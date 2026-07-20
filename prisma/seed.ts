// Seed：插入演示用户 + 1 个示例题库（12 道题，覆盖 4 种题型）
// 幂等：若 email 已存在则跳过用户创建，仅清理并重建题库
//
// 运行：pnpm db:seed
//
// 演示账户：captain@compass.dev / Compass-Test-2026!

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "captain@compass.dev";
const DEMO_PASSWORD = "Compass-Test-2026!";
const DEMO_NAME = "航海者";

// 12 道示例题（覆盖 4 题型）
const QUESTIONS = [
  // === 单选题 ×3 ===
  {
    type: "SINGLE_CHOICE" as const,
    stem: "FSRS 算法中，\"记忆稳定性\"（Stability）的含义是？",
    options: [
      { key: "A", text: "卡片当前的可检索性概率", correct: false },
      { key: "B", text: "在不复习的情况下，记忆能保持的天数", correct: true },
      { key: "C", text: "卡片的难度系数（1-10）", correct: false },
      { key: "D", text: "已复习的次数", correct: false },
    ],
    answer: "B",
    explanation: "Stability 表示如果不再复习，记忆能维持的时间长度（天）。S 越大，记忆越牢固。",
    knowledgePoints: ["FSRS-核心概念", "Stability"],
    difficulty: 2.5,
    source: "FSRS-6 文档",
  },
  {
    type: "SINGLE_CHOICE" as const,
    stem: "下列哪个不是 FSRS-6 的 4 个评分等级？",
    options: [
      { key: "A", text: "Again（重来）", correct: false },
      { key: "B", text: "Hard（困难）", correct: false },
      { key: "C", text: "Good（良好）", correct: false },
      { key: "D", text: "Skip（跳过）", correct: true },
    ],
    answer: "D",
    explanation: "FSRS-6 使用 Again / Hard / Good / Easy 四档（对应 Rating 1-4）。Skip 不是 FSRS 的评分等级。",
    knowledgePoints: ["FSRS-评分"],
    difficulty: 1.5,
  },
  {
    type: "SINGLE_CHOICE" as const,
    stem: "Compass 项目的视觉风格隐喻源自？",
    options: [
      { key: "A", text: "现代极简主义", correct: false },
      { key: "B", text: "深海航海仪器", correct: true },
      { key: "C", text: "日式和风", correct: false },
      { key: "D", text: "赛博朋克", correct: false },
    ],
    answer: "B",
    explanation: "Compass 以黄铜罗盘、漂流瓶、星图等航海仪器为美学隐喻，对应 abyss / ivory / brass / coral 色板。",
    knowledgePoints: ["Compass-设计"],
    difficulty: 1.0,
  },

  // === 多选题 ×3 ===
  {
    type: "MULTI_CHOICE" as const,
    stem: "下列哪些是 Compass 支持的题库导入格式？（多选）",
    options: [
      { key: "A", text: "Markdown (.md)", correct: true },
      { key: "B", text: "Excel (.xlsx)", correct: true },
      { key: "C", text: "Word (.docx)", correct: true },
      { key: "D", text: "PDF (.pdf)", correct: false },
    ],
    answer: ["A", "B", "C"],
    explanation: "V1 支持 .md / .txt / .xlsx / .xls / .csv / .docx。PDF 暂不支持。",
    knowledgePoints: ["Compass-导入", "V1-能力"],
    difficulty: 1.5,
  },
  {
    type: "MULTI_CHOICE" as const,
    stem: "关于 FSRS 的 DSR 模型，下列哪些说法正确？（多选）",
    options: [
      { key: "A", text: "D 代表 Difficulty（难度）", correct: true },
      { key: "B", text: "S 代表 Stability（稳定性）", correct: true },
      { key: "C", text: "R 代表 Retrievability（可检索性）", correct: true },
      { key: "D", text: "R 由 S 和经过时间直接计算得出", correct: true },
    ],
    answer: ["A", "B", "C", "D"],
    explanation: "DSR 三参数模型：D 是难度（1-10），S 是稳定性（天），R 是当前记忆保留率，由 R = exp(-t/S) 类公式计算。",
    knowledgePoints: ["FSRS-DSR模型"],
    difficulty: 3.5,
  },
  {
    type: "MULTI_CHOICE" as const,
    stem: "下列哪些属于 Compass 的核心模块？（多选）",
    options: [
      { key: "A", text: "答题舱 (Study)", correct: true },
      { key: "B", text: "造船工坊 (Workshop)", correct: true },
      { key: "C", text: "错题漂流瓶 (Wrongbook)", correct: true },
      { key: "D", text: "每日打卡 (Daily Check-in)", correct: false },
    ],
    answer: ["A", "B", "C"],
    explanation: "Compass V1 的 7 个核心模块：罗盘 / 答题舱 / 工坊 / 错题本 / 日志 / 分析 / 账户。打卡不在其中。",
    knowledgePoints: ["Compass-架构"],
    difficulty: 2.0,
  },

  // === 判断题 ×3 ===
  {
    type: "TRUE_FALSE" as const,
    stem: "FSRS-6 默认使用 21 个权重参数。",
    options: [
      { key: "T", text: "正确", correct: true },
      { key: "F", text: "错误", correct: false },
    ],
    answer: true,
    explanation: "FSRS-6 默认 21 个权重，可通过优化器在用户满 1000 条复习后重新训练。",
    knowledgePoints: ["FSRS-权重"],
    difficulty: 2.0,
  },
  {
    type: "TRUE_FALSE" as const,
    stem: "Compass 的两阶段提交中，/api/study/grade 会写入 ReviewLog。",
    options: [
      { key: "T", text: "正确", correct: false },
      { key: "F", text: "错误", correct: true },
    ],
    answer: false,
    explanation: "grade 阶段只写 AnswerRecord 不动 FSRS；ReviewLog 在 apply 阶段写入。这样设计避免用户覆盖评分时重复调度 FSRS。",
    knowledgePoints: ["Compass-API", "两阶段提交"],
    difficulty: 3.0,
  },
  {
    type: "TRUE_FALSE" as const,
    stem: "多选题漏选时，Compass 给 0 分。",
    options: [
      { key: "T", text: "正确", correct: false },
      { key: "F", text: "错误", correct: true },
    ],
    answer: false,
    explanation: "漏选给部分分：0.5 + (已选正确数 / 应选正确数) * 0.5，上限 0.99。只有错选才给 0 分。",
    knowledgePoints: ["Compass-判分", "多选题"],
    difficulty: 2.5,
  },

  // === 填空题 ×3 ===
  {
    type: "FILL_BLANK" as const,
    stem: "FSRS 中，记忆保留率 R 的计算基于 ____ 公式（指数衰减）。",
    options: [{ key: "1", answer: "R=exp(-t/S)|exp(-elapsed_days/S)| forgetting curve" }],
    answer: ["R=exp(-t/S)|exp(-elapsed_days/S)|forgetting curve"],
    explanation: "R = exp(-t/S)，其中 t 是自上次复习以来的天数，S 是稳定性。也称为 forgetting curve（遗忘曲线）。",
    knowledgePoints: ["FSRS-公式", "R"],
    difficulty: 3.5,
  },
  {
    type: "FILL_BLANK" as const,
    stem: "Compass 的 4 键评分快捷键分别是 1/2/3/4，对应 ____ / 困难 / 良好 / 简单。",
    options: [{ key: "1", answer: "Again|again|重来" }],
    answer: ["Again|again|重来"],
    explanation: "1=Again（重来）、2=Hard（困难）、3=Good（良好）、4=Easy（简单）。",
    knowledgePoints: ["Compass-快捷键", "评分"],
    difficulty: 1.5,
  },
  {
    type: "FILL_BLANK" as const,
    stem: "Compass 默认目标记忆保留率是 ____（百分比），FSRS 默认学习步骤是 1 分钟到 ____ 分钟。",
    options: [
      { key: "1", answer: "90%|90|0.9" },
      { key: "2", answer: "10|十" },
    ],
    answer: ["90%|90|0.9", "10|十"],
    explanation: "request_retention = 0.9（90%）；learning_steps = [1m, 10m]。",
    knowledgePoints: ["FSRS-默认参数", "Compass-配置"],
    difficulty: 2.5,
  },
];

