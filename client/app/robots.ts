import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/sign-in", "/sign-up", "/privacy", "/terms", "/copyright"],
      disallow: [
        "/echo/",
        "/history",
        "/settings",
        "/premium",
        "/monitoring",
        "/pulse/",
      ],
    },
    sitemap: "https://www.echomind.co.in/sitemap.xml",
    host: "https://www.echomind.co.in",
  };
}
