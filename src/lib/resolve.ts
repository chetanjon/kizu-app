// Universal smart paste — detect the drop type from any pasted URL, then resolve
// title/art. Powers the one-box "paste anything" drop. Server-side.

import { resolveListen, type ListenData } from "./odesli";
import { searchWatch, getWatchByTmdb, getWatchByImdb, type WatchData } from "./tmdb";

export type DropType = "watch" | "listen" | "go_out";

export type ResolveResult =
  | { type: "listen"; resolved: true; data: ListenData }
  | { type: "watch"; resolved: true; data: WatchData }
  | { type: "go_out"; resolved: false; data: { place_name: string | null; source_url: string } }
  | { type: DropType | null; resolved: false; reason: string; query?: string | null };

const MUSIC_HOSTS = [
  "open.spotify.com", "spotify.com", "music.apple.com", "soundcloud.com",
  "tidal.com", "deezer.com", "music.amazon.com", "bandcamp.com", "music.youtube.com",
];
const WATCH_HOSTS = ["letterboxd.com", "imdb.com", "themoviedb.org", "www.themoviedb.org"];
// Streaming services have no public title API → we best-effort guess the title
// from the URL slug and show the TMDB pick-list.
const STREAMING_HOSTS = [
  "max.com", "hbomax.com", "netflix.com", "disneyplus.com", "primevideo.com",
  "hulu.com", "peacocktv.com", "paramountplus.com", "tv.apple.com", "jiocinema.com", "hotstar.com",
];
const PLACE_HOSTS = ["google.com/maps", "maps.google.com", "maps.app.goo.gl", "goo.gl/maps", "yelp.com"];

function host(u: URL) {
  return (u.hostname + u.pathname).toLowerCase();
}

/** Best-guess the drop type from a URL's domain. youtube.com (non-music) → listen by default. */
export function detectType(raw: string): DropType | null {
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  const h = host(u);
  if (MUSIC_HOSTS.some((d) => h.includes(d))) return "listen";
  if (h.includes("youtube.com") || h.includes("youtu.be")) return "listen";
  if (WATCH_HOSTS.some((d) => h.includes(d))) return "watch";
  if (STREAMING_HOSTS.some((d) => h.includes(d))) return "watch";
  if (PLACE_HOSTS.some((d) => h.includes(d))) return "go_out";
  return null;
}

// best-effort: pull a plausible title from a URL path slug (skips ids/uuids/junk)
function guessTitleFromUrl(u: URL): string | null {
  const skip = new Set(["movie", "movies", "tv", "title", "watch", "play", "video", "series", "show", "feature", "detail"]);
  const segs = u.pathname.split("/").filter(Boolean);
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = decodeURIComponent(segs[i]);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(s)) continue; // uuid
    if (/^\d+$/.test(s)) continue;                      // numeric id
    if (/[a-zA-Z]/.test(s) && s.length > 2 && !skip.has(s.toLowerCase())) {
      return s.replace(/[-_]+/g, " ").replace(/\.\w+$/, "").trim();
    }
  }
  return null;
}

function titleFromSlug(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

async function resolveWatchFromUrl(raw: string): Promise<WatchData | null> {
  const u = new URL(raw);
  const h = u.hostname.toLowerCase();
  const path = u.pathname;

  // themoviedb.org/movie/123-title  |  /tv/123
  if (h.includes("themoviedb.org")) {
    const m = path.match(/\/(movie|tv)\/(\d+)/);
    if (m) return getWatchByTmdb(m[1] as "movie" | "tv", Number(m[2]));
  }
  // imdb.com/title/tt1234567/
  if (h.includes("imdb.com")) {
    const m = path.match(/\/title\/(tt\d+)/);
    if (m) return getWatchByImdb(m[1]);
  }
  // letterboxd.com/film/past-lives/  → titleize slug → TMDB search (no LB API)
  if (h.includes("letterboxd.com")) {
    const m = path.match(/\/film\/([^/]+)/);
    if (m) return (await searchWatch(titleFromSlug(m[1])))[0] ?? null;
  }
  return null;
}

/** Main entry: detect + resolve a pasted link. Always returns something the UI can act on. */
export async function resolveUrl(raw: string): Promise<ResolveResult> {
  const url = raw.trim();
  const type = detectType(url);

  if (type === "listen") {
    const data = await resolveListen(url);
    if (data) return { type: "listen", resolved: true, data };
    return { type: "listen", resolved: false, reason: "couldn't resolve that music link — add it manually" };
  }

  if (type === "watch") {
    const data = await resolveWatchFromUrl(url);
    if (data) return { type: "watch", resolved: true, data };
    // streaming/unknown film link → guess the title from the slug for the picker
    let query: string | null = null;
    try { query = guessTitleFromUrl(new URL(url)); } catch { /* ignore */ }
    return {
      type: "watch",
      resolved: false,
      reason: query ? "pick the film:" : "that link can't be read — type the movie's name",
      query,
    };
  }

  if (type === "go_out") {
    // No maps API in v1 — best-effort name from the query, else manual.
    let place: string | null = null;
    try {
      const u = new URL(url);
      place = u.searchParams.get("q") || decodeURIComponent(u.pathname.split("/place/")[1]?.split("/")[0] || "") || null;
      if (place) place = place.replace(/\+/g, " ");
    } catch { /* ignore */ }
    return { type: "go_out", resolved: false, data: { place_name: place, source_url: url } };
  }

  return { type: null, resolved: false, reason: "not a link kizu knows — pick a type and add it" };
}
