// "Where to watch / you have it" for movies + TV. TMDB's free watch/providers
// endpoint (JustWatch-powered). Fetched at view time with a 1-day cache so it
// stays fresh without a backfill, and works for every existing drop immediately.

import type { Action } from "@/lib/item-actions";
import { SERVICES, serviceWatchUrl } from "@/lib/services";

const BASE = "https://api.themoviedb.org/3";
const REGION = "US";

// We only need which subscription services a title streams on (flatrate) — to
// answer the one personalized question "do YOU have it?". Everything else stays
// the plain "where to watch" pill, so we don't need rent/buy lists or the link.
async function fetchFlatrate(mediaType: "movie" | "tv", tmdbId: number | string): Promise<number[] | null> {
  const k = process.env.TMDB_API_KEY;
  if (!k) return null;
  try {
    const res = await fetch(`${BASE}/${mediaType}/${tmdbId}/watch/providers?api_key=${k}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const us = (await res.json())?.results?.[REGION];
    if (!us) return null;
    return Array.isArray(us.flatrate) ? us.flatrate.map((p: { provider_id: number }) => p.provider_id) : [];
  } catch {
    return null;
  }
}

const watchPage = (mediaType: "movie" | "tv", id: number | string) =>
  `https://www.themoviedb.org/${mediaType}/${id}/watch`;

/** A "you have it" pill ONLY when the title streams on a service the viewer has.
 *  Links straight INTO that service (search the title) when we have a reliable
 *  URL, else the TMDB watch page. Returns null → surface keeps "where to watch". */
function youHaveIt(flatrate: number[] | null, mine: string[], fallbackUrl: string, title: string | null): Action | null {
  if (!flatrate?.length) return null;
  const flat = new Set(flatrate);
  const yours = SERVICES.find((s) => mine.includes(s.slug) && s.ids.some((id) => flat.has(id)));
  if (!yours) return null;
  const direct = title ? serviceWatchUrl(yours.slug, title) : null;
  // label = just the service name; the green ✓ "have" pill conveys ownership.
  return { label: yours.name.toLowerCase(), url: direct ?? fallbackUrl, kind: "have" };
}

/** For a set of (id, data) watch rows → a map of item id → availability pill.
 *  Non-watch rows and rows without a tmdb id are skipped. */
export async function availabilityMap(
  rows: { id: string; type: string; data: Record<string, unknown> | null | undefined }[],
  mine: string[],
): Promise<Map<string, Action>> {
  const watch = rows.filter((r) => r.type === "watch" && r.data?.tmdb_id != null && r.data?.tmdb_id !== "");
  const entries = await Promise.all(
    watch.map(async (r) => {
      const media = (typeof r.data?.media_type === "string" && r.data.media_type === "tv") ? "tv" : "movie";
      const tmdbId = r.data!.tmdb_id as number | string;
      const flatrate = await fetchFlatrate(media, tmdbId);
      const title = typeof r.data?.title === "string" ? r.data.title : null;
      const a = youHaveIt(flatrate, mine, watchPage(media, tmdbId), title);
      return a ? ([r.id, a] as const) : null;
    }),
  );
  return new Map(entries.filter((e): e is readonly [string, Action] => e !== null));
}
