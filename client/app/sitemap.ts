import type { MetadataRoute } from "next";

const publicRoutes = ["", "/sign-in", "/sign-up", "/privacy", "/terms", "/copyright"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route, index) => ({
    url: `https://www.echomind.co.in${route || "/"}`,
    lastModified,
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route.startsWith("/sign-") ? 0.6 : 0.4,
  }));
}
