import { Resend } from "resend";

// Lazy — instantiated on first call, never at module load (which would
// run during `next build`'s page-data collection and throw).
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Configure it on Vercel and in .env.local."
    );
  }
  _resend = new Resend(apiKey);
  return _resend;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "kizu <sunset@kizu.app>";
