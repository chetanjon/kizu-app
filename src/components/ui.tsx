export function Pill({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <span
      className={`inline-block font-m text-[11px] font-bold px-[10px] py-1 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] whitespace-nowrap ${bg}`}
    >
      {children}
    </span>
  );
}

export function SmallPill({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <span
      className={`inline-block font-m text-[10px] font-bold px-2 py-0.5 rounded-lg border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] whitespace-nowrap ${bg}`}
    >
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  bg,
  size = "default",
}: {
  initials: string;
  bg: string;
  size?: "default" | "small" | "sidebar";
}) {
  const sizeClasses = {
    default: "w-[38px] h-[38px] text-xs",
    small: "w-8 h-8 text-[10px]",
    sidebar: "w-[34px] h-[34px] text-[11px]",
  };
  return (
    <div
      className={`${sizeClasses[size]} rounded-xl border-2 border-stroke flex items-center justify-center font-m font-bold shrink-0 ${bg}`}
    >
      {initials}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] transition-all duration-150 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_#1A1A1A] ${className}`}
    >
      {children}
    </div>
  );
}
