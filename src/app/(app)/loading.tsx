// Shown instantly on tab navigation while the server renders — makes taps feel
// responsive instead of dead-silent until data loads.
export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <span className="font-h text-3xl font-extrabold tracking-[-0.05em] animate-pulse text-muted">
        kizu<span className="text-red">.</span>
      </span>
    </div>
  );
}