async function main() {
  console.log("Seeding Compass V1 demo data...");

  // 1. 创建或复用 demo 用户
  let user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    user = await prisma.user.create({
      data: {
        email: DEMO_EMAIL,
        name: DEMO_NAME,
        passwordHash,
        theme: "deep-sea",
        locale: "zh-CN",
      },
    });
    console.log(`  ✓ Created demo user: ${user.email}`);
  } else {
    console.log(`  • Demo user already exists: ${user.email}`);
  }

  // 2. 清理旧的 seed 题库（按 sourceRef 标记）
  const oldSeedBanks = await prisma.questionBank.findMany({
    where: { userId: user.id, sourceRef: "seed-v1-demo" },
    select: { id: true },
  });
  if (oldSeedBanks.length > 0) {
    await prisma.questionBank.deleteMany({
      where: { id: { in: oldSeedBanks.map((b) => b.id) } },
    });
    console.log(`  • Removed ${oldSeedBanks.length} old seed bank(s)`);
  }

  // 3. 创建示例题库（事务：bank + questions + reviewItems）
  const result = await prisma.$transaction(async (tx) => {
    const bank = await tx.questionBank.create({
      data: {
        userId: user!.id,
        name: "FSRS 与 Compass 知识小测",
        description: "覆盖 FSRS-6 核心概念、DSR 模型、Compass V1 功能与判分规则，共 12 题。",
        coverColor: "brass",
        tags: ["FSRS", "Compass", "示例"],
        visibility: "PRIVATE",
        source: "MANUAL",
        sourceRef: "seed-v1-demo",
        fsrsEnabled: true,
        desiredRetention: 0.9,
        newCardsPerDay: 20,
        maxReviewsPerDay: 200,
      },
    });

    const questionsData = QUESTIONS.map((q, idx) => ({
      bankId: bank.id,
      type: q.type,
      stem: q.stem,
      options: q.options as never,
      answer: q.answer as never,
      explanation: q.explanation,
      knowledgePoints: q.knowledgePoints,
      difficulty: q.difficulty,
      source: q.source ?? "seed",
      position: idx,
    }));
    await tx.question.createMany({ data: questionsData });

    const inserted = await tx.question.findMany({
      where: { bankId: bank.id },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    await tx.reviewItem.createMany({
      data: inserted.map((q) => ({
        userId: user!.id,
        questionId: q.id,
        bankId: bank.id,
        state: "NEW" as const,
        dueAt: new Date(),
      })),
    });

    await tx.questionBank.update({
      where: { id: bank.id },
      data: { totalQuestions: inserted.length },
    });

    return { bank, count: inserted.length };
  });

  console.log(`  ✓ Created bank "${result.bank.name}" with ${result.count} questions`);

  // 4. 写入用户级 FSRS 默认参数（可选）
  const existingParams = await prisma.fsrsParams.findUnique({
    where: { userId: user.id },
  });
  if (!existingParams) {
    await prisma.fsrsParams.create({
      data: {
        userId: user.id,
        w: [
          0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001,
          1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014,
          1.8729, 0.5425, 0.0912, 0.0658, 0.1542,
        ],
        requestRetention: 0.9,
        maximumInterval: 36500,
        enableFuzz: true,
        enableShortTerm: true,
      },
    });
    console.log(`  ✓ Created FSRS default params for user`);
  }

  console.log("\nSeed complete.");
  console.log(`  Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
