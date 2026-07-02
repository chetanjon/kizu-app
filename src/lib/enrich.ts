// Catalog layer for the expanded feed card: film facts (score · runtime ·
// genre), the film's own tagline + a short synopsis for watch drops, and a
// 30-second iTunes preview url for listen drops. Same discipline as
// providers.ts: view-time fetch, 24h data cache, hard 800ms cap — a miss just
// means the drawer shows less. The keep-warm cron re-primes both caches every
// 5 minutes so a human almost never pays the fetch.

const TMDB = "https://api.themoviedb.org/3";

export type FilmFacts = {
  facts: string;           // "★ 7.0 · 3h 35m · drama" (parts drop out when unknown)
  tagline: string | null;  // the film's own line, lowercased to the house voice
  synopsis: string | null; // trimmed to ~280 chars on a word boundary
  trailer: string | null;  // YouTube video key for the best official trailer
};

// the best trailer from TMDB's videos block: official trailers beat fan
// uploads, trailers beat teasers, newer beats older within a tier.
type Video = { key?: string; site?: string; type?: string; official?: boolean; published_at?: string };
function pickTrailer(videos: unknown): string | null {
  const list = Array.isArray((videos as { results?: Video[] })?.results)
    ? (videos as { results: Video[] }).results : [];
  const yt = list.filter((v) => v.site === "YouTube" && typeof v.key === "string" && (v.type === "Trailer" || v.type === "Teaser"));
  if (!yt.length) return null;
  const tier = (v: Video) => (v.type === "Trailer" ? 2 : 0) + (v.official ? 1 : 0);
  yt.sort((a, b) => tier(b) - tier(a) || (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  return yt[0].key!;
}

type Row = { id: string; type: string; data: Record<string, unknown> | null | undefined };

const fmtRuntime = (min: unknown): string | null => {
  if (typeof min !== "number" || !Number.isFinite(min) || min <= 0) return null;
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

const trimTo = (text: unknown, max: number): string | null => {
  if (typeof text !== "string" || !text.trim()) return null;
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
};

async function fetchFilmFacts(media: "movie" | "tv", tmdbId: number | string): Promise<FilmFacts | null> {
  const k = process.env.TMDB_API_KEY;
  if (!k) return null;
  try {
    // videos ride the same request (append_to_response) — the trailer lookup
    // costs zero extra round trips.
    const res = await fetch(`${TMDB}/${media}/${tmdbId}?api_key=${k}&append_to_response=videos`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(800),
    });
    if (!res.ok) return null;
    const j = await res.json();
    const vote = typeof j.vote_average === "number" && j.vote_average > 0 ? `★ ${j.vote_average.toFixed(1)}` : null;
    const runtime = fmtRuntime(media === "movie" ? j.runtime : j.episode_run_time?.[0]);
    const genre = typeof j.genres?.[0]?.name === "string" ? j.genres[0].name.toLowerCase() : null;
    const facts = [vote, runtime, genre].filter(Boolean).join(" · ");
    const trailer = pickTrailer(j.videos);
    if (!facts && !j.tagline && !j.overview && !trailer) return null;
    return {
      facts,
      tagline: typeof j.tagline === "string" && j.tagline.trim() ? j.tagline.trim().toLowerCase() : null,
      synopsis: trimTo(j.overview, 280),
      trailer,
    };
  } catch {
    return null;
  }
}

/** item id → film facts, for the watch rows that carry a tmdb id. */
export async function filmFactsMap(rows: Row[]): Promise<Map<string, FilmFacts>> {
  const watch = rows.filter((r) => r.type === "watch" && r.data?.tmdb_id != null && r.data?.tmdb_id !== "");
  const entries = await Promise.all(
    watch.map(async (r) => {
      const media = r.data?.media_type === "tv" ? ("tv" as const) : ("movie" as const);
      const f = await fetchFilmFacts(media, r.data!.tmdb_id as number | string);
      return f ? ([r.id, f] as const) : null;
    })
  );
  return new Map(entries.filter((e): e is readonly [string, FilmFacts] => e !== null));
}

// iTunes previews are plain public audio files — playing one needs no Apple
// anything (works the same in every browser); the search API is keyless.
async function fetchPreview(title: string, artist: string | null): Promise<string | null> {
  const term = [title, artist].filter(Boolean).join(" ").trim();
  if (!term) return null;
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?media=music&entity=song&limit=1&term=${encodeURIComponent(term)}`,
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(800) }
    );
    if (!res.ok) return null;
    const r = (await res.json())?.results?.[0];
    return typeof r?.previewUrl === "string" ? r.previewUrl : null;
  } catch {
    return null;
  }
}

/** item id → 30s preview url, for listen rows iTunes can find. */
export async function previewMap(rows: Row[]): Promise<Map<string, string>> {
  const listen = rows.filter((r) => r.type === "listen" && typeof r.data?.title === "string");
  const entries = await Promise.all(
    listen.map(async (r) => {
      const artist = typeof r.data?.artist === "string" ? r.data.artist : null;
      const u = await fetchPreview(r.data!.title as string, artist);
      return u ? ([r.id, u] as const) : null;
    })
  );
  return new Map(entries.filter((e): e is readonly [string, string] => e !== null));
}
