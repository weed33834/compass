// 航海日志：答题历史时间线
// GET /api/logbook?page=&pageSize=&bankId=&startDate=&endDate=

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "30")));
  const bankId = searchParams.get("bankId") ?? undefined;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where = {
    userId: auth.userId,
    ...(bankId ? { bankId } : {}),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        }
      : {}),
  };

  const [total, records] = await Promise.all([
    prisma.answerRecord.count({ where }),
    prisma.answerRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        question: { select: { id: true, stem: true, type: true, knowledgePoints: true } },
        bank: { select: { id: true, name: true, coverColor: true } },
      },
    }),
  ]);

  return NextResponse.json({
    records: records.map((r) => ({
      id: r.id,
      questionId: r.questionId,
      bankId: r.bankId,
      bankName: r.bank.name,
      bankCoverColor: r.bank.coverColor,
      stem: r.question.stem,
      type: r.question.type,
      knowledgePoints: r.question.knowledgePoints,
      userAnswer: r.userAnswer,
      isCorrect: r.isCorrect,
      partialScore: r.partialScore,
      timeSpentSec: r.timeSpentSec,
      errorReason: r.errorReason,
      createdAt: r.createdAt,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
