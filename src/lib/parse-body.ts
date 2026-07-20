import type { NextRequest } from "next/server";

/**
 * 安全解析 JSON 请求体：非 JSON / 空 body / 格式错误时返回 null（不抛错）。
 *
 * 用于统一替代 API 路由中的 `await request.json()`：
 * 后者在收到空 body 或非法 JSON 时会抛 SyntaxError，若路由未 try/catch 或
 * catch 里未细分错误类型，会被吞成 500 服务器内部错误，而正确语义应为 400。
 *
 * 用法：
 *   const body = await parseJsonBody(request);
 *   if (body === null) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
 */
export async function parseJsonBody<T = unknown>(
  request: NextRequest
): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
