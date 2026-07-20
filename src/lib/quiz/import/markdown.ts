// Markdown 题库解析器
//
// 支持格式（推荐用 --- 分隔题目）：
//
//   # 题库名（可选，第一行）
//
//   ---
//
//   ## 单选题
//
//   这道题的题干，可以是多行。
//
//   A. 选项 A
//   B. 选项 B
//   C. 选项 C
//   D. 选项 D
//
//   答案：B
//   解析：因为 B 是正确的。
//   难度：3
//   知识点：马原-辩证法, 真题-2024
//   来源：2024 国考真题
//
//   ---
//
//   ## 多选题
//
//   下列哪些是正确的？
//
//   A. 选项 A
//   B. 选项 B
//   C. 选项 C
//
//   答案：AC
//
//   ---
//
//   ## 判断题
//
//   地球是圆的。
//
//   答案：正确
//
//   ---
//
//   ## 填空题
//
//   中国的首都是____。
//
//   答案：北京
//
// 解析规则：
//   - 题型从 ## 标题推断；可省略，默认按选项数量+答案形式推断
//   - 选项行：A. / A) / A、 三种格式都接受
//   - 答案行：单选"B" / 多选"AC"或"A,C" / 判断"正确/错误/T/F/对/错" / 填空"北京" 或 "北京|Beijing"
//   - 题干内的 ____（≥4 个下划线）表示填空位置
//   - 答案行 | 分隔多个备选答案（任一匹配即算对）

import type { ParsedOption, ParsedQuestion, ParseResult } from "./index";
import type { QuestionType } from "@prisma/client";

const TYPE_HEADERS: Record<string, QuestionType> = {
  "单选题": "SINGLE_CHOICE",
  "单选": "SINGLE_CHOICE",
  "single": "SINGLE_CHOICE",
  "多选题": "MULTI_CHOICE",
  "多选": "MULTI_CHOICE",
  "multi": "MULTI_CHOICE",
  "判断题": "TRUE_FALSE",
  "判断": "TRUE_FALSE",
  "true/false": "TRUE_FALSE",
  "tf": "TRUE_FALSE",
  "填空题": "FILL_BLANK",
  "填空": "FILL_BLANK",
  "fill": "FILL_BLANK",
};

// 判断题答案归一化
function parseBooleanAnswer(s: string): boolean | null {
  const v = s.trim().toLowerCase();
  if (["正确", "对", "true", "t", "yes", "y", "是", "√"].includes(v)) return true;
  if (["错误", "错", "false", "f", "no", "n", "否", "×"].includes(v)) return false;
  return null;
}

// 解析选项行
function parseOptionLine(line: string): ParsedOption | null {
  // A. / A) / A、 / A: 开头
  const m = line.match(/^\s*([A-Z])\s*[.):、:]\s*(.+?)\s*$/);
  if (!m) return null;
  return { key: m[1], text: m[2] };
}

// 解析"答案：xxx"
function parseLabeledLine(line: string, label: string): string | null {
  const re = new RegExp(`^\\s*${label}\\s*[:：]\\s*(.+?)\\s*$`, "i");
  const m = line.match(re);
  return m ? m[1] : null;
}

// 把"AC" / "A,C" / "A、C" 拆成 ["A","C"]
function splitMultiAnswer(s: string): string[] {
  return s
    .split(/[,，、\s]+/)
    .map((x) => x.trim().toUpperCase())
    .filter((x) => /^[A-Z]$/.test(x));
}

