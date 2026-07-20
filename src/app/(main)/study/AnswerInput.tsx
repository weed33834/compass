"use client";

// 答题输入组件：根据题型渲染不同输入
// 4 种题型：
//   - SINGLE_CHOICE：单选按钮组
//   - MULTI_CHOICE：复选按钮组
//   - TRUE_FALSE：判断（对/错二选一）
//   - FILL_BLANK：每空一个输入框
//
// 受控组件：value 是 userAnswer，onChange 回调上传新值
// 答题阶段可编辑，提交后父组件置 disabled

import { useId } from "react";
import type { QuestionType, QuestionOption } from "./types";

interface AnswerInputProps {
  type: QuestionType;
  options: unknown;             // QuestionOption[]
  value: unknown;               // 当前用户答案
  onChange: (v: unknown) => void;
  disabled?: boolean;
  reveal?: boolean;             // 是否进入"显示对错"阶段
  correctAnswer?: unknown;      // reveal=true 时用于高亮正确选项
}

// 把 options JSON 转成强类型数组
function parseOptions(options: unknown): QuestionOption[] {
  if (!Array.isArray(options)) return [];
  return options as QuestionOption[];
}

export function AnswerInput({
  type,
  options,
  value,
  onChange,
  disabled = false,
  reveal = false,
  correctAnswer,
}: AnswerInputProps) {
  const opts = parseOptions(options);
  const baseId = useId();

  // 单选 / 判断：value 是 string
  if (type === "SINGLE_CHOICE" || type === "TRUE_FALSE") {
    const selected = typeof value === "string" ? value : "";

    return (
      <div className="space-y-3" role="radiogroup" aria-disabled={disabled}>
        {opts.map((opt) => {
          const isSelected = selected === opt.key;
          const isCorrect = reveal && opt.correct === true;
          const isWrong = reveal && isSelected && opt.correct !== true;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              id={`${baseId}-${opt.key}`}
              onClick={() => !disabled && onChange(opt.key)}
              className={[
                "group flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                "border-starlight/15 bg-abyss-50/30 hover:border-brass/40 hover:bg-brass/5",
                isSelected ? "border-brass bg-brass/10 ring-1 ring-brass/40" : "",
                isCorrect ? "!border-f-emerald !bg-f-emerald/10 ring-1 ring-f-emerald/40" : "",
                isWrong ? "!border-f-coral2 !bg-f-coral2/10 ring-1 ring-f-coral2/40" : "",
                disabled && !reveal ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-bold",
                  isSelected
                    ? "border-brass bg-brass text-abyss"
                    : "border-starlight/30 text-starlight",
                  isCorrect ? "!border-f-emerald !bg-f-emerald !text-abyss" : "",
                  isWrong ? "!border-f-coral2 !bg-f-coral2 !text-ivory" : "",
                ].join(" ")}
              >
                {opt.key}
              </span>
              <span className="flex-1 font-sans text-sm leading-relaxed text-ivory">
                {opt.text}
              </span>
              {isCorrect && (
                <span className="text-f-emerald text-xs font-mono">✓ 正确</span>
              )}
              {isWrong && (
                <span className="text-f-coral2 text-xs font-mono">✗ 你选的</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // 多选：value 是 string[]
  if (type === "MULTI_CHOICE") {
    const selected = Array.isArray(value) ? value as string[] : [];

    const toggle = (key: string) => {
      if (disabled) return;
      const next = selected.includes(key)
        ? selected.filter((k) => k !== key)
        : [...selected, key];
      onChange(next);
    };

    return (
      <div className="space-y-3" role="group" aria-disabled={disabled}>
        {opts.map((opt) => {
          const isSelected = selected.includes(opt.key);
          const isCorrect = reveal && opt.correct === true;
          const isWrong = reveal && isSelected && opt.correct !== true;
          const isMissing = reveal && !isSelected && opt.correct === true;
          return (
            <button
              key={opt.key}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => toggle(opt.key)}
              className={[
                "group flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                "border-starlight/15 bg-abyss-50/30 hover:border-brass/40 hover:bg-brass/5",
                isSelected ? "border-brass bg-brass/10 ring-1 ring-brass/40" : "",
                isCorrect ? "!border-f-emerald !bg-f-emerald/10" : "",
                isWrong ? "!border-f-coral2 !bg-f-coral2/10" : "",
                isMissing ? "!border-f-amber/60 !bg-f-amber/5" : "",
                disabled && !reveal ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-mono font-bold",
                  isSelected
                    ? "border-brass bg-brass text-abyss"
                    : "border-starlight/30 text-starlight",
                  isCorrect ? "!border-f-emerald !bg-f-emerald !text-abyss" : "",
                  isWrong ? "!border-f-coral2 !bg-f-coral2 !text-ivory" : "",
                  isMissing ? "!border-f-amber" : "",
                ].join(" ")}
              >
                {isSelected ? "✓" : opt.key}
              </span>
              <span className="flex-1 font-sans text-sm leading-relaxed text-ivory">
                {opt.text}
              </span>
              {isCorrect && <span className="text-f-emerald text-xs">正确</span>}
              {isWrong && <span className="text-f-coral2 text-xs">你选的</span>}
              {isMissing && <span className="text-f-amber text-xs">漏选</span>}
            </button>
          );
        })}
        <p className="font-sans text-xs text-starlight/60">
          多选：完全对满分，漏选部分给分，错选 0 分
        </p>
      </div>
    );
  }

  // 填空：value 是 string[]，每个空一个 input
  if (type === "FILL_BLANK") {
    const blanks = opts.filter((o) => o.answer != null || o.placeholder != null);
    const arr = Array.isArray(value) ? value as string[] : [];
    const correctArr = Array.isArray(correctAnswer) ? correctAnswer as string[] : [];

    return (
      <div className="space-y-4" aria-disabled={disabled}>
        {blanks.map((blank, idx) => {
          const v = arr[idx] ?? "";
          const isCorrect = reveal && correctArr[idx] != null
            && normalize(v) === normalize(String(correctArr[idx]));
          const isWrong = reveal && !isCorrect;
          return (
            <div key={idx} className="space-y-1.5">
              <label
                htmlFor={`${baseId}-blank-${idx}`}
                className="font-sans text-xs text-starlight"
              >
                填空 {idx + 1}
                {blank.placeholder && (
                  <span className="ml-2 text-starlight/50">（{blank.placeholder}）</span>
                )}
              </label>
              <input
                id={`${baseId}-blank-${idx}`}
                type="text"
                value={v}
                disabled={disabled}
                onChange={(e) => {
                  const next = [...arr];
                  next[idx] = e.target.value;
                  onChange(next);
                }}
                placeholder={blank.placeholder ?? `第 ${idx + 1} 空`}
                className={[
                  "w-full rounded-lg border bg-abyss-700/50 px-4 py-2.5 font-sans text-sm text-ivory placeholder:text-starlight/40",
                  "border-starlight/20 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass/40",
                  "transition-colors",
                  isCorrect ? "!border-f-emerald !bg-f-emerald/10" : "",
                  isWrong ? "!border-f-coral2 !bg-f-coral2/10" : "",
                ].join(" ")}
              />
              {reveal && isWrong && (
                <p className="font-sans text-xs text-f-emerald">
                  正确答案：<span className="font-mono">{String(correctArr[idx] ?? "")}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "");
}
