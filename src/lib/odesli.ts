// Odesli / song.link — resolve any music link into a universal link + metadata
// + per-platform deep links, so the recipient plays it on whatever app they use.
// Free public API, no key. Server-side.

const API = "https://api.song.link/v1-alpha.1/links";

export type ListenData = {
  source_url: string;
  odesli_url: string | null;
  title: string | null;
  artist: string | null;
  artwork_url: string | null;
  platform_links: Record<string, string>;
};

// platforms we surface as "play on X" (Odesli returns many more)
const PLATFORMS: Record<string, string> = {
  spotify: "spotify",
  appleMusic: "apple",
  youtube: "youtube",
  youtubeMusic: "youtubeMusic",
  soundcloud: "soundcloud",
  tidal: "tidal",
  amazonMusic: "amazon",
  deezer: "deezer",
};

/** Resolve a pasted music URL. Returns null on failure (caller falls back to manual). */
export async function resolveListen(url: string): Promise<ListenData | null> {
  try {
    const res = await fetch(`${API}?url=${encodeURIComponent(url)}&userCountry=US`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const j = await res.json();
    const entity = j.entitiesByUniqueId?.[j.entityUniqueId];

    const platform_links: Record<string, string> = {};
    for (const [odKey, label] of Object.entries(PLATFORMS)) {
      const link = j.linksByPlatform?.[odKey]?.url;
      if (link) platform_links[label] = link;
    }

    return {
      source_url: url,
      odesli_url: j.pageUrl ?? null,
      title: entity?.title ?? null,
      artist: entity?.artistName ?? null,
      artwork_url: entity?.thumbnailUrl ?? null,
      platform_links,
    };
  } catch {
    return null;
  }
}