export async function parseMarkdown(content: string): Promise<Omit<ParseResult, "parser">> {
  const warnings: string[] = [];
  const questions: ParsedQuestion[] = [];

  // 切分题目：以单独成行的 --- 或 *** 为分隔
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/^---+\s*$|^---+\*\*\*+\s*$/m)
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  let position = 0;
  for (const block of blocks) {
    // 解析题型（## 标题）
    let type: QuestionType | null = null;
    const lines = block.split("\n");
    const cleanLines: string[] = [];
    for (const line of lines) {
      const headerMatch = line.match(/^\s*##\s+(.+?)\s*$/);
      if (headerMatch && type === null) {
        const headerText = headerMatch[1].trim().toLowerCase();
        type = TYPE_HEADERS[headerText] ?? null;
        continue; // 标题行不进入正文
      }
      // 跳过 # 一级标题（题库名）
      if (/^\s*#\s+/.test(line) && cleanLines.length === 0) continue;
      cleanLines.push(line);
    }

    const stem: string[] = [];
    const options: ParsedOption[] = [];
    const labels: Record<string, string> = {}; // 答案/解析/难度/知识点/来源
    let inStem = true;

    for (const line of cleanLines) {
      const trimmed = line.trim();
      if (trimmed === "") {
        if (inStem && stem.length > 0) inStem = false;
        continue;
      }
      // 选项行
      const opt = parseOptionLine(trimmed);
      if (opt) {
        options.push(opt);
        inStem = false;
        continue;
      }
      // 标签行（答案/解析/难度/知识点/来源）
      const labelMap: Array<{ key: string; aliases: string[] }> = [
        { key: "answer", aliases: ["答案", "answer", "ans"] },
        { key: "explanation", aliases: ["解析", "解释", "explanation", "exp"] },
        { key: "difficulty", aliases: ["难度", "difficulty", "diff"] },
        { key: "knowledgePoints", aliases: ["知识点", "考点", "knowledge", "kp"] },
        { key: "source", aliases: ["来源", "source", "src"] },
      ];
      let matched = false;
      for (const l of labelMap) {
        for (const alias of l.aliases) {
          const val = parseLabeledLine(trimmed, alias);
          if (val !== null) {
            labels[l.key] = val;
            matched = true;
            inStem = false;
            break;
          }
        }
        if (matched) break;
      }
      if (matched) continue;

      // 其它行：作为题干（在标签前）或追加到解析（标签后）
      if (inStem) {
        stem.push(line);
      } else if (labels.explanation) {
        labels.explanation += "\n" + line;
      }
    }

    const stemText = stem.join("\n").trim();
    if (!stemText) {
      warnings.push(`跳过空题干块（位置 ${position + 1}）`);
      continue;
    }

    // 如果没指定题型，按选项/答案推断
    if (!type) {
      if (options.length > 0) {
        const ans = labels.answer ?? "";
        type = splitMultiAnswer(ans).length >= 2 ? "MULTI_CHOICE" : "SINGLE_CHOICE";
      } else if (parseBooleanAnswer(labels.answer ?? "") !== null) {
        type = "TRUE_FALSE";
      } else if (stemText.includes("____")) {
        type = "FILL_BLANK";
      } else {
        warnings.push(`位置 ${position + 1} 无法推断题型，已跳过`);
        continue;
      }
    }

    // 构建选项/答案
    let finalOptions: ParsedOption[] | undefined;
    let finalAnswer: unknown;
    let finalExplanation: string | undefined = labels.explanation?.trim() || undefined;
    const knowledgePoints = labels.knowledgePoints
      ? labels.knowledgePoints.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
      : undefined;
    const difficulty = labels.difficulty ? parseFloat(labels.difficulty) : undefined;
    const source = labels.source?.trim() || undefined;

    if (type === "SINGLE_CHOICE" || type === "MULTI_CHOICE") {
      finalOptions = options.map((o) => ({
        ...o,
        correct: false,
      }));
      const answerKeys = splitMultiAnswer(labels.answer ?? "");
      if (type === "SINGLE_CHOICE" && answerKeys.length > 1) {
        warnings.push(`位置 ${position + 1} 标为单选但答案有多个，仅取第一个`);
      }
      finalAnswer = type === "SINGLE_CHOICE" ? (answerKeys[0] ?? "") : answerKeys;
      // 标记正确选项
      finalOptions = finalOptions.map((o) => ({
        ...o,
        correct: answerKeys.includes(o.key),
      }));
    } else if (type === "TRUE_FALSE") {
      const b = parseBooleanAnswer(labels.answer ?? "");
      if (b === null) {
        warnings.push(`位置 ${position + 1} 判断题答案无法识别："${labels.answer}"`);
      }
      finalOptions = [
        { key: "T", text: "正确", correct: b === true },
        { key: "F", text: "错误", correct: b === false },
      ];
      finalAnswer = b;
    } else if (type === "FILL_BLANK") {
      // 填空：根据 ____ 数量切分；如果答案有 | 或 / 分隔多个备选
      const blankCount = (stemText.match(/_{4,}/g) ?? []).length;
      const answerStr = labels.answer ?? "";
      // 多个空用 || 分隔；同一空的多个备选用 | 或 / 分隔
      const blanks = answerStr.split("||").map((b) => b.trim());
      finalOptions = blanks.map((b, i) => ({
        key: String(i + 1),
        answer: b,
        placeholder: `第 ${i + 1} 空`,
      }));
      finalAnswer = blanks;
      if (blankCount > 0 && blanks.length !== blankCount) {
        warnings.push(
          `位置 ${position + 1} 填空题：题干有 ${blankCount} 个空，但答案有 ${blanks.length} 个`
        );
      }
    }

    questions.push({
      type,
      stem: stemText,
      options: finalOptions,
      answer: finalAnswer,
      explanation: finalExplanation,
      knowledgePoints,
      difficulty: Number.isFinite(difficulty) ? difficulty : undefined,
      source,
      position,
    });
    position++;
  }

  return { questions, warnings };
}
