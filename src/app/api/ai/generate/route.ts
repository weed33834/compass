// POST /api/ai/generate — AI 生成题目并入库
//
// 请求体：
//   { topic: string, count?: number, bankId?: string, difficulty?: string, focusAreas?: string[] }
//
// 响应：
//   { bankId, imported: number, questions: [...] }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { parseJsonBody } from "@/lib/parse-body";
import { ErrorCode, ApiError } from "@/lib/errors";
import { generateQuestions } from "@/lib/ai/generator";

interface GenerateBody {
  topic: string;
  count?: number;
  bankId?: string;       // 可选：追加到已有题库
  bankName?: string;     // 不传 bankId 时必须传，自动创建题库
  difficulty?: string;
  focusAreas?: string[];
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  // AI 调用成本高，严格限流：5 次/时/用户
  const limited = assertRateLimit(`ai-generate:${auth.userId}`, 5, 3600_000);
  if (limited) return limited;

  const body = await parseJsonBody<GenerateBody>(request);
  if (!body || !body.topic || !body.topic.trim()) {
    return ApiError.toResponse(ErrorCode.MISSING_FIELD, "缺少 topic");
  }

  const count = Math.min(Math.max(1, body.count ?? 5), 20);

  // 解析或创建题库
  let bankId: string;
  let bankName: string;

  if (body.bankId) {
    const bank = await prisma.questionBank.findFirst({
      where: { id: body.bankId, userId: auth.userId },
    });
    if (!bank) {
      return ApiError.toResponse(ErrorCode.NOT_FOUND, "题库不存在");
    }
    bankId = bank.id;
    bankName = bank.name;
  } else if (body.bankName) {
    const existing = await prisma.questionBank.findFirst({
      where: { name: body.bankName.trim(), userId: auth.userId },
    });
    if (existing) {
      bankId = existing.id;
      bankName = existing.name;
    } else {
      const created = await prisma.questionBank.create({
        data: {
          name: body.bankName.trim(),
          userId: auth.userId,
          source: "AGENT_GENERATED",
          sourceRef: `AI 生成 - ${body.topic}`,
        },
      });
      bankId = created.id;
      bankName = created.name;
    }
  } else {
    // 自动命名
    const name = `AI 题库 - ${body.topic.slice(0, 30)}`;
    const created = await prisma.questionBank.create({
      data: {
        name,
        userId: auth.userId,
        source: "AGENT_GENERATED",
        sourceRef: `AI 生成 - ${body.topic}`,
      },
    });
    bankId = created.id;
    bankName = created.name;
  }

  // 调用 AI 生成
  let questions;
  try {
    questions = await generateQuestions({
      topic: body.topic,
      count,
      difficulty: body.difficulty,
      focusAreas: body.focusAreas,
    });
  } catch (err) {
    console.error("[ai/generate] AI 调用失败:", err);
    return ApiError.toResponse(
      ErrorCode.AI_ERROR,
      `AI 生成失败: ${err instanceof Error ? err.message : "未知错误"}`
    );
  }

  if (questions.length === 0) {
    return ApiError.toResponse(ErrorCode.AI_ERROR, "AI 未生成任何题目");
  }

  // 入库
  const now = new Date();
  const maxSort = await prisma.question.aggregate({
    where: { bankId },
    _max: { position: true },
  });
  let nextSort = (maxSort._max.position ?? -1) + 1;

  const createdQuestions = [];
  for (const q of questions) {
    const question = await prisma.question.create({
      data: {
        bankId,
        type: q.type,
        stem: q.stem,
        options: q.options as Prisma.InputJsonValue,
        answer: q.answer as Prisma.InputJsonValue,
        explanation: q.explanation,
        knowledgePoints: q.knowledgePoints,
        position: nextSort++,
        source: "AGENT_GENERATED",
      },
    });

    // 创建 ReviewItem
    await prisma.reviewItem.create({
      data: {
        userId: auth.userId,
        questionId: question.id,
        bankId,
        state: "NEW",
        dueAt: now,
        scheduledDays: 0,
        elapsedDays: 0,
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
      },
    });

    createdQuestions.push({
      id: question.id,
      type: question.type,
      stem: question.stem.slice(0, 100),
    });
  }

  return NextResponse.json({
    bankId,
    bankName,
    imported: createdQuestions.length,
    questions: createdQuestions,
  });
}
