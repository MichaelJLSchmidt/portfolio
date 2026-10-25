import type { MetadataRoute } from "next";
import { PRIMARY_DOMAIN } from "@/hosting/config";

export const dynamic = "force-static";

// Preview builds (NEXT_PUBLIC_PREVIEW=1) block all crawlers; production allows them.
export default function robots(): MetadataRoute.Robots {
  if (process.env.NEXT_PUBLIC_PREVIEW === "1") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `https://${PRIMARY_DOMAIN}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/sitemap.xml` };
}
