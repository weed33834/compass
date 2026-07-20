// 题库内题目列表 / 创建单题
// GET  /api/banks/:id/questions?page=1&pageSize=20&type=SINGLE_CHOICE&keyword=...
// POST /api/banks/:id/questions

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";
import type { Prisma } from "@prisma/client";

interface CreateQuestionBody {
  type: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";
  stem: string;
  options?: unknown;
  answer?: unknown;
  explanation?: string;
  knowledgePoints?: string[];
  difficulty?: number;
  source?: string;
  position?: number;
}

async function getOwnedBank(userId: string, id: string) {
  return prisma.questionBank.findFirst({ where: { id, userId }, select: { id: true } });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { id } = await params;
  const bank = await getOwnedBank(auth.userId, id);
  if (!bank) return NextResponse.json({ error: "题库不存在" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));
  const type = searchParams.get("type");
  const keyword = searchParams.get("keyword")?.trim();
  const onlyStarred = searchParams.get("starred") === "1";
  const onlyWrong = searchParams.get("wrong") === "1";

  const where: Prisma.QuestionWhereInput = {
    bankId: bank.id,
    isDisabled: false,
    ...(type ? { type: type as Prisma.QuestionWhereInput["type"] } : {}),
    ...(keyword ? { stem: { contains: keyword, mode: "insensitive" } } : {}),
    ...(onlyStarred ? { isStarred: true } : {}),
  };

  // onlyWrong：与 ReviewItem join，过滤 lapses > 0
  if (onlyWrong) {
    const r = await prisma.reviewItem.findMany({
      where: { userId: auth.userId, bankId: bank.id, lapses: { gt: 0 } },
      select: { questionId: true },
    });
    const wrongIds = r.map((x) => x.questionId);
    where.id = { in: wrongIds.length > 0 ? wrongIds : ["__none__"] };
  }

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: { position: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    questions,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { id } = await params;
  const bank = await getOwnedBank(auth.userId, id);
  if (!bank) return NextResponse.json({ error: "题库不存在" }, { status: 404 });

  const limited = assertRateLimit(`question-create:${auth.userId}`, 100, 60_000);
  if (limited) return limited;

  const body = await parseJsonBody<CreateQuestionBody>(request);
  if (!body || !body.stem || body.stem.trim().length === 0) {
    return NextResponse.json({ error: "题干不能为空" }, { status: 400 });
  }

  // 取下一个 position
  const maxPos = await prisma.question.findFirst({
    where: { bankId: bank.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const question = await prisma.$transaction(async (tx) => {
    const q = await tx.question.create({
      data: {
        bankId: bank.id,
        type: body.type,
        stem: body.stem.trim(),
        options: (body.options ?? null) as Prisma.InputJsonValue,
        answer: (body.answer ?? null) as Prisma.InputJsonValue,
        explanation: body.explanation ?? null,
        knowledgePoints: body.knowledgePoints ?? [],
        difficulty: body.difficulty ?? 2.5,
        source: body.source ?? null,
        position: body.position ?? (maxPos?.position ?? -1) + 1,
      },
    });
    // 自动建 ReviewItem
    await tx.reviewItem.create({
      data: {
        userId: auth.userId,
        questionId: q.id,
        bankId: bank.id,
        state: "NEW",
        dueAt: new Date(),
      },
    });
    await tx.questionBank.update({
      where: { id: bank.id },
      data: { totalQuestions: { increment: 1 } },
    });
    return q;
  });

  return NextResponse.json({ question }, { status: 201 });
}
