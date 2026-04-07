import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${appConfig.appUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${appConfig.appUrl}/catalog`,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${appConfig.appUrl}/login`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
