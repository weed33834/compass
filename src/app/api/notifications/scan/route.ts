// 通知扫描触发器
// POST /api/notifications/scan → 触发 scanAndNotify

import { NextResponse } from "next/server";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { scanAndNotify } from "@/lib/notifications";

export async function POST() {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  // 每人每 5 分钟最多触发一次扫描
  const limited = assertRateLimit(`notify-scan:${auth.userId}`, 1, 5 * 60_000);
  if (limited) return NextResponse.json({ message: "请稍后再试" }, { status: 429 });

  const count = await scanAndNotify(auth.userId);

  if (count === 0) {
    return NextResponse.json({ message: "无需通知", count: 0 }, { status: 204 });
  }
  return NextResponse.json({ message: `已生成 ${count} 条通知`, count });
}
