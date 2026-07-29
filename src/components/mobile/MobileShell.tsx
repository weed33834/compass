"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Compass,
  Plus,
  Anchor,
  User,
  Ship,
  ChevronLeft,
  BarChart3,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/i18n/useTranslation";
import { signOut } from "next-auth/react";

// 移动端底部主导航（4 个常驻 Tab + 中央「开始刷题」悬浮按钮）。
// 与桌面左侧侧栏是完全不同的信息结构与交互模型：
// - 桌面：240px 常驻侧栏 + hover 态 + 键盘可达
// - 移动：拇指可达的底部 Tab + 大色块 FAB + 全屏内容区
const tabs = [
  { href: "/compass", labelKey: "compass", icon: Compass },
  { href: "/workshop", labelKey: "workshop", icon: Plus },
  { href: "/wrongbook", labelKey: "wrongbook", icon: Anchor },
  { href: "/account", labelKey: "account", icon: User },
] as const;

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const onStudy = pathname.startsWith("/study");

  return (
    <div className="min-h-screen bg-abyss text-ivory">
      <main className="mx-auto w-full max-w-2xl px-4 pb-[calc(var(--mobile-nav-h-safe)+12px)] pt-[max(14px,env(safe-area-inset-top))]">
        {children}
      </main>

      {/* 底部导航 + 中央 FAB */}
      <nav
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-brass/15 bg-abyss-600/95 backdrop-blur-md"
        style={{ height: "var(--mobile-nav-h)" }}
        aria-label="主导航"
      >
        <div className="relative mx-auto flex h-full max-w-2xl items-stretch justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  active ? "text-brass" : "text-starlight"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{t("nav", tab.labelKey)}</span>
              </Link>
            );
          })}

          {/* 中央 FAB：开始刷题（答题舱） */}
          <Link
            href="/study"
            aria-label={t("nav", "study")}
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
          >
            <span
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full border-2 border-abyss bg-brass text-abyss shadow-lg shadow-brass/30 transition-transform active:scale-95",
                onStudy && "ring-2 ring-brass/50"
              )}
            >
              <Ship className="h-6 w-6" />
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

// 移动端通用顶栏：返回（或回首页）+ 标题 + 右侧操作区。
// 与桌面顶部用户信息栏不同，移动端顶栏专注于「当前页上下文」。
export function MobileTopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const goBack = onBack ?? (() => router.back());

  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-1 border-b border-brass/10 bg-abyss/90 px-2 py-2.5 backdrop-blur-md">
      <button
        type="button"
        onClick={goBack}
        aria-label="返回"
        className="tap-target -ml-1 flex h-10 w-10 items-center justify-center rounded-full text-starlight active:bg-white/5"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <h1 className="flex-1 truncate font-serif text-lg font-semibold text-ivory">{title}</h1>
      {right}
    </header>
  );
}

// 移动端「更多」入口（个人中心页内使用）：罗列桌面侧栏里其余目的地。
export const MOBILE_SECONDARY_NAV = [
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/logbook", labelKey: "logbook", icon: BookOpen },
] as const;
