// 单会话操作：详情 / 结束
// GET   /api/study/sessions/:id
// PATCH /api/study/sessions/:id  → 结束会话（endedAt + durationSec）

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";

interface PatchSessionBody {
  end?: boolean;  // true: 结束会话
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { id } = await params;

  const session = await prisma.quizSession.findFirst({
    where: { id, userId: auth.userId },
    include: {
      bank: { select: { id: true, name: true, coverColor: true } },
      answers: {
        orderBy: { createdAt: "asc" },
        include: { question: { select: { id: true, stem: true, type: true } } },
      },
    },
  });
  if (!session) return NextResponse.json({ error: "会话不存在" }, { status: 404 });

  return NextResponse.json({ session });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { id } = await params;

  const session = await prisma.quizSession.findFirst({
    where: { id, userId: auth.userId },
  });
  if (!session) return NextResponse.json({ error: "会话不存在" }, { status: 404 });

  const body = await parseJsonBody<PatchSessionBody>(request);
  if (!body) return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });

  if (body.end && !session.endedAt) {
    const endedAt = new Date();
    const durationSec = Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000);
    const updated = await prisma.quizSession.update({
      where: { id: session.id },
      data: { endedAt, durationSec },
    });
    return NextResponse.json({ session: updated });
  }

  return NextResponse.json({ session });
}
