// FSRS 间隔重复算法封装
// 文档：https://github.com/open-spaced-repetition/ts-fsrs
// 设计：每用户每题一行 ReviewItem，承载 ts-fsrs Card 状态

import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card,
  type FSRSParameters,
  type Grade,
  type RecordLogItem,
  type ReviewLog,
  type Steps,
  Rating,
  State,
} from "ts-fsrs";
import type { Prisma } from "@prisma/client";

// FSRS-6 默认 21 个权重（来自 awesome-fsrs wiki）
// 优化器在用户满 1000 条复习后可覆盖
export const FSRS6_DEFAULT_W: number[] = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001,
  1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014,
  1.8729, 0.5425, 0.0912, 0.0658, 0.1542,
];

// 默认学习步骤：1 分钟 → 10 分钟（Anki 经典 graduation）
// 类型必须为模板字面量 `${number}m` / `${number}h` / `${number}d`
const DEFAULT_LEARNING_STEPS = ["1m", "10m"] as unknown as Steps;
const DEFAULT_RELEARNING_STEPS = ["10m"] as unknown as Steps;

// 构造调度器参数（可由用户级 FsrsParams 覆盖）
export function buildParameters(overrides?: Partial<FSRSParameters>): FSRSParameters {
  return generatorParameters({
    request_retention: 0.9,
    maximum_interval: 36500,
    enable_fuzz: true,
    enable_short_term: true,
    learning_steps: DEFAULT_LEARNING_STEPS,
    relearning_steps: DEFAULT_RELEARNING_STEPS,
    w: FSRS6_DEFAULT_W,
    ...overrides,
  });
}

// 调度器实例（默认参数；用户级参数请用 buildScheduler(params)）
export function buildScheduler(params?: Partial<FSRSParameters>) {
  return fsrs(buildParameters(params));
}

// Prisma ReviewItem 行 → ts-fsrs Card（用于评分计算前）
export function dbRowToCard(item: {
  state: State;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  scheduledDays: number;
  elapsedDays: number;
  dueAt: Date;
  lastReviewAt: Date | null;
}): Card {
  return {
    due: item.dueAt,
    stability: item.stability,
    difficulty: item.difficulty,
    elapsed_days: item.elapsedDays,
    scheduled_days: item.scheduledDays,
    reps: item.reps,
    lapses: item.lapses,
    state: item.state,
    last_review: item.lastReviewAt ?? undefined,
  } as Card;
}

// ts-fsrs Card → Prisma 更新数据（评分后写回）
export function cardToDbUpdate(card: Card): Prisma.ReviewItemUpdateInput {
  return {
    state: card.state as unknown as Prisma.ReviewItemUpdateInput["state"],
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses,
    scheduledDays: card.scheduled_days,
    elapsedDays: card.elapsed_days,
    dueAt: card.due,
    lastReviewAt: card.last_review ?? null,
  };
}

// 评分：输入旧 Card + Grade（Rating 中除 Manual 外的值），返回新 Card 与 ReviewLog
export function gradeCard(
  prev: Card,
  rating: Grade,
  now: Date = new Date()
): RecordLogItem {
  const scheduler = buildScheduler();
  return scheduler.next(prev, now, rating);
}

// 预览 4 个评分各自会得到的间隔（用于 UI 按钮下方显示）
export function previewIntervals(prev: Card, now: Date = new Date()): {
  again: number;
  hard: number;
  good: number;
  easy: number;
} {
  const scheduler = buildScheduler();
  const repeat = scheduler.repeat(prev, now);
  return {
    again: repeat[Rating.Again].card.scheduled_days,
    hard: repeat[Rating.Hard].card.scheduled_days,
    good: repeat[Rating.Good].card.scheduled_days,
    easy: repeat[Rating.Easy].card.scheduled_days,
  };
}

// 把"间隔天数"格式化为人类可读字符串（按钮下方显示）
export function formatInterval(days: number): string {
  if (days < 1 / 1440) return "<1m";
  if (days < 1 / 24) return `${Math.round(days * 1440)}m`;
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 7)}w`;
  if (days < 365 * 2) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

// 判分得分率 → Grade 映射（用于多选/填空部分对场景；不含 Manual）
export function scoreToRating(score: number): Grade {
  if (score < 0.6) return Rating.Again;
  if (score < 0.85) return Rating.Hard;
  if (score < 0.95) return Rating.Good;
  return Rating.Easy;
}

// 创建空卡（首次进入题库时调用）
export function newCard(now: Date = new Date()): Card {
  return createEmptyCard(now);
}

// 重新导出常用类型与枚举，便于业务层使用
export { Rating, State, createEmptyCard };
export type { Card, FSRSParameters, Grade, RecordLogItem, ReviewLog };
