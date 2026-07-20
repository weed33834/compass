// 答题舱共享类型
// 与 /api/study/queue、/api/study/grade、/api/study/apply 的响应结构对齐

export type QuestionType = "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";
export type CardState = "NEW" | "LEARNING" | "REVIEW" | "RELEARNING";
export type Rating = "AGAIN" | "HARD" | "GOOD" | "EASY";

// 选项结构（与 schema Question.options 一致）
export interface QuestionOption {
  key: string;
  text?: string;
  correct?: boolean;
  answer?: string;
  placeholder?: string;
}

// 学习队列条目（GET /api/study/queue 返回）
export interface QueueItem {
  reviewItemId: string;
  questionId: string;
  bankId: string;
  bankName: string;
  bankCoverColor: string;
  type: QuestionType;
  stem: string;
  options: unknown;
  knowledgePoints: string[];
  difficulty: number;
  isStarred: boolean;
  state: CardState;
  lapses: number;
  reps: number;
  lastReviewAt: string | null;
  isNew: boolean;
}

export interface QueueStats {
  dueCount: number;
  newCount: number;
  totalCount: number;
}

// 判分响应（POST /api/study/grade 返回）
// 不应用 FSRS；只判分 + 写 AnswerRecord + 返回 4 键预览
export interface GradeResult {
  isCorrect: boolean;
  partialScore: number;
  correctAnswer: unknown;
  userAnswerNormalized: unknown;
  explanation: string | null;
  knowledgePoints: string[];
  appliedRating: Rating;          // 自动映射的评分（用户可覆盖）
  previews: {
    again: { days: number; label: string };
    hard: { days: number; label: string };
    good: { days: number; label: string };
    easy: { days: number; label: string };
  };
}

// 应用评分响应（POST /api/study/apply 返回）
// 应用 FSRS 调度 + 写 ReviewLog + 更新 ReviewItem
export interface ApplyResult {
  state: CardState;
  reps: number;
  lapses: number;
  stability: number;
  difficulty: number;
  dueAt: string;
  nextIntervalDays: number;
  nextIntervalLabel: string;
  appliedRating: Rating;
}

// 提交响应（前端展示用：grade + apply 合并视图）
export interface SubmitResult extends GradeResult {
  // 来自 apply 阶段
  state: CardState;
  reps: number;
  lapses: number;
  stability: number;
  difficulty: number;
  dueAt: string;
  nextIntervalDays: number;
  nextIntervalLabel: string;
}

// 类型标签
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE_CHOICE: "单选题",
  MULTI_CHOICE: "多选题",
  TRUE_FALSE: "判断题",
  FILL_BLANK: "填空题",
};

// 状态标签
export const CARD_STATE_LABELS: Record<CardState, string> = {
  NEW: "新卡",
  LEARNING: "学习中",
  REVIEW: "复习",
  RELEARNING: "重学",
};

// 4 键评分配置
export const RATING_CONFIG: Array<{
  key: Rating;
  label: string;
  hint: string;
  color: string;
  hotkey: string;
}> = [
  { key: "AGAIN", label: "重来", hint: "完全不会", color: "f-coral2", hotkey: "1" },
  { key: "HARD", label: "困难", hint: "勉强答对", color: "f-amber", hotkey: "2" },
  { key: "GOOD", label: "良好", hint: "正常答对", color: "f-azure", hotkey: "3" },
  { key: "EASY", label: "简单", hint: "一眼就懂", color: "f-emerald", hotkey: "4" },
];
