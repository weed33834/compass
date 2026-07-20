/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone 输出：Next 生成最小自托管 server.js + 精简 node_modules，
  // Docker runner 阶段无需完整 node_modules，镜像体积显著缩小
  output: 'standalone',

  // 关闭 X-Powered-By 响应头，避免泄露技术栈（Caddy 侧亦会 -Server 隐藏版本）
  poweredByHeader: false,

  // 允许远程开发代理访问 dev 资源（MCP 集成浏览器通过 ws 代理访问 HMR 时需要）
  allowedDevOrigins: ['*.svc.cluster.local', 'localhost', '127.0.0.1'],

  // 服务端外置包：Prisma 客户端 / bcrypt / nodemailer 含原生或动态加载逻辑，
  // 外置后由 Node 运行时按需 require，避免被打包进 standalone 产物导致失效。
  // Next 15+: 顶层 serverExternalPackages。
  serverExternalPackages: ['@prisma/client', 'bcryptjs', 'nodemailer'],

  // 全局安全响应头：与 Caddy 边缘安全头形成纵深防御，
  // 即便绕过反代直连 app:3000（如内网健康探活）也保留基本防护。
  // CSP 不在此处下发：Next.js 内联 RSC/样式需 'unsafe-inline'，
  // 故 CSP 统一由 Caddyfile 边缘层管理（含 'unsafe-inline'，移除 'unsafe-eval'）。
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
