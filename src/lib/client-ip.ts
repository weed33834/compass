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
 * 提取顺序：
 *  1. x-real-ip（Caddy/Nginx 反代设置，不可被客户端伪造，最可信）
 *  2. x-forwarded-for 链的第一个 IP（多跳代理时为最原始客户端 IP）
 *  3. "unknown"（兜底）
 */
export function getClientIP(request: {
  headers: Headers | Record<string, string | string[] | undefined>;
}): string {
  const getHeader = (name: string): string | null => {
    const h = request.headers;
    if (typeof (h as Headers).get === "function") {
      // NextRequest / Web Headers
      return (h as Headers).get(name);
    }
    // Node IncomingHttpHeaders（key 小写）
    const v = (h as Record<string, string | string[] | undefined>)[name.toLowerCase()];
    if (Array.isArray(v)) return v[0] ?? null;
    return v ?? null;
  };

  // x-real-ip 由 Caddy header_up X-Real-IP 设置，是真实的直连 IP
  const realIP = getHeader("x-real-ip");
  if (realIP && realIP.trim()) {
    return realIP.trim();
  }

  // 回退到 x-forwarded-for 链的第一个 IP
  const forwarded = getHeader("x-forwarded-for");
  if (forwarded) {
    const firstIP = forwarded.split(",")[0].trim();
    if (firstIP) return firstIP;
  }

  return "unknown";
}
