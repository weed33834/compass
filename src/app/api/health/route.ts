// 健康检查端点
// GET /api/health → 200 { status: "ok", timestamp, db: "ok"|"down" }
// 用于 Docker / K8s 容器探活，无需认证
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  try {
    // 简单 ping 数据库（select 1）
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      timestamp,
      db: "ok",
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp,
        db: "down",
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 503 }
    );
  }
}
