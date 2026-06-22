// The vibe read — the make-or-break magic. Reads a group's drops back to them as
// a sharp, funny, relationship-aware portrait (NOT a generic horoscope).
//
// Provider-swappable. Defaults to FREE Google Gemini (no credit card). Set
// VIBE_PROVIDER=claude to use the existing Anthropic client once there's budget.

import { getAnthropic, CLAUDE_MODEL } from "./claude";

export type VibeItem = {
  type: "watch" | "listen" | "go_out";
  title: string;
  meta?: string;     // year/genre · artist · subtype — texture for the model
  rating?: string;
  note?: string;
  who: string;       // display name of who dropped it
};

export type VibeRead = {
  title: string;                                   // the screenshot headline
  body: string;                                    // 2–3 sentence read
  person_lines: { name: string; line: string }[];  // one too-accurate line per person
  tags: string[];                                  // 2–4 playful labels
  top_picks: { type: string; title: string }[];    // what they keep coming back to
};

const TYPE_LABEL = { watch: "MOVIE", listen: "MUSIC", go_out: "OUTSIDE" } as const;

function buildPrompt(groupName: string, members: string[], items: VibeItem[]): string {
  const lines = items
    .map((i) => {
      const bits = [
        `[${TYPE_LABEL[i.type]}]`,
        i.title,
        i.meta ? `(${i.meta})` : "",
        i.rating ? `· rated ${i.rating}` : "",
        `· by ${i.who}`,
        i.note ? `· "${i.note}"` : "",
      ];
      return "- " + bits.filter(Boolean).join(" ");
    })
    .join("\n");

  return `You are the "vibe read" for kizu — a private space where a friend group drops the movies, music, and places they love. Your job is to read this group's COLLECTIVE TASTE back to them in a way that feels a little too accurate, funny, and flattering-but-true.

GROUP: "${groupName}" — members: ${members.join(", ")}.

THEIR DROPS:
${lines}

WRITE THE READ. Rules:
- SHORT. Reads in ~5 seconds. body = ONE or TWO punchy sentences, max. no rambling.
- FUNNY. land at least one genuinely funny, specific observation — the kind someone screenshots.
- HUMAN. sound like a sharp friend texting, not an essay or a horoscope. lowercase, no exclamation marks, no emoji.
- ACCURATE + SPECIFIC. cite real titles/artists/places by name; read the PEOPLE through their taste. NO generic filler ("eclectic taste", "good vibes") — instant fail.
- flattering-but-true: tease, don't insult.

Return ONLY valid JSON, no markdown:
{
  "title": "punchy headline, max ~6 words, lowercase",
  "body": "1-2 SHORT sentences, citing real drops",
  "person_lines": [ { "name": "<member>", "line": "one short, funny line, max ~12 words" } ],
  "tags": ["2-3 short lowercase labels, e.g. 'letterboxd-core'"],
  "top_picks": [ { "type": "watch|listen|go_out", "title": "<a standout drop>" } ]
}
Only add person_lines for members whose taste genuinely stands out — skip the section entirely if there isn't enough signal (e.g. just one person).`;
}

function parseJson(text: string): VibeRead {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const obj = JSON.parse(cleaned);
  return {
    title: String(obj.title || "").trim(),
    body: String(obj.body || "").trim(),
    person_lines: Array.isArray(obj.person_lines)
      ? obj.person_lines.map((p: any) => ({ name: String(p.name || ""), line: String(p.line || "") }))
      : [],
    tags: Array.isArray(obj.tags) ? obj.tags.map(String).slice(0, 4) : [],
    top_picks: Array.isArray(obj.top_picks)
      ? obj.top_picks.map((t: any) => ({ type: String(t.type || ""), title: String(t.title || "") })).slice(0, 3)
      : [],
  };
}

async function generateGemini(prompt: string): Promise<VibeRead> {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not set. Add it to .env.local / Vercel.");
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${k}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.95, responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const j = await res.json();
  const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text");
  return parseJson(text);
}

async function generateClaude(prompt: string): Promise<VibeRead> {
  const msg = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  return parseJson(text);
}

/** Generate a vibe read for a group from its drops. Provider per VIBE_PROVIDER (default gemini). */
export async function generateVibe(
  groupName: string,
  members: string[],
  items: VibeItem[]
): Promise<VibeRead> {
  const prompt = buildPrompt(groupName, members, items);
  const provider = (process.env.VIBE_PROVIDER || "gemini").toLowerCase();
  return provider === "claude" ? generateClaude(prompt) : generateGemini(prompt);
}
