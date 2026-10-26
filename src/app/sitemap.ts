import type { MetadataRoute } from "next";
import { caseStudies } from "@/content/case-studies";
import { PRIMARY_DOMAIN } from "@/hosting/config";

export const dynamic = "force-static";

const base = `https://${PRIMARY_DOMAIN}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`;

// Indexable pages only: flagged examples are always noindex, so they are never listed.
export default function sitemap(): MetadataRoute.Sitemap {
  const studies = Object.entries(caseStudies).filter(([, study]) => !study.example);
  return [{ url: `${base}/` }, { url: `${base}/about/` }, ...studies.map(([slug]) => ({ url: `${base}/work/${slug}/` }))];
}
