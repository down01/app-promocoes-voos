import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voo Barato",
    short_name: "Voo Barato",
    description: "Promoções de passagens com aviso de queda de preço",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fb",
    theme_color: "#0284c7",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
