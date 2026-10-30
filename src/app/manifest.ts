import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { color } from "@/styles/tokens";

export const dynamic = "force-static";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** The web app manifest: names from the name source (site.ts), colours from the tokens. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.brand} · ${site.name}`,
    short_name: site.brand,
    description: site.description,
    start_url: `${base}/`,
    display: "browser",
    background_color: color.ground,
    theme_color: color.ground,
  };
}
