// AI 题库生成提示词模板
// 覆盖四种题型：单选、多选、判断、填空

export const SYSTEM_PROMPT = `你是一位专业的题库设计专家。根据用户提供的主题生成高质量题目。

规则：
1. 题目必须准确、无歧义，答案唯一确定
2. 难度适中，覆盖核心知识点
3. 解析必须包含推理过程，指出易错点
4. 知识点以字符串数组返回

输出 JSON 数组，每条题目格式：
{
  "type": "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK",
  "stem": "题干（支持 Markdown）",
  "options": [{"key": "A", "text": "选项内容"}],
  "answer": "正确答案",
  "explanation": "解析",
  "knowledgePoints": ["知识点1"]
}

类型约束：
- SINGLE_CHOICE: options 含 4 个选项，answer 为正确选项 key（如 "A"）
- MULTI_CHOICE: options 含 4 个选项，answer 为逗号分隔的 key（如 "A,C"），至少 2 个正确
- TRUE_FALSE: options 为 [{"key":"T","text":"正确"},{"key":"F","text":"错误"}]，answer 为 "T" 或 "F"
- FILL_BLANK: 无 options，answer 为填空答案

只返回 JSON 数组，不要额外解释。`;

export function userPrompt(
  topic: string,
  count: number,
  difficulty?: string,
  focusAreas?: string[]
): string {
  const parts = [`主题: ${topic}`, `生成 ${count} 道题目`];
  if (difficulty) {
    const map: Record<string, string> = {
      easy: "难度: 基础（覆盖核心概念和定义）",
      medium: "难度: 中等（涉及理解和简单应用）",
      hard: "难度: 困难（涉及综合分析和推理）",
    };
    parts.push(map[difficulty] ?? `难度: ${difficulty}`);
  }
  if (focusAreas && focusAreas.length > 0) {
    parts.push(`重点覆盖领域: ${focusAreas.join("、")}`);
  }
  parts.push("题型均匀分布，至少包含两种以上题型。");
  return parts.join("\n");
}
