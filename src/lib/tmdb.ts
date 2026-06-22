// TMDB — movie/TV search + lookup for the "movies" (watch) drop type.
// Free v3 API key (themoviedb.org → Settings → API). Used server-side only.

const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/w500";

export type WatchData = {
  tmdb_id: number;
  title: string;
  year: string | null;
  poster_url: string | null;
  media_type: "movie" | "tv";
};

function key(): string {
  const k = process.env.TMDB_API_KEY;
  if (!k) throw new Error("TMDB_API_KEY is not set. Add it to .env.local / Vercel.");
  return k;
}

function yearOf(r: { release_date?: string; first_air_date?: string }): string | null {
  const d = r.release_date || r.first_air_date || "";
  return d ? d.slice(0, 4) : null;
}

function toWatch(r: any): WatchData {
  const media: "movie" | "tv" = r.media_type === "tv" || r.first_air_date ? "tv" : "movie";
  return {
    tmdb_id: r.id,
    title: r.title || r.name,
    year: yearOf(r),
    poster_url: r.poster_path ? `${IMG}${r.poster_path}` : null,
    media_type: media,
  };
}

/** In-app search box for the watch drop flow. Movies + TV, ranked by popularity. */
export async function searchWatch(query: string): Promise<WatchData[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `${BASE}/search/multi?include_adult=false&language=en-US&query=${encodeURIComponent(q)}&api_key=${key()}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results || [])
    .filter((r: any) => (r.media_type === "movie" || r.media_type === "tv") && (r.title || r.name))
    .slice(0, 8)
    .map(toWatch);
}

/** Resolve a pasted themoviedb.org link (/movie/123 or /tv/123). */
export async function getWatchByTmdb(mediaType: "movie" | "tv", id: number): Promise<WatchData | null> {
  const url = `${BASE}/${mediaType}/${id}?language=en-US&api_key=${key()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return toWatch({ ...(await res.json()), media_type: mediaType });
}

/** Resolve a pasted IMDb link via TMDB's /find by external id. */
export async function getWatchByImdb(imdbId: string): Promise<WatchData | null> {
  const url = `${BASE}/find/${imdbId}?external_source=imdb_id&api_key=${key()}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = await res.json();
  const hit = (j.movie_results || [])[0] || (j.tv_results || [])[0];
  if (!hit) return null;
  return toWatch({ ...hit, media_type: j.movie_results?.length ? "movie" : "tv" });
}
