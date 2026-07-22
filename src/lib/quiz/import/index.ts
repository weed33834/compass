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

// .doc（旧版 Word 二进制）无法用 mammoth 解析，仅支持 .docx
// 早期发现，给出明确错误，避免后续抛"未知格式"或解析失败
function isLegacyDoc(name: string): boolean {
  return name.endsWith(".doc") && !name.endsWith(".docx");
}

// 二进制伪装成文本检测：.md/.txt/.csv 文件含 NUL 字节 → 视为二进制
// 使用 git 同款启发式（前 8KB 内出现 NUL 即判为二进制）：
//   - NUL 字节在 UTF-8 文本中几乎不会出现（除了 BOM 之外的合法文本都不含 0x00）
//   - 但在 PNG/DOC/ZIP 等二进制中很常见
// 旧实现的"不可打印字节占比"会误伤含中文/弯引号的多字节 UTF-8 文本（continuation byte 0x80-0xBF 被误判），已弃用
function looksBinary(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] === 0) return true;
  }
  return false;
}

// 根据文件名后缀分派到对应解析器
export async function parseQuestionFile(
  buffer: Buffer,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const name = (options.fileName ?? "").toLowerCase();

  // 空文件统一处理（避免 markdown 解析器返回"未解析到题目"，给更明确的错误）
  if (buffer.length === 0) {
    throw new Error("文件为空，请检查文件内容");
  }

  // .doc 旧版二进制格式：mammoth 仅支持 .docx
  if (isLegacyDoc(name)) {
    throw new Error(
      `不支持旧版 .doc 格式（${options.fileName ?? "文件"}）。请用 Word 另存为 .docx 后再导入，或复制内容到 .md/.txt 文件`
    );
  }

  if (name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".txt")) {
    // 二进制伪装成 .md（如改后缀的图片/PDF）：明确拒绝
    if (looksBinary(buffer)) {
      throw new Error(
        `文件内容看起来不是文本（${options.fileName ?? "文件"}）。.md/.txt 需为 UTF-8 文本，二进制文件请用 .docx/.xlsx`
      );
    }
    const { parseMarkdown } = await import("./markdown");
    return { ...await parseMarkdown(buffer.toString("utf-8")), parser: "MARKDOWN" };
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv")) {
    const { parseExcel } = await import("./excel");
    return { ...await parseExcel(buffer, name.endsWith(".csv")), parser: "EXCEL" };
  }
  if (name.endsWith(".docx")) {
    const { parseWord } = await import("./word");
    return { ...await parseWord(buffer), parser: "WORD" };
  }
  throw new Error(
    `不支持的文件格式：${options.fileName ?? "(未知)"}。支持 .md/.markdown/.txt/.xlsx/.xls/.csv/.docx`
  );
}
