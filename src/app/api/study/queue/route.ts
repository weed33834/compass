// 学习队列：今日复习 + 新卡
// GET /api/study/queue?bankId=&mode=LEARN&limit=200
//   mode: LEARN（默认，复习+新卡）/ REVIEW_ONLY（仅复习）/ WRONG_REDO（错题重做）

import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api";
import { buildStudyQueue } from "@/lib/quiz/scheduler";

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const bankId = searchParams.get("bankId") ?? undefined;
  const modeParam = searchParams.get("mode") ?? "LEARN";
  const mode = (["LEARN", "REVIEW_ONLY", "WRONG_REDO"].includes(modeParam)
    ? modeParam
    : "LEARN") as "LEARN" | "REVIEW_ONLY" | "WRONG_REDO";
  const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") ?? "200")));

  const { items, stats } = await buildStudyQueue({
    userId: auth.userId,
    bankId,
    mode,
    limit,
  });

  // 隐藏 answer 字段，前端在用户提交后再判分回显
  return NextResponse.json({
    items: items.map(({ reviewItem, question, bank, isNew }) => ({
      reviewItemId: reviewItem.id,
      questionId: question.id,
      bankId: bank.id,
      bankName: bank.name,
      bankCoverColor: bank.coverColor,
      type: question.type,
      stem: question.stem,
      options: question.options,
      knowledgePoints: question.knowledgePoints,
      difficulty: question.difficulty,
      isStarred: question.isStarred,
      state: reviewItem.state,
      lapses: reviewItem.lapses,
      reps: reviewItem.reps,
      lastReviewAt: reviewItem.lastReviewAt,
      isNew,
    })),
    stats,
  });
}
