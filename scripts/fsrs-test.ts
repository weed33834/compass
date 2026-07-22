// FSRS 状态映射单元测试（验证 C-1 修复）
// 运行：pnpm test:fsrs
import { strict as assert } from "node:assert";
import { State } from "ts-fsrs";
import {
  statePrismaToTs,
  stateTsToPrisma,
  dbRowToCard,
  cardToDbUpdate,
  gradeCard,
  previewIntervals,
  formatInterval,
  scoreToRating,
  newCard,
  Rating,
} from "@/lib/fsrs";

let passed = 0;
let failed = 0;

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

console.log("\nPrisma ↔ ts-fsrs State 映射（C-1 修复）");

test("statePrismaToTs('NEW') === State.New (0)", () => {
  assert.equal(statePrismaToTs("NEW"), State.New);
  assert.equal(statePrismaToTs("NEW"), 0);
});

test("statePrismaToTs('LEARNING') === State.Learning (1)", () => {
  assert.equal(statePrismaToTs("LEARNING"), State.Learning);
  assert.equal(statePrismaToTs("LEARNING"), 1);
});

test("statePrismaToTs('REVIEW') === State.Review (2)", () => {
  assert.equal(statePrismaToTs("REVIEW"), State.Review);
  assert.equal(statePrismaToTs("REVIEW"), 2);
});

test("statePrismaToTs('RELEARNING') === State.Relearning (3)", () => {
  assert.equal(statePrismaToTs("RELEARNING"), State.Relearning);
  assert.equal(statePrismaToTs("RELEARNING"), 3);
});

test("statePrismaToTs 未知字符串兜底为 NEW", () => {
  assert.equal(statePrismaToTs("UNKNOWN"), State.New);
  assert.equal(statePrismaToTs(""), State.New);
});

test("stateTsToPrisma(State.New) === 'NEW'", () => {
  assert.equal(stateTsToPrisma(State.New), "NEW");
});

test("stateTsToPrisma(State.Review) === 'REVIEW'", () => {
  assert.equal(stateTsToPrisma(State.Review), "REVIEW");
});

test("statePrismaToTs ↔ stateTsToPrisma 双向一致", () => {
  const states: Array<"NEW" | "LEARNING" | "REVIEW" | "RELEARNING"> = ["NEW", "LEARNING", "REVIEW", "RELEARNING"];
  for (const s of states) {
    const ts = statePrismaToTs(s);
    const back = stateTsToPrisma(ts);
    assert.equal(back, s, `往返不一致：${s} → ${ts} → ${back}`);
  }
});

console.log("\ndbRowToCard 正确转换 Prisma 字符串 state");

test("dbRowToCard 接受字符串 state，输出 ts-fsrs Card 数字 state", () => {
  const card = dbRowToCard({
    state: "REVIEW",
    stability: 5.0,
    difficulty: 5.0,
    reps: 3,
    lapses: 1,
    scheduledDays: 7,
    elapsedDays: 6,
    dueAt: new Date(),
    lastReviewAt: new Date(),
  });
  assert.equal(card.state, State.Review);
  assert.equal(card.state, 2);
  assert.equal(card.stability, 5.0);
  assert.equal(card.reps, 3);
});

test("dbRowToCard 对 NEW 卡返回 state=0（关键：原 bug 是返回字符串 'NEW'）", () => {
  const card = dbRowToCard({
    state: "NEW",
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    scheduledDays: 0,
    elapsedDays: 0,
    dueAt: new Date(),
    lastReviewAt: null,
  });
  // 关键断言：必须是数字 0，不能是字符串 "NEW"
  assert.equal(typeof card.state, "number");
  assert.equal(card.state, 0);
  assert.equal(card.state, State.New);
});

console.log("\ngradeCard 调度验证");

test("NEW 卡 gradeCard(Again) 返回有效 Card", () => {
  const card = newCard();
  const result = gradeCard(card, Rating.Again);
  assert.ok(result.card, "应返回 card");
  assert.ok(result.card.due instanceof Date, "due 应为 Date");
  assert.ok(result.card.stability >= 0, "stability 应 >= 0");
});

test("NEW 卡 gradeCard(Good) 后 state 应为 LEARNING 或 REVIEW", () => {
  const card = newCard();
  const result = gradeCard(card, Rating.Good);
  // Good 评分后 NEW 卡应进入 LEARNING 或直接 REVIEW
  const newState = result.card.state;
  assert.ok(
    newState === State.Learning || newState === State.Review,
    `Good 评分后 state 应为 LEARNING(${State.Learning}) 或 REVIEW(${State.Review})，实际 ${newState}`
  );
});

test("previewIntervals 返回 4 个有效间隔", () => {
  const card = newCard();
  const previews = previewIntervals(card);
  assert.ok(typeof previews.again === "number");
  assert.ok(typeof previews.hard === "number");
  assert.ok(typeof previews.good === "number");
  assert.ok(typeof previews.easy === "number");
  // EASY 间隔应 >= GOOD 间隔 >= HARD 间隔 >= AGAIN 间隔
  assert.ok(previews.easy >= previews.good, "easy 应 >= good");
  assert.ok(previews.good >= previews.hard, "good 应 >= hard");
});

console.log("\nformatInterval 格式化");

test("<1m / 分钟 / 小时 / 天 / 周 / 月 / 年", () => {
  assert.equal(formatInterval(0), "<1m");
  assert.equal(formatInterval(1 / 1440), "1m");
  assert.equal(formatInterval(1 / 24), "1h");
  assert.equal(formatInterval(1), "1d");
  assert.equal(formatInterval(30), "4w");
  assert.equal(formatInterval(365), "12mo");
  assert.equal(formatInterval(730), "2.0y");
});

console.log("\nscoreToRating 映射");

test("score < 0.6 → Again", () => {
  assert.equal(scoreToRating(0), Rating.Again);
  assert.equal(scoreToRating(0.59), Rating.Again);
});

test("0.6 <= score < 0.85 → Hard", () => {
  assert.equal(scoreToRating(0.6), Rating.Hard);
  assert.equal(scoreToRating(0.84), Rating.Hard);
});

test("0.85 <= score < 0.95 → Good", () => {
  assert.equal(scoreToRating(0.85), Rating.Good);
  assert.equal(scoreToRating(0.94), Rating.Good);
});

test("score >= 0.95 → Easy", () => {
  assert.equal(scoreToRating(0.95), Rating.Easy);
  assert.equal(scoreToRating(1), Rating.Easy);
});

console.log("\ncardToDbUpdate 反向转换");

test("cardToDbUpdate 输出 Prisma 字符串 state", () => {
  const card = newCard();
  const result = gradeCard(card, Rating.Good);
  const update = cardToDbUpdate(result.card);
  assert.equal(typeof update.state, "string");
  assert.ok(
    ["NEW", "LEARNING", "REVIEW", "RELEARNING"].includes(update.state as string),
    `state 应为 Prisma 字符串，实际 ${update.state}`
  );
});

// 汇总
console.log(`\nFSRS 状态映射：${passed} 通过 / ${failed} 失败 / ${passed + failed} 总计`);
if (failed > 0) process.exit(1);
