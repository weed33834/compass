"use client";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import type { Locale } from "@/lib/i18n";

// 客户端 Provider 集合：Session / I18n / Toast
// initialLocale 由服务端 layout 从 user.locale / cookie 读取后注入，
// I18nProvider 内部 useState 初始化，切换语言时同步写 cookie
export function Providers({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  return (
    <SessionProvider>
      <I18nProvider initialLocale={initialLocale}>
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
