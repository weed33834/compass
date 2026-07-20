"use client";

// 答题舱主页面
// 路由：/study?bankId=&mode=LEARN
//
// 流程（grade/apply 两阶段，避免重复调度 FSRS）：
//   1. 拉队列 → 显示第 1 题
//   2. 用户作答 → 点"提交" → 调用 /api/study/grade
//      后端判分 + 写 AnswerRecord + 返回 4 键预览（不动 FSRS）
//   3. 显示判分结果 + 正确答案 + 解析 + 4 键评分
//   4. 用户基于自身体验按 1/2/3/4 评分 → 调用 /api/study/apply
//      后端应用 FSRS 调度 + 写 ReviewLog + 更新 ReviewItem
//      （或按 Space 接受默认评分 = grade 阶段的 appliedRating）
//   5. 进入下一题；队列答完后显示完成报告

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Star, Clock, ArrowRight, RotateCcw, CheckCircle2, XCircle, Anchor } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/Button";
import { AnswerInput } from "./AnswerInput";
import { RatingBar } from "./RatingBar";
import {
  CARD_STATE_LABELS,
  QUESTION_TYPE_LABELS,
  type ApplyResult,
  type GradeResult,
  type QueueItem,
  type QueueStats,
  type Rating,
  type SubmitResult,
} from "./types";

type Phase = "loading" | "answering" | "submitted" | "completed" | "error";

export default function StudyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Anchor className="h-10 w-10 animate-pulse text-brass" />
        </div>
      }
    >
      <StudyContent />
    </Suspense>
  );
}

