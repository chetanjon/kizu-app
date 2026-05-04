import sharp from "sharp";
import { CLAUDE_MODEL, getAnthropic } from "./claude";

// Cap the image we send to Claude (token efficiency). Coordinates come back
// in 0..1000 normalized space so they map cleanly to the original.
const PREVIEW_MAX_EDGE = 1568;

// Cap the final stored output — receipts don't need to be huge.
const OUTPUT_MAX_EDGE = 1920;

// Sharp's blur sigma. 18 reliably destroys small text without making the
// blurred box look like a UI mistake.
const BLUR_SIGMA = 18;

// Padding (in original-image pixels) added around each region so we cover
// minor mis-alignment in the model's bounding box.
const PAD_PX = 8;

const SYSTEM_PROMPT = `You are a privacy-redaction assistant for a small social app.
The user uploaded a screenshot they want to share with 5-20 close friends. Your job
is to identify rectangular regions of the image that contain PERSONALLY
IDENTIFYING information about specific real people, so the app can blur them.

Redact ONLY:
- Proper names of people (first names, last names, full names) — anywhere they appear
- Social handles (@usernames, IG/Twitter/TikTok handles)
- Phone numbers
- Email addresses
- Physical/street addresses
- Credit card numbers, account numbers
- Faces of identifiable people in photos
- QR codes, barcodes (often encode identity)

Do NOT redact:
- App names, brand names, product names
- Generic UI chrome (timestamps, battery indicators, "Reply" buttons, etc.)
- Quoted public content (song lyrics, news headlines, public-figure quotes)
- Generic text that doesn't identify a person
- Emoji, decorative imagery
- Group names or pack names

If there is nothing to redact, return an empty regions array.

Coordinates: use a 0-1000 normalized coordinate system where (0,0) is the
top-left of the image and (1000,1000) is the bottom-right. Be tight but
inclusive — slight padding is added downstream.`;

type Region = {
  x: number;
  y: number;
  width: number;
  height: number;
  reason: string;
};

const REDACT_TOOL = {
  name: "redact_regions",
  description:
    "Submit the rectangular regions of the image that contain personally identifying information and must be blurred for privacy.",
  input_schema: {
    type: "object" as const,
    properties: {
      regions: {
        type: "array" as const,
        description:
          "List of rectangles to blur. Empty array if nothing needs redaction.",
        items: {
          type: "object" as const,
          properties: {
            x: {
              type: "number",
              description: "Left edge in 0-1000 normalized coordinates.",
            },
            y: {
              type: "number",
              description: "Top edge in 0-1000 normalized coordinates.",
            },
            width: {
              type: "number",
              description: "Width in 0-1000 normalized coordinates.",
            },
            height: {
              type: "number",
              description: "Height in 0-1000 normalized coordinates.",
            },
            reason: {
              type: "string",
              description:
                "Short label of what is being redacted: name, handle, phone, email, address, face, etc.",
            },
          },
          required: ["x", "y", "width", "height", "reason"],
        },
      },
    },
    required: ["regions"],
  },
};

type DetectMediaType = "image/png" | "image/jpeg" | "image/webp" | "image/gif";

async function detectRegions(
  previewBuffer: Buffer,
  mediaType: DetectMediaType
): Promise<Region[]> {
  const client = getAnthropic();
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [REDACT_TOOL],
    tool_choice: { type: "tool", name: "redact_regions" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: previewBuffer.toString("base64"),
            },
          },
          {
            type: "text",
            text: "Identify regions to redact. Return an empty array if nothing in the image identifies a specific person.",
          },
        ],
      },
    ],
  });

  for (const block of message.content) {
    if (block.type === "tool_use" && block.name === "redact_regions") {
      const input = block.input as { regions?: Region[] };
      return Array.isArray(input.regions) ? input.regions : [];
    }
  }
  return [];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export type BlurResult = {
  buffer: Buffer;
  contentType: "image/jpeg";
  ext: "jpg";
  regionCount: number;
};

// Run a screenshot through the redaction pipeline:
//   original bytes → resize-for-Claude → detect regions → blur on original →
//   re-encode as JPEG (capped at OUTPUT_MAX_EDGE).
//
// Throws on any failure. Caller should treat throw as "do not store the
// receipt at all" — better to lose the post than to leak un-blurred PII.
export async function blurReceipt(
  inputBuffer: Buffer,
  inputContentType: string
): Promise<BlurResult> {
  const mediaType: DetectMediaType =
    inputContentType === "image/png"
      ? "image/png"
      : inputContentType === "image/webp"
        ? "image/webp"
        : "image/jpeg";

  const original = sharp(inputBuffer, { failOn: "none" }).rotate();
  const meta = await original.metadata();
  if (!meta.width || !meta.height) {
    throw new Error("could not read image dimensions");
  }
  const origW = meta.width;
  const origH = meta.height;

  const previewBuffer = await sharp(inputBuffer, { failOn: "none" })
    .rotate()
    .resize({
      width: PREVIEW_MAX_EDGE,
      height: PREVIEW_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFormat(mediaType === "image/png" ? "png" : "jpeg", { quality: 85 })
    .toBuffer();

  const regions = await detectRegions(
    previewBuffer,
    mediaType === "image/png" ? "image/png" : "image/jpeg"
  );

  // Build composite operations: a heavily blurred copy of each region,
  // overlaid back on the original at the same coords (with padding).
  type Composite = {
    input: Buffer;
    top: number;
    left: number;
  };
  const composites: Composite[] = [];

  for (const r of regions) {
    if (
      typeof r.x !== "number" ||
      typeof r.y !== "number" ||
      typeof r.width !== "number" ||
      typeof r.height !== "number"
    ) {
      continue;
    }
    let left = Math.floor((r.x / 1000) * origW) - PAD_PX;
    let top = Math.floor((r.y / 1000) * origH) - PAD_PX;
    let width = Math.ceil((r.width / 1000) * origW) + PAD_PX * 2;
    let height = Math.ceil((r.height / 1000) * origH) + PAD_PX * 2;

    left = clamp(left, 0, origW - 1);
    top = clamp(top, 0, origH - 1);
    width = clamp(width, 1, origW - left);
    height = clamp(height, 1, origH - top);
    if (width < 4 || height < 4) continue;

    const tile = await sharp(inputBuffer, { failOn: "none" })
      .rotate()
      .extract({ left, top, width, height })
      .blur(BLUR_SIGMA)
      .png()
      .toBuffer();
    composites.push({ input: tile, top, left });
  }

  const pipeline = sharp(inputBuffer, { failOn: "none" }).rotate();
  if (composites.length > 0) {
    pipeline.composite(composites);
  }

  const output = await pipeline
    .resize({
      width: OUTPUT_MAX_EDGE,
      height: OUTPUT_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  return {
    buffer: output,
    contentType: "image/jpeg",
    ext: "jpg",
    regionCount: composites.length,
  };
}
