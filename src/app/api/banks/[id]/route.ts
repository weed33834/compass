// 单题库：详情 / 更新 / 删除
// GET    /api/banks/:id
// PATCH  /api/banks/:id
// DELETE /api/banks/:id

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";

interface UpdateBankBody {
  name?: string;
  description?: string | null;
  coverColor?: string;
  tags?: string[];
  visibility?: "PRIVATE" | "UNLISTED" | "PUBLIC";
  fsrsEnabled?: boolean;
  desiredRetention?: number;
  newCardsPerDay?: number;
  maxReviewsPerDay?: number;
}

async function getOwnedBank(userId: string, id: string) {
  return prisma.questionBank.findFirst({ where: { id, userId } });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { id } = await params;
  const bank = await getOwnedBank(auth.userId, id);
  if (!bank) return NextResponse.json({ error: "题库不存在" }, { status: 404 });

  const [totalCount, dueCount, learnedCount, wrongCount] = await Promise.all([
    prisma.question.count({ where: { bankId: bank.id, isDisabled: false } }),
    prisma.reviewItem.count({
      where: {
        userId: auth.userId,
        bankId: bank.id,
        dueAt: { lte: new Date() },
        isBuried: false,
        isSuspended: false,
        state: { in: ["REVIEW", "RELEARNING", "LEARNING"] },
      },
    }),
    prisma.reviewItem.count({
      where: { userId: auth.userId, bankId: bank.id, state: { in: ["REVIEW", "RELEARNING"] } },
    }),
    prisma.reviewItem.count({
      where: { userId: auth.userId, bankId: bank.id, lapses: { gt: 0 } },
    }),
  ]);

  return NextResponse.json({
    bank: {
      ...bank,
      stats: { totalCount, dueCount, learnedCount, wrongCount },
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { id } = await params;
  const bank = await getOwnedBank(auth.userId, id);
  if (!bank) return NextResponse.json({ error: "题库不存在" }, { status: 404 });

  const limited = assertRateLimit(`bank-update:${auth.userId}`, 60, 60_000);
  if (limited) return limited;

  const body = await parseJsonBody<UpdateBankBody>(request);
  if (!body) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });

  if (body.name !== undefined && body.name.trim().length === 0) {
    return NextResponse.json({ error: "题库名称不能为空" }, { status: 400 });
  }

  const updated = await prisma.questionBank.update({
    where: { id: bank.id },
    data: {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.coverColor !== undefined ? { coverColor: body.coverColor } : {}),
      ...(body.tags !== undefined ? { tags: body.tags } : {}),
      ...(body.visibility !== undefined ? { visibility: body.visibility } : {}),
      ...(body.fsrsEnabled !== undefined ? { fsrsEnabled: body.fsrsEnabled } : {}),
      ...(body.desiredRetention !== undefined ? { desiredRetention: body.desiredRetention } : {}),
      ...(body.newCardsPerDay !== undefined ? { newCardsPerDay: body.newCardsPerDay } : {}),
      ...(body.maxReviewsPerDay !== undefined ? { maxReviewsPerDay: body.maxReviewsPerDay } : {}),
    },
  });
  return NextResponse.json({ bank: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { id } = await params;
  const bank = await getOwnedBank(auth.userId, id);
  if (!bank) return NextResponse.json({ error: "题库不存在" }, { status: 404 });

  // 级联删除：Question/QuizSession/ReviewItem/LearningPlan/AnswerRecord
  await prisma.questionBank.delete({ where: { id: bank.id } });
  return NextResponse.json({ ok: true });
}
