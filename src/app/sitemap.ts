import type { MetadataRoute } from "next";

// Only the public surfaces — the app itself is invite-only and noindex'd.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://kizu.app", changeFrequency: "weekly", priority: 1 },
    { url: "https://kizu.app/login", changeFrequency: "monthly", priority: 0.5 },
  ];
}
