// 题库导出：CSV / Anki 文本
// GET /api/banks/:id/export?format=csv|anki
//
// CSV：与 Excel 导入兼容的表头（type/stem/options/answer/explanation/difficulty/knowledge/source）
// Anki：Anki 文本导入格式（TSV + #tags column:2 头部），可直接在 Anki 桌面端"导入"使用

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";
import type { ParsedOption } from "@/lib/quiz/import";

interface DbOption {
  key: string;
  text?: string;
  correct?: boolean;
  answer?: string;
  placeholder?: string;
}

const TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: "单选",
  MULTI_CHOICE: "多选",
  TRUE_FALSE: "判断",
  FILL_BLANK: "填空",
};

function csvEscape(s: string): string {
  if (s == null) return "";
  // 含逗号 / 引号 / 换行时用双引号包裹，内部引号双写
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function optionsToCsvString(opts: DbOption[] | null | undefined): string {
  if (!opts || !Array.isArray(opts) || opts.length === 0) return "";
  // 单选/多选：A.选项A|B.选项B
  // 判断：跳过（导入端会自动构造）
  // 填空：跳过（导入端按 answer 构造）
  if (opts.every((o) => o.text !== undefined)) {
    return opts.map((o) => `${o.key}.${o.text ?? ""}`).join("|");
  }
  return "";
}

function answerToCsvString(
  type: string,
  answer: unknown,
  options: DbOption[] | null | undefined
): string {
  if (answer == null) return "";
  if (type === "SINGLE_CHOICE") return String(answer as string);
  if (type === "MULTI_CHOICE") {
    if (Array.isArray(answer)) return (answer as string[]).join(",");
    return String(answer as string);
  }
  if (type === "TRUE_FALSE") {
    return answer === true ? "正确" : "错误";
  }
  if (type === "FILL_BLANK") {
    if (Array.isArray(answer)) return (answer as string[]).join("||");
    return String(answer as string);
  }
  // 兜底：判断题选项兜底
  if (options && options.length === 2) {
    const t = options.find((o) => o.key === "T");
    if (t && t.correct === true) return "正确";
    if (t && t.correct === false) return "错误";
  }
  return "";
}

function buildCsv(
  bankName: string,
  questions: Array<{
    type: string;
    stem: string;
    options: unknown;
    answer: unknown;
    explanation: string | null;
    difficulty: number;
    knowledgePoints: string[];
    source: string | null;
  }>
): string {
  const header = ["type", "stem", "options", "answer", "explanation", "difficulty", "knowledge", "source"];
  const lines = [header.join(",")];
  for (const q of questions) {
    const opts = (q.options as DbOption[] | null) ?? null;
    const row = [
      csvEscape(TYPE_LABELS[q.type] ?? q.type),
      csvEscape(q.stem),
      csvEscape(optionsToCsvString(opts)),
      csvEscape(answerToCsvString(q.type, q.answer, opts)),
      csvEscape(q.explanation ?? ""),
      csvEscape(String(q.difficulty)),
      csvEscape((q.knowledgePoints ?? []).join(",")),
      csvEscape(q.source ?? ""),
    ];
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

function stemToAnkiHtml(stem: string): string {
  // Anki 卡片正面：题干转 HTML（换行 → <br>）
  return stem
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function buildAnkiText(
  bankName: string,
  questions: Array<{
    type: string;
    stem: string;
    options: unknown;
    answer: unknown;
    explanation: string | null;
    knowledgePoints: string[];
  }>
): string {
  const lines: string[] = [
    "#separator:tab",
    "#html:true",
    "#tags column:3",
    `#deck:${bankName}`,
  ];
  for (const q of questions) {
    const opts = (q.options as DbOption[] | null) ?? null;
    let front = "";
    let back = "";

    if (q.type === "SINGLE_CHOICE" || q.type === "MULTI_CHOICE") {
      // 正面：题干 + 选项
      const optsHtml = (opts ?? [])
        .map((o) => `${o.key}. ${o.text ?? ""}`)
        .join("<br>");
      front = `${stemToAnkiHtml(q.stem)}<br><br>${optsHtml}`;
      const answerArr = Array.isArray(q.answer)
        ? (q.answer as string[])
        : q.answer
        ? [String(q.answer)]
        : [];
      const correctLabels = (opts ?? [])
        .filter((o) => answerArr.includes(o.key))
        .map((o) => `${o.key}. ${o.text ?? ""}`)
        .join("<br>");
      back = `<b>答案</b>：${answerArr.join("")}<br>${correctLabels}`;
    } else if (q.type === "TRUE_FALSE") {
      front = stemToAnkiHtml(q.stem);
      back = `<b>答案</b>：${q.answer === true ? "正确" : "错误"}`;
    } else if (q.type === "FILL_BLANK") {
      front = stemToAnkiHtml(q.stem);
      const answers = Array.isArray(q.answer)
        ? (q.answer as string[])
        : q.answer
        ? [String(q.answer)]
        : [];
      back = `<b>答案</b>：${answers.join(" / ")}`;
    } else {
      front = stemToAnkiHtml(q.stem);
      back = String(q.answer ?? "");
    }

    if (q.explanation) {
      back += `<br><br><b>解析</b>：${stemToAnkiHtml(q.explanation)}`;
    }

    // Anki TSV：front \t back \t tags
    const tags = (q.knowledgePoints ?? [])
      .map((kp) => kp.replace(/\s+/g, "_"))
      .join(" ");
    // 转义 Tab 和换行（防止破坏 TSV 结构）
    const frontSafe = front.replace(/\t/g, " ").replace(/\r/g, "");
    const backSafe = back.replace(/\t/g, " ").replace(/\r/g, "");
    lines.push(`${frontSafe}\t${backSafe}\t${tags}`);
  }
  return lines.join("\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiUser();
  if (auth.errorResponse) return auth.errorResponse;
  const { id } = await params;

  const bank = await prisma.questionBank.findFirst({
    where: { id, userId: auth.userId },
    select: { id: true, name: true },
  });
  if (!bank) return NextResponse.json({ error: "题库不存在" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv").toLowerCase();
  if (format !== "csv" && format !== "anki") {
    return NextResponse.json(
      { error: "不支持的格式，仅支持 csv 或 anki" },
      { status: 400 }
    );
  }

  const questions = await prisma.question.findMany({
    where: { bankId: bank.id, isDisabled: false },
    orderBy: { position: "asc" },
    select: {
      type: true,
      stem: true,
      options: true,
      answer: true,
      explanation: true,
      difficulty: true,
      knowledgePoints: true,
      source: true,
    },
  });

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "题库为空，无法导出" },
      { status: 422 }
    );
  }

  // 文件名：题库名-YYYYMMDD.format
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const safeName = bank.name.replace(/[\\/:*?"<>|]/g, "_");
  const fileName = `${safeName}-${dateStr}.${format === "csv" ? "csv" : "txt"}`;

  if (format === "csv") {
    const csv = buildCsv(bank.name, questions);
    // UTF-8 BOM，Excel 直接打开不乱码
    const body = "\uFEFF" + csv;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  }

  // anki
  const anki = buildAnkiText(bank.name, questions);
  return new NextResponse(anki, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}

// 仅供类型校验保留（ParsedOption 与 DbOption 兼容）
export type _OptionCompat = ParsedOption;
