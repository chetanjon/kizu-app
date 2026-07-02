"use client";

import ErrorCard from "@/components/error-card";

// In-layout boundary for the tab pages (home, tonight, queue, you, drop, log):
// a fetch failure keeps the nav and swaps only the page body.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorCard reset={reset} />;
}
