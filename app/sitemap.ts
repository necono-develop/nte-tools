import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const routes = ["", "/buildcard", "/privacy", "/terms", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `https://nte-tools.com${route}`,
    lastModified: new Date("2026-05-13"),
  }));
}
