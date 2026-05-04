"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PackOption = {
  id: string;
  name: string;
  is_home: boolean;
  icon: string;
};

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

const localDate = () =>
  new Date().toLocaleDateString("en-CA");

export function ReceiptComposer({
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

  const acceptFile = useCallback((f: File) => {
    if (!ACCEPTED.includes(f.type)) {
      setError("png, jpeg, or webp only.");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setError("");
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      for (const item of e.clipboardData.items) {
        if (item.kind === "file" && ACCEPTED.includes(item.type)) {
          const f = item.getAsFile();
          if (f) {
            acceptFile(f);
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [acceptFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  };

  const submit = async () => {
    if (!file) return;
    setSubmitting(true);
    setError("");

    const fd = new FormData();
    fd.append("pack_id", packId);
    fd.append("kind", "receipt");
    fd.append("local_date", localDate());
    fd.append("image", file);

    const res = await fetch("/api/posts", { method: "POST", body: fd });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "could not post.");
      return;
    }
    router.push("/wall");
    router.refresh();
  };

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
            alt="preview"
            className="w-full rounded-xl border-[2.5px] border-stroke shadow-[3px_3px_0_#1A1A1A] max-h-[480px] object-contain bg-bg"
          />
          <button
            onClick={() => {
              setFile(null);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl(null);
            }}
            className="font-m text-[11px] text-[#888] mt-2 hover:text-stroke transition-colors cursor-pointer"
          >
            replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full bg-bg rounded-xl border-[2.5px] border-dashed border-stroke px-6 py-12 text-center transition-colors hover:bg-[#EAE8DE] cursor-pointer mb-5"
        >
          <div className="font-h text-xl font-black tracking-[-0.02em] mb-1">
            paste a screenshot.
          </div>
          <div className="font-m text-[11px] text-[#888] tracking-[0.05em]">
            ⌘V — or click to choose a file
          </div>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={onPick}
        className="hidden"
      />

      <div className="bg-bg rounded-xl border-2 border-stroke px-4 py-3 mb-5">
        <div className="font-m text-[10px] font-bold text-stroke tracking-[0.08em] mb-1">
          A NOTE
        </div>
        <p className="font-b text-[12px] text-[#555] leading-relaxed">
          names, handles, numbers, and faces are blurred before your pack
          sees this. it takes a few seconds. you can still delete the post
          if anything slips through.
        </p>
      </div>

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
        {submitting ? "redacting…" : "post →"}
      </button>
    </div>
  );
}
