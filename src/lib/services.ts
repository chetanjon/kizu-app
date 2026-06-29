// The streaming services people can say they have. Pure data (no server-only
// code) so both the client picker and the server providers logic can import it.
// Each maps to the TMDB provider id(s) that appear in a title's `flatrate`.

export const SERVICES: { slug: string; name: string; ids: number[] }[] = [
  { slug: "netflix", name: "Netflix", ids: [8, 1796] },
  { slug: "prime", name: "Prime Video", ids: [9, 119] },
  { slug: "hulu", name: "Hulu", ids: [15] },
  { slug: "disney", name: "Disney+", ids: [337] },
  { slug: "max", name: "Max", ids: [1899, 384] },
  { slug: "apple", name: "Apple TV+", ids: [350] },
  { slug: "peacock", name: "Peacock", ids: [386, 387] },
  { slug: "paramount", name: "Paramount+", ids: [531, 582] },
];

const SLUGS = new Set(SERVICES.map((s) => s.slug));

export const cleanServices = (v: unknown): string[] =>
  Array.isArray(v) ? [...new Set(v.map(String).filter((s) => SLUGS.has(s)))] : [];
