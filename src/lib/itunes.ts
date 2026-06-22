// iTunes Search API — free, no key. Lets you resolve a song *by name* (artwork +
// artist) without needing a pasted link. Pasting a real link still uses Odesli
// for universal cross-platform play links.

export type ListenHit = {
  title: string;
  artist: string;
  artwork_url: string | null;
  source_url: string | null;
  platform_links: Record<string, string>;
};

export async function searchListen(q: string): Promise<ListenHit[]> {
  const term = q.trim();
  if (!term) return [];
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?media=music&entity=song&limit=6&term=${encodeURIComponent(term)}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) return [];
    const j = await res.json();
    return (j.results ?? []).map((r: any) => ({
      title: r.trackName,
      artist: r.artistName,
      artwork_url: (r.artworkUrl100 || "").replace("100x100", "400x400") || null,
      source_url: r.trackViewUrl || null,
      platform_links: r.trackViewUrl ? { apple: r.trackViewUrl } : {},
    }));
  } catch {
    return [];
  }
}
