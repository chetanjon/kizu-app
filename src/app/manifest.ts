import type { MetadataRoute } from "next";

// Installable PWA manifest. Next auto-injects <link rel="manifest">.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "kizu · good taste runs in the group",
    short_name: "kizu",
    description: "A private taste space for you and your people.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#16130E",
    theme_color: "#16130E",
    icons: [
      { src: "/icons/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
