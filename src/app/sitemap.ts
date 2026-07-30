import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// 站点根地址解析优先级同 robots.ts（见 src/app/robots.ts 注释）：
//   环境变量 NEXT_PUBLIC_SITE_URL → 运行时请求 Host → 兜底占位
async function resolveSiteUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (env) return env;
  try {
    const h = await headers();
    const host = h.get("host") ?? h.get("x-forwarded-host");
    if (host) {
      const proto = h.get("x-forwarded-proto") || "https";
      return `${proto}://${host}`;
    }
  } catch {
    /* headers() 在构建期不可用，忽略 */
  }
  return "https://compass.example.com";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = await resolveSiteUrl();
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/offline`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
