import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpsLens AI",
    short_name: "OpsLens",
    description: "OpsLens operational dashboard",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f7",
    theme_color: "#1d1d1f",
    icons: [
      {
        src: "/icons/icon.svg",
        type: "image/svg+xml",
        sizes: "any"
      }
    ]
  };
}

