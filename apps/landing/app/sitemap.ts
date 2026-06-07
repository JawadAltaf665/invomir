import type { MetadataRoute } from "next";
import { alternatives, blogPosts } from "./lib/content";
import { site } from "./lib/site";

export const dynamic = "force-static";

const staticRoutes = [
  "",
  "/pricing",
  "/about",
  "/blog",
  "/help",
  "/privacy",
  "/terms",
  "/security",
  "/status",
  "/changelog",
  "/api-docs",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    ...staticRoutes,
    ...blogPosts.map((post) => `/blog/${post.slug}`),
    ...alternatives.map((alternative) => `/alternatives/${alternative.slug}`),
  ];

  return routes.map((route) => ({
    url: `${site.marketingUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/pricing" ? 0.9 : 0.7,
  }));
}
