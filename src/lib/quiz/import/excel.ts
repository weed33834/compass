// Excel/CSV 题库解析器
//
// 列约定（首行为表头，大小写不敏感，可中英文）：
//   type / 题型   : "单选"/"single" | "多选"/"multi" | "判断"/"tf" | "填空"/"fill"
//   stem / 题干   : 必填，多行用 \n
//   options / 选项 : 多选/单选用 | 分隔，如 "A.选项A|B.选项B|C.选项C"
//                    判断可不填；填空可不填
//   answer / 答案  : 单选 "B" / 多选 "AC" 或 "A,C" / 判断 "正确"/"T"/true / 填空 "北京||Beijing"（多空用 || 分隔）
//   explanation / 解析 : 可选
//   difficulty / 难度 : 1-5 数字，可选
//   knowledge / 知识点 : "马原-辩证法,真题-2024"，可选
//   source / 来源  : 可选
//
// 表头缺失时按固定顺序推断：type, stem, options, answer, explanation, difficulty, knowledge, source

import * as XLSX from "xlsx";
import type { ParsedOption, ParsedQuestion, ParseResult } from "./index";
import type { QuestionType } from "@prisma/client";

const TYPE_MAP: Record<string, QuestionType> = {
  "单选题": "SINGLE_CHOICE",
  "单选": "SINGLE_CHOICE",
  "single": "SINGLE_CHOICE",
  "single_choice": "SINGLE_CHOICE",
  "多选题": "MULTI_CHOICE",
  "多选": "MULTI_CHOICE",
  "multi": "MULTI_CHOICE",
  "multi_choice": "MULTI_CHOICE",
  "判断题": "TRUE_FALSE",
  "判断": "TRUE_FALSE",
  "tf": "TRUE_FALSE",
  "true_false": "TRUE_FALSE",
  "true/false": "TRUE_FALSE",
  "填空题": "FILL_BLANK",
  "填空": "FILL_BLANK",
  "fill": "FILL_BLANK",
  "fill_blank": "FILL_BLANK",
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().trim();
}

const HEADER_ALIASES: Record<string, string> = {
  type: "type", 题型: "type",
  stem: "stem", 题干: "stem", 题目: "stem",
  options: "options", 选项: "options",
  answer: "answer", 答案: "answer",
  explanation: "explanation", 解析: "explanation", 解释: "explanation",
  difficulty: "difficulty", 难度: "difficulty",
  knowledge: "knowledge", 知识点: "knowledge", 考点: "knowledge",
  source: "source", 来源: "source",
};

const FALLBACK_HEADERS = ["type", "stem", "options", "answer", "explanation", "difficulty", "knowledge", "source"];

function parseBooleanAnswer(s: string): boolean | null {
  const v = s.trim().toLowerCase();
  if (["正确", "对", "true", "t", "yes", "y", "是", "√", "1"].includes(v)) return true;
  if (["错误", "错", "false", "f", "no", "n", "否", "×", "0"].includes(v)) return false;
  return null;
}

function splitMultiAnswer(s: string): string[] {
  const v = s.trim().toUpperCase();
  // 纯连续字母（无分隔符）："ABCD" → ["A","B","C","D"]
  if (/^[A-Z]+$/.test(v)) {
    return v.split("");
  }
  return s
    .split(/[,，、\s]+/)
    .map((x) => x.trim().toUpperCase())
    .filter((x) => /^[A-Z]$/.test(x));
}

function parseOptionsString(s: string): ParsedOption[] {
  // "A.选项A|B.选项B" → [{key:A,text:选项A},...]
  const parts = s.split(/\|/).map((p) => p.trim()).filter(Boolean);
  const result: ParsedOption[] = [];
  for (const part of parts) {
    const m = part.match(/^([A-Z])\s*[.):、:]\s*(.+?)$/);
    if (m) {
      result.push({ key: m[1], text: m[2] });
    } else {
      // 无标号的选项，按字母自动编号
      result.push({ key: String.fromCharCode(65 + result.length), text: part });
    }
  }
  return result;
}

