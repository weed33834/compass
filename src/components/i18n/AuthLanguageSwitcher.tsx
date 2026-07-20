"use client";

import { Globe } from "lucide-react";
import { useTranslation } from "./useTranslation";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// 紧凑版语言切换器：用于登录/注册/忘记密码等公开页面
// 渲染为极简的按钮组（中文 / EN），不依赖 select，视觉上融入深海主题
export function AuthLanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  function handleChange(next: Locale) {
    if (next === locale) return;
    setLocale(next);
    fetch("/api/user/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).catch(() => {});
    setTimeout(() => window.location.reload(), 200);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-starlight/20 bg-abyss-200/30 p-0.5 text-xs",
        className
      )}
      role="group"
      aria-label="Language / 语言"
    >
      <Globe className="ml-1.5 h-3 w-3 text-starlight/60" aria-hidden="true" />
      <button
        type="button"
        onClick={() => handleChange("zh-CN")}
        className={cn(
          "rounded px-2 py-1 font-medium transition-colors",
          locale === "zh-CN"
            ? "bg-brass/20 text-brass"
            : "text-starlight hover:text-ivory"
        )}
        aria-pressed={locale === "zh-CN"}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => handleChange("en")}
        className={cn(
          "rounded px-2 py-1 font-medium transition-colors",
          locale === "en"
            ? "bg-brass/20 text-brass"
            : "text-starlight hover:text-ivory"
        )}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
