import type { MetadataRoute } from "next"

/** Carte d'identité de l'application, pour l'installer sur l'écran d'accueil. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mivtsa Now",
    short_name: "Mivtsa Now",
    description: "Trouvez l'intervenant disponible le plus proche.",
    lang: "fr",
    start_url: "/accueil",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icones/icone-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
