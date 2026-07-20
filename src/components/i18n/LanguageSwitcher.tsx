"use client";

import { useTranslation } from "./useTranslation";
import type { Locale } from "@/lib/i18n";

// 语言切换器：在个人中心偏好区块使用
// - 立即更新 I18nProvider state（client 端文案即时切换）
// - 同步写 cookie（I18nProvider 内部已处理）
// - 调 /api/user/locale 持久化到 User.locale（已登录时；未登录静默失败，cookie 仍生效）
// - 200ms 后刷新页面，让 server component（layout 的 <html lang>) 重新读取
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  function handleChange(value: string) {
    if (value !== "zh-CN" && value !== "en") return;
    const next = value as Locale;
    setLocale(next);
    // 持久化到用户记录（已登录时；未登录返回 401，静默忽略，cookie 已生效）
    fetch("/api/user/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).catch(() => {
      // 网络异常静默失败：cookie 已设置，下次访问仍生效
    });
    // 刷新让 server component 重新读取 locale（<html lang>、SSR 文案等）
    setTimeout(() => window.location.reload(), 200);
  }

  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-starlight">
        {t("profile", "language")}
      </span>
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-md border border-starlight/20 bg-abyss-200/40 px-3 py-1.5 text-sm text-ivory focus:border-brass focus:outline-none"
        aria-label={t("profile", "language")}
      >
        <option value="zh-CN">中文</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
