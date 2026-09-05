import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Appointments",
    short_name: "Appointments",
    description: "Book hospital appointments with OTP login",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#9900ff",
    orientation: "portrait",
    icons: [
      {
        src: "/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