function StudyContent() {
  const searchParams = useSearchParams();
  const bankId = searchParams.get("bankId") ?? undefined;
  const mode = (searchParams.get("mode") ?? "LEARN") as "LEARN" | "REVIEW_ONLY" | "WRONG_REDO";

  const [phase, setPhase] = useState<Phase>("loading");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [cursor, setCursor] = useState(0);
  const [userAnswer, setUserAnswer] = useState<unknown>(null);
  // grade 阶段的判分结果（不含 FSRS 新状态）
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  // apply 阶段返回的 FSRS 新状态（与 gradeResult 合并成 SubmitResult 用于 UI 展示）
  const [applyResult, setApplyResult] = useState<ApplyResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  // 已答记录：用于完成报告
  const [history, setHistory] = useState<Array<{ item: QueueItem; result: SubmitResult; finalRating: Rating }>>([]);

  // 1. 拉队列
  const loadQueue = useCallback(async () => {
    setPhase("loading");
    setError("");
    const params = new URLSearchParams();
    if (bankId) params.set("bankId", bankId);
    params.set("mode", mode);
    params.set("limit", "200");
    const res = await apiFetch(`/api/study/queue?${params.toString()}`);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "加载失败");
      setPhase("error");
      return;
    }
    const data = await res.json();
    setItems(data.items);
    setStats(data.stats);
    setCursor(0);
    setUserAnswer(null);
    setGradeResult(null);
    setApplyResult(null);
    setHistory([]);
    setStartTime(Date.now());
    setPhase(data.items.length > 0 ? "answering" : "completed");
  }, [bankId, mode]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const currentItem = items[cursor];
  const progress = useMemo(() => {
    if (!stats || stats.totalCount === 0) return 0;
    return Math.round((cursor / stats.totalCount) * 100);
  }, [cursor, stats]);

  // 合并 grade + apply 结果，供 UI 展示
  const submitResult: SubmitResult | null = useMemo(() => {
    if (!gradeResult) return null;
    if (applyResult) {
      return {
        ...gradeResult,
        appliedRating: applyResult.appliedRating,
        state: applyResult.state,
        reps: applyResult.reps,
        lapses: applyResult.lapses,
        stability: applyResult.stability,
        difficulty: applyResult.difficulty,
        dueAt: applyResult.dueAt,
        nextIntervalDays: applyResult.nextIntervalDays,
        nextIntervalLabel: applyResult.nextIntervalLabel,
      };
    }
    // grade 完成、apply 未完成时：用 grade 的预览 good 作为默认间隔展示
    return {
      ...gradeResult,
      state: currentItem?.state ?? "NEW",
      reps: currentItem?.reps ?? 0,
      lapses: currentItem?.lapses ?? 0,
      stability: 0,
      difficulty: 0,
      dueAt: currentItem?.lastReviewAt ?? new Date().toISOString(),
      nextIntervalDays: gradeResult.previews.good.days,
      nextIntervalLabel: gradeResult.previews.good.label,
    };
  }, [gradeResult, applyResult, currentItem]);

  // 2. 提交答案 → /api/study/grade（仅判分，不动 FSRS）
  const handleSubmit = async () => {
    if (!currentItem || submitting) return;
    if (!isAnswerFilled(currentItem.type, userAnswer)) {
      setError("请先选择答案");
      return;
    }
    setError("");
    setSubmitting(true);
    const timeSpentSec = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await apiFetch("/api/study/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewItemId: currentItem.reviewItemId,
          userAnswer,
          timeSpentSec,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "提交失败");
        return;
      }
      const result: GradeResult = await res.json();
      setGradeResult(result);
      setApplyResult(null);
      setPhase("submitted");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. 用户评分 → /api/study/apply（应用 FSRS 调度）
  const handleRate = async (rating: Rating) => {
    if (!currentItem || submitting || !gradeResult) return;
    setSubmitting(true);
    setError("");
    const timeSpentSec = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await apiFetch("/api/study/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewItemId: currentItem.reviewItemId,
          rating,
          timeSpentSec,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "评分失败");
        return;
      }
      const result: ApplyResult = await res.json();
      setApplyResult(result);
      // 合并入 history（用合并后的 SubmitResult）
      const merged: SubmitResult = {
        ...gradeResult,
        appliedRating: result.appliedRating,
        state: result.state,
        reps: result.reps,
        lapses: result.lapses,
        stability: result.stability,
        difficulty: result.difficulty,
        dueAt: result.dueAt,
        nextIntervalDays: result.nextIntervalDays,
        nextIntervalLabel: result.nextIntervalLabel,
      };
      setHistory((h) => [...h, { item: currentItem, result: merged, finalRating: rating }]);
      goNext();
    } finally {
      setSubmitting(false);
    }
  };

  // 4. 接受默认评分 → 同样调用 apply（用 grade 的 appliedRating）
  const handleAcceptDefault = async () => {
    if (!currentItem || !gradeResult) return;
    await handleRate(gradeResult.appliedRating);
  };

  const goNext = () => {
    const next = cursor + 1;
    if (next >= items.length) {
      setPhase("completed");
      return;
    }
    setCursor(next);
    setUserAnswer(null);
    setGradeResult(null);
    setApplyResult(null);
    setStartTime(Date.now());
    setPhase("answering");
  };

  // 快捷键 Enter 提交 / Space 接受默认评分
  useEffect(() => {
    if (phase !== "answering" && phase !== "submitted") return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Enter" && phase === "answering" && isAnswerFilled(currentItem?.type, userAnswer)) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === " " && phase === "submitted" && !submitting) {
        e.preventDefault();
        handleAcceptDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentItem, userAnswer, gradeResult, submitting]);

  // === 渲染 ===

  if (phase === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Anchor className="mx-auto h-10 w-10 animate-pulse text-brass" />
          <p className="mt-4 font-sans text-sm text-starlight">正在装载题库...</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto h-10 w-10 text-f-coral2" />
          <p className="mt-4 font-sans text-sm text-coral">{error || "未知错误"}</p>
          <Button className="mt-6" onClick={loadQueue}>
            <RotateCcw className="h-4 w-4" /> 重试
          </Button>
        </div>
      </div>
    );
  }

  // 完成报告
  if (phase === "completed") {
    const correct = history.filter((h) => h.result.isCorrect).length;
    const accuracy = history.length > 0 ? Math.round((correct / history.length) * 100) : 0;
    return (
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-2xl border border-brass/30 bg-abyss-50/40 p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-f-emerald" />
          <h2 className="mt-6 font-serif text-3xl text-ivory">本轮已完成</h2>
          <p className="mt-2 font-sans text-sm text-starlight">
            共答 {history.length} 题 · 正确 {correct} 题 · 正确率 {accuracy}%
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl border border-starlight/15 bg-abyss-700/40 p-4">
              <p className="font-serif text-2xl text-brass">{history.length}</p>
              <p className="font-sans text-xs text-starlight">已答</p>
            </div>
            <div className="rounded-xl border border-starlight/15 bg-abyss-700/40 p-4">
              <p className="font-serif text-2xl text-f-emerald">{correct}</p>
              <p className="font-sans text-xs text-starlight">答对</p>
            </div>
            <div className="rounded-xl border border-starlight/15 bg-abyss-700/40 p-4">
              <p className="font-serif text-2xl text-f-coral2">{history.length - correct}</p>
              <p className="font-sans text-xs text-starlight">答错</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={loadQueue}>
              <RotateCcw className="h-4 w-4" /> 再来一轮
            </Button>
            <Link
              href="/compass"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-starlight/40 px-5 text-sm font-medium text-ivory transition-colors hover:bg-brass/10"
            >
              返回罗盘
            </Link>
            <Link
              href="/wrongbook"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-starlight/40 px-5 text-sm font-medium text-ivory transition-colors hover:bg-brass/10"
            >
              错题漂流瓶
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 空队列
  if (!currentItem) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-12 text-center">
        <Anchor className="mx-auto h-12 w-12 text-brass/50" />
        <h2 className="mt-4 font-serif text-2xl text-ivory">今日队列已清空</h2>
        <p className="mt-2 font-sans text-sm text-starlight">
          没有到期复习，也没有新卡配额。先去题库添加题目，或稍后再来。
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/workshop"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-brass bg-brass/10 px-5 text-sm font-medium text-brass transition-colors hover:bg-brass/20"
          >
            前往造船工坊
          </Link>
          <Link
            href="/compass"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-starlight/40 px-5 text-sm font-medium text-ivory transition-colors hover:bg-brass/10"
          >
            返回罗盘
          </Link>
        </div>
      </div>
    );
  }

  // 答题中 / 已提交
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {/* === 顶部状态条 === */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-full border border-brass/30 bg-brass/10 px-3 py-1 font-mono text-brass">
            {currentItem.bankName}
          </span>
          <span className="font-sans text-starlight/70">
            {QUESTION_TYPE_LABELS[currentItem.type]}
          </span>
          <span className="font-sans text-starlight/50">
            · {CARD_STATE_LABELS[currentItem.state]}
            {currentItem.isNew && " · 新题"}
          </span>
          {currentItem.isStarred && (
            <Star className="h-3.5 w-3.5 fill-brass text-brass" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-starlight/70">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono">
            {cursor + 1} / {items.length}
          </span>
        </div>
      </div>

      {/* === 进度条 === */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-abyss-700/60">
        <div
          className="h-full bg-gradient-to-r from-brass-dark to-brass transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* === 题目卡片 === */}
      <div key={currentItem.reviewItemId} className="rounded-2xl border border-starlight/15 bg-abyss-50/30 p-6 sm:p-8">
        {/* 题干 */}
        <div className="mb-6">
          <pre className="whitespace-pre-wrap break-words font-sans text-base leading-relaxed text-ivory">
            {currentItem.stem}
          </pre>
          {currentItem.knowledgePoints.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {currentItem.knowledgePoints.map((kp) => (
                <span
                  key={kp}
                  className="rounded border border-starlight/20 bg-abyss-700/40 px-2 py-0.5 font-mono text-[11px] text-starlight/80"
                >
                  {kp}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 答题输入 */}
        <AnswerInput
          type={currentItem.type}
          options={currentItem.options}
          value={userAnswer}
          onChange={setUserAnswer}
          disabled={phase === "submitted"}
          reveal={phase === "submitted"}
          correctAnswer={submitResult?.correctAnswer}
        />

        {/* 错误提示 */}
        {error && (
          <p className="mt-4 rounded-lg border border-coral/30 bg-coral/10 px-4 py-2 font-sans text-sm text-coral">
            {error}
          </p>
        )}
      </div>

      {/* === 底部操作区 === */}
      <div className="mt-6">
        {phase === "answering" && (
          <div className="flex items-center justify-between gap-4">
            <p className="font-sans text-xs text-starlight/60">
              <kbd className="rounded border border-starlight/30 px-1.5 py-0.5 text-[10px]">Enter</kbd> 提交
            </p>
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={!isAnswerFilled(currentItem.type, userAnswer)}
              size="lg"
            >
              提交答案 <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {phase === "submitted" && submitResult && (
          <div className="space-y-5">
            {/* 判分结果 */}
            <div
              className={[
                "rounded-2xl border p-5",
                submitResult.isCorrect
                  ? "border-f-emerald/40 bg-f-emerald/5"
                  : "border-f-coral2/40 bg-f-coral2/5",
              ].join(" ")}
            >
              <div className="mb-3 flex items-center gap-2">
                {submitResult.isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-f-emerald" />
                ) : (
                  <XCircle className="h-5 w-5 text-f-coral2" />
                )}
                <span
                  className={[
                    "font-serif text-lg",
                    submitResult.isCorrect ? "text-f-emerald" : "text-f-coral2",
                  ].join(" ")}
                >
                  {submitResult.isCorrect ? "答对" : "答错"}
                </span>
                {submitResult.partialScore > 0 && submitResult.partialScore < 1 && (
                  <span className="font-mono text-xs text-f-amber">
                    部分得分 {Math.round(submitResult.partialScore * 100)}%
                  </span>
                )}
                <span className="ml-auto font-sans text-xs text-starlight/60">
                  下次复习：{submitResult.nextIntervalLabel}
                </span>
              </div>
              {submitResult.explanation && (
                <div className="mt-3 border-t border-starlight/10 pt-3">
                  <p className="mb-1 font-sans text-xs text-starlight">解析</p>
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-ivory/90">
                    {submitResult.explanation}
                  </pre>
                </div>
              )}
              {submitResult.knowledgePoints.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {submitResult.knowledgePoints.map((kp) => (
                    <span
                      key={kp}
                      className="rounded border border-starlight/20 bg-abyss-700/40 px-2 py-0.5 font-mono text-[11px] text-starlight/80"
                    >
                      {kp}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 4 键评分 + 接受默认 */}
            <RatingBar result={submitResult} onRate={handleRate} disabled={submitting} />
            <div className="flex items-center justify-between">
              <p className="font-sans text-xs text-starlight/60">
                <kbd className="rounded border border-starlight/30 px-1.5 py-0.5 text-[10px]">Space</kbd>{" "}
                接受默认评分
              </p>
              <Button variant="secondary" onClick={handleAcceptDefault} disabled={submitting}>
                接受默认 · 下一题 <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 检查用户答案是否已填
function isAnswerFilled(type: string, value: unknown): boolean {
  if (value == null) return false;
  if (type === "SINGLE_CHOICE" || type === "TRUE_FALSE") {
    return typeof value === "string" && value.length > 0;
  }
  if (type === "MULTI_CHOICE") {
    return Array.isArray(value) && value.length > 0;
  }
  if (type === "FILL_BLANK") {
    if (!Array.isArray(value)) return false;
    return value.some((v) => typeof v === "string" && v.trim().length > 0);
  }
  return false;
}
