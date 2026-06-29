// The music app a person lives in. People have ONE (you live in Spotify *or*
// Apple Music), so this is a single choice — unlike streaming services. Each
// slug is also the `platform_links` key Odesli stores (see src/lib/odesli.ts),
// so a pick maps straight to a deep link on the drop. Pure data (no server-only
// code) → both the client picker and the pure item-actions logic can import it.

export const MUSIC_APPS: { slug: string; name: string; pill: string }[] = [
  { slug: "spotify", name: "Spotify", pill: "spotify" },
  { slug: "youtubeMusic", name: "YouTube Music", pill: "yt music" },
  { slug: "apple", name: "Apple Music", pill: "apple music" },
];

const SLUGS = new Set(MUSIC_APPS.map((a) => a.slug));

/** A whitelisted slug, or null (no preference / cleared). */
export const cleanMusicApp = (v: unknown): string | null =>
  typeof v === "string" && SLUGS.has(v) ? v : null;

/** Open the user's app to a search for this song, when we have no direct deep
 *  link for it (e.g. an older Apple-only drop). One tap lands them on the track
 *  in their app — so "your music app" always works, no enrichment required. */
export function musicSearchUrl(slug: string, query: string): string | null {
  const q = encodeURIComponent(query);
  switch (slug) {
    case "spotify": return `https://open.spotify.com/search/${q}`;
    case "youtubeMusic": return `https://music.youtube.com/search?q=${q}`;
    case "apple": return `https://music.apple.com/us/search?term=${q}`;
    default: return null;
  }
}
