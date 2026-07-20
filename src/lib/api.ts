import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

// 统一 401 鉴权：返回 userId 与可选的错误响应，调用方先判 errorResponse 再继续
export async function requireApiUser(): Promise<
  | { userId: string; errorResponse: null }
  | { userId: null; errorResponse: NextResponse }
> {
  const userId = await getAuthUserId();
  if (!userId) {
    return {
      userId: null,
      errorResponse: NextResponse.json({ error: "未登录" }, { status: 401 }),
    };
  }
  return { userId, errorResponse: null };
}

// 统一 429 限流：成功返回 null，失败返回 429 响应
export function assertRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const rl = rateLimit(identifier, limit, windowMs);
  if (!rl.success) {
    return NextResponse.json(
      { error: "操作过于频繁，请稍后再试" },
      { status: 429 }
    );
  }
  return null;
}
