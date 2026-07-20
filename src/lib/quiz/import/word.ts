// Word 题库解析器
//
// 使用 mammoth 将 .docx 转为纯文本，然后用与 markdown 类似的规则解析。
// 因为 Word 文档结构差异大，本解析器要求文档遵循清晰格式：
//   - 每题之间用空行分隔（或 "题目 N：" / "Q1." 等编号开头）
//   - 题型用单独一行标识（"单选题" / "多选题" / "判断题" / "填空题"）
//   - 选项格式：A. / A) / A、
//   - 答案、解析、知识点等同 Markdown 解析器
//
// 也可接受 Markdown 风格的 .docx（## 单选题、--- 分隔）

import mammoth from "mammoth";
import { parseMarkdown } from "./markdown";

export async function parseWord(buffer: Buffer): Promise<{
  questions: import("./index").ParsedQuestion[];
  warnings: string[];
}> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value || "";

  // 优先按 Markdown 规则解析（很多用户会用 Word 写 Markdown 风格）
  // 如果检测到 --- 或 ## 标题，直接走 markdown 路径
  if (/^---+\s*$/m.test(text) || /^\s*##\s+/m.test(text)) {
    return parseMarkdown(text);
  }

  // 否则按"空行分块" + 题型识别行 来解析
  const warnings: string[] = [];

  // 把 Word 文本转成 Markdown 风格再复用 markdown 解析器：
  // - 把"单选题"、"多选题"等独立行替换为 "## 单选题"
  // - 用 --- 分隔每个题块
  const typeRegex = /^\s*(单选题|单选|多选题|多选|判断题|判断|填空题|填空)\s*[:：]?\s*$/m;
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let lastWasEmpty = false;
  let titleInsertedForBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "") {
      if (!lastWasEmpty) {
        out.push("");
        lastWasEmpty = true;
        titleInsertedForBlock = false;
      }
      continue;
    }
    // 题型行 → ## 标题
    const typeMatch = trimmed.match(typeRegex);
    if (typeMatch) {
      out.push(`## ${typeMatch[1]}`);
      lastWasEmpty = false;
      continue;
    }
    // 题号开头："1. xxx" / "Q1. xxx" / "第 1 题：xxx"
    const numMatch = trimmed.match(/^(?:第\s*\d+\s*题[:：]、\s*)|(?:Q\d+[.):]\s*)|(?:\d+[.):、]\s*)/);
    if (numMatch && !titleInsertedForBlock && lastWasEmpty === false && out.length > 0) {
      // 题号开头视为新题开始，插入分隔
      out.push("---");
      out.push("");
    }
    out.push(line);
    lastWasEmpty = false;
  }

  const mdText = out.join("\n");
  const parsed = await parseMarkdown(mdText);
  return { questions: parsed.questions, warnings: [...warnings, ...parsed.warnings] };
}
