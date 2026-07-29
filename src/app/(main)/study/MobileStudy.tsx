"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RotateCcw, CheckCircle2, XCircle, ArrowRight, Trophy } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { AnswerInput } from "./AnswerInput";
import {
  RATING_CONFIG,
  CARD_STATE_LABELS,
  QUESTION_TYPE_LABELS,
  type Rating,
  type QueueItem,
  type QueueStats,
  type GradeResult,
} from "./types";
import { MobileTopBar } from "@/components/mobile/MobileShell";

type Phase = "loading" | "empty" | "answering" | "graded" | "completed" | "error";

function emptyAnswer(type: QueueItem["type"]): unknown {
  if (type === "MULTI_CHOICE" || type === "FILL_BLANK") return [];
  return "";
}

interface FinishedItem {
  item: QueueItem;
  isCorrect: boolean;
  rating: Rating;
}

export function MobileStudy() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bankId = searchParams.get("bankId") ?? undefined;
  const mode = (searchParams.get("mode") as "LEARN" | "REVIEW_ONLY" | "WRONG_REDO") ?? "LEARN";

  const [phase, setPhase] = useState<Phase>("loading");
  const [items, setItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [cursor, setCursor] = useState(0);
  const [answer, setAnswer] = useState<unknown>(undefined);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [applying, setApplying] = useState(false);
  const [finished, setFinished] = useState<FinishedItem[]>([]);
  const [error, setError] = useState("");
  const touchStartX = useRef<number | null>(null);

  const load = useCallback(async () => {
    setPhase("loading");
    try {
      const qs = new URLSearchParams({ mode });
      if (bankId) qs.set("bankId", bankId);
      const res = await apiFetch(`/api/study/queue?${qs.toString()}`);
      if (!res.ok) throw new Error("队列加载失败");
      const data = await res.json();
      setItems(data.items ?? []);
      setStats(data.stats ?? null);
      if (!data.items?.length) {
        setPhase("empty");
        return;
      }
      setCursor(0);
      setAnswer(emptyAnswer(data.items[0].type));
      setGrade(null);
      setFinished([]);
      setPhase("answering");
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
      setPhase("error");
    }
  }, [bankId, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const current = items[cursor];
  const total = items.length;
  const progress = total ? Math.round((cursor / total) * 100) : 0;

  const submit = async () => {
    if (!current) return;
    try {
      const res = await apiFetch("/api/study/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewItemId: current.reviewItemId, userAnswer: answer }),
      });
      if (!res.ok) throw new Error("判分失败");
      const g: GradeResult = await res.json();
      setGrade(g);
      setPhase("graded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "判分失败");
      setPhase("error");
    }
  };

  const rate = async (rating: Rating) => {
    if (!current || !grade || applying) return;
    setApplying(true);
    try {
      const res = await apiFetch("/api/study/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewItemId: current.reviewItemId, rating }),
      });
      if (!res.ok) throw new Error("评分提交失败");
      setFinished((f) => [...f, { item: current, isCorrect: grade.isCorrect, rating }]);
      const next = cursor + 1;
      if (next >= total) {
        setPhase("completed");
      } else {
        setCursor(next);
        setAnswer(emptyAnswer(items[next].type));
        setGrade(null);
        setPhase("answering");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "评分提交失败");
      setPhase("error");
    } finally {
      setApplying(false);
    }
  };

  // 滑动手势（仅在判分后生效）：向左滑 = 采用默认评分进入下一题
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || phase !== "graded" || !grade) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -60) rate(grade.appliedRating);
    touchStartX.current = null;
  };

  if (phase === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-starlight">
        <Loader2 className="h-8 w-8 animate-spin text-brass" />
        <p>正在校准罗盘…</p>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <Trophy className="h-12 w-12 text-brass/70" />
        <p className="font-serif text-xl text-ivory">暂无待复习卡片</p>
        <p className="text-sm text-starlight">去工坊挑选题库，开始你的航程</p>
        <button
          type="button"
          onClick={() => router.push("/workshop")}
          className="mt-2 rounded-xl bg-brass px-6 py-3 font-semibold text-abyss active:bg-brass-dark"
        >
          前往工坊
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <XCircle className="h-12 w-12 text-f-coral2" />
        <p className="font-serif text-xl text-ivory">出了点问题</p>
        <p className="text-sm text-starlight">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-2 flex items-center gap-2 rounded-xl bg-brass px-6 py-3 font-semibold text-abyss active:bg-brass-dark"
        >
          <RotateCcw className="h-4 w-4" /> 重试
        </button>
      </div>
    );
  }

  if (phase === "completed") {
    const correct = finished.filter((f) => f.isCorrect).length;
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
        <Trophy className="h-16 w-16 text-brass" />
        <p className="font-serif text-2xl text-ivory">本程结束</p>
        <div className="flex gap-4">
          <div className="rounded-2xl border border-brass/20 bg-abyss-300/60 px-6 py-4">
            <div className="font-serif text-3xl text-ivory">{finished.length}</div>
            <div className="text-xs text-starlight">总题数</div>
          </div>
          <div className="rounded-2xl border border-f-emerald/30 bg-f-emerald/10 px-6 py-4">
            <div className="font-serif text-3xl text-f-emerald">{correct}</div>
            <div className="text-xs text-starlight">答对</div>
          </div>
        </div>
        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={load}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-brass/30 py-3 font-semibold text-ivory active:bg-white/5"
          >
            <RotateCcw className="h-4 w-4" /> 再来一轮
          </button>
          <button
            type="button"
            onClick={() => router.push("/compass")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brass py-3 font-semibold text-abyss active:bg-brass-dark"
          >
            回到罗盘
          </button>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="flex min-h-[calc(100vh-var(--mobile-nav-h-safe))] flex-col">
      {/* 顶部进度 + 题头 */}
      <MobileTopBar title={current.bankName} onBack={() => router.push("/compass")} />

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs text-starlight">
          <span>
            第 {cursor + 1} / {total} 题
          </span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-brass/10 px-2 py-0.5 text-brass">
              {QUESTION_TYPE_LABELS[current.type]}
            </span>
            <span className="rounded-full bg-starlight/10 px-2 py-0.5 text-starlight">
              {CARD_STATE_LABELS[current.state]}
            </span>
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-abyss-300">
          <div
            className="h-full rounded-full bg-brass transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 题干（可滚动） */}
      <div
        className="flex-1 overflow-y-auto pb-4"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="rounded-2xl border border-brass/15 bg-abyss-300/50 p-4">
          <div className="font-serif text-lg leading-relaxed text-ivory">
            {current.stem}
          </div>
          {current.knowledgePoints?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {current.knowledgePoints.map((kp) => (
                <span key={kp} className="rounded-full bg-tide/15 px-2 py-0.5 text-[11px] text-tide-light">
                  {kp}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <AnswerInput
            type={current.type}
            options={current.options}
            value={answer}
            onChange={setAnswer}
            disabled={phase === "graded"}
            reveal={phase === "graded"}
            correctAnswer={grade?.correctAnswer}
          />
        </div>

        {phase === "graded" && grade && (
          <div
            className={[
              "mt-4 rounded-2xl border p-4",
              grade.isCorrect
                ? "border-f-emerald/30 bg-f-emerald/10"
                : "border-f-coral2/30 bg-f-coral2/10",
            ].join(" ")}
          >
            <div className="mb-2 flex items-center gap-2">
              {grade.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-f-emerald" />
              ) : (
                <XCircle className="h-5 w-5 text-f-coral2" />
              )}
              <span className={grade.isCorrect ? "text-f-emerald" : "text-f-coral2"}>
                {grade.isCorrect ? "回答正确" : "回答错误"}
              </span>
            </div>
            {grade.explanation && (
              <p className="font-sans text-sm leading-relaxed text-starlight">
                {grade.explanation}
              </p>
            )}
            <p className="mt-2 text-xs text-starlight/60">向左滑动可快速进入下一题</p>
          </div>
        )}
      </div>

      {/* 底部动作区（固定，拇指可达） */}
      <div className="sticky bottom-0 -mx-4 border-t border-brass/10 bg-abyss/95 px-4 py-3 backdrop-blur-md safe-bottom">
        {phase === "answering" ? (
          <button
            type="button"
            onClick={submit}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brass py-3.5 text-base font-semibold text-abyss active:bg-brass-dark"
          >
            提交答案
          </button>
        ) : (
          <MobileRatingDock grade={grade!} onRate={rate} applying={applying} />
        )}
      </div>
    </div>
  );
}

// 移动端底部评分坞：4 个大色块按钮，拇指可达。
function MobileRatingDock({
  grade,
  onRate,
  applying,
}: {
  grade: GradeResult;
  onRate: (r: Rating) => void;
  applying: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {RATING_CONFIG.map((r) => {
        const prev = grade.previews[r.key.toLowerCase() as keyof typeof grade.previews];
        const colorVar = `var(--color-${r.color})`;
        return (
          <button
            key={r.key}
            type="button"
            disabled={applying}
            onClick={() => onRate(r.key)}
            className="flex flex-col items-center gap-1 rounded-xl border border-starlight/15 bg-abyss-300/60 py-2.5 active:scale-95 disabled:opacity-50"
            style={{ borderColor: `${colorVar}55` }}
          >
            <span className="text-base font-semibold" style={{ color: colorVar }}>
              {r.label}
            </span>
            <span className="font-mono text-[10px]" style={{ color: colorVar }}>
              {prev.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