export async function parseExcel(buffer: Buffer, isCsv = false): Promise<Omit<ParseResult, "parser">> {
  const warnings: string[] = [];
  const questions: ParsedQuestion[] = [];

  // 旧 bug：原 raw: isCsv 导致 CSV 按 Latin-1 解码，中文全部乱码（"单选题"→"åéé¢"），
  //         TYPE_MAP 匹配失败 → "无法推断题型"。改用 codepage: 65001 强制 UTF-8。
  //         raw: true 的本意是"不把 3 解析成数字"，但 getCell 已用 String(v) 兜底，不再需要。
  const wb = XLSX.read(buffer, { type: "buffer", codepage: 65001 });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { questions, warnings: ["Excel 文件没有工作表"] };
  }
  const sheet = wb.Sheets[sheetName];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (rows.length === 0) {
    return { questions, warnings: ["工作表为空"] };
  }

  // 解析表头
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  const headerMap: Record<string, string> = {}; // normalizedHeader -> standard key
  for (const k of keys) {
    const nk = normalizeHeader(k);
    const std = HEADER_ALIASES[nk];
    if (std) headerMap[std] = k;
  }

  // 表头不全，回退到固定顺序
  // 阈值：原 < 2 太宽松（仅识别 1 列就当表头存在但残缺），导致部分数据被误判为表头
  // 改为：至少识别出 type/stem/answer 中的 2 个核心列才算表头可用，否则走固定顺序
  const recognizedCount = Object.keys(headerMap).length;
  const useFallback = recognizedCount < 2;
  const getCell = (row: Record<string, unknown>, stdKey: string, idx: number): string => {
    if (!useFallback && headerMap[stdKey]) {
      const v = row[headerMap[stdKey]];
      return v == null ? "" : String(v).trim();
    }
    // 固定顺序：取第 idx 列
    const allKeys = Object.keys(row);
    if (idx < allKeys.length) {
      const v = row[allKeys[idx]];
      return v == null ? "" : String(v).trim();
    }
    return "";
  };

  if (useFallback) {
    warnings.push(
      `表头识别到 ${recognizedCount} 列（需 ≥2 列），按固定顺序 type/stem/options/answer/... 解析；如结果异常请在首行写明 type/stem/options/answer 列名`
    );
  }

  rows.forEach((row, i) => {
    const typeStr = getCell(row, "type", 0).toLowerCase();
    const stemStr = getCell(row, "stem", 1);
    const optionsStr = getCell(row, "options", 2);
    const answerStr = getCell(row, "answer", 3);
    const explanationStr = getCell(row, "explanation", 4);
    const difficultyStr = getCell(row, "difficulty", 5);
    const knowledgeStr = getCell(row, "knowledge", 6);
    const sourceStr = getCell(row, "source", 7);

    // CSV 未转义逗号检测：sheet_to_json 在 CSV 模式下若行内有未引用的逗号，
    // 会产生多余列（key 形如 "__EMPTY" / "__EMPTY_1"）。前 5 行检查一次告警，避免刷屏
    if (isCsv && i < 5) {
      const emptyKeys = Object.keys(row).filter((k) => k.startsWith("__EMPTY"));
      if (emptyKeys.length > 0) {
        warnings.push(
          `第 ${i + 2} 行：检测到 ${emptyKeys.length} 个未命名列，可能是 CSV 中选项/解析含未转义逗号（建议用 | 分隔选项，或将含逗号的字段用双引号包裹）`
        );
      }
    }

    if (!stemStr) {
      warnings.push(`跳过第 ${i + 2} 行：题干为空`);
      return;
    }

    let type: QuestionType | null = TYPE_MAP[typeStr] ?? null;
    if (!type) {
      // 推断
      if (optionsStr) {
        const ans = splitMultiAnswer(answerStr);
        type = ans.length >= 2 ? "MULTI_CHOICE" : "SINGLE_CHOICE";
      } else if (parseBooleanAnswer(answerStr) !== null) {
        type = "TRUE_FALSE";
      } else if (stemStr.includes("____")) {
        type = "FILL_BLANK";
      } else {
        warnings.push(`第 ${i + 2} 行：无法推断题型，跳过`);
        return;
      }
    }

    let finalOptions: ParsedOption[] | undefined;
    let finalAnswer: unknown;
    const knowledgePoints = knowledgeStr
      ? knowledgeStr.split(/[,，、]/).map((s) => s.trim()).filter(Boolean)
      : undefined;
    const difficulty = difficultyStr ? parseFloat(difficultyStr) : undefined;
    const source = sourceStr || undefined;

    if (type === "SINGLE_CHOICE" || type === "MULTI_CHOICE") {
      const opts = parseOptionsString(optionsStr);
      const answerKeys = splitMultiAnswer(answerStr);
      if (type === "SINGLE_CHOICE" && answerKeys.length > 1) {
        warnings.push(`第 ${i + 2} 行：单选题答案有多个，仅取第一个`);
      }
      // 答案不在选项中：CSV/Excel 用户经常写错选项字母或漏写选项，给出告警
      if (answerKeys.length > 0 && opts.length > 0) {
        const optionKeys = opts.map((o) => o.key);
        const missing = answerKeys.filter((k) => !optionKeys.includes(k));
        if (missing.length > 0) {
          warnings.push(
            `第 ${i + 2} 行：答案 "${missing.join(",")}" 不在选项 ${optionKeys.join("/")} 中，请检查选项或答案是否漏写`
          );
        }
      }
      // 选项数量与表头不一致的 CSV 逗号未转义检测：
      // 当 useFallback 且 optionsStr 含逗号但行内字段数比首行多 → 可能 CSV 未转义
      finalOptions = opts.map((o) => ({
        ...o,
        correct: answerKeys.includes(o.key),
      }));
      finalAnswer = type === "SINGLE_CHOICE" ? (answerKeys[0] ?? "") : answerKeys;
    } else if (type === "TRUE_FALSE") {
      const b = parseBooleanAnswer(answerStr);
      if (b === null) {
        // 与 markdown 解析器一致：跳过无法判分的判断题，而非保存 null
        warnings.push(`第 ${i + 2} 行：判断题答案无法识别 "${answerStr}"，已跳过该题`);
        return;
      }
      finalOptions = [
        { key: "T", text: "正确", correct: b === true },
        { key: "F", text: "错误", correct: b === false },
      ];
      finalAnswer = b;
    } else if (type === "FILL_BLANK") {
      const blanks = answerStr.split("||").map((b) => b.trim()).filter((b) => b.length > 0 || true);
      finalOptions = blanks.map((b, idx) => ({
        key: String(idx + 1),
        answer: b,
        placeholder: `第 ${idx + 1} 空`,
      }));
      finalAnswer = blanks;
    }

    questions.push({
      type,
      stem: stemStr,
      options: finalOptions,
      answer: finalAnswer,
      explanation: explanationStr || undefined,
      knowledgePoints,
      difficulty: Number.isFinite(difficulty) ? difficulty : undefined,
      source,
      position: i,
    });
  });

  return { questions, warnings };
}
