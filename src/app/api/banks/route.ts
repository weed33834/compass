// 题库列表 / 创建题库
// GET  /api/banks           → 列出当前用户的全部题库（带统计）
// POST /api/banks           → 创建题库（可一次性塞入 questions，自动建 ReviewItem）

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";
import type { Prisma } from "@prisma/client";

// 创建题库的请求体
interface CreateBankBody {
  name: string;
  description?: string;
  coverColor?: string;
  tags?: string[];
  visibility?: "PRIVATE" | "UNLISTED" | "PUBLIC";
  source?: "MANUAL" | "IMPORT_MD" | "IMPORT_EXCEL" | "IMPORT_WORD" | "IMPORT_ANKI" | "AGENT_GENERATED";
  sourceRef?: string;
  fsrsEnabled?: boolean;
  desiredRetention?: number;
  newCardsPerDay?: number;
  maxReviewsPerDay?: number;
  // 可选：一次性塞入题目（用于导入流程）
  questions?: Array<{
    type: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";
    stem: string;
    options?: unknown;
    answer?: unknown;
    explanation?: string;
    knowledgePoints?: string[];
    difficulty?: number;
    source?: string;
    position?: number;
  }>;
}

// GET /api/banks
export async function GET() {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const banks = await prisma.questionBank.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { questions: { where: { isDisabled: false } } } },
    },
  });

  // 同时统计每题库的待复习数
  const dueCounts = await prisma.reviewItem.groupBy({
    by: ["bankId"],
    where: {
      userId: auth.userId,
      dueAt: { lte: new Date() },
      isBuried: false,
      isSuspended: false,
      state: { in: ["REVIEW", "RELEARNING", "LEARNING"] },
    },
    _count: true,
  });
  const dueMap = new Map(dueCounts.map((d) => [d.bankId, d._count]));

  return NextResponse.json({
    banks: banks.map((b) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      coverColor: b.coverColor,
      tags: b.tags,
      visibility: b.visibility,
      source: b.source,
      totalQuestions: b.totalQuestions,
      questionCount: b._count.questions,
      dueCount: dueMap.get(b.id) ?? 0,
      fsrsEnabled: b.fsrsEnabled,
      desiredRetention: b.desiredRetention,
      newCardsPerDay: b.newCardsPerDay,
      maxReviewsPerDay: b.maxReviewsPerDay,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    })),
  });
}

// POST /api/banks
export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const limited = assertRateLimit(`bank-create:${auth.userId}`, 20, 60_000);
  if (limited) return limited;

  const body = await parseJsonBody<CreateBankBody>(request);
  if (!body || !body.name || body.name.trim().length === 0) {
    return NextResponse.json({ error: "题库名称不能为空" }, { status: 400 });
  }
  if (body.name.length > 100) {
    return NextResponse.json({ error: "题库名称过长（最多 100 字符）" }, { status: 400 });
  }

  // 事务：建题库 + 建题目 + 建 ReviewItem
  const result = await prisma.$transaction(async (tx) => {
    const bank = await tx.questionBank.create({
      data: {
        userId: auth.userId,
        name: body.name.trim(),
        description: body.description ?? null,
        coverColor: body.coverColor ?? "brass",
        tags: body.tags ?? [],
        visibility: body.visibility ?? "PRIVATE",
        source: body.source ?? "MANUAL",
        sourceRef: body.sourceRef ?? null,
        fsrsEnabled: body.fsrsEnabled ?? true,
        desiredRetention: body.desiredRetention ?? 0.9,
        newCardsPerDay: body.newCardsPerDay ?? 20,
        maxReviewsPerDay: body.maxReviewsPerDay ?? 200,
      },
    });

    // 批量建题目（如果有）
    if (body.questions && body.questions.length > 0) {
      const questionsData: Prisma.QuestionUncheckedCreateInput[] = body.questions.map((q, idx) => ({
        bankId: bank.id,
        type: q.type,
        stem: q.stem,
        options: (q.options ?? null) as Prisma.InputJsonValue,
        answer: (q.answer ?? null) as Prisma.InputJsonValue,
        explanation: q.explanation ?? null,
        knowledgePoints: q.knowledgePoints ?? [],
        difficulty: q.difficulty ?? 2.5,
        source: q.source ?? null,
        position: q.position ?? idx,
      }));
      const created = await tx.question.createMany({ data: questionsData });

      // createMany 不返回 id，按 position 升序反查后建立 ReviewItem
      const inserted = await tx.question.findMany({
        where: { bankId: bank.id },
        orderBy: { position: "asc" },
        select: { id: true },
      });
      await tx.reviewItem.createMany({
        data: inserted.map((q) => ({
          userId: auth.userId,
          questionId: q.id,
          bankId: bank.id,
          state: "NEW" as const,
          dueAt: new Date(),
        })),
      });
      await tx.questionBank.update({
        where: { id: bank.id },
        data: { totalQuestions: created.count },
      });
      return { bank, questionCount: created.count };
    }
    return { bank, questionCount: 0 };
  });

  return NextResponse.json({ id: result.bank.id, questionCount: result.questionCount }, { status: 201 });
}
