// 错题漂流瓶：列出错题、标记错因、移除已掌握
// GET    /api/wrongbook?bankId=&page=&pageSize=
// PATCH  /api/wrongbook  { reviewItemId, errorReason?, errorTags?, isSuspended?, isBuried? }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";
import type { ErrorReason } from "@prisma/client";

interface UpdateWrongItemBody {
  reviewItemId: string;
  errorReason?: ErrorReason | null;
  errorTags?: string[];
  isSuspended?: boolean;
  isBuried?: boolean;
  // remove: 把卡片从错题本移除（重置 lapses 计数 + 错时戳）
  remove?: boolean;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const bankId = searchParams.get("bankId") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  const where = {
    userId: auth.userId,
    lapses: { gt: 0 },
    isBuried: false,
    isSuspended: false,
    question: { isDisabled: false },
    ...(bankId ? { bankId } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.reviewItem.count({ where }),
    prisma.reviewItem.findMany({
      where,
      orderBy: [{ lastErrorAt: "desc" }, { lapses: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        question: { select: { id: true, stem: true, type: true, options: true, answer: true, explanation: true, knowledgePoints: true, isStarred: true } },
        bank: { select: { id: true, name: true, coverColor: true } },
      },
    }),
  ]);

  return NextResponse.json({
    items: items.map((ri) => ({
      reviewItemId: ri.id,
      questionId: ri.questionId,
      bankId: ri.bankId,
      bankName: ri.bank.name,
      bankCoverColor: ri.bank.coverColor,
      stem: ri.question.stem,
      type: ri.question.type,
      options: ri.question.options,
      answer: ri.question.answer,
      explanation: ri.question.explanation,
      knowledgePoints: ri.question.knowledgePoints,
      isStarred: ri.question.isStarred,
      lapses: ri.lapses,
      state: ri.state,
      dueAt: ri.dueAt,
      lastReviewAt: ri.lastReviewAt,
      firstErrorAt: ri.firstErrorAt,
      lastErrorAt: ri.lastErrorAt,
      errorTags: ri.errorTags,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const body = await parseJsonBody<UpdateWrongItemBody>(request);
  if (!body || !body.reviewItemId) {
    return NextResponse.json({ error: "缺少 reviewItemId" }, { status: 400 });
  }

  const item = await prisma.reviewItem.findFirst({
    where: { id: body.reviewItemId, userId: auth.userId },
  });
  if (!item) return NextResponse.json({ error: "错题不存在" }, { status: 404 });

  if (body.remove) {
    // 从错题本移除：重置错时戳（lapses 保留作历史，错题本过滤 lapses > 0 也会排除）
    // 实际策略：直接把 firstErrorAt/lastErrorAt 置空，lapses 不动（保留历史）
    // 但错题本查询以 lapses > 0 为准 → 需要单独标记 removed
    // 简化：用 isBuried=true 表示"已掌握，从错题本移除"
    const updated = await prisma.reviewItem.update({
      where: { id: item.id },
      data: { isBuried: true },
    });
    return NextResponse.json({ item: updated });
  }

  // ErrorReason 存在 AnswerRecord 表，不在 ReviewItem；errorTags 是 ReviewItem 自定义错因标签
  const updated = await prisma.reviewItem.update({
    where: { id: item.id },
    data: {
      ...(body.errorTags !== undefined ? { errorTags: body.errorTags } : {}),
      ...(body.isSuspended !== undefined ? { isSuspended: body.isSuspended } : {}),
      ...(body.isBuried !== undefined ? { isBuried: body.isBuried } : {}),
    },
  });
  return NextResponse.json({ item: updated });
}
