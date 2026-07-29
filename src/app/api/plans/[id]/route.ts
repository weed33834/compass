// 学习计划详情 / 更新 / 删除
// GET    /api/plans/[id] → 获取单个计划详情
// PATCH  /api/plans/[id] → 更新计划字段（标题/日期/状态等）
// DELETE /api/plans/[id] → 删除计划

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;
  const plan = await prisma.learningPlan.findFirst({
    where: { id, userId: auth.userId },
    include: {
      bank: {
        select: { id: true, name: true, coverColor: true, totalQuestions: true },
      },
    },
  });
  if (!plan) {
    return NextResponse.json({ error: "学习计划不存在" }, { status: 404 });
  }
  return NextResponse.json({ plan });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return NextResponse.json({ error: "请求体为空" }, { status: 400 });

  const existing = await prisma.learningPlan.findFirst({
    where: { id, userId: auth.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "学习计划不存在" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json({ error: "计划标题不能为空" }, { status: 400 });
    }
    data.title = body.title.trim();
  }
  if (body.bankId !== undefined) data.bankId = typeof body.bankId === "string" ? body.bankId.trim() || null : null;
  if (body.startDate !== undefined) data.startDate = new Date(String(body.startDate));
  if (body.endDate !== undefined) data.endDate = new Date(String(body.endDate));
  if (body.dailyNewCards !== undefined) data.dailyNewCards = Number(body.dailyNewCards);
  if (body.dailyReviewCap !== undefined) data.dailyReviewCap = Number(body.dailyReviewCap);
  if (body.desiredRetention !== undefined) data.desiredRetention = Number(body.desiredRetention);
  if (body.status !== undefined) {
    const status = String(body.status);
    if (!["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"].includes(status)) {
      return NextResponse.json({ error: "无效的计划状态" }, { status: 400 });
    }
    data.status = status;
  }

  const plan = await prisma.learningPlan.update({
    where: { id },
    data,
  });

  return NextResponse.json({ plan });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { id } = await params;
  const existing = await prisma.learningPlan.findFirst({
    where: { id, userId: auth.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "学习计划不存在" }, { status: 404 });
  }

  await prisma.learningPlan.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
