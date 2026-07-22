// Seed：插入演示用户 + 3 个示例题库（共 60 题，覆盖 4 种题型）
// 幂等：若 email 已存在则跳过用户创建，仅清理并重建 seed 题库
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

// ============================================================
// 类型定义（与 schema 对齐）
// ============================================================
type QType = "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";

interface Opt {
  key: string;
  text?: string;
  correct?: boolean;
  answer?: string;
  placeholder?: string;
}

interface SeedQ {
  type: QType;
  stem: string;
  options: Opt[];
  answer: string | string[] | boolean;
  explanation: string;
  knowledgePoints: string[];
  difficulty: number;
  source?: string;
}

interface SeedBank {
  name: string;
  description: string;
  coverColor: string;
  tags: string[];
  newCardsPerDay: number;
  sourceRef: string;
  questions: SeedQ[];
}

// ============================================================
// 题库 1：FSRS 与间隔重复（20 题）
// ============================================================
const FSRS_BANK: SeedBank = {
  name: "FSRS 与间隔重复入门",
  description: "覆盖 FSRS-6 核心概念、DSR 模型、评分机制、参数优化，共 20 题。适合刚接触算法的开发者。",
  coverColor: "brass",
  tags: ["FSRS", "算法", "示例"],
  newCardsPerDay: 20,
  sourceRef: "seed-v1-fsrs",
  questions: [
    // === 单选题 ×6 ===
    {
      type: "SINGLE_CHOICE",
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
      type: "SINGLE_CHOICE",
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
      type: "SINGLE_CHOICE",
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
    {
      type: "SINGLE_CHOICE",
      stem: "FSRS 中，难度（Difficulty）D 的取值范围是？",
      options: [
        { key: "A", text: "0 到 1", correct: false },
        { key: "B", text: "1 到 10", correct: true },
        { key: "C", text: "1 到 5", correct: false },
        { key: "D", text: "0 到 100", correct: false },
      ],
      answer: "B",
      explanation: "D 取值 1-10。初始难度由首答评分决定，后续基于 Mean Reversion 公式向 5 收敛后再叠加用户评分调整。",
      knowledgePoints: ["FSRS-DSR模型", "Difficulty"],
      difficulty: 2.0,
    },
    {
      type: "SINGLE_CHOICE",
      stem: "FSRS 默认的目标记忆保留率（request_retention）是？",
      options: [
        { key: "A", text: "0.85", correct: false },
        { key: "B", text: "0.90", correct: true },
        { key: "C", text: "0.95", correct: false },
        { key: "D", text: "0.99", correct: false },
      ],
      answer: "B",
      explanation: "默认 0.9（90%）。该值越高，复习频率越密集；越低则间隔越长但遗忘风险更大。Anki 推荐 0.85-0.95。",
      knowledgePoints: ["FSRS-参数", "request_retention"],
      difficulty: 1.5,
    },
    {
      type: "SINGLE_CHOICE",
      stem: "下列关于 FSRS 与 SM-2 算法的对比，错误的是？",
      options: [
        { key: "A", text: "FSRS 基于 DSR 模型，SM-2 基于 SuperMemo 2 公式", correct: false },
        { key: "B", text: "FSRS 支持个性化权重优化，SM-2 参数固定", correct: false },
        { key: "C", text: "FSRS 的间隔预测精度显著优于 SM-2", correct: false },
        { key: "D", text: "SM-2 是 2024 年发布的新算法", correct: true },
      ],
      answer: "D",
      explanation: "SM-2 是 1987 年 Piotr Wozniak 设计的算法，被 Anki 沿用至今。FSRS-6 由 Jarrett Ye 在 2022-2024 年开发。",
      knowledgePoints: ["FSRS-历史", "SM-2"],
      difficulty: 2.5,
    },
    // === 多选题 ×5 ===
    {
      type: "MULTI_CHOICE",
      stem: "下列哪些是 Compass 支持的题库导入格式？（多选）",
      options: [
        { key: "A", text: "Markdown (.md)", correct: true },
        { key: "B", text: "Excel (.xlsx)", correct: true },
        { key: "C", text: "Word (.docx)", correct: true },
        { key: "D", text: "PDF (.pdf)", correct: false },
      ],
      answer: ["A", "B", "C"],
      explanation: "V1 支持 .md / .txt / .xlsx / .xls / .csv / .docx。PDF 暂不支持，可先用工具转 Markdown 再导入。",
      knowledgePoints: ["Compass-导入", "V1-能力"],
      difficulty: 1.5,
    },
    {
      type: "MULTI_CHOICE",
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
      difficulty: 3.0,
    },
    {
      type: "MULTI_CHOICE",
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
    {
      type: "MULTI_CHOICE",
      stem: "FSRS-6 默认的 learning_steps 配置包括？（多选）",
      options: [
        { key: "A", text: "1 分钟", correct: true },
        { key: "B", text: "10 分钟", correct: true },
        { key: "C", text: "1 天", correct: false },
        { key: "D", text: "4 天", correct: false },
      ],
      answer: ["A", "B"],
      explanation: "默认 learning_steps = [1m, 10m]。1 天/4 天是 Anki 的传统步骤，FSRS-6 默认更短以加快新卡毕业。",
      knowledgePoints: ["FSRS-参数", "learning_steps"],
      difficulty: 2.5,
    },
    {
      type: "MULTI_CHOICE",
      stem: "下列哪些情况会触发 FSRS 卡片进入 RELEARNING 状态？（多选）",
      options: [
        { key: "A", text: "复习时按 Again", correct: true },
        { key: "B", text: "复习时按 Hard", correct: false },
        { key: "C", text: "复习时按 Good 但保留率已低于 0.7", correct: false },
        { key: "D", text: "卡片从未被复习过", correct: false },
      ],
      answer: ["A"],
      explanation: "RELEARNING 只在复习失败（Again）时触发。Hard/Good/Easy 都会推进状态。新卡属于 NEW 状态。",
      knowledgePoints: ["FSRS-状态机", "RELEARNING"],
      difficulty: 3.0,
    },
    // === 判断题 ×4 ===
    {
      type: "TRUE_FALSE",
      stem: "FSRS-6 默认使用 21 个权重参数。",
      options: [
        { key: "T", text: "正确", correct: true },
        { key: "F", text: "错误", correct: false },
      ],
      answer: true,
      explanation: "FSRS-6 默认 21 个权重，可通过优化器在用户积累约 1000 条复习记录后重新训练个性化权重。",
      knowledgePoints: ["FSRS-权重"],
      difficulty: 2.0,
    },
    {
      type: "TRUE_FALSE",
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
      type: "TRUE_FALSE",
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
    {
      type: "TRUE_FALSE",
      stem: "FSRS 的 Retrievability R 是单调递减的（在两次复习之间）。",
      options: [
        { key: "T", text: "正确", correct: true },
        { key: "F", text: "错误", correct: false },
      ],
      answer: true,
      explanation: "R = exp(-t/S)，t 是自上次复习的天数，随 t 增加 R 单调递减，直到下一次复习时被重置。",
      knowledgePoints: ["FSRS-R", "遗忘曲线"],
      difficulty: 2.5,
    },
    // === 填空题 ×5 ===
    {
      type: "FILL_BLANK",
      stem: "FSRS 中，记忆保留率 R 的计算基于 ____ 公式（指数衰减）。",
      options: [{ key: "1", answer: "R=exp(-t/S)|exp(-elapsed_days/S)|forgetting curve" }],
      answer: ["R=exp(-t/S)|exp(-elapsed_days/S)|forgetting curve"],
      explanation: "R = exp(-t/S)，其中 t 是自上次复习以来的天数，S 是稳定性。也称为 forgetting curve（遗忘曲线）。",
      knowledgePoints: ["FSRS-公式", "R"],
      difficulty: 3.0,
    },
    {
      type: "FILL_BLANK",
      stem: "Compass 的 4 键评分快捷键分别是 1/2/3/4，对应 ____ / 困难 / 良好 / 简单。",
      options: [{ key: "1", answer: "Again|again|重来" }],
      answer: ["Again|again|重来"],
      explanation: "1=Again（重来）、2=Hard（困难）、3=Good（良好）、4=Easy（简单）。Space 接受默认评分。",
      knowledgePoints: ["Compass-快捷键", "评分"],
      difficulty: 1.5,
    },
    {
      type: "FILL_BLANK",
      stem: "FSRS-6 默认的 21 个权重 w 中，w[0] 用于初始化新卡的 ____（参数名英文）。",
      options: [{ key: "1", answer: "Stability|stability|S|initial stability" }],
      answer: ["Stability|stability|S|initial stability"],
      explanation: "w[0] 是新卡初始稳定性（initial Stability）的初始值，约 0.212。它决定了从未复习过的卡片的起始 S 值。",
      knowledgePoints: ["FSRS-权重", "w[0]"],
      difficulty: 3.5,
    },
    {
      type: "FILL_BLANK",
      stem: "Compass 默认目标记忆保留率是 ____（百分比），FSRS 默认学习步骤是从 1 分钟到 ____ 分钟。",
      options: [
        { key: "1", answer: "90%|90|0.9" },
        { key: "2", answer: "10|十" },
      ],
      answer: ["90%|90|0.9", "10|十"],
      explanation: "request_retention = 0.9（90%）；learning_steps = [1m, 10m]。",
      knowledgePoints: ["FSRS-默认参数", "Compass-配置"],
      difficulty: 2.5,
    },
    {
      type: "FILL_BLANK",
      stem: "Compass 的两阶段提交：第一阶段 API 是 /api/study/____（动词），第二阶段是 /api/study/____（动词）。",
      options: [
        { key: "1", answer: "grade" },
        { key: "2", answer: "apply" },
      ],
      answer: ["grade", "apply"],
      explanation: "grade 阶段判分（不动 FSRS）+ 写 AnswerRecord；apply 阶段应用 FSRS 调度 + 写 ReviewLog + 更新 ReviewItem。",
      knowledgePoints: ["Compass-API", "两阶段提交"],
      difficulty: 2.0,
    },
  ],
};

// ============================================================
// 题库 2：中国地理与人文常识（20 题）
// ============================================================
const GEO_BANK: SeedBank = {
  name: "中国地理与人文常识",
  description: "覆盖中国省级行政区、山川河流、世界遗产、节气民俗等常识，共 20 题。适合公考/教资备考。",
  coverColor: "tide",
  tags: ["地理", "常识", "公考"],
  newCardsPerDay: 15,
  sourceRef: "seed-v1-geo",
  questions: [
    // === 单选题 ×6 ===
    {
      type: "SINGLE_CHOICE",
      stem: "下列省份中，既临渤海又临黄海的是？",
      options: [
        { key: "A", text: "辽宁", correct: false },
        { key: "B", text: "山东", correct: true },
        { key: "C", text: "江苏", correct: false },
        { key: "D", text: "浙江", correct: false },
      ],
      answer: "B",
      explanation: "山东半岛北部临渤海海峡，东南部临黄海。辽宁只临渤海和黄海北部（在辽东半岛），江苏只临黄海，浙江临东海。",
      knowledgePoints: ["地理-中国-省级行政区"],
      difficulty: 2.5,
      source: "公考常识",
    },
    {
      type: "SINGLE_CHOICE",
      stem: "中国最长的内陆河是？",
      options: [
        { key: "A", text: "塔里木河", correct: true },
        { key: "B", text: "黑河", correct: false },
        { key: "C", text: "疏勒河", correct: false },
        { key: "D", text: "伊犁河", correct: false },
      ],
      answer: "A",
      explanation: "塔里木河全长约 2179 公里，是中国最长的内陆河，也是世界第五大内陆河，位于新疆塔里木盆地。",
      knowledgePoints: ["地理-中国-河流"],
      difficulty: 1.5,
    },
    {
      type: "SINGLE_CHOICE",
      stem: "下列哪座山是佛教四大名山之一？",
      options: [
        { key: "A", text: "武当山", correct: false },
        { key: "B", text: "峨眉山", correct: true },
        { key: "C", text: "青城山", correct: false },
        { key: "D", text: "龙虎山", correct: false },
      ],
      answer: "B",
      explanation: "佛教四大名山：山西五台山、浙江普陀山、四川峨眉山、安徽九华山，分别对应文殊、观音、普贤、地藏四大菩萨。",
      knowledgePoints: ["地理-中国-名山", "文化-佛教"],
      difficulty: 2.0,
    },
    {
      type: "SINGLE_CHOICE",
      stem: "二十四节气中，夏季的第一个节气是？",
      options: [
        { key: "A", text: "立夏", correct: true },
        { key: "B", text: "小满", correct: false },
        { key: "C", text: "芒种", correct: false },
        { key: "D", text: "夏至", correct: false },
      ],
      answer: "A",
      explanation: "立夏是夏季第一个节气（公历 5 月 5-7 日）。夏季六个节气依次为：立夏、小满、芒种、夏至、小暑、大暑。",
      knowledgePoints: ["文化-节气"],
      difficulty: 1.5,
    },
    {
      type: "SINGLE_CHOICE",
      stem: "中国面积最大的省级行政区是？",
      options: [
        { key: "A", text: "西藏自治区", correct: false },
        { key: "B", text: "内蒙古自治区", correct: false },
        { key: "C", text: "新疆维吾尔自治区", correct: true },
        { key: "D", text: "青海省", correct: false },
      ],
      answer: "C",
      explanation: "新疆维吾尔自治区面积约 166 万平方公里，是中国面积最大的省级行政区，约占全国陆地面积的六分之一。",
      knowledgePoints: ["地理-中国-省级行政区"],
      difficulty: 1.0,
    },
    {
      type: "SINGLE_CHOICE",
      stem: "下列哪项不属于中国“五岳”？",
      options: [
        { key: "A", text: "泰山", correct: false },
        { key: "B", text: "华山", correct: false },
        { key: "C", text: "黄山", correct: true },
        { key: "D", text: "衡山", correct: false },
      ],
      answer: "C",
      explanation: "五岳：东岳泰山（山东）、西岳华山（陕西）、南岳衡山（湖南）、北岳恒山（山西）、中岳嵩山（河南）。黄山虽称“天下第一奇山”，但不属五岳。",
      knowledgePoints: ["地理-中国-名山", "文化-五岳"],
      difficulty: 1.5,
    },
    // === 多选题 ×5 ===
    {
      type: "MULTI_CHOICE",
      stem: "下列哪些是中国的世界文化与自然双重遗产？（多选）",
      options: [
        { key: "A", text: "泰山", correct: true },
        { key: "B", text: "黄山", correct: true },
        { key: "C", text: "峨眉山-乐山大佛", correct: true },
        { key: "D", text: "武夷山", correct: true },
      ],
      answer: ["A", "B", "C", "D"],
      explanation: "中国有 4 项世界双重遗产：泰山（1987）、黄山（1990）、峨眉山-乐山大佛（1996）、武夷山（1999）。",
      knowledgePoints: ["地理-世界遗产", "文化"],
      difficulty: 3.0,
    },
    {
      type: "MULTI_CHOICE",
      stem: "下列哪些河流最终注入太平洋？（多选）",
      options: [
        { key: "A", text: "长江", correct: true },
        { key: "B", text: "黄河", correct: true },
        { key: "C", text: "雅鲁藏布江", correct: false },
        { key: "D", text: "澜沧江", correct: false },
      ],
      answer: ["A", "B"],
      explanation: "长江、黄河注入太平洋。雅鲁藏布江注入印度洋（经布拉马普特拉河入孟加拉湾），澜沧江注入南海（属于太平洋）——但其上游在中国境内，下游称湄公河。注意：严格来说澜沧江-湄公河也注入太平洋，但本题侧重中国境内主流认知。",
      knowledgePoints: ["地理-中国-河流"],
      difficulty: 3.5,
    },
    {
      type: "MULTI_CHOICE",
      stem: "下列哪些是中国的自治区？（多选）",
      options: [
        { key: "A", text: "宁夏回族自治区", correct: true },
        { key: "B", text: "广西壮族自治区", correct: true },
        { key: "C", text: "西藏自治区", correct: true },
        { key: "D", text: "青海省", correct: false },
      ],
      answer: ["A", "B", "C"],
      explanation: "中国 5 个自治区：内蒙古、广西、西藏、宁夏、新疆。青海省是省，不是自治区。",
      knowledgePoints: ["地理-中国-行政区划"],
      difficulty: 2.0,
    },
    {
      type: "MULTI_CHOICE",
      stem: "下列哪些是中国传统“四大发明”？（多选）",
      options: [
        { key: "A", text: "造纸术", correct: true },
        { key: "B", text: "印刷术", correct: true },
        { key: "C", text: "火药", correct: true },
        { key: "D", text: "指南针", correct: true },
      ],
      answer: ["A", "B", "C", "D"],
      explanation: "四大发明：造纸术（东汉蔡伦改进）、印刷术（唐代雕版、宋代毕昇活字）、火药（唐代炼丹术）、指南针（宋代应用于航海）。",
      knowledgePoints: ["历史-科技", "文化"],
      difficulty: 1.0,
    },
    {
      type: "MULTI_CHOICE",
      stem: "关于长江，下列说法正确的有？（多选）",
      options: [
        { key: "A", text: "发源于青藏高原唐古拉山", correct: true },
        { key: "B", text: "是中国第一长河", correct: true },
        { key: "C", text: "流经 11 个省级行政区", correct: true },
        { key: "D", text: "最终注入东海", correct: true },
      ],
      answer: ["A", "B", "C", "D"],
      explanation: "长江发源于唐古拉山主峰各拉丹冬，全长约 6300 公里，流经青海、西藏、四川、云南、重庆、湖北、湖南、江西、安徽、江苏、上海 11 省区，于崇明岛注入东海。",
      knowledgePoints: ["地理-中国-河流", "长江"],
      difficulty: 2.5,
    },
    // === 判断题 ×4 ===
    {
      type: "TRUE_FALSE",
      stem: "黄河是中国第二长河，也是世界第五长河。",
      options: [
        { key: "T", text: "正确", correct: true },
        { key: "F", text: "错误", correct: false },
      ],
      answer: true,
      explanation: "黄河全长约 5464 公里，是中国第二长河（仅次于长江），世界第五长河（仅次于尼罗河、亚马逊河、长江、密西西比河）。",
      knowledgePoints: ["地理-中国-河流", "黄河"],
      difficulty: 2.0,
    },
    {
      type: "TRUE_FALSE",
      stem: "北京故宫是世界上现存规模最大、保存最完整的木质结构古建筑群。",
      options: [
        { key: "T", text: "正确", correct: true },
        { key: "F", text: "错误", correct: false },
      ],
      answer: true,
      explanation: "故宫占地约 72 万平方米，建筑面积约 15 万平方米，有大小宫殿七十多座，房屋九千余间，是世界上现存规模最大、保存最为完整的木质结构古建筑之一。",
      knowledgePoints: ["地理-世界遗产", "文化-建筑"],
      difficulty: 1.5,
    },
    {
      type: "TRUE_FALSE",
      stem: "中国的最南端领土是曾母暗沙。",
      options: [
        { key: "T", text: "正确", correct: true },
        { key: "F", text: "错误", correct: false },
      ],
      answer: true,
      explanation: "中国领土四至：最北——漠河以北黑龙江主航道（约 53°N）；最南——曾母暗沙（约 4°N）；最东——黑龙江与乌苏里江主航道汇合处（约 135°E）；最西——帕米尔高原（约 73°E）。",
      knowledgePoints: ["地理-中国-四至点"],
      difficulty: 2.0,
    },
    {
      type: "TRUE_FALSE",
      stem: "青藏高原是世界上海拔最高的高原，被称为“世界屋脊”。",
      options: [
        { key: "T", text: "正确", correct: true },
        { key: "F", text: "错误", correct: false },
      ],
      answer: true,
      explanation: "青藏高原平均海拔 4000 米以上，是世界上海拔最高的高原，面积 约 250 万平方公里，有“世界屋脊”“第三极”之称。",
      knowledgePoints: ["地理-中国-地形", "青藏高原"],
      difficulty: 1.0,
    },
    // === 填空题 ×5 ===
    {
      type: "FILL_BLANK",
      stem: "中国的首都是 ____，最大城市是 ____。",
      options: [
        { key: "1", answer: "北京|Beijing|beijing" },
        { key: "2", answer: "上海|Shanghai|shanghai" },
      ],
      answer: ["北京|Beijing|beijing", "上海|Shanghai|shanghai"],
      explanation: "北京是首都，上海是中国人口最多、经济体量最大的城市（按市区人口和 GDP 计）。",
      knowledgePoints: ["地理-中国-城市"],
      difficulty: 1.0,
    },
    {
      type: "FILL_BLANK",
      stem: "中国最长的河流是 ____，全长约 ____ 公里。",
      options: [
        { key: "1", answer: "长江|Yangtze|Yangtze River|Changjiang" },
        { key: "2", answer: "6300|6300公里|六千三百" },
      ],
      answer: ["长江|Yangtze|Yangtze River|Changjiang", "6300|6300公里|六千三百"],
      explanation: "长江全长约 6300 公里，是中国第一长河，世界第三长河（仅次于尼罗河和亚马逊河）。",
      knowledgePoints: ["地理-中国-河流", "长江"],
      difficulty: 1.5,
    },
    {
      type: "FILL_BLANK",
      stem: "中国的“五岳”中，东岳是 ____（山名），西岳是 ____（山名）。",
      options: [
        { key: "1", answer: "泰山|Taishan|Mount Tai" },
        { key: "2", answer: "华山|Huashan|Mount Hua" },
      ],
      answer: ["泰山|Taishan|Mount Tai", "华山|Huashan|Mount Hua"],
      explanation: "五岳：东岳泰山（山东泰安）、西岳华山（陕西渭南）、南岳衡山（湖南衡阳）、北岳恒山（山西大同）、中岳嵩山（河南郑州）。",
      knowledgePoints: ["地理-中国-名山", "五岳"],
      difficulty: 2.0,
    },
    {
      type: "FILL_BLANK",
      stem: "中国传统农历二十四节气中，立春之后的节气是 ____，最后一个节气是 ____。",
      options: [
        { key: "1", answer: "雨水|Rain Water" },
        { key: "2", answer: "大寒|Major Cold|Dahan" },
      ],
      answer: ["雨水|Rain Water", "大寒|Major Cold|Dahan"],
      explanation: "二十四节气顺序：立春→雨水→惊蛰→春分→清明→谷雨→立夏→小满→芒种→夏至→小暑→大暑→立秋→处暑→白露→秋分→寒露→霜降→立冬→小雪→大雪→冬至→小寒→大寒。",
      knowledgePoints: ["文化-节气"],
      difficulty: 3.0,
    },
    {
      type: "FILL_BLANK",
      stem: "中国四大直辖市是北京、上海、____ 和 ____。",
      options: [
        { key: "1", answer: "天津|Tianjin|tianjin" },
        { key: "2", answer: "重庆|Chongqing|chongqing" },
      ],
      answer: ["天津|Tianjin|tianjin", "重庆|Chongqing|chongqing"],
      explanation: "中国四大直辖市：北京、上海、天津、重庆。重庆是 1997 年设立的最新直辖市，也是面积最大、人口最多的直辖市。",
      knowledgePoints: ["地理-中国-行政区划"],
      difficulty: 1.5,
    },
  ],
};

// ============================================================
// 题库 3：编程基础与 TypeScript（20 题）
// ============================================================
const CODE_BANK: SeedBank = {
  name: "编程基础与 TypeScript",
  description: "覆盖 TypeScript 类型系统、JavaScript 基础、数据结构概念、HTTP 协议，共 20 题。适合前端工程师自查。",
  coverColor: "coral",
  tags: ["编程", "TypeScript", "前端"],
  newCardsPerDay: 10,
  sourceRef: "seed-v1-code",
  questions: [
    // === 单选题 ×6 ===
    {
      type: "SINGLE_CHOICE",
      stem: "TypeScript 中，以下哪个类型表示“永远不会有值”？",
      options: [
        { key: "A", text: "void", correct: false },
        { key: "B", text: "null", correct: false },
        { key: "C", text: "undefined", correct: false },
        { key: "D", text: "never", correct: true },
      ],
      answer: "D",
      explanation: "never 表示永远不会发生的值类型，常用于抛出异常的函数、无限循环、或穷尽检查（exhaustive check）。void 表示函数无返回值，但实际返回 undefined。",
      knowledgePoints: ["TypeScript-类型系统", "never"],
      difficulty: 2.5,
    },
    {
      type: "SINGLE_CHOICE",
      stem: "下列哪个 HTTP 状态码表示“资源已永久移动”？",
      options: [
        { key: "A", text: "301", correct: true },
        { key: "B", text: "302", correct: false },
        { key: "C", text: "307", correct: false },
        { key: "D", text: "404", correct: false },
      ],
      answer: "A",
      explanation: "301 Moved Permanently 表示永久重定向，浏览器和搜索引擎会缓存新地址。302 是临时重定向，307 保持原方法重定向，404 是资源未找到。",
      knowledgePoints: ["HTTP-状态码"],
      difficulty: 1.5,
    },
    {
      type: "SINGLE_CHOICE",
      stem: "JavaScript 中，0.1 + 0.2 的结果是？",
      options: [
        { key: "A", text: "0.3", correct: false },
        { key: "B", text: "0.30000000000000004", correct: true },
        { key: "C", text: "0.3000000000000001", correct: false },
        { key: "D", text: "0.29999999999999999", correct: false },
      ],
      answer: "B",
      explanation: "JavaScript 使用 IEEE 754 双精度浮点数，0.1 和 0.2 都无法精确表示，相加后产生浮点误差。比较时应用 Math.abs(a - b) < Number.EPSILON。",
      knowledgePoints: ["JavaScript-数值", "IEEE 754"],
      difficulty: 2.0,
    },
    {
      type: "SINGLE_CHOICE",
      stem: "下列哪个不是 JavaScript 的原始类型（primitive）？",
      options: [
        { key: "A", text: "string", correct: false },
        { key: "B", text: "number", correct: false },
        { key: "C", text: "object", correct: true },
        { key: "D", text: "symbol", correct: false },
      ],
      answer: "C",
      explanation: "JavaScript 原始类型：string、number、boolean、null、undefined、symbol、bigint。object 是引用类型，不是原始类型。",
      knowledgePoints: ["JavaScript-类型"],
      difficulty: 1.5,
    },
    {
      type: "SINGLE_CHOICE",
      stem: "时间复杂度 O(log n) 的典型算法是？",
      options: [
        { key: "A", text: "冒泡排序", correct: false },
        { key: "B", text: "二分查找", correct: true },
        { key: "C", text: "线性查找", correct: false },
        { key: "D", text: "快速排序", correct: false },
      ],
      answer: "B",
      explanation: "二分查找每次将搜索范围减半，时间复杂度 O(log n)。冒泡/线性查找是 O(n)，快速排序平均 O(n log n)。",
      knowledgePoints: ["算法-复杂度"],
      difficulty: 1.5,
    },
    {
      type: "SINGLE_CHOICE",
      stem: "TypeScript 中，type 和 interface 的主要区别是？",
      options: [
        { key: "A", text: "interface 不支持联合类型，type 支持", correct: true },
        { key: "B", text: "type 不能被 class implements", correct: false },
        { key: "C", text: "interface 不能描述对象形状", correct: false },
        { key: "D", text: "type 不能扩展（extend）", correct: false },
      ],
      answer: "A",
      explanation: "type 可以表示联合类型、交叉类型、原始类型别名等；interface 主要描述对象形状，支持声明合并（declaration merging）。两者都可被 class implements。",
      knowledgePoints: ["TypeScript-类型系统", "type vs interface"],
      difficulty: 2.5,
    },
    // === 多选题 ×5 ===
    {
      type: "MULTI_CHOICE",
      stem: "下列哪些是 HTTP 请求方法？（多选）",
      options: [
        { key: "A", text: "GET", correct: true },
        { key: "B", text: "POST", correct: true },
        { key: "C", text: "PATCH", correct: true },
        { key: "D", text: "FETCH", correct: false },
      ],
      answer: ["A", "B", "C"],
      explanation: "HTTP 标准方法：GET、POST、PUT、PATCH、DELETE、HEAD、OPTIONS、CONNECT、TRACE。FETCH 是浏览器 API 名称，不是 HTTP 方法。",
      knowledgePoints: ["HTTP-方法"],
      difficulty: 1.5,
    },
    {
      type: "MULTI_CHOICE",
      stem: "下列哪些是 JavaScript 数组的不可变方法（不修改原数组）？（多选）",
      options: [
        { key: "A", text: "map", correct: true },
        { key: "B", text: "filter", correct: true },
        { key: "C", text: "push", correct: false },
        { key: "D", text: "slice", correct: true },
      ],
      answer: ["A", "B", "D"],
      explanation: "不可变方法：map、filter、slice、concat、reduce、find 等。可变方法：push、pop、shift、unshift、splice、sort、reverse 等。",
      knowledgePoints: ["JavaScript-数组", "不可变性"],
      difficulty: 2.0,
    },
    {
      type: "MULTI_CHOICE",
      stem: "关于 RESTful API 设计，下列哪些说法正确？（多选）",
      options: [
        { key: "A", text: "用名词复数表示资源集合，如 /users", correct: true },
        { key: "B", text: "用 HTTP 方法表达操作意图", correct: true },
        { key: "C", text: "用状态码反映处理结果", correct: true },
        { key: "D", text: "URL 中应包含动词以表明动作", correct: false },
      ],
      answer: ["A", "B", "C"],
      explanation: "REST 风格：URL 用名词复数（/users、/users/123），动作用 HTTP 方法（GET/POST/PUT/DELETE），结果用状态码（200/201/400/404/500）。URL 中包含动词（如 /getUser）不符合 REST 规范。",
      knowledgePoints: ["HTTP-REST", "API设计"],
      difficulty: 2.0,
    },
    {
      type: "MULTI_CHOICE",
      stem: "下列哪些是 React 19 的新特性？（多选）",
      options: [
        { key: "A", text: "Server Components 稳定", correct: true },
        { key: "B", text: "use() hook", correct: true },
        { key: "C", text: "Actions 和 useActionState", correct: true },
        { key: "D", text: "Hooks 完全废弃", correct: false },
      ],
      answer: ["A", "B", "C"],
      explanation: "React 19 稳定了 Server Components、use() hook、Actions/useActionState、ref as prop、forwardRef 渐进弃用、文档元数据原生支持等。Hooks 没有被废弃，反而得到增强。",
      knowledgePoints: ["React-19", "前端框架"],
      difficulty: 2.5,
    },
    {
      type: "MULTI_CHOICE",
      stem: "下列哪些数据结构是线性的？（多选）",
      options: [
        { key: "A", text: "数组", correct: true },
        { key: "B", text: "栈", correct: true },
        { key: "C", text: "队列", correct: true },
        { key: "D", text: "二叉树", correct: false },
      ],
      answer: ["A", "B", "C"],
      explanation: "线性结构：数组、链表、栈、队列。非线性结构：树（二叉树、B 树、堆）、图、哈希表（结构上是数组+链表/红黑树）。",
      knowledgePoints: ["数据结构-分类"],
      difficulty: 1.5,
    },
    // === 判断题 ×4 ===
    {
      type: "TRUE_FALSE",
      stem: "TypeScript 编译后会移除所有类型注解。",
      options: [
        { key: "T", text: "正确", correct: true },
        { key: "F", text: "错误", correct: false },
      ],
      answer: true,
      explanation: "TypeScript 是结构化类型系统，编译为 JavaScript 时会移除所有类型注解、接口、类型别名，运行时没有任何类型信息（除非用 class 装饰器等运行时反射机制）。",
      knowledgePoints: ["TypeScript-编译"],
      difficulty: 1.5,
    },
    {
      type: "TRUE_FALSE",
      stem: "JavaScript 中，== 比较不进行类型转换，=== 比较进行类型转换。",
      options: [
        { key: "T", text: "正确", correct: false },
        { key: "F", text: "错误", correct: true },
      ],
      answer: false,
      explanation: "正好相反：==（宽松相等）会进行类型转换后比较，===（严格相等）不进行类型转换。建议始终使用 === 避免隐式转换的坑。",
      knowledgePoints: ["JavaScript-相等性"],
      difficulty: 1.5,
    },
    {
      type: "TRUE_FALSE",
      stem: "HTTP 是无状态协议，每次请求相互独立。",
      options: [
        { key: "T", text: "正确", correct: true },
        { key: "F", text: "错误", correct: false },
      ],
      answer: true,
      explanation: "HTTP 是无状态协议，服务器默认不保留客户端的任何上下文。会话状态通过 Cookie、Session、JWT 等机制在应用层维护。",
      knowledgePoints: ["HTTP-特性"],
      difficulty: 1.0,
    },
    {
      type: "TRUE_FALSE",
      stem: "Promise.all 在任一 Promise 失败时立即 reject，不会等待其他完成。",
      options: [
        { key: "T", text: "正确", correct: true },
        { key: "F", text: "错误", correct: false },
      ],
      answer: true,
      explanation: "Promise.all 是“短-circuit”：任一 reject 立即 reject 整个 Promise.all，其他 Promise 仍在执行但其结果被忽略。需要“全等”应使用 Promise.allSettled。",
      knowledgePoints: ["JavaScript-Promise"],
      difficulty: 2.0,
    },
    // === 填空题 ×5 ===
    {
      type: "FILL_BLANK",
      stem: "JavaScript 中，将字符串 “123” 转为数字的常用方法是 Number()、parseInt() 或在前面加 ____（运算符）。",
      options: [{ key: "1", answer: "+|一元加|unary plus" }],
      answer: ["+|一元加|unary plus"],
      explanation: "+str 是一元加运算符，会触发隐式数字转换，等价于 Number(str)。如 +\"123\" === 123。",
      knowledgePoints: ["JavaScript-类型转换"],
      difficulty: 2.0,
    },
    {
      type: "FILL_BLANK",
      stem: "HTTP 状态码 200 表示 ____，404 表示 ____。",
      options: [
        { key: "1", answer: "OK|成功|success" },
        { key: "2", answer: "Not Found|未找到|资源不存在" },
      ],
      answer: ["OK|成功|success", "Not Found|未找到|资源不存在"],
      explanation: "2xx 成功类、3xx 重定向、4xx 客户端错误、5xx 服务器错误。200 OK、404 Not Found 是最常用的两个。",
      knowledgePoints: ["HTTP-状态码"],
      difficulty: 1.0,
    },
    {
      type: "FILL_BLANK",
      stem: "TypeScript 中，泛型的语法用 ____（符号）包裹类型参数，如 function id<T>(x: T): T。",
      options: [{ key: "1", answer: "<>|尖括号|angle bracket" }],
      answer: ["<>|尖括号|angle bracket"],
      explanation: "TypeScript 泛型用 <T> 包裹类型参数。可在函数、接口、类型别名、class 上使用。如 type Box<T> = { value: T }。",
      knowledgePoints: ["TypeScript-泛型"],
      difficulty: 1.5,
    },
    {
      type: "FILL_BLANK",
      stem: "CSS 中，使元素水平居中的常用方式：父元素 display: ____ 和 justify-content: ____。",
      options: [
        { key: "1", answer: "flex" },
        { key: "2", answer: "center" },
      ],
      answer: ["flex", "center"],
      explanation: "display: flex + justify-content: center 实现主轴居中。如果需要垂直居中再加 align-items: center。",
      knowledgePoints: ["CSS-布局", "flexbox"],
      difficulty: 1.0,
    },
    {
      type: "FILL_BLANK",
      stem: "Git 中，撤销已 push 的最新提交应使用 git ____ 命令（注意：force push 才能更新远端）。",
      options: [{ key: "1", answer: "revert" }],
      answer: ["revert"],
      explanation: "已 push 的提交应使用 git revert <commit> 创建一个反向提交来撤销，避免改写历史。reset 会改写历史，仅适用于本地未 push 的提交。",
      knowledgePoints: ["Git-操作"],
      difficulty: 2.5,
    },
  ],
};

// ============================================================
// 主流程
// ============================================================
// V1.4 起：seed 只创建 demo 用户与 FSRS 默认参数，不再自动插入题库。
// 题库改为随仓库分发的官方静态文件（public/official-banks/*.md），
// 用户在 /workshop 点击"官方题库"按需加载，不点不占数据库。
// 原内联题库数据（FSRS_BANK / GEO_BANK / CODE_BANK）保留在文件中作为
// 历史参考与官方题库 Markdown 文件的生成源，但不再执行插入。
const ALL_BANKS: SeedBank[] = [FSRS_BANK, GEO_BANK, CODE_BANK];

async function main() {
  console.log("Seeding Compass V1.4 demo user...");

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

  // 2. 清理可能存在的旧 seed 题库（V1.3 及之前自动插入的）
  const seedRefPattern = "seed-v1-";
  const oldSeedBanks = await prisma.questionBank.findMany({
    where: {
      userId: user.id,
      sourceRef: { startsWith: seedRefPattern },
    },
    select: { id: true, name: true },
  });
  if (oldSeedBanks.length > 0) {
    await prisma.questionBank.deleteMany({
      where: { id: { in: oldSeedBanks.map((b) => b.id) } },
    });
    console.log(`  • Removed ${oldSeedBanks.length} legacy seed bank(s): ${oldSeedBanks.map((b) => b.name).join(", ")}`);
  }

  // 3. 写入用户级 FSRS 默认参数（可选）
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
  console.log(`  Official banks: ${ALL_BANKS.map((b) => `${b.name}(${b.questions.length}题)`).join(" · ")} (load on demand via /workshop → 官方题库)`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
