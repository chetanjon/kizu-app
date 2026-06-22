import { searchWatch } from "@/lib/tmdb";
import { searchListen } from "@/lib/itunes";
import { NextResponse } from "next/server";

// Typeahead/search for a typed title (not a link): movies via TMDB, music via iTunes.
// Returns pick-ready results so the user chooses the right one (with art).
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type");
  const q = sp.get("q") ?? "";
  try {
    if (type === "watch") {
      const r = await searchWatch(q);
      return NextResponse.json({
        results: r.map((w) => ({
          data: w,
          title: w.title,
          sub: [w.year, w.media_type].filter(Boolean).join(" · ").toUpperCase(),
          img: w.poster_url,
        })),
      });
    }
    if (type === "listen") {
      const r = await searchListen(q);
      return NextResponse.json({
        results: r.map((h) => ({
          data: { title: h.title, artist: h.artist, artwork_url: h.artwork_url, source_url: h.source_url, odesli_url: null, platform_links: h.platform_links },
          title: h.title,
          sub: h.artist,
          img: h.artwork_url,
        })),
      });
    }
    return NextResponse.json({ results: [] });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
