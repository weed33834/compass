// 单题：详情 / 更新 / 删除（软删除）/ 收藏切换
// GET    /api/questions/:id
// PATCH  /api/questions/:id
// DELETE /api/questions/:id

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";
import type { Prisma } from "@prisma/client";

interface UpdateQuestionBody {
  type?: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";
  stem?: string;
  options?: unknown;
  answer?: unknown;
  explanation?: string | null;
  knowledgePoints?: string[];
  difficulty?: number;
  source?: string | null;
  isStarred?: boolean;
  isDisabled?: boolean;
}

async function getOwnedQuestion(userId: string, id: string) {
  return prisma.question.findFirst({
    where: { id, bank: { userId } },
    include: { bank: { select: { id: true, name: true } } },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { id } = await params;
  const question = await getOwnedQuestion(auth.userId, id);
  if (!question) return NextResponse.json({ error: "题目不存在" }, { status: 404 });

  // 附带当前用户的 ReviewItem 状态
  const reviewItem = await prisma.reviewItem.findUnique({
    where: { userId_questionId: { userId: auth.userId, questionId: question.id } },
  });
  return NextResponse.json({ question, reviewItem });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { id } = await params;
  const question = await getOwnedQuestion(auth.userId, id);
  if (!question) return NextResponse.json({ error: "题目不存在" }, { status: 404 });

  const limited = assertRateLimit(`question-update:${auth.userId}`, 100, 60_000);
  if (limited) return limited;

  const body = await parseJsonBody<UpdateQuestionBody>(request);
  if (!body) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });

  if (body.stem !== undefined && body.stem.trim().length === 0) {
    return NextResponse.json({ error: "题干不能为空" }, { status: 400 });
  }

  const updated = await prisma.question.update({
    where: { id: question.id },
    data: {
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.stem !== undefined ? { stem: body.stem.trim() } : {}),
      ...(body.options !== undefined ? { options: body.options as Prisma.InputJsonValue } : {}),
      ...(body.answer !== undefined ? { answer: body.answer as Prisma.InputJsonValue } : {}),
      ...(body.explanation !== undefined ? { explanation: body.explanation } : {}),
      ...(body.knowledgePoints !== undefined ? { knowledgePoints: body.knowledgePoints } : {}),
      ...(body.difficulty !== undefined ? { difficulty: body.difficulty } : {}),
      ...(body.source !== undefined ? { source: body.source } : {}),
      ...(body.isStarred !== undefined ? { isStarred: body.isStarred } : {}),
      ...(body.isDisabled !== undefined ? { isDisabled: body.isDisabled } : {}),
    },
  });
  return NextResponse.json({ question: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { id } = await params;
  const question = await getOwnedQuestion(auth.userId, id);
  if (!question) return NextResponse.json({ error: "题目不存在" }, { status: 404 });

  // 软删除：保留答题记录的可追溯性
  await prisma.$transaction([
    prisma.question.update({
      where: { id: question.id },
      data: { isDisabled: true },
    }),
    prisma.questionBank.update({
      where: { id: question.bankId },
      data: { totalQuestions: { decrement: 1 } },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
