import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SettingsForm } from "@/components/settings-form";
import type { Frequency } from "@/lib/sunset";

const fallbackTimezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Moscow",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Seoul",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
];

const allTimezones = (): string[] => {
  const intl = Intl as unknown as {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  if (typeof intl.supportedValuesOf === "function") {
    return intl.supportedValuesOf("timeZone");
  }
  return fallbackTimezones;
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/settings");

  const { data: row } = await supabase
    .from("users")
    .select("timezone, sunset_frequency, next_sunset_at")
    .eq("id", user.id)
    .single();

  const tz = row?.timezone ?? "Etc/UTC";
  const freq: Frequency = (row?.sunset_frequency ?? "daily") as Frequency;
  const next = row?.next_sunset_at ?? null;

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b-[2.5px] border-stroke bg-bg sticky top-0 z-10">
        <div className="max-w-[640px] mx-auto px-6 flex justify-between items-center h-16">
          <Link
            href="/wall"
            className="font-m text-[11px] text-[#888] hover:text-stroke transition-colors no-underline"
          >
            ← back to wall
          </Link>
          <span className="font-h text-xl font-black tracking-[-0.03em]">
            kizu
          </span>
        </div>
      </nav>

      <main className="max-w-[640px] mx-auto px-6 py-10">
        <h1 className="font-h text-3xl font-black tracking-[-0.03em] mb-2">
          settings.
        </h1>
        <p className="font-b text-sm text-[#888] mb-7">
          when sunset finds you. that&apos;s the only thing on this page.
        </p>
        <SettingsForm
          initialTimezone={tz}
          initialFrequency={freq}
          initialNextSunset={next}
          timezones={allTimezones()}
        />
      </main>
    </div>
  );
}
