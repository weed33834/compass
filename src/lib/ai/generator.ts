// AI 题库生成核心模块
// 调用 OpenAI 兼容 API 生成题目，支持流式仅获取最终结果
// 生成后自动入库（ReviewItem），返回入库统计

import { SYSTEM_PROMPT, userPrompt } from "@/lib/ai/prompts";
import type { Prisma } from "@prisma/client";

// ─── 配置 ──────────────────────────────────────────────

function getConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const timeout = Number(process.env.AI_TIMEOUT_MS) || 60_000;
  const maxTokens = Number(process.env.AI_MAX_TOKENS) || 4096;
  if (!apiKey) throw new Error("OPENAI_API_KEY 未配置");
  return { apiKey, baseUrl, model, timeout, maxTokens };
}

// ─── 核心：调用 API 生成题目 ───────────────────────────

export async function generateQuestions(params: {
  topic: string;
  count: number;
  difficulty?: string;
  focusAreas?: string[];
}): Promise<GeneratedQuestion[]> {
  const { apiKey, baseUrl, model, timeout, maxTokens } = getConfig();
  const { topic, count, difficulty, focusAreas } = params;
  const clampedCount = Math.min(Math.max(1, count), 20);

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt(topic, clampedCount, difficulty, focusAreas) },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
    response_format: { type: "json_object" },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`AI API ${resp.status}: ${text.slice(0, 200)}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 返回为空");

  // OpenAI json_object 模式返回整个 JSON，但数组可能被包在 { "questions": [...] } 里
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    // 尝试提取 JSON 数组
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("AI 返回不是有效 JSON");
    parsed = JSON.parse(match[0]);
  }

  const questions = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown>).questions)
      ? (parsed as Record<string, unknown>).questions
      : null;

  if (!questions || !Array.isArray(questions)) {
    throw new Error("AI 返回格式不符合预期");
  }

  return questions.map((q: Record<string, unknown>, i: number) => ({
    type: normalizeType(q.type) ?? "SINGLE_CHOICE",
    stem: String(q.stem ?? ""),
    options: normalizeOptions(q.options),
    answer: normalizeAnswer(q.answer),
    explanation: String(q.explanation ?? ""),
    knowledgePoints: Array.isArray(q.knowledgePoints)
      ? q.knowledgePoints.map(String)
      : [],
    sortOrder: i,
  }));
}

// ─── 校验与规整 ────────────────────────────────────────

export interface GeneratedQuestion {
  type: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";
  stem: string;
  options: unknown;
  answer: unknown;
  explanation: string;
  knowledgePoints: string[];
  sortOrder: number;
}

function normalizeType(t: unknown): GeneratedQuestion["type"] | null {
  const s = String(t ?? "").toUpperCase().trim();
  const map: Record<string, GeneratedQuestion["type"]> = {
    SINGLE_CHOICE: "SINGLE_CHOICE",
    "SINGLE CHOICE": "SINGLE_CHOICE",
    SINGLE: "SINGLE_CHOICE",
    MULTI_CHOICE: "MULTI_CHOICE",
    "MULTI CHOICE": "MULTI_CHOICE",
    MULTIPLE: "MULTI_CHOICE",
    MULTIPLE_CHOICE: "MULTI_CHOICE",
    TRUE_FALSE: "TRUE_FALSE",
    "TRUE FALSE": "TRUE_FALSE",
    BOOLEAN: "TRUE_FALSE",
    TF: "TRUE_FALSE",
    FILL_BLANK: "FILL_BLANK",
    "FILL BLANK": "FILL_BLANK",
    FILL: "FILL_BLANK",
    BLANK: "FILL_BLANK",
  };
  return map[s] ?? null;
}

function normalizeOptions(o: unknown): unknown {
  if (o == null) return null;
  if (Array.isArray(o) && o.length > 0) {
    return o.map((opt: unknown) => {
      if (typeof opt === "object" && opt !== null) {
        const obj = opt as Record<string, unknown>;
        return { key: String(obj.key ?? ""), text: String(obj.text ?? "") };
      }
      return { key: "", text: String(opt) };
    });
  }
  return null;
}

function normalizeAnswer(a: unknown): unknown {
  if (a == null) return "";
  if (Array.isArray(a)) return a.map(String).sort().join(",");
  return String(a).trim();
}
