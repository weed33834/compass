import type { MetadataRoute } from "next";

/**
 * sitemap.xml — 向搜索引擎声明可索引的公开页面。
 * 仅列出无需登录即可访问的页面（功能区需登录，不进 sitemap）。
 * Next.js 在 build 时将此文件渲染为 /sitemap.xml。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const host = "https://gitcode.com/badhope/compass";
  const now = new Date();
  return [
    {
      url: `${host}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${host}/login`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${host}/register`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${host}/forgot-password`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
