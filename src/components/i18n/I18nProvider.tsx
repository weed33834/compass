"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Locale } from "@/lib/i18n";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  // 翻译函数：t(namespace, key)，找不到时回退到 zh-CN，再回退到 key 本身
  t: (namespace: string, key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// I18n Provider：从 layout 注入 initialLocale（服务端读 cookie / user.locale）
// setLocale 时同步写入 cookie，下次 SSR 即生效；client 端立即更新 state 触发重渲染
export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    // 持久化到 cookie：服务端 layout 下次读取（max-age 1 年）
    document.cookie = `locale=${l}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; samesite=lax`;
  }, []);

  const t = useCallback(
    (namespace: string, key: string): string => {
      const ns = (dictionaries as Record<
        string,
        Record<string, Record<Locale, string>>
      >)[namespace];
      if (!ns) return key;
      const entry = ns[key];
      if (!entry) return key;
      return entry[locale] ?? entry["zh-CN"] ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// 消费 hook：在 I18nProvider 内任意 client 组件中调用
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n 必须在 I18nProvider 内使用");
  }
  return ctx;
}
