import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Robots.txt disallow is prefix matching — "/pluggeo" alone already
      // covers every nested admin route (/pluggeo/products, etc.).
      disallow: ["/pluggeo", "/sign-in"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
