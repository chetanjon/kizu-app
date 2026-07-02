"use client";

import ErrorCard from "@/components/error-card";

// Root boundary: catches server/render failures on any route without its own
// error.tsx (landing, /join, /read, /r, ...). Keeps users off Next's default screen.
export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen">
      <ErrorCard reset={reset} />
    </div>
  );
}
