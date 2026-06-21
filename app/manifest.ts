import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Catalink",
    short_name: "Catalink",
    description:
      "Crée ton catalogue, partage ton lien et gère tes commandes depuis ton téléphone.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#7c3aed",
    orientation: "portrait-primary",
    lang: "fr",
    categories: ["business", "shopping"],
    icons: [
      {
        src: "/icons/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    scope: "/",
    id: "/dashboard",
  };
}
