import Anthropic from "@anthropic-ai/sdk";

// Lazy — instantiated on first call, never at module load (which would
// run during `next build`'s page-data collection and throw).
let _anthropic: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (_anthropic) return _anthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Configure it on Vercel and in .env.local."
    );
  }
  _anthropic = new Anthropic({ apiKey });
  return _anthropic;
}

// Default model. Sonnet for vision (accuracy on bounding boxes matters
// for the privacy promise on receipts). Override per-call where cheap is fine.
export const CLAUDE_MODEL = "claude-sonnet-4-6";
