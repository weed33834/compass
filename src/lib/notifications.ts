// 通知调度模块
// 职责：批量检查用户通知触发条件（复习到期、连续天数预警等），生成通知记录
// 触发时机：每次用户登录后 / 完成答题会话后 调用 scanAndNotify()
//
// 设计要点：
// - 全内存运算，不依赖外部队列（单实例足够；多实例通过 Cron Vercel / pg_cron 触发）
// - 每人每天每种通知类型最多一条（通过 DB unique check 实现幂等）
// - 批量入库，不逐条 insert

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type NotifyReason = "review_due" | "streak_alert" | "plan_overdue";

interface PendingNotification {
  userId: string;
  type: "review_due" | "streak_alert" | "system";
  title: string;
  body: string;
  link?: string;
}

// 扫描指定用户的到期复习卡，超过阈值时生成通知
async function scanReviewDue(userId: string): Promise<PendingNotification[]> {
  const dueCount = await prisma.reviewItem.count({
    where: {
      userId,
      dueAt: { lte: new Date() },
      isBuried: false,
      isSuspended: false,
      state: { in: ["REVIEW", "RELEARNING", "LEARNING", "NEW"] },
    },
  });

  const notifications: PendingNotification[] = [];
  if (dueCount >= 50) {
    notifications.push({
      userId,
      type: "review_due",
      title: "大量卡片待复习",
      body: `你有 ${dueCount} 张卡片已到期，建议尽快复习以保持记忆效果。`,
      link: "/compass",
    });
  }

  return notifications;
}

// 扫描用户最近 48 小时内是否答题，若未答题则生成中断预警
async function scanStreakAlert(userId: string): Promise<PendingNotification[]> {
  const latestLog = await prisma.reviewLog.findFirst({
    where: { userId },
    orderBy: { reviewedAt: "desc" },
    select: { reviewedAt: true },
  });

  const notifications: PendingNotification[] = [];
  if (!latestLog) return notifications;

  const hoursSinceLastReview =
    (Date.now() - latestLog.reviewedAt.getTime()) / (60 * 60 * 1000);

  if (hoursSinceLastReview >= 40 && hoursSinceLastReview < 72) {
    notifications.push({
      userId,
      type: "streak_alert",
      title: "连续答题即将中断",
      body: "你已经接近 2 天没答题了，再不动手连续记录就会断掉。",
      link: "/compass",
    });
  }

  return notifications;
}

// 扫描活跃学习计划，检查今日应完成但尚未完成的计划
async function scanPlanOverdue(userId: string): Promise<PendingNotification[]> {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const activePlans = await prisma.learningPlan.findMany({
    where: { userId, status: "ACTIVE" },
    select: { id: true, title: true, endDate: true },
  });

  const notifications: PendingNotification[] = [];

  for (const plan of activePlans) {
    // 距离结束日期 ≤3 天且今日尚未完成计划学习量
    const daysLeft = Math.ceil(
      (plan.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );
    if (daysLeft <= 3 && daysLeft > 0) {
      const todayAnswers = await prisma.answerRecord.count({
        where: {
          userId,
          createdAt: { gte: startOfToday },
        },
      });
      if (todayAnswers === 0) {
        notifications.push({
          userId,
          type: "system",
          title: `学习计划"${plan.title}"即将到期`,
          body: `距离截止还剩 ${daysLeft} 天，今天还没有答题记录。`,
          link: "/compass",
        });
      }
    }
  }

  return notifications;
}

// 主入口：全量扫描并入库（幂等：每人每类型每天最多一条）
export async function scanAndNotify(userId: string): Promise<number> {
  try {
    const results = await Promise.all([
      scanReviewDue(userId),
      scanStreakAlert(userId),
      scanPlanOverdue(userId),
    ]);

    const allPending = results.flat();

    if (allPending.length === 0) return 0;

    // 批量入库：已存在的跳过
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const existing = await prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gte: startOfToday },
      },
      select: { type: true },
    });
    const existingTypes = new Set(existing.map((n) => n.type));

    const toCreate = allPending.filter((n) => !existingTypes.has(n.type));

    if (toCreate.length === 0) return 0;

    await prisma.notification.createMany({ data: toCreate });

    logger.info(
      { userId, count: toCreate.length, types: toCreate.map((n) => n.type) },
      "notifications created"
    );

    return toCreate.length;
  } catch (err) {
    logger.error({ err, userId }, "scanAndNotify failed");
    return 0;
  }
}

// 获取用户未读通知列表
export async function getUnreadNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// 标记通知为已读
export async function markNotificationRead(notificationId: string, userId: string) {
  const n = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!n) return null;
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

// 标记全部已读
export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
