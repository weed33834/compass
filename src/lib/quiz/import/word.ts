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

// 把"无 --- 分隔的纯编号文本"转成 markdown 风格（## 题型 + --- 分隔）
// 导出以便单元测试：无需 mammoth 即可验证预处理逻辑
//
// 关键：题型标题（## 单选题）必须与"紧随其后的题目"在同一个 --- 块内，
// 否则标题会泄漏到前一个题块，导致题型错配。
export function preprocessWordText(text: string): string {
  const typeRegex = /^\s*(单选题|单选|多选题|多选|判断题|判断|填空题|填空)\s*[:：]?\s*$/m;
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let lastWasEmpty = false;
  // 上一行是否是 ## 题型标题——若是，则下一个"第N题"不插 ---（让标题与题目同块）
  let lastWasTypeHeader = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "") {
      if (!lastWasEmpty) {
        out.push("");
        lastWasEmpty = true;
      }
      continue;
    }
    // 题型行 → ## 标题，前面插 --- 与前一题块分隔
    const typeMatch = trimmed.match(typeRegex);
    if (typeMatch) {
      if (out.length > 0) {
        const lastNonEmpty = [...out].reverse().find((l) => l.trim() !== "");
        if (lastNonEmpty && lastNonEmpty !== "---") {
          out.push("---");
          out.push("");
        }
      }
      out.push(`## ${typeMatch[1]}`);
      lastWasEmpty = false;
      lastWasTypeHeader = true;
      continue;
    }
    // 题号开头："1. xxx" / "Q1. xxx" / "第 1 题：xxx" / "第1题: xxx" / "第1题、 xxx"
    // 旧 bug 1：原正则 [:：]、 强制要求"冒号+顿号"同时出现，导致 "第1题：xxx" 无法识别
    //           修复：[:：、]? 让三种分隔符（: ： 、）均可选
    // 旧 bug 2：原条件 lastWasEmpty === false 反了——题号通常在空行之后（题块边界），
    //           导致分隔符从未插入，所有题合并成一题。修复：只要前面有内容就插入 ---
    // 旧 bug 3：题型标题（## 多选题）会泄漏到前一题块，导致题型错配。
    //           修复：若上一行是 ## 题型标题，则不插 ---（让标题与题目同块）
    const numMatch = trimmed.match(/^(?:第\s*\d+\s*题[:：、]?\s*)|(?:Q\d+[.):]\s*)|(?:\d+[.):、]\s*)/);
    if (numMatch && out.length > 0 && !lastWasTypeHeader) {
      const lastLine = out[out.length - 1];
      if (lastLine !== "---") {
        out.push("---");
        out.push("");
      }
    }
    out.push(line);
    lastWasEmpty = false;
    lastWasTypeHeader = false;
  }

  return out.join("\n");
}

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
  const mdText = preprocessWordText(text);
  const parsed = await parseMarkdown(mdText);
  return { questions: parsed.questions, warnings: [...warnings, ...parsed.warnings] };
}
