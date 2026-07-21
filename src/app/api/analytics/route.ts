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
import { retrievability, State } from "@/lib/fsrs";

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
    memoryCards,
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
      where: {
        userId: auth.userId,
        ...(bankId ? { bankId } : {}),
        OR: [
          { lapses: { gt: 0 } },
          { lastErrorAt: { not: null } },
        ],
      },
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
    // 记忆健康度数据：所有 REVIEW/RELEARNING/LEARNING 卡（同时用于 R 计算和 7 天到期预测）
    prisma.reviewItem.findMany({
      where: {
        userId: auth.userId,
        ...(bankId ? { bankId } : {}),
        state: { in: ["REVIEW", "RELEARNING", "LEARNING"] },
        isBuried: false,
        isSuspended: false,
      },
      select: { state: true, stability: true, lastReviewAt: true, dueAt: true },
    }),
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

  // === 6. 记忆健康度（Retrievability）+ 7 天到期预测 ===
  // FSRS-6 衰退公式：R(t, S) = (1 + factor * t/(9*S))^decay
  // 仅对 REVIEW / RELEARNING 卡计算 R；LEARNING / NEW 跳过（stability 未稳定）
  const now = new Date();
  const rValues: number[] = [];
  const distribution = [
    { bucket: "0-30%", label: "危急", count: 0, color: "coral" },
    { bucket: "30-50%", label: "脆弱", count: 0, color: "amber" },
    { bucket: "50-70%", label: "尚可", count: 0, color: "tide" },
    { bucket: "70-90%", label: "稳固", count: 0, color: "brass" },
    { bucket: "90-100%", label: "鲜活", count: 0, color: "emerald" },
  ];
  let atRiskCount = 0;

  // 未来 7 天到期预测桶（包含 LEARNING 卡的到期）
  const forecastMap = new Map<string, number>();
  const dayStarts: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    dayStarts.push(d);
    forecastMap.set(d.toISOString().slice(0, 10), 0);
  }
  const forecastEnd = new Date(dayStarts[6]);
  forecastEnd.setDate(forecastEnd.getDate() + 1);

  for (const ri of memoryCards) {
    // 到期预测：所有 REVIEW/RELEARNING/LEARNING 卡按 dueAt 归入 7 天桶
    if (ri.dueAt >= dayStarts[0] && ri.dueAt < forecastEnd) {
      const day = ri.dueAt.toISOString().slice(0, 10);
      const cur = forecastMap.get(day);
      if (cur !== undefined) forecastMap.set(day, cur + 1);
    }

    // R 计算：仅 REVIEW / RELEARNING
    const stateNum = stateStringToNum(ri.state);
    if (stateNum !== State.Review && stateNum !== State.Relearning) continue;
    const r = retrievability(
      { state: stateNum, stability: ri.stability, lastReviewAt: ri.lastReviewAt },
      now
    );
    if (r === null) continue;
    rValues.push(r);
    if (r < 0.7) atRiskCount++;
    if (r < 0.3) distribution[0].count++;
    else if (r < 0.5) distribution[1].count++;
    else if (r < 0.7) distribution[2].count++;
    else if (r < 0.9) distribution[3].count++;
    else distribution[4].count++;
  }

  const avgR = rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0;
  const forecast = Array.from(forecastMap.entries()).map(([day, count]) => ({ day, count }));
  const memoryHealth = {
    averageRetrievability: avgR,
    totalCards: rValues.length,
    atRiskCount,
    distribution,
    forecast,
  };

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
    memoryHealth,
    meta: { days, bankId: bankId ?? null, since },
  });
}

// Prisma 字符串 CardState → ts-fsrs 数字 State
// Prisma enum 是字符串（NEW/LEARNING/REVIEW/RELEARNING），ts-fsrs State 是数字（0/1/2/3）
function stateStringToNum(s: string): State {
  switch (s) {
    case "NEW": return State.New;
    case "LEARNING": return State.Learning;
    case "REVIEW": return State.Review;
    case "RELEARNING": return State.Relearning;
    default: return State.New;
  }
}
