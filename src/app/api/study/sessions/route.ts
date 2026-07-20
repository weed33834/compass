// 学习会话：创建 / 列表
// POST /api/study/sessions     → 创建一次答题会话（不强制使用，submit 可不传 sessionId）
// GET  /api/study/sessions     → 列出历史会话

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";

interface CreateSessionBody {
  bankId?: string;
  mode?: "LEARN" | "REVIEW_ONLY" | "WRONG_REDO" | "EXAM" | "CUSTOM";
  config?: unknown;
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const limited = assertRateLimit(`session-create:${auth.userId}`, 30, 60_000);
  if (limited) return limited;

  const body = await parseJsonBody<CreateSessionBody>(request);
  if (!body) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });

  const session = await prisma.quizSession.create({
    data: {
      userId: auth.userId,
      bankId: body.bankId ?? null,
      mode: body.mode ?? "LEARN",
      config: (body.config ?? null) as never,
    },
  });
  return NextResponse.json({ session }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

  const [total, sessions] = await Promise.all([
    prisma.quizSession.count({ where: { userId: auth.userId } }),
    prisma.quizSession.findMany({
      where: { userId: auth.userId },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        bank: { select: { id: true, name: true, coverColor: true } },
      },
    }),
  ]);

  return NextResponse.json({
    sessions,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
