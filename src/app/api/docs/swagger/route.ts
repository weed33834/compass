// Swagger UI 预览页面
// 访问 /api/docs/swagger → 渲染交互式 API 文档
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API 文档 · Compass",
  robots: { index: false, follow: false },
};

export const dynamic = "force-static";

export function GET() {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Compass API 文档</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html { background: #0a0f14; }
    body { margin: 0; }
    .swagger-ui .topbar { background: #0d1319; border-bottom: 1px solid rgba(201,162,39,0.3); }
    .swagger-ui .info .title { color: #f5f0e1; }
    .swagger-ui .scheme-container { background: #0d1319; }
    .swagger-ui { color: #c8c3b8; }
    .swagger-ui .opblock-tag { color: #c8c3b8; }
    .swagger-ui .opblock .opblock-summary-description { color: #999; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    SwaggerUIBundle({
      url: "/api/docs",
      dom_id: "#swagger-ui",
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout",
      defaultModelsExpandDepth: -1,
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
