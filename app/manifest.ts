import type { MetadataRoute } from "next";
import { site } from "@/lib/content";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.fullName,
    short_name: site.name,
    description: site.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#9900ff",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/favicon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
