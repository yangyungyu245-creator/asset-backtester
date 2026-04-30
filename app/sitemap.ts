import type { MetadataRoute } from "next";

const baseUrl = "https://investment-simulator.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/simple", "/advanced/dates", "/about"];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
