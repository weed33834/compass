import type { MetadataRoute } from "next";

/**
 * robots.txt — 引导搜索引擎抓取公开页面，屏蔽鉴权与 API 路径。
 * Next.js 在 build 时将此文件渲染为 /robots.txt。
 */
export default function robots(): MetadataRoute.Robots {
  const host = "https://gitcode.com/badhope/compass";
  return {
    rules: [
      {
        // 公开落地页与文档可索引
        userAgent: "*",
        allow: ["/", "/login", "/register", "/forgot-password"],
        disallow: [
          // 鉴权后的功能区与全部 API 不应进索引
          "/compass",
          "/study",
          "/workshop",
          "/wrongbook",
          "/logbook",
          "/analytics",
          "/account",
          "/api/",
        ],
      },
    ],
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
