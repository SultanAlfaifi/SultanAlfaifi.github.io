import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sultan Alfaifi | Portfolio",
    short_name: "Sultan Alfaifi",
    description:
      "Full-stack software engineer specializing in AI agents and LLM applications.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f3ec",
    theme_color: "#111816",
    icons: [
      {
        src: "/brand/sultan-alfaifi-mark.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
