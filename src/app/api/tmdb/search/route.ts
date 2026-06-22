import { searchWatch } from "@/lib/tmdb";
import { NextResponse } from "next/server";

// Movie/TV typeahead. Returns [] gracefully if TMDB_API_KEY isn't set yet,
// so the UI just falls back to manual title entry.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  try {
    return NextResponse.json({ results: await searchWatch(q) });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
