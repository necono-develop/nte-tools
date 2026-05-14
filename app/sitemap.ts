import type { MetadataRoute } from "next";
import { SITE_ROUTES, SITE_URL } from "../lib/generated-sitemap";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return SITE_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.route === "/" ? "" : route.route}`,
    lastModified: new Date(route.lastModified),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
