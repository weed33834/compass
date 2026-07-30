import type { MetadataRoute } from "next";
import { headers } from "next/headers";

// 站点根地址解析优先级：
//   1) 显式环境变量 NEXT_PUBLIC_SITE_URL（构建期注入，适合固定域名/自定义域）
//   2) 运行时请求 Host（Render / Vercel 默认域名、反代透传，免重构建自动适配）
//   3) 兜底占位域名
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

export default async function robots(): Promise<MetadataRoute.Robots> {
  const SITE_URL = await resolveSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 仅公开营销页可被抓取；API 与登录后应用页禁止索引
      disallow: ["/api/", "/compass", "/study", "/workshop", "/wrongbook", "/logbook", "/analytics", "/account"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
