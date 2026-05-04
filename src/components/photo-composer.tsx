"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PackOption = {
  id: string;
  name: string;
  is_home: boolean;
  icon: string;
};

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

const localDate = () => new Date().toLocaleDateString("en-CA");

export function PhotoComposer({
  packs,
  initialPackId,
}: {
  packs: PackOption[];
  initialPackId: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [packId, setPackId] = useState(initialPackId);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError("png, jpeg, or webp only.");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError("");
  };

  const submit = async () => {
    if (!file) return;
    setSubmitting(true);
    setError("");

    const fd = new FormData();
    fd.append("pack_id", packId);
    fd.append("kind", "photo");
    fd.append("local_date", localDate());
    fd.append("image", file);

    const res = await fetch("/api/posts", { method: "POST", body: fd });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      if (
        typeof data.error === "string" &&
        /duplicate|unique|already/i.test(data.error)
      ) {
        setDone(true);
        return;
      }
      setError(data.error || "could not post.");
      return;
    }
    router.push("/wall");
    router.refresh();
  };

  if (done) {
    return (
      <div className="bg-lime rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7 text-center">
        <div className="font-h text-2xl font-black tracking-[-0.03em] text-lime-t mb-2">
          you already witnessed today.
        </div>
        <p className="font-b text-sm text-lime-t opacity-70 mb-6">
          one moment a day. that&apos;s the rule. sunset comes again tomorrow.
        </p>
        <button
          onClick={() => router.push("/wall")}
          className="rounded-xl border-[2.5px] border-stroke bg-white font-b font-bold text-sm px-6 py-3 shadow-[4px_4px_0_#1A1A1A] transition-all duration-[120ms] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A] cursor-pointer"
        >
          go to your wall →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-[2.5px] border-stroke shadow-[5px_5px_0_#1A1A1A] p-7">
      <div className="font-m text-[10px] font-bold text-[#888] tracking-[0.1em] mb-3">
        POSTING TO
      </div>
      {packs.length === 1 ? (
        <div className="font-h text-xl font-extrabold mb-5">
          {packs[0].icon} {packs[0].name}
        </div>
      ) : (
        <select
          value={packId}
          onChange={(e) => setPackId(e.target.value)}
          className="w-full rounded-xl border-[2.5px] border-stroke bg-white font-b font-bold text-[15px] px-4 py-3 shadow-[3px_3px_0_#1A1A1A] outline-none mb-5 cursor-pointer"
        >
          {packs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.name} {p.is_home ? "· home" : ""}
            </option>
          ))}
        </select>
      )}

      {previewUrl ? (
        <div className="mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="your shot"
            className="w-full rounded-xl border-[2.5px] border-stroke shadow-[3px_3px_0_#1A1A1A] max-h-[480px] object-contain bg-bg"
          />
          <div className="bg-bg rounded-xl border-2 border-stroke px-4 py-3 mt-3">
            <div className="font-m text-[10px] font-bold text-stroke tracking-[0.08em] mb-1">
              FIRST TAKE, ONLY TAKE
            </div>
            <p className="font-b text-[12px] text-[#555] leading-relaxed">
              this is what your pack will see. no edits, no filters. if you want
              a different shot, that&apos;s tomorrow&apos;s.
            </p>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full bg-bg rounded-xl border-[2.5px] border-stroke px-6 py-12 text-center transition-colors hover:bg-[#EAE8DE] cursor-pointer mb-5"
        >
          <div className="font-h text-2xl font-black tracking-[-0.02em] mb-1">
            open the camera.
          </div>
          <div className="font-m text-[11px] text-[#888] tracking-[0.05em]">
            back camera only · no filters · one shot
          </div>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPick}
        className="hidden"
      />

      {!previewUrl && (
        <div className="bg-yellow rounded-xl border-2 border-stroke px-4 py-3 mb-5">
          <div className="font-m text-[10px] font-bold text-yellow-t tracking-[0.08em] mb-1">
            MOBILE-FIRST
          </div>
          <p className="font-b text-[12px] text-yellow-t leading-relaxed">
            on your phone, this opens the back camera. on desktop, it falls back
            to a file picker — kizu&apos;s daily moment is meant for the device
            in your hand.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-pink rounded-xl border-2 border-stroke shadow-[2px_2px_0_#1A1A1A] px-4 py-3 font-b text-sm text-pink-t mb-4">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={!file || submitting}
        className={`w-full rounded-xl border-[2.5px] border-stroke font-b font-bold text-base px-6 py-3.5 transition-all duration-[120ms] cursor-pointer ${
          !file || submitting
            ? "bg-[#AAA] text-[#666] shadow-none"
            : "bg-yellow text-yellow-t shadow-[4px_4px_0_#1A1A1A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1A1A1A]"
        }`}
      >
        {submitting ? "posting…" : "post →"}
      </button>
    </div>
  );
}
