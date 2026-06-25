import type { MetadataRoute } from "next";

// Crawl the public front door; keep the private invite-only app out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login"],
      disallow: ["/home", "/tonight", "/queue", "/you", "/drop", "/groups", "/join", "/admin", "/api", "/r"],
    },
    sitemap: "https://kizu.app/sitemap.xml",
    host: "https://kizu.app",
  };
}
