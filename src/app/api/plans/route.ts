// 学习计划列表 / 创建
// GET  /api/plans → 列出当前用户全部学习计划（按状态排序）
// POST /api/plans → 创建学习计划

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";

interface CreatePlanBody {
  title: string;
  bankId?: string;
  startDate?: string; // ISO 8601
  endDate?: string;
  dailyNewCards?: number;
  dailyReviewCap?: number;
  desiredRetention?: number;
}

export async function GET() {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const plans = await prisma.learningPlan.findMany({
    where: { userId: auth.userId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      bank: { select: { id: true, name: true, coverColor: true } },
    },
  });

  return NextResponse.json({ plans });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const limited = assertRateLimit(`plan-create:${auth.userId}`, 10, 60_000);
  if (limited) return limited;

  const body = await parseJsonBody<CreatePlanBody>(request);
  if (!body || !body.title || body.title.trim().length === 0) {
    return NextResponse.json({ error: "计划标题不能为空" }, { status: 400 });
  }
  if (body.title.length > 100) {
    return NextResponse.json({ error: "计划标题过长（最多 100 字符）" }, { status: 400 });
  }

  const now = new Date();
  const startDate = body.startDate ? new Date(body.startDate) : now;
  const endDate = body.endDate ? new Date(body.endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (startDate >= endDate) {
    return NextResponse.json({ error: "开始日期必须早于结束日期" }, { status: 400 });
  }

  // 验证 bankId（如果提供）属于当前用户
  if (body.bankId) {
    const bank = await prisma.questionBank.findFirst({
      where: { id: body.bankId, userId: auth.userId },
      select: { id: true },
    });
    if (!bank) {
      return NextResponse.json({ error: "题库不存在或无权访问" }, { status: 403 });
    }
  }

  const plan = await prisma.learningPlan.create({
    data: {
      userId: auth.userId,
      title: body.title.trim(),
      bankId: body.bankId ?? null,
      startDate,
      endDate,
      dailyNewCards: body.dailyNewCards ?? 20,
      dailyReviewCap: body.dailyReviewCap ?? 200,
      desiredRetention: body.desiredRetention ?? 0.9,
    },
  });

  return NextResponse.json({ plan }, { status: 201 });
}
