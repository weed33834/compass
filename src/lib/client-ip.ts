/**
 * 从请求中安全提取客户端 IP（兼容 NextRequest 与 Node IncomingMessage）
 *
 * 背景：
 * - Next.js Route Handler / Middleware 接收的是 NextRequest（Web Request API），
 *   其 headers 是 Headers 实例，用 headers.get(name) 读取，name 大小写不敏感。
 * - NextAuth v4 authorize 回调传入的 req 是原生 Node.js IncomingMessage，
 *   其 headers 是普通 IncomingHttpHeaders（Record<string, string|string[]|undefined>），
 *   用 headers[name] 读取，name 必须小写。
 * 本函数同时兼容这两种对象，避免 `request.headers.get is not a function` 崩溃。
 *
 * H-7 修复：x-real-ip / x-forwarded-for 可被客户端伪造！
 *   - 仅当部署在反向代理（Caddy/Nginx）后，且代理配置了"覆盖"客户端同名 header 时才可信
 *   - 通过 TRUSTED_PROXY_IPS 环境变量声明可信代理 IP，仅当直连 IP 在白名单内才信任代理头
 *   - 若未配置白名单（默认），仅在 NODE_ENV=development 时信任代理头；生产环境必须配置
 *
 * 提取顺序：
 *  1. 若直连 IP 在可信代理白名单内 → x-real-ip → x-forwarded-for 链首 IP
 *  2. 直连 socket remoteAddress
 *  3. "unknown"（兜底）
 */

// 可信代理 IP 白名单（逗号分隔，如 "127.0.0.1,10.0.0.0/8"）
// 未配置时：开发环境信任所有代理头，生产环境仅信任直连 IP
const TRUSTED_PROXIES = (process.env.TRUSTED_PROXY_IPS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const IS_DEV = process.env.NODE_ENV === "development";

function isTrustedProxy(ip: string | null | undefined): boolean {
  if (!ip) return false;
  if (TRUSTED_PROXIES.length === 0) return IS_DEV; // 未配置白名单：仅 dev 信任
  // 简化匹配：精确匹配（CIDR 匹配需额外依赖，暂不支持）
  return TRUSTED_PROXIES.includes(ip);
}

export function getClientIP(request: {
  headers: Headers | Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  info?: { remoteAddress?: string };
}): string {
  const getHeader = (name: string): string | null => {
    const h = request.headers;
    if (typeof (h as Headers).get === "function") {
      return (h as Headers).get(name);
    }
    const v = (h as Record<string, string | string[] | undefined>)[name.toLowerCase()];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };

  // 直连 socket IP（不可伪造）
  const directIP = request.socket?.remoteAddress ?? request.info?.remoteAddress ?? null;

  // H-7 修复：仅当直连 IP 是可信代理时才信任 x-real-ip / x-forwarded-for
  const trustProxy = isTrustedProxy(directIP);

  if (trustProxy) {
    const realIP = getHeader("x-real-ip");
    if (realIP && realIP.trim()) {
      return realIP.trim();
    }
    const forwarded = getHeader("x-forwarded-for");
    if (forwarded) {
      const firstIP = forwarded.split(",")[0].trim();
      if (firstIP) return firstIP;
    }
  }

  // 回退到直连 IP
  if (directIP) return directIP;

  return "unknown";
}
