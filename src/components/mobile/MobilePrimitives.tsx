"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

// 移动端通用卡片：比桌面玻璃面板更紧凑、圆角更大、点击有轻微缩放反馈。
export function MobileCard({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-brass/15 bg-abyss-300/60 p-4",
        onClick && "active:scale-[0.985] transition-transform",
        className
      )}
    >
      {children}
    </div>
  );
}

// 区块标题（带左侧黄铜短竖线）。
export function MobileSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 px-1 font-serif text-base font-semibold text-ivory">
      <span className="h-4 w-1 rounded-full bg-brass" />
      {children}
    </h2>
  );
}

// 空状态占位。
export function MobileEmpty({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-brass/20 px-6 py-12 text-center">
      {icon && <div className="text-brass/60">{icon}</div>}
      <p className="font-medium text-ivory">{title}</p>
      {hint && <p className="text-sm text-starlight">{hint}</p>}
    </div>
  );
}

// 移动端主操作按钮（全宽、大触控目标）。
export function MobilePrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl bg-brass py-3.5 text-base font-semibold text-abyss transition-colors active:bg-brass-dark disabled:opacity-50",
        className
      )}
    >
      {loading && (
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
