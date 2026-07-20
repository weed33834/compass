// 题库导入：上传文件 → 解析 → 建题库 + 批量建题目 + 建 ReviewItem
// POST /api/banks/import
//
// 请求：multipart/form-data
//   - file: File（必填，.md/.txt/.xlsx/.xls/.csv/.docx）
//   - name: 题库名（可选，缺省用文件名）
//   - description: 描述（可选）
//   - coverColor: 封面色 token（可选）
//   - tags: 逗号分隔的标签（可选）
//   - newCardsPerDay: 数字（可选，默认 20）
//
// 响应：
//   { id, bankName, questionCount, parser, warnings }

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, assertRateLimit } from "@/lib/api";
import { parseQuestionFile } from "@/lib/quiz/import";
import type { Prisma } from "@prisma/client";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;

  const limited = assertRateLimit(`bank-import:${auth.userId}`, 10, 60_000);
  if (limited) return limited;

  const form = await request.formData();
  const file = form.get("file");
  const name = (form.get("name") as string | null)?.trim() || "";
  const description = (form.get("description") as string | null)?.trim() || "";
  const coverColor = (form.get("coverColor") as string | null)?.trim() || "brass";
  const tagsStr = (form.get("tags") as string | null)?.trim() || "";
  const newCardsPerDayStr = (form.get("newCardsPerDay") as string | null)?.trim() || "20";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少 file 字段" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `文件过大（${(file.size / 1024 / 1024).toFixed(1)} MB），最大 10 MB` },
      { status: 413 }
    );
  }

  const newCardsPerDay = Math.max(1, Math.min(500, parseInt(newCardsPerDayStr, 10) || 20));
  const buffer = Buffer.from(await file.arrayBuffer());

  // 1. 解析
  let parsed;
  try {
    parsed = await parseQuestionFile(buffer, { fileName: file.name });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "文件解析失败" },
      { status: 400 }
    );
  }

  if (parsed.questions.length === 0) {
    return NextResponse.json(
      {
        error: "未解析到任何题目",
        warnings: parsed.warnings,
        parser: parsed.parser,
      },
      { status: 422 }
    );
  }

  // 2. 推断题库元信息
  const bankName = name || file.name.replace(/\.[^.]+$/, "");
  const sourceMap: Record<typeof parsed.parser, "IMPORT_MD" | "IMPORT_EXCEL" | "IMPORT_WORD"> = {
    MARKDOWN: "IMPORT_MD",
    EXCEL: "IMPORT_EXCEL",
    WORD: "IMPORT_WORD",
  };
  const tags = tagsStr
    ? tagsStr.split(/[,，]/).map((s) => s.trim()).filter(Boolean)
    : [];

  // 3. 事务：建题库 + 批量建题目 + 建 ReviewItem
  const result = await prisma.$transaction(async (tx) => {
    const bank = await tx.questionBank.create({
      data: {
        userId: auth.userId,
        name: bankName,
        description: description || null,
        coverColor,
        tags,
        visibility: "PRIVATE",
        source: sourceMap[parsed.parser],
        sourceRef: file.name,
        fsrsEnabled: true,
        desiredRetention: 0.9,
        newCardsPerDay,
        maxReviewsPerDay: 200,
      },
    });

    const questionsData: Prisma.QuestionUncheckedCreateInput[] = parsed.questions.map((q, idx) => ({
      bankId: bank.id,
      type: q.type,
      stem: q.stem,
      options: (q.options ?? null) as unknown as Prisma.InputJsonValue,
      answer: (q.answer ?? null) as unknown as Prisma.InputJsonValue,
      explanation: q.explanation ?? null,
      knowledgePoints: q.knowledgePoints ?? [],
      difficulty: q.difficulty ?? 2.5,
      source: q.source ?? null,
      position: q.position ?? idx,
    }));
    const created = await tx.question.createMany({ data: questionsData });

    const inserted = await tx.question.findMany({
      where: { bankId: bank.id },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    await tx.reviewItem.createMany({
      data: inserted.map((q) => ({
        userId: auth.userId,
        questionId: q.id,
        bankId: bank.id,
        state: "NEW" as const,
        dueAt: new Date(),
      })),
    });
    await tx.questionBank.update({
      where: { id: bank.id },
      data: { totalQuestions: created.count },
    });

    return { bank, questionCount: created.count };
  });

  return NextResponse.json(
    {
      id: result.bank.id,
      bankName,
      questionCount: result.questionCount,
      parser: parsed.parser,
      warnings: parsed.warnings,
    },
    { status: 201 }
  );
}
