// 判分逻辑单元测试
// 运行：pnpm test:unit
import { strict as assert } from "node:assert";
import { gradeQuestion, type QuestionOption } from "@/lib/quiz/grading";
import type { Question } from "@prisma/client";

let passed = 0;
let failed = 0;

function makeQuestion(
  type: Question["type"],
  options: QuestionOption[],
  answer: unknown,
  stem = "测试题目"
): Question {
  return {
    id: "test-id",
    bankId: "test-bank",
    stem,
    type,
    options: options as any,
    answer: answer as any,
    explanation: null,
    knowledgePoints: [],
    isDisabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Question;
}

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${(e as Error).message}`);
  }
}

// ========== 单选题 ==========
console.log("\n单选题");

test("正确答案 → isCorrect=true, score=1", () => {
  const q = makeQuestion(
    "SINGLE_CHOICE",
    [
      { key: "A", text: "选项1" },
      { key: "B", text: "选项2", correct: true },
    ],
    ["B"]
  );
  const r = gradeQuestion(q, ["B"]);
  assert.equal(r.isCorrect, true);
  assert.equal(r.partialScore, 1);
});

test("错误答案 → isCorrect=false, score=0", () => {
  const q = makeQuestion(
    "SINGLE_CHOICE",
    [
      { key: "A", text: "选项1" },
      { key: "B", text: "选项2", correct: true },
    ],
    ["B"]
  );
  const r = gradeQuestion(q, ["A"]);
  assert.equal(r.isCorrect, false);
  assert.equal(r.partialScore, 0);
});

test("空答案 → isCorrect=false", () => {
  const q = makeQuestion(
    "SINGLE_CHOICE",
    [
      { key: "A", text: "选项1" },
      { key: "B", text: "选项2", correct: true },
    ],
    ["B"]
  );
  const r = gradeQuestion(q, []);
  assert.equal(r.isCorrect, false);
});

// ========== 多选题 ==========
console.log("\n多选题");

test("全选对 → isCorrect=true, score=1", () => {
  const q = makeQuestion(
    "MULTI_CHOICE",
    [
      { key: "A", text: "选项1", correct: true },
      { key: "B", text: "选项2", correct: true },
      { key: "C", text: "选项3" },
    ],
    ["A", "B"]
  );
  const r = gradeQuestion(q, ["A", "B"]);
  assert.equal(r.isCorrect, true);
  assert.equal(r.partialScore, 1);
});

test("漏选 → isCorrect=false, score=0.5（部分对）", () => {
  const q = makeQuestion(
    "MULTI_CHOICE",
    [
      { key: "A", text: "选项1", correct: true },
      { key: "B", text: "选项2", correct: true },
      { key: "C", text: "选项3" },
    ],
    ["A", "B"]
  );
  const r = gradeQuestion(q, ["A"]);
  assert.equal(r.isCorrect, false);
  assert.ok(r.partialScore > 0 && r.partialScore < 1, `score 应在 0-1 之间，实际 ${r.partialScore}`);
});

test("错选 → isCorrect=false, score=0", () => {
  const q = makeQuestion(
    "MULTI_CHOICE",
    [
      { key: "A", text: "选项1", correct: true },
      { key: "B", text: "选项2", correct: true },
      { key: "C", text: "选项3" },
    ],
    ["A", "B"]
  );
  const r = gradeQuestion(q, ["A", "C"]);
  assert.equal(r.isCorrect, false);
  assert.equal(r.partialScore, 0);
});

// ========== 判断题 ==========
console.log("\n判断题");

test("正确 → isCorrect=true", () => {
  const q = makeQuestion("TRUE_FALSE", [], [true]);
  const r = gradeQuestion(q, [true]);
  assert.equal(r.isCorrect, true);
});

test("错误 → isCorrect=false", () => {
  const q = makeQuestion("TRUE_FALSE", [], [true]);
  const r = gradeQuestion(q, [false]);
  assert.equal(r.isCorrect, false);
});

test("字符串 'true' ↔ boolean true 等价", () => {
  const q = makeQuestion("TRUE_FALSE", [], [true]);
  const r = gradeQuestion(q, ["true"]);
  assert.equal(r.isCorrect, true);
});

// ========== 填空题 ==========
console.log("\n填空题");

test("单空完全匹配 → isCorrect=true", () => {
  const q = makeQuestion(
    "FILL_BLANK",
    [{ key: "1", answer: "北京" }],
    ["北京"]
  );
  const r = gradeQuestion(q, ["北京"]);
  assert.equal(r.isCorrect, true);
});

test("单空大小写不敏感", () => {
  const q = makeQuestion(
    "FILL_BLANK",
    [{ key: "1", answer: "Beijing" }],
    ["Beijing"]
  );
  const r = gradeQuestion(q, ["beijing"]);
  assert.equal(r.isCorrect, true);
});

test("单空全角半角等价（， vs ,）", () => {
  const q = makeQuestion(
    "FILL_BLANK",
    [{ key: "1", answer: "1,000" }],
    ["1,000"]
  );
  const r = gradeQuestion(q, ["1，000"]);
  assert.equal(r.isCorrect, true);
});

test("| 分隔的等价答案", () => {
  const q = makeQuestion(
    "FILL_BLANK",
    [{ key: "1", answer: "北京|Beijing|首都" }],
    ["北京"]
  );
  const r1 = gradeQuestion(q, ["Beijing"]);
  const r2 = gradeQuestion(q, ["首都"]);
  const r3 = gradeQuestion(q, ["上海"]);
  assert.equal(r1.isCorrect, true);
  assert.equal(r2.isCorrect, true);
  assert.equal(r3.isCorrect, false);
});

test("多空部分对 → score 介于 0-1", () => {
  const q = makeQuestion(
    "FILL_BLANK",
    [
      { key: "1", answer: "北京" },
      { key: "2", answer: "上海" },
    ],
    ["北京", "上海"]
  );
  const r = gradeQuestion(q, ["北京", "广州"]);
  assert.equal(r.isCorrect, false);
  assert.ok(r.partialScore > 0 && r.partialScore < 1);
});

// 汇总
console.log(`\n判分逻辑：${passed} 通过 / ${failed} 失败 / ${passed + failed} 总计`);
if (failed > 0) process.exit(1);
