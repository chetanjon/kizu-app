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
  body: string;                                    // THE read — one 2–3 line paragraph naming the active people
  tags: string[];                                  // 2–4 playful labels
  top_picks: { type: string; title: string }[];    // what they keep coming back to (feeds the act-on-it buttons)
};

const TYPE_LABEL = { watch: "MOVIE", listen: "MUSIC", go_out: "OUTSIDE" } as const;

function buildPrompt(groupName: string, members: string[], items: VibeItem[], variant: "default" | "weekly" = "default"): string {
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

  const weekly = variant === "weekly";
  const job = weekly
    ? `Your job is to recap THIS WEEK for them: read the taste behind what they dropped over the last 7 days back to them in a way that feels a little too accurate, funny, and flattering-but-true. This is the weekly ritual: the standing appointment, so it should feel like "here's what your week sounded/looked like."`
    : `Your job is to read this group's COLLECTIVE TASTE back to them in a way that feels a little too accurate, funny, and flattering-but-true.`;

  return `You are the "vibe read" for kizu, a private space where a friend group drops the movies, music, and places they love. ${job}

GROUP: "${groupName}" . members: ${members.join(", ")}.

${weekly ? "THIS WEEK'S DROPS:" : "THEIR DROPS:"}
${lines}

WRITE THE READ: one short paragraph, nothing else. Rules:
- SHORT. a SINGLE tight paragraph, UNDER ~45 words total (2-3 short sentences, ~2-3 lines). reads in ~5 seconds. be terse: name a person + their standout drop, don't over-explain. no rambling, no lists, no "it seems"/"meanwhile" filler.
- NAME THE ACTIVE PEOPLE. weave in the names of the members who actually dropped things (you can see them as "by <name>" on each drop). only name people who dropped; never name someone with no drops, and if a drop is "by someone" it's anonymous, so don't name them.
- FUNNY. land at least one genuinely funny, specific observation, the kind someone screenshots.
- HUMAN. sound like a sharp friend texting, not an essay or a horoscope. lowercase, no exclamation marks, no emoji, and NEVER use an em dash (—) anywhere. PLAIN TEXT only: no markdown, no *asterisks* or \`backticks\` around titles.
- ACCURATE + SPECIFIC. cite real titles/artists/places by name. NO generic filler ("eclectic taste", "good vibes") = instant fail.
- flattering-but-true: tease, don't insult.

Return ONLY valid JSON, no markdown:
{
  "title": "punchy headline, max ~6 words, lowercase",
  "body": "THE READ: one tight paragraph under ~45 words, naming the people who dropped + citing their real drops",
  "tags": ["2-3 short lowercase labels, e.g. 'letterboxd-core'"],
  "top_picks": [ { "type": "watch|listen|go_out", "title": "<a standout drop>" } ]
}`;
}

function parseJson(text: string): VibeRead {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const obj = JSON.parse(cleaned);
  return {
    title: String(obj.title || "").trim(),
    body: String(obj.body || "").trim(),
    tags: Array.isArray(obj.tags) ? obj.tags.map(String).slice(0, 4) : [],
    top_picks: Array.isArray(obj.top_picks)
      ? obj.top_picks.map((t: any) => ({ type: String(t.type || ""), title: String(t.title || "") })).slice(0, 3)
      : [],
  };
}

async function runGemini(prompt: string): Promise<string> {
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
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const j = await res.json();
  const text = j.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text");
  return text;
}

async function runClaude(prompt: string): Promise<string> {
  const msg = await getAnthropic().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
}

/** Run the JSON-mode model. Provider per VIBE_PROVIDER (default FREE gemini). */
async function runModel(prompt: string): Promise<string> {
  const provider = (process.env.VIBE_PROVIDER || "gemini").toLowerCase();
  return provider === "claude" ? runClaude(prompt) : runGemini(prompt);
}

/** Generate a vibe read for a group from its drops. */
export async function generateVibe(
  groupName: string,
  members: string[],
  items: VibeItem[],
  variant: "default" | "weekly" = "default"
): Promise<VibeRead> {
  return parseJson(await runModel(buildPrompt(groupName, members, items, variant)));
}

// ─────────────────────────────────────────────────────────────────────────
// The taste SIGNATURE — one flattering line naming the AESTHETIC of a person's
// taste (NOT their personality). Deliberately simple and safe: no body, no
// "pattern you can't see", no diagnosis. We name a vibe, never read a soul —
// kizu rates taste, not people.
// ─────────────────────────────────────────────────────────────────────────

export type TasteRead = {
  signature: string;  // the one-line aesthetic label of their taste, lowercase
  tags: string[];     // 2-3 short aesthetic tags
};

export type TasteSignal = {
  type: "watch" | "listen" | "go_out";
  title: string;
  meta?: string;
  rating?: string;
  note?: string;
  verdict?: "loved" | "liked" | "meh"; // present for queued things, absent for own drops
  source: "drop" | "queue";            // did they drop it, or queue someone else's
};

function buildTastePrompt(name: string, signals: TasteSignal[]): string {
  const lines = signals
    .map((s) => {
      const bits = [
        `[${TYPE_LABEL[s.type]}]`,
        s.title,
        s.meta ? `(${s.meta})` : "",
        s.rating ? `· rated ${s.rating}` : "",
        s.source === "drop" ? "· they dropped this" : `· they saved this${s.verdict ? `, verdict: ${s.verdict}` : ""}`,
        s.note ? `· "${s.note}"` : "",
      ];
      return "- " + bits.filter(Boolean).join(" ");
    })
    .join("\n");

  return `You are the "taste signature" for kizu, a private space where friends drop the movies, music, and places they love. Give ${name} a SINGLE-LINE signature that names the AESTHETIC of their taste: the territory their drops live in. This describes their TASTE, never their personality.

${name}'S DROPS & WATCHLIST:
${lines}

WRITE THE SIGNATURE. Rules:
- ONE line. a vivid aesthetic label, max ~10 words. e.g. "main-character energy with a soft landing", "late-night heartbreak you can dance to", "prestige drama with a junk-food chaser".
- describe the TASTE as a place or aesthetic, NOT the person. NEVER "you are", never "you crave/need/project/secretly want", no psychology, no diagnosis, no claim to know them. you are naming a vibe, not reading a soul.
- flattering and true. celebrate it. lowercase, no exclamation marks, no emoji, no em dashes.
- SPECIFIC to THEIR drops: the aesthetic must obviously come from their actual titles. generic filler ("eclectic", "good vibes", "varied taste") is an instant fail.

Return ONLY valid JSON, no markdown:
{
  "signature": "the one-line aesthetic, lowercase, max ~10 words",
  "tags": ["2-3 short lowercase aesthetic tags, e.g. 'comfort-rewatcher'"]
}`;
}

function parseTaste(text: string): TasteRead {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const obj = JSON.parse(cleaned);
  return {
    signature: String(obj.signature || "").trim(),
    tags: Array.isArray(obj.tags) ? obj.tags.map(String).slice(0, 3) : [],
  };
}

/** Generate a one-line taste signature from one person's signals. */
export async function generateTasteRead(name: string, signals: TasteSignal[]): Promise<TasteRead> {
  return parseTaste(await runModel(buildTastePrompt(name, signals)));
}
