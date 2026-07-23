import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/app/providers";
import { getAuthUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n";

const SITE_DESCRIPTION =
  "Compass · 刷题罗盘 — 基于 FSRS-6 算法的自托管间隔重复刷题工具。导入 Markdown / Excel / Word 题库，键盘驱动答题，算法自动调度复习节奏。Anki 的现代自托管替代品。";

const SITE_KEYWORDS = [
  "Compass",
  "刷题罗盘",
  "间隔重复",
  "spaced repetition",
  "FSRS",
  "FSRS-6",
  "刷题",
  "题库",
  "错题本",
  "记忆",
  "复习",
  "Anki 替代",
  "Anki alternative",
  "自托管",
  "self-hosted",
  "SuperMemo",
  "flashcard",
];

export const metadata: Metadata = {
  title: {
    default: "Compass · 刷题罗盘 — FSRS-6 自托管间隔重复刷题工具",
    template: "%s · Compass 刷题罗盘",
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: "Compass",
  manifest: "/manifest.json",
  authors: [{ name: "Compass Contributors" }],
  creator: "Compass Contributors",
  publisher: "Compass",
  category: "education",
  metadataBase: new URL("https://gitcode.com/badhope/compass"),
  alternates: {
    canonical: "https://gitcode.com/badhope/compass",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "https://gitcode.com/badhope/compass",
    siteName: "Compass · 刷题罗盘",
    title: "Compass · 刷题罗盘 — FSRS-6 自托管间隔重复刷题工具",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Compass · 刷题罗盘",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0f14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 根布局：注入字体 CSS 变量与全局 Provider
// 服务端读取用户主题并写入 <html data-theme>，避免主题闪烁（FOUC）：
// - 未登录或读取失败 → 默认 deep-sea
// - 登录用户 → 取 DB 中的 theme（profile 改主题后 router.refresh() 即生效）
//
// locale 同理：登录用户读 user.locale，未登录读 cookie（LanguageSwitcher 写入），
// 都没有时回退 defaultLocale。I18nProvider 用 initialLocale 初始化 client state
function resolveLocale(cookieValue: string | undefined): Locale {
  return isLocale(cookieValue) ? cookieValue : defaultLocale;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let theme = "deep-sea";
  let locale: Locale = defaultLocale;
  try {
    // 未登录用户从 cookie 读取语言偏好（LanguageSwitcher 切换时写入）
    const cookieStore = await cookies();
    locale = resolveLocale(cookieStore.get("locale")?.value);

    const userId = await getAuthUserId();
    if (userId) {
      // 登录用户：DB 中的 theme / locale 优先于 cookie
      const u = await prisma.user.findUnique({
        where: { id: userId },
        select: { theme: true, locale: true },
      });
      if (u?.theme) theme = u.theme;
      if (u?.locale && isLocale(u.locale)) locale = u.locale;
    }
  } catch {
    // 取数失败时保持默认主题与默认语言，不阻塞首屏渲染
  }

  return (
    <html lang={locale} data-theme={theme}>
      <head />
      <body>
        <Script id="sw-register" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) { window.addEventListener('load', function() { navigator.serviceWorker.register('/sw.js'); }); }`}
        </Script>
        <Providers initialLocale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
