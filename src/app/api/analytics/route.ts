// 航迹分析：全局 + 题库级统计
// GET /api/analytics?bankId=&days=30
//
// 返回：
//   - 总览：总答题数、正确率、连续天数、FSRS 状态分布
//   - 趋势：近 N 天每日答题数 + 正确率（折线图）
//   - 题型分布：4 题型的答对率
//   - 错因分布：ErrorReason 计数（饼图）
//   - 知识点薄弱 TOP10：按错误率排序

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const bankId = searchParams.get("bankId") ?? undefined;
  const days = Math.min(365, Math.max(1, Number(searchParams.get("days") ?? "30")));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const baseWhere = {
    userId: auth.userId,
    ...(bankId ? { bankId } : {}),
  };
  const recentWhere = {
    ...baseWhere,
    createdAt: { gte: since },
  };

  // === 1. 总览 ===
  const [
    totalAnswers,
    recentAnswers,
    recentCorrect,
    banksCount,
    questionsCount,
    stateDistribution,
    wrongCount,
    dueTodayCount,
    streak,
  ] = await Promise.all([
    prisma.answerRecord.count({ where: baseWhere }),
    prisma.answerRecord.count({ where: recentWhere }),
    prisma.answerRecord.count({ where: { ...recentWhere, isCorrect: true } }),
    prisma.questionBank.count({ where: { userId: auth.userId } }),
    prisma.reviewItem.count({
      where: { userId: auth.userId, ...(bankId ? { bankId } : {}), question: { isDisabled: false } },
    }),
    prisma.reviewItem.groupBy({
      by: ["state"],
      where: { userId: auth.userId, ...(bankId ? { bankId } : {}) },
      _count: true,
    }),
    prisma.reviewItem.count({
      where: { userId: auth.userId, ...(bankId ? { bankId } : {}), lapses: { gt: 0 } },
    }),
    prisma.reviewItem.count({
      where: {
        userId: auth.userId,
        ...(bankId ? { bankId } : {}),
        dueAt: { lte: new Date() },
        isBuried: false,
        isSuspended: false,
        state: { in: ["REVIEW", "RELEARNING", "LEARNING"] },
      },
    }),
    // 连续答题天数：从今天往前查，直到某天没答题为止
    (async () => {
      let s = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < 365; i++) {
        const dayStart = new Date(today);
        dayStart.setDate(dayStart.getDate() - i);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const cnt = await prisma.answerRecord.count({
          where: {
            userId: auth.userId,
            ...(bankId ? { bankId } : {}),
            createdAt: { gte: dayStart, lt: dayEnd },
          },
        });
        if (cnt === 0) {
          // 今天还没答题不算断签
          if (i === 0) continue;
          break;
        }
        s++;
      }
      return s;
    })(),
  ]);

  // === 2. 趋势：每日答题数 + 正确数 ===
  const trendRaw = await prisma.answerRecord.findMany({
    where: recentWhere,
    select: { isCorrect: true, createdAt: true },
  });
  const trendMap = new Map<string, { total: number; correct: number }>();
  for (const r of trendRaw) {
    const day = r.createdAt.toISOString().slice(0, 10);
    const entry = trendMap.get(day) ?? { total: 0, correct: 0 };
    entry.total++;
    if (r.isCorrect) entry.correct++;
    trendMap.set(day, entry);
  }
  const trend = Array.from(trendMap.entries())
    .map(([day, v]) => ({ day, total: v.total, correct: v.correct, rate: v.total > 0 ? v.correct / v.total : 0 }))
    .sort((a, b) => a.day.localeCompare(b.day));

  // === 3. 题型分布 ===
  const typeRaw = await prisma.answerRecord.findMany({
    where: recentWhere,
    select: { isCorrect: true, question: { select: { type: true } } },
  });
  const typeMap = new Map<string, { total: number; correct: number }>();
  for (const r of typeRaw) {
    const t = r.question.type;
    const entry = typeMap.get(t) ?? { total: 0, correct: 0 };
    entry.total++;
    if (r.isCorrect) entry.correct++;
    typeMap.set(t, entry);
  }
  const typeStats = Array.from(typeMap.entries()).map(([type, v]) => ({
    type,
    total: v.total,
    correct: v.correct,
    rate: v.total > 0 ? v.correct / v.total : 0,
  }));

  // === 4. 错因分布 ===
  const errorReasonRaw = await prisma.answerRecord.groupBy({
    by: ["errorReason"],
    where: { ...recentWhere, isCorrect: false },
    _count: true,
  });
  const errorReasons = errorReasonRaw.map((e) => ({
    reason: e.errorReason ?? "unknown",
    count: e._count,
  }));

  // === 5. 知识点薄弱 TOP10 ===
  const wrongRecords = await prisma.answerRecord.findMany({
    where: { ...recentWhere, isCorrect: false },
    select: { question: { select: { knowledgePoints: true } } },
  });
  const kpMap = new Map<string, number>();
  for (const r of wrongRecords) {
    for (const kp of r.question.knowledgePoints) {
      kpMap.set(kp, (kpMap.get(kp) ?? 0) + 1);
    }
  }
  const weakPoints = Array.from(kpMap.entries())
    .map(([point, count]) => ({ point, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json({
    overview: {
      totalAnswers,
      recentAnswers,
      recentCorrect,
      recentAccuracy: recentAnswers > 0 ? recentCorrect / recentAnswers : 0,
      banksCount,
      questionsCount,
      wrongCount,
      dueTodayCount,
      streak,
      stateDistribution: stateDistribution.map((s) => ({ state: s.state, count: s._count })),
    },
    trend,
    typeStats,
    errorReasons,
    weakPoints,
    meta: { days, bankId: bankId ?? null, since },
  });
}
