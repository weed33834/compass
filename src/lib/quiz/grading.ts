// 判分逻辑：4 种题型的统一判定接口
// 输入：题目 + 用户答案；输出：是否正确 / 部分得分 / 解释
// 设计：
//   - 单选 / 判断：二元对错
//   - 多选：完全对 1.0，漏选 0.5，错选 0.0（参考粉笔"多选少选给分"模式）
//   - 填空：每个空独立判分，归一化为 0-1

import type { Question } from "@prisma/client";

// 选项结构（与 schema.prisma Question.options 注释一致）
export interface QuestionOption {
  key: string;        // "A" / "B" / "T" / "F" / "1"
  text?: string;      // 选项文本（选择/判断题）
  correct?: boolean;  // 标记正确选项（选择/判断）
  answer?: string;    // 标准答案（填空题）
  placeholder?: string; // 填空占位符
}

export interface GradingResult {
  isCorrect: boolean;
  partialScore: number;       // 0-1，用于多选/填空部分对
  correctAnswer: unknown;     // 标准答案回显
  userAnswerNormalized: unknown;
}

// 把 Question.answer（JSON）规范化为字符串数组（多选/判断/填空统一）
function normalizeAnswer(answer: unknown): string[] {
  if (answer == null) return [];
  if (Array.isArray(answer)) return answer.map((x) => String(x));
  if (typeof answer === "boolean") return [answer ? "true" : "false"];
  if (typeof answer === "string") return [answer];
  return [String(answer)];
}

// 把用户答案规范化为字符串数组
function normalizeUserAnswer(input: unknown): string[] {
  if (input == null) return [];
  if (Array.isArray(input)) return input.map((x) => String(x));
  if (typeof input === "boolean") return [input ? "true" : "false"];
  if (typeof input === "string") return input.trim() ? [input] : [];
  return [String(input)];
}

// 字符串归一化（填空题答案比较用）：去首尾空白、全角转半角、统一小写
function normalizeString(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[\u3000]/g, " ")
    .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, " ");
}

// 单选：用户答案 === 标准答案
function gradeSingle(correct: string[], user: string[]): GradingResult {
  const isCorrect = user.length === 1 && correct.includes(user[0]);
  return {
    isCorrect,
    partialScore: isCorrect ? 1 : 0,
    correctAnswer: correct[0] ?? null,
    userAnswerNormalized: user[0] ?? null,
  };
}

// 多选：完全对 1.0，漏选 0.5，错选/多选 0.0
function gradeMulti(correct: string[], user: string[]): GradingResult {
  const correctSet = new Set(correct);
  const userSet = new Set(user);
  // 完全一致
  if (correctSet.size === userSet.size && [...correctSet].every((k) => userSet.has(k))) {
    return { isCorrect: true, partialScore: 1, correctAnswer: correct, userAnswerNormalized: user };
  }
  // 用户选了任何不在正确答案中的项 → 0 分
  const hasWrong = [...userSet].some((k) => !correctSet.has(k));
  if (hasWrong) {
    return { isCorrect: false, partialScore: 0, correctAnswer: correct, userAnswerNormalized: user };
  }
  // 漏选：按比例给分（至少 0.5，最多 0.99，鼓励但不满分）
  const ratio = userSet.size / Math.max(correctSet.size, 1);
  return {
    isCorrect: false,
    partialScore: Math.min(0.5 + ratio * 0.5, 0.99) * (ratio > 0 ? 1 : 0),
    correctAnswer: correct,
    userAnswerNormalized: user,
  };
}

// 判断题：true/false 与 T/F 都接受
function gradeTrueFalse(correct: string[], user: string[]): GradingResult {
  const norm = (s: string) => {
    const t = s.toLowerCase();
    if (t === "true" || t === "t" || t === "对" || t === "正确" || t === "是") return "true";
    if (t === "false" || t === "f" || t === "错" || t === "错误" || t === "否") return "false";
    return t;
  };
  const c = norm(correct[0] ?? "");
  const u = norm(user[0] ?? "");
  const isCorrect = c !== "" && c === u;
  return {
    isCorrect,
    partialScore: isCorrect ? 1 : 0,
    correctAnswer: c === "true",
    userAnswerNormalized: u === "true",
  };
}

// 填空题：每个空独立判分，归一化后字符串比较
function gradeFillBlank(question: Question, user: string[]): GradingResult {
  const options = (question.options ?? []) as unknown as QuestionOption[];
  const blanks = options.filter((o) => o.answer != null);
  if (blanks.length === 0) {
    // 没有空结构，fallback 到直接比较 answer
    const correct = normalizeAnswer(question.answer);
    const isCorrect = correct.length === user.length
      && correct.every((c, i) => normalizeString(c) === normalizeString(user[i] ?? ""));
    return {
      isCorrect,
      partialScore: isCorrect ? 1 : 0,
      correctAnswer: correct,
      userAnswerNormalized: user,
    };
  }
  let hit = 0;
  const evaluated = blanks.map((blank, i) => {
    const u = user[i] ?? "";
    // 一个空可能有多个等价答案（用 | 分隔），任一匹配即对
    const alts = String(blank.answer ?? "").split("|").map(normalizeString);
    const ok = alts.includes(normalizeString(u));
    if (ok) hit++;
    return { standard: blank.answer, user: u, ok };
  });
  const ratio = hit / blanks.length;
  return {
    isCorrect: ratio === 1,
    partialScore: ratio,
    correctAnswer: evaluated.map((e) => e.standard),
    userAnswerNormalized: evaluated.map((e) => e.user),
  };
}

// 统一判分入口
export function gradeQuestion(question: Question, userAnswer: unknown): GradingResult {
  const correct = normalizeAnswer(question.answer);
  const user = normalizeUserAnswer(userAnswer);
  switch (question.type) {
    case "SINGLE_CHOICE":
      return gradeSingle(correct, user);
    case "MULTI_CHOICE":
      return gradeMulti(correct, user);
    case "TRUE_FALSE":
      return gradeTrueFalse(correct, user);
    case "FILL_BLANK":
      return gradeFillBlank(question, user);
    default:
      return {
        isCorrect: false,
        partialScore: 0,
        correctAnswer: question.answer,
        userAnswerNormalized: userAnswer,
      };
  }
}
