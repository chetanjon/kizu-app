// "Act on it" links for a drop — the bridge from a trusted rec to doing it tonight.
// Pure (server + client safe), mirrors src/lib/item-render.ts. Reads data that's
// ALREADY stored on the drop: music platform links (odesli), a place's source url,
// a movie's tmdb id. No network, no key.

import type { DropType } from "@/lib/item-render";
import { MUSIC_APPS, musicSearchUrl } from "@/lib/music-apps";

export type Action = { label: string; url: string; kind: "play" | "watch" | "map" | "have" | "set"; primary?: boolean };

type ActItem = { type: DropType; data: Record<string, unknown> | null | undefined };

const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

// odesli stores links under these label keys (see src/lib/odesli.ts PLATFORMS).
// Order = which we surface first; cap at 2 so cards stay calm.
const MUSIC_PRIORITY: { key: string; label: string }[] = [
  { key: "spotify", label: "spotify" },
  { key: "apple", label: "apple music" },
  { key: "youtube", label: "youtube" },
  { key: "youtubeMusic", label: "yt music" },
  { key: "soundcloud", label: "soundcloud" },
  { key: "tidal", label: "tidal" },
  { key: "deezer", label: "deezer" },
  { key: "amazon", label: "amazon" },
];

// One pill for a given music app: its direct deep link if the song has it, else
// a search in that app — so "your app" always opens, even on un-enriched songs.
function appPill(slug: string, links: Record<string, unknown>, d: Record<string, unknown>): Action | null {
  const app = MUSIC_APPS.find((a) => a.slug === slug);
  if (!app) return null;
  const direct = str(links[slug]);
  if (direct) return { label: app.pill, url: direct, kind: "play" };
  const q = [str(d.title), str(d.artist)].filter(Boolean).join(" ");
  const surl = q ? musicSearchUrl(slug, q) : null;
  return surl ? { label: app.pill, url: surl, kind: "play" } : null;
}

export function actionsFor(item: ActItem, musicApp?: string | null): Action[] {
  const d = item.data ?? {};

  if (item.type === "listen") {
    const links = (d.platform_links && typeof d.platform_links === "object")
      ? (d.platform_links as Record<string, unknown>) : {};

    // picked an app → open it first, with yt music as a universal second option
    // (free, has ~everything). Each pill is a direct deep link if we have one,
    // else a search in that app, so it always works.
    if (musicApp) {
      const out: Action[] = [];
      const primary = appPill(musicApp, links, d);
      if (primary) { primary.primary = true; out.push(primary); } // their app → highlighted
      // universal second option: yt music (free, has ~everything) — or spotify
      // when they already picked yt music as their app.
      const secondSlug = musicApp === "youtubeMusic" ? "spotify" : "youtubeMusic";
      const second = appPill(secondSlug, links, d);
      if (second) out.push(second);
      if (out.length) return out;
    }

    // no app picked → the song's available play pills + a clear prompt to pick one
    const out: Action[] = [];
    for (const { key, label } of MUSIC_PRIORITY) {
      const url = str(links[key]);
      if (url) out.push({ label, url, kind: "play" });
      if (out.length === 2) break;
    }
    if (!out.length) {
      // no per-platform links (e.g. a manual drop) → the universal song.link, then source
      const fallback = str(d.odesli_url) || str(d.source_url);
      if (fallback) out.push({ label: "listen", url: fallback, kind: "play" });
    }
    // only nudge people who haven't picked yet (never on a fall-through above).
    if (!musicApp) out.push({ label: "pick your music app", url: "/you#music", kind: "set" });
    return out;
  }

  if (item.type === "go_out") {
    const src = str(d.source_url);
    if (src) return [{ label: "open in maps", url: src, kind: "map" }];
    const place = str(d.place_name);
    if (place) {
      return [{
        label: "open in maps",
        url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`,
        kind: "map",
      }];
    }
    return [];
  }

  // watch — TMDB's free, JustWatch-powered watch page when we have the id, else a search.
  const tmdbId = d.tmdb_id;
  if (tmdbId != null && tmdbId !== "") {
    const kind = str(d.media_type) === "tv" ? "tv" : "movie";
    return [{ label: "where to watch", url: `https://www.themoviedb.org/${kind}/${tmdbId}/watch`, kind: "watch" }];
  }
  const tit = str(d.title);
  if (tit) {
    return [{ label: "where to watch", url: `https://www.google.com/search?q=${encodeURIComponent(`where to watch ${tit}`)}`, kind: "watch" }];
  }
  return [];
}
