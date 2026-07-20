// 题库导入解析器：统一入口
// 支持 Markdown / Excel / Word 三种格式
// 所有解析器输出统一的 ParsedQuestion 数组，可直接喂给 /api/banks 的 questions 字段

import type { QuestionType } from "@prisma/client";

// 选项结构（与 schema Question.options JSON 一致）
// 单选/多选：{ key, text, correct }
// 判断：{ key:"T", text:"正确", correct } / { key:"F", text:"错误", correct }
// 填空：{ key:"1", answer:"标准答案", placeholder:"可选占位符" }
export interface ParsedOption {
  key: string;
  text?: string;
  correct?: boolean;
  answer?: string;
  placeholder?: string;
}

export interface ParsedQuestion {
  type: QuestionType;
  stem: string;
  options?: ParsedOption[];
  answer?: unknown;
  explanation?: string;
  knowledgePoints?: string[];
  difficulty?: number;
  source?: string;
  position?: number;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  warnings: string[];      // 非致命问题（如跳过的空行）
  parser: "MARKDOWN" | "EXCEL" | "WORD";
}

export interface ParseOptions {
  fileName?: string;       // 用于推断格式 / 写入 source
  defaultBankName?: string;
}

// 根据文件名后缀分派到对应解析器
export async function parseQuestionFile(
  buffer: Buffer,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const name = (options.fileName ?? "").toLowerCase();
  if (name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".txt")) {
    const { parseMarkdown } = await import("./markdown");
    return { ...await parseMarkdown(buffer.toString("utf-8")), parser: "MARKDOWN" };
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
    const { parseExcel } = await import("./excel");
    return { ...await parseExcel(buffer, name.endsWith(".csv")), parser: "EXCEL" };
  }
  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    const { parseWord } = await import("./word");
    return { ...await parseWord(buffer), parser: "WORD" };
  }
  throw new Error(`不支持的文件格式：${options.fileName ?? "(未知)"}。支持 .md/.txt/.xlsx/.xls/.csv/.docx`);
}
