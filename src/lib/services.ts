// The streaming services people can say they have. Pure data (no server-only
// code) so both the client picker and the server providers logic can import it.
// Each maps to the TMDB provider id(s) that appear in a title's `flatrate`.

export const SERVICES: { slug: string; name: string; ids: number[] }[] = [
  { slug: "netflix", name: "Netflix", ids: [8, 1796] },
  { slug: "prime", name: "Prime Video", ids: [9, 119] },
  { slug: "hulu", name: "Hulu", ids: [15] },
  { slug: "disney", name: "Disney+", ids: [337] },
  { slug: "max", name: "HBO Max", ids: [1899, 384] },
  { slug: "apple", name: "Apple TV+", ids: [350] },
  { slug: "peacock", name: "Peacock", ids: [386, 387] },
  { slug: "paramount", name: "Paramount+", ids: [531, 582] },
];

const SLUGS = new Set(SERVICES.map((s) => s.slug));

export const cleanServices = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.map(String).filter((s) => SLUGS.has(s)))] : [];

/** Open a service straight to a search for this title, so "you have it" lands you
 *  IN the app instead of on a TMDB page. Only services with a reliable public
 *  search URL — Disney+/Peacock return null → caller falls back to the watch page. */
export function serviceWatchUrl(slug: string, title: string): string | null {
  const q = encodeURIComponent(title);
  switch (slug) {
    case "netflix":   return `https://www.netflix.com/search?q=${q}`;
    case "prime":     return `https://www.primevideo.com/search?phrase=${q}`;
    case "hulu":      return `https://www.hulu.com/search?q=${q}`;
    case "max":       return `https://play.hbomax.com/search?q=${q}`;
    case "apple":     return `https://tv.apple.com/search?term=${q}`;
    case "paramount": return `https://www.paramountplus.com/search/?query=${q}`;
    default:          return null; // disney / peacock → no reliable URL, use fallback
  }
}
