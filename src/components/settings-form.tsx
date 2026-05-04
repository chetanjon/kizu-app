"use client";

import {
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import type { Frequency } from "@/lib/sunset";

const subscribe = () => () => {};
const getBrowserTz = (): string | null => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
};
const getServerTz = (): string | null => null;

type Props = {
  initialTimezone: string;
  initialFrequency: Frequency;
  initialNextSunset: string | null;
  timezones: string[];
};

const FREQ_LABELS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "daily" },
  { value: "every_2_days", label: "every other day" },
  { value: "weekly", label: "weekly" },
  { value: "off", label: "off" },
];

const formatNext = (iso: string | null, tz: string): string => {
  if (!iso) return "off — no email";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  }).toLowerCase();
};

export function SettingsForm({
  initialTimezone,
  initialFrequency,
  initialNextSunset,
  timezones,
}: Props) {
  const [tz, setTz] = useState(initialTimezone);
  const [freq, setFreq] = useState<Frequency>(initialFrequency);
  const [nextSunset, setNextSunset] = useState<string | null>(
    initialNextSunset
  );
  const browserTz = useSyncExternalStore(
    subscribe,
    getBrowserTz,
    getServerTz
  );
  const [filter, setFilter] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const filteredTzs = useMemo(() => {
    if (!filter.trim()) return timezones;
    const f = filter.toLowerCase();
    return timezones.filter((z) => z.toLowerCase().includes(f));
  }, [filter, timezones]);

  const dirty = tz !== initialTimezone || freq !== initialFrequency;

  const save = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: tz, sunset_frequency: freq }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "could not save.");
        return;
      }
      setNextSunset(data.user.next_sunset_at ?? null);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    });
  };

  return (
    <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7">
      {browserTz && browserTz !== tz && (
        <div className="bg-yellow rounded-xl border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] px-4 py-3 mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="font-m text-[10px] font-bold text-yellow-t tracking-[0.08em] mb-1">
              YOUR BROWSER SAYS
            </div>
            <p className="font-b text-[12px] text-yellow-t leading-relaxed">
              looks like you&apos;re in{" "}
              <span className="font-mono font-bold">{browserTz}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTz(browserTz)}
            className="shrink-0 rounded-lg border-2 border-stroke bg-white font-b font-bold text-[11px] px-3 py-1.5 shadow-[2px_2px_0_#1A1A1A] cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1A1A1A]"
          >
            switch
          </button>
        </div>
      )}

      <div className="font-m text-[10px] font-bold text-[#888] tracking-[0.1em] mb-3">
        TIMEZONE
      </div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="filter…"
        className="w-full rounded-xl border-[2.5px] border-stroke bg-white font-b text-[14px] px-4 py-2.5 shadow-[2px_2px_0_#1A1A1A] outline-none mb-2 placeholder:text-[#CCC]"
      />
      <select
        value={tz}
        onChange={(e) => setTz(e.target.value)}
        className="w-full rounded-xl border-[2.5px] border-stroke bg-white font-m text-[14px] px-4 py-3 shadow-[3px_3px_0_#1A1A1A] outline-none mb-6 cursor-pointer"
      >
        {!filteredTzs.includes(tz) && <option value={tz}>{tz}</option>}
        {filteredTzs.map((z) => (
          <option key={z} value={z}>
            {z}
          </option>
        ))}
      </select>

      <div className="font-m text-[10px] font-bold text-[#888] tracking-[0.1em] mb-3">
        SUNSET EMAIL
      </div>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {FREQ_LABELS.map(({ value, label }) => {
          const selected = freq === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setFreq(value)}
              className={`rounded-xl border-[2.5px] border-stroke font-b font-bold text-[13px] px-4 py-3 transition-all duration-[120ms] cursor-pointer ${
                selected
                  ? "bg-yellow text-yellow-t shadow-[3px_3px_0_#1A1A1A] translate-x-[-1px] translate-y-[-1px]"
                  : "bg-white text-stroke shadow-[2px_2px_0_#1A1A1A] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1A1A1A]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="bg-bg rounded-xl border-2 border-stroke px-4 py-3 mb-6">
        <div className="font-m text-[10px] font-bold text-[#888] tracking-[0.08em] mb-1">
          NEXT SUNSET
        </div>
        <p className="font-b text-[13px] text-stroke">
          {formatNext(nextSunset, tz)}
        </p>
      </div>

      {error && (
        <div className="bg-pink rounded-xl border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] px-4 py-3 font-b text-sm text-pink-t mb-4">
          {error}
        </div>
      )}

      <button
        onClick={save}
        disabled={!dirty || pending}
        className={`w-full rounded-xl border-[2.5px] border-stroke font-b font-bold text-base px-6 py-3.5 transition-all duration-[120ms] cursor-pointer ${
          !dirty || pending
            ? "bg-[#DDD] text-[#888] shadow-none"
            : "bg-yellow text-yellow-t shadow-[4px_4px_0_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A]"
        }`}
      >
        {pending ? "saving…" : savedFlash ? "saved." : "save"}
      </button>
    </div>
  );
}
