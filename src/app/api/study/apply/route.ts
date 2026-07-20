// 应用 FSRS 评分（写入调度 + ReviewLog，不再写 AnswerRecord）
// POST /api/study/apply
//
// 请求体：
//   { reviewItemId, rating: "AGAIN"|"HARD"|"GOOD"|"EASY", timeSpentSec?, sessionId? }
//
// 响应：
//   {
//     state, reps, lapses, stability, difficulty,
//     dueAt, nextIntervalDays, nextIntervalLabel,
//     appliedRating
//   }
//
// 设计：与 /api/study/grade 配对使用。
//   grade 阶段：仅判分 + 写 AnswerRecord + 返回 4 键预览（不动 FSRS）
//   apply 阶段：根据用户最终选择的评分，应用 FSRS 调度 + 写 ReviewLog + 更新 ReviewItem
//   两阶段拆分可避免"判分自动评分"与"用户覆盖评分"重复调度 FSRS 的 bug

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";
import {
  dbRowToCard,
  gradeCard,
  formatInterval,
  Rating,
  type Grade,
} from "@/lib/fsrs";
import type { CardState, Rating as PrismaRating } from "@prisma/client";

interface ApplyBody {
  reviewItemId: string;
  rating: "AGAIN" | "HARD" | "GOOD" | "EASY";
  timeSpentSec?: number;
  sessionId?: string;
}

const RATING_MAP: Record<"AGAIN" | "HARD" | "GOOD" | "EASY", Grade> = {
  AGAIN: Rating.Again,
  HARD: Rating.Hard,
  GOOD: Rating.Good,
  EASY: Rating.Easy,
};

// ts-fsrs 的 Rating 是数字（1=Again 2=Hard 3=Good 4=Easy）
// Prisma 的 Rating 是字符串 enum，需要反向映射
const GRADE_TO_PRISMA_RATING: Record<number, PrismaRating> = {
  1: "AGAIN",
  2: "HARD",
  3: "GOOD",
  4: "EASY",
};

const STATE_TO_PRISMA: Record<number, CardState> = {
  0: "NEW",
  1: "LEARNING",
  2: "REVIEW",
  3: "RELEARNING",
};

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const limited = assertRateLimit(`study-apply:${auth.userId}`, 600, 60_000);
  if (limited) return limited;

  const body = await parseJsonBody<ApplyBody>(request);
  if (!body || !body.reviewItemId || !body.rating) {
    return NextResponse.json(
      { error: "缺少 reviewItemId 或 rating" },
      { status: 400 }
    );
  }
  const grade = RATING_MAP[body.rating];
  if (!grade) {
    return NextResponse.json({ error: "无效的 rating" }, { status: 400 });
  }

  // 取 ReviewItem（评分前状态）
  const reviewItem = await prisma.reviewItem.findFirst({
    where: { id: body.reviewItemId, userId: auth.userId },
    include: { question: true },
  });
  if (!reviewItem) {
    return NextResponse.json({ error: "复习卡不存在" }, { status: 404 });
  }

  // FSRS 调度：基于评分前的 Card 状态 + 用户选择的评分
  const prevCard = dbRowToCard({
    state: reviewItem.state as unknown as number,
    stability: reviewItem.stability,
    difficulty: reviewItem.difficulty,
    reps: reviewItem.reps,
    lapses: reviewItem.lapses,
    scheduledDays: reviewItem.scheduledDays,
    elapsedDays: reviewItem.elapsedDays,
    dueAt: reviewItem.dueAt,
    lastReviewAt: reviewItem.lastReviewAt,
  });

  const now = new Date();
  const recordLog = gradeCard(prevCard, grade, now);
  const newCard = recordLog.card;

  // 事务写回：ReviewItem 更新 + ReviewLog（不可变日志）
  const updated = await prisma.$transaction(async (tx) => {
    // 1. ReviewItem 更新（FSRS 新状态）
    const isLapse = newCard.lapses > reviewItem.lapses;
    // AGAIN 表示"完全不会"——无论 FSRS 是否计 lapse，都记入错题本
    // （NEW/LEARNING 卡 AGAIN 不增加 lapses，但用户确实答错了）
    const isError = grade === Rating.Again;
    const item = await tx.reviewItem.update({
      where: { id: reviewItem.id },
      data: {
        state: STATE_TO_PRISMA[newCard.state] ?? "REVIEW",
        stability: newCard.stability,
        difficulty: newCard.difficulty,
        reps: newCard.reps,
        lapses: newCard.lapses,
        scheduledDays: newCard.scheduled_days,
        elapsedDays: newCard.elapsed_days,
        dueAt: newCard.due,
        lastReviewAt: now,
        // 错题本字段：lapse 或 AGAIN 时记录错时戳
        ...(isLapse || isError
          ? {
              firstErrorAt: reviewItem.firstErrorAt ?? now,
              lastErrorAt: now,
            }
          : {}),
      },
    });

    // 2. ReviewLog：不可变日志（供优化器训练）
    await tx.reviewLog.create({
      data: {
        reviewItemId: reviewItem.id,
        userId: auth.userId,
        rating: GRADE_TO_PRISMA_RATING[grade] ?? "AGAIN",
        state: reviewItem.state, // 评分前的 state
        prevStability: reviewItem.stability,
        prevDifficulty: reviewItem.difficulty,
        prevDueAt: reviewItem.dueAt,
        prevElapsedDays: reviewItem.elapsedDays,
        prevScheduledDays: reviewItem.scheduledDays,
        reviewedAt: now,
        reviewDurationMs: body.timeSpentSec ? body.timeSpentSec * 1000 : null,
      },
    });

    return item;
  });

  return NextResponse.json({
    state: updated.state,
    reps: updated.reps,
    lapses: updated.lapses,
    stability: updated.stability,
    difficulty: updated.difficulty,
    dueAt: updated.dueAt,
    nextIntervalDays: updated.scheduledDays,
    nextIntervalLabel: formatInterval(updated.scheduledDays),
    appliedRating: body.rating,
  });
}
