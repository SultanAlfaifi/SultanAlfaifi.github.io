import type { MetadataRoute } from "next";
import { seo } from "@/data/portfolio";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: seo.siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: { ar: `${seo.siteUrl}/ar/` } }
    },
    {
      url: `${seo.siteUrl}/ar/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: { languages: { en: seo.siteUrl } }
    },
    {
      url: `${seo.siteUrl}/agent-evals/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4
    }
  ];
}
