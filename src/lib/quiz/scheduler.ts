// 学习队列构建器：从 ReviewItem 表生成每日学习/复习队列
// 设计：
//   1. 取到期复习卡（dueAt <= now，state != NEW），按 dueAt 升序
//   2. 取新卡（state == NEW），按 position 升序，限制数量 = bank.newCardsPerDay
//   3. 综合排序：复习优先 → 新卡（穿插）
//   4. 支持单题库 / 全题库 / 仅错题 三种范围

import { prisma } from "@/lib/prisma";
import type { Question, QuestionBank, ReviewItem } from "@prisma/client";

export interface QueueItem {
  reviewItem: ReviewItem;
  question: Question;
  bank: QuestionBank;
  isNew: boolean;
}

export interface QueueStats {
  dueCount: number;      // 到期复习数
  newCount: number;      // 本日新卡配额
  totalCount: number;    // 队列总长
}

// 取今日学习队列
export async function buildStudyQueue(opts: {
  userId: string;
  bankId?: string;       // 指定题库；不传则全题库
  mode?: "LEARN" | "REVIEW_ONLY" | "WRONG_REDO";
  limit?: number;        // 总条数上限，默认 200
}): Promise<{ items: QueueItem[]; stats: QueueStats }> {
  const { userId, bankId, mode = "LEARN", limit = 200 } = opts;
  const now = new Date();

  // 基础 where：本用户、未软删、未被埋/暂停
  const baseWhere = {
    userId,
    isBuried: false,
    isSuspended: false,
    question: { isDisabled: false },
    ...(bankId ? { bankId } : {}),
  };

  // 错题重做：只取 lapses > 0 的卡
  if (mode === "WRONG_REDO") {
    const items = await prisma.reviewItem.findMany({
      where: { ...baseWhere, lapses: { gt: 0 } },
      include: { question: true, bank: true },
      orderBy: [{ lastErrorAt: "desc" }, { updatedAt: "desc" }],
      take: limit,
    });
    return {
      items: items.map((ri) => ({
        reviewItem: ri,
        question: ri.question,
        bank: ri.bank,
        isNew: false,
      })),
      stats: { dueCount: items.length, newCount: 0, totalCount: items.length },
    };
  }

  // 1. 到期复习卡
  const dueItems = await prisma.reviewItem.findMany({
    where: {
      ...baseWhere,
      state: { in: ["REVIEW", "RELEARNING", "LEARNING"] },
      dueAt: { lte: now },
    },
    include: { question: true, bank: true },
    orderBy: [{ dueAt: "asc" }],
    take: limit,
  });

  // REVIEW_ONLY 模式：只返回到期复习卡
  if (mode === "REVIEW_ONLY") {
    return {
      items: dueItems.map((ri) => ({
        reviewItem: ri,
        question: ri.question,
        bank: ri.bank,
        isNew: false,
      })),
      stats: {
        dueCount: dueItems.length,
        newCount: 0,
        totalCount: dueItems.length,
      },
    };
  }

  // 2. 新卡（按题库 dailyNewCardsPerDay 限制）
  // 简化实现：取所有 NEW 卡，按 bank 分组计数；总上限 = limit - dueCount
  const newCardBudget = Math.max(0, limit - dueItems.length);
  let newItems: Array<ReviewItem & { question: Question; bank: QuestionBank }> = [];
  if (newCardBudget > 0) {
    // 取本用户各题库的 newCardsPerDay 配额
    const banks = await prisma.questionBank.findMany({
      where: { userId, ...(bankId ? { id: bankId } : {}) },
      select: { id: true, newCardsPerDay: true },
    });
    const bankBudget = new Map(banks.map((b) => [b.id, b.newCardsPerDay]));

    // 一次性查所有新卡，再按题库切分（避免 N 次 SQL）
    const allNew = await prisma.reviewItem.findMany({
      where: { ...baseWhere, state: "NEW" },
      include: { question: true, bank: true },
      orderBy: [{ bankId: "asc" }, { question: { position: "asc" } }],
      take: limit * 2, // 多取一些防止分桶后不足
    });

    const perBankCount = new Map<string, number>();
    newItems = [];
    for (const ri of allNew) {
      const used = perBankCount.get(ri.bankId) ?? 0;
      const cap = bankBudget.get(ri.bankId) ?? 20;
      if (used >= cap) continue;
      perBankCount.set(ri.bankId, used + 1);
      newItems.push(ri);
      if (newItems.length >= newCardBudget) break;
    }
  }

  // 3. 综合：复习优先 → 新卡
  const items: QueueItem[] = [
    ...dueItems.map((ri) => ({
      reviewItem: ri,
      question: ri.question,
      bank: ri.bank,
      isNew: false,
    })),
    ...newItems.map((ri) => ({
      reviewItem: ri,
      question: ri.question,
      bank: ri.bank,
      isNew: true,
    })),
  ];

  return {
    items,
    stats: {
      dueCount: dueItems.length,
      newCount: newItems.length,
      totalCount: items.length,
    },
  };
}
