import { resolveUrl } from "@/lib/resolve";
import { NextResponse } from "next/server";

// Smart paste: a URL in → detected type + resolved title/art out.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const url = String(body.url ?? "").trim();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
  try {
    return NextResponse.json(await resolveUrl(url));
  } catch (e) {
    return NextResponse.json({ type: null, resolved: false, reason: (e as Error)?.message ?? "resolve failed" });
  }
}
