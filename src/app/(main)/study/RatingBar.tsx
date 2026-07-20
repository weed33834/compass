"use client";

// 4 键评分条：用户作答后，对自身记忆程度自评
// 再次 / 困难 / 良好 / 简单 四档，对应 FSRS Rating.Again/Hard/Good/Easy
// 显示每个评分对应的下一次间隔（来自后端 previews）
// 支持快捷键 1/2/3/4

import { useEffect } from "react";
import { RATING_CONFIG, type Rating, type SubmitResult } from "./types";

interface RatingBarProps {
  result: SubmitResult;            // 提交后的判分结果（含 previews）
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}

export function RatingBar({ result, onRate, disabled = false }: RatingBarProps) {
  // 快捷键 1/2/3/4
  useEffect(() => {
    if (disabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx >= 0) {
        e.preventDefault();
        onRate(RATING_CONFIG[idx].key);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onRate, disabled]);

  const previews = result.previews;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-base text-ivory">记忆评分</h3>
        <span className="font-sans text-xs text-starlight/60">
          按 <kbd className="rounded border border-starlight/30 px-1.5 py-0.5 text-[10px]">1</kbd>
          -<kbd className="rounded border border-starlight/30 px-1.5 py-0.5 text-[10px]">4</kbd> 快捷评分
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {RATING_CONFIG.map((r) => {
          const prev = previews[r.key.toLowerCase() as keyof typeof previews];
          const colorVar = `var(--color-${r.color}, var(--color-brass))`;
          return (
            <button
              key={r.key}
              type="button"
              disabled={disabled}
              onClick={() => onRate(r.key)}
              className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-starlight/15 bg-abyss-50/40 p-4 transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {/* 顶部色条 */}
              <span
                className="absolute left-3 right-3 top-0 h-0.5 rounded-b-full opacity-60 group-hover:opacity-100"
                style={{ backgroundColor: colorVar }}
              />
              <span
                className="font-serif text-lg"
                style={{ color: colorVar }}
              >
                {r.label}
              </span>
              <span className="font-sans text-[11px] text-starlight/70">{r.hint}</span>
              <span className="mt-1 font-mono text-xs text-starlight">
                {prev.label}
              </span>
              <span className="absolute right-2 top-2 font-mono text-[10px] text-starlight/40">
                {r.hotkey}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-center font-sans text-xs text-starlight/50">
        当前判分：<span className="text-ivory">{result.isCorrect ? "✓ 答对" : "✗ 答错"}</span>
        {result.partialScore > 0 && result.partialScore < 1 && (
          <span className="ml-2 text-f-amber">部分得分 {Math.round(result.partialScore * 100)}%</span>
        )}
        <span className="ml-2">下次复习：<span className="text-brass">{result.nextIntervalLabel}</span></span>
      </p>
    </div>
  );
}
