// 答题判分（仅判分 + 写 AnswerRecord，不应用 FSRS）
// POST /api/study/grade
//
// 请求体：
//   { reviewItemId, userAnswer, timeSpentSec?, sessionId? }
//
// 响应：
//   { isCorrect, partialScore, correctAnswer, userAnswerNormalized,
//     explanation, knowledgePoints,
//     previews: { again, hard, good, easy }  // 4 个评分对应的下一次间隔
//     appliedRating: "AGAIN"|"HARD"|"GOOD"|"EASY"  // 自动映射的评分（用户可覆盖）
//   }
//
// 后续：用户选择评分后，调用 /api/study/apply 写入 FSRS

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";
import { gradeQuestion } from "@/lib/quiz/grading";
import {
  dbRowToCard,
  previewIntervals,
  scoreToRating,
  formatInterval,
  Rating,
} from "@/lib/fsrs";

interface GradeBody {
  reviewItemId: string;
  userAnswer: unknown;
  timeSpentSec?: number;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const limited = assertRateLimit(`study-grade:${auth.userId}`, 600, 60_000);
  if (limited) return limited;

  const body = await parseJsonBody<GradeBody>(request);
  if (!body || !body.reviewItemId) {
    return NextResponse.json({ error: "缺少 reviewItemId" }, { status: 400 });
  }

  const reviewItem = await prisma.reviewItem.findFirst({
    where: { id: body.reviewItemId, userId: auth.userId },
    include: { question: true, bank: true },
  });
  if (!reviewItem) {
    return NextResponse.json({ error: "复习卡不存在" }, { status: 404 });
  }
  if (reviewItem.question.isDisabled) {
    return NextResponse.json({ error: "题目已下架" }, { status: 400 });
  }

  // 1. 判分
  const grading = gradeQuestion(reviewItem.question, body.userAnswer);

  // 2. 计算预览间隔（基于评分前的 Card 状态）
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
  const previews = previewIntervals(prevCard, new Date());

  // 3. 自动映射评分（用户可覆盖）
  const autoRating = scoreToRating(grading.partialScore);
  const appliedRating: "AGAIN" | "HARD" | "GOOD" | "EASY" =
    autoRating === Rating.Again ? "AGAIN"
    : autoRating === Rating.Hard ? "HARD"
    : autoRating === Rating.Good ? "GOOD" : "EASY";

  // 4. 写 AnswerRecord（仅记录，不写 FSRS）
  await prisma.answerRecord.create({
    data: {
      userId: auth.userId,
      questionId: reviewItem.questionId,
      bankId: reviewItem.bankId,
      sessionId: body.sessionId ?? null,
      userAnswer: body.userAnswer as never,
      isCorrect: grading.isCorrect,
      partialScore: grading.partialScore,
      timeSpentSec: body.timeSpentSec ?? null,
    },
  });

  // 5. 可选：写 SessionAnswer
  if (body.sessionId) {
    const session = await prisma.quizSession.findFirst({
      where: { id: body.sessionId, userId: auth.userId },
    });
    if (session) {
      await prisma.sessionAnswer.create({
        data: {
          sessionId: session.id,
          questionId: reviewItem.questionId,
          userAnswer: body.userAnswer as never,
          isCorrect: grading.isCorrect,
          partialScore: grading.partialScore,
          timeSpentSec: body.timeSpentSec ?? null,
          gradedAt: new Date(),
        },
      });
      await prisma.quizSession.update({
        where: { id: session.id },
        data: {
          totalQuestions: { increment: 1 },
          ...(grading.isCorrect ? { correctCount: { increment: 1 } } : {}),
        },
      });
    }
  }

  return NextResponse.json({
    isCorrect: grading.isCorrect,
    partialScore: grading.partialScore,
    correctAnswer: grading.correctAnswer,
    userAnswerNormalized: grading.userAnswerNormalized,
    explanation: reviewItem.question.explanation,
    knowledgePoints: reviewItem.question.knowledgePoints,
    appliedRating,
    previews: {
      again: { days: previews.again, label: formatInterval(previews.again) },
      hard: { days: previews.hard, label: formatInterval(previews.hard) },
      good: { days: previews.good, label: formatInterval(previews.good) },
      easy: { days: previews.easy, label: formatInterval(previews.easy) },
    },
  });
}
