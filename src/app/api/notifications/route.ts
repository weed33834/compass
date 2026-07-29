// 通知列表 / 标记已读
// GET  /api/notifications → 获取通知列表（支持 ?unread=true 过滤）
// POST /api/notifications → 标记全部已读

import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { getUnreadNotifications, markAllNotificationsRead } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));

  // 简单实现：用 prisma 直接查
  const { prisma } = await import("@/lib/prisma");
  const notifications = await prisma.notification.findMany({
    where: {
      userId: auth.userId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ notifications });
}

export async function POST() {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  await markAllNotificationsRead(auth.userId);
  return NextResponse.json({ success: true });
}
