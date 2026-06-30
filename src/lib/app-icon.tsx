import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Load Archivo (heavy) so the icon "k." matches the in-app wordmark weight,
// instead of falling back to a thin system font.
let fontCache: Buffer | null = null;
function archivo(): Buffer {
  if (!fontCache) fontCache = readFileSync(join(process.cwd(), "src/assets/archivo-800.ttf"));
  return fontCache;
}

// Cinematic-brutalist icon (dark rebrand): a warm-black field with a faint
// violet nebula glowing from the top (echoing the app body), an INSET rounded
// CREAM line-frame, and a bold light "k" with the precious red dot. The frame is
// inset (not flush to the edge) so it reads as a clean rounded line, not a square
// border, once the OS rounds the icon. maskable → larger inset so the round crop
// never touches it.
export function kizuIconResponse(size: number, opts?: { maskable?: boolean }) {
  const maskable = opts?.maskable ?? false;
  const pad = Math.round(size * (maskable ? 0.2 : 0.1));
  const box = size - pad * 2;
  const border = Math.max(3, Math.round(size * 0.05));
  const radius = Math.round(box * 0.26);
  const glyph = Math.round(box * 0.52);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(120% 120% at 50% 0%, #2A1F52 0%, #16130E 58%)",
        }}
      >
        <div
          style={{
            width: box,
            height: box,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `${border}px solid #EDE3CE`,
            borderRadius: radius,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", fontFamily: "Archivo", fontWeight: 800, lineHeight: 1 }}>
            <span style={{ fontSize: glyph, color: "#F6F1EA" }}>k</span>
            <span style={{ fontSize: glyph, color: "#FF3B5C" }}>.</span>
          </div>
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: [{ name: "Archivo", data: archivo(), weight: 800, style: "normal" }],
    }
  );
}
