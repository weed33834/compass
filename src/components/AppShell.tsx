"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Compass,
  BookOpen,
  BarChart3,
  User,
  Anchor,
  Ship,
  Plus,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/i18n/useTranslation";
import { signOut } from "next-auth/react";

// 导航项配置：路径、i18n key、图标
// 沿用航海隐喻：罗盘=首页 / 答题舱=刷题 / 工坊=题库管理 / 漂流瓶=错题本 / 日志=答题记录 / 分析=学情
const navItems = [
  { href: "/compass", labelKey: "compass", icon: Compass },
  { href: "/study", labelKey: "study", icon: Ship },
  { href: "/workshop", labelKey: "workshop", icon: Plus },
  { href: "/wrongbook", labelKey: "wrongbook", icon: Anchor },
  { href: "/logbook", labelKey: "logbook", icon: BookOpen },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/account", labelKey: "account", icon: User },
] as const;

// 判断当前路径是否命中某个导航项（含子路径）
function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// 已登录页面的布局壳：
// - 桌面端左侧固定 240px 导航栏
// - 顶部展示用户信息
// - 移动端改为底部标签栏
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const userName = session?.user?.name ?? "航海者";
  const avatarChar = (Array.from(userName)[0] ?? "U").toUpperCase();

  return (
    <div className="min-h-screen bg-abyss">
      {/* 桌面端左侧固定导航栏（240px） */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r border-brass/15 bg-abyss-600/80 backdrop-blur-md md:flex">
        {/* 品牌标识 */}
        <div className="flex h-16 items-center gap-2 border-b border-brass/10 px-6">
          <Compass className="h-6 w-6 text-brass" />
          <span className="font-serif text-xl font-semibold text-ivory">
            Compass
          </span>
        </div>
        {/* 导航菜单 */}
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brass/10 text-brass"
                    : "text-starlight hover:bg-white/5 hover:text-ivory"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {t("nav", item.labelKey)}
              </Link>
            );
          })}
        </nav>
        {/* 底部退出登录 */}
        <div className="border-t border-brass/10 p-3">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-starlight transition-colors hover:bg-white/5 hover:text-coral"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {t("nav", "signOut")}
          </button>
        </div>
      </aside>

      {/* 主内容区：左侧留出 240px 给侧边栏 */}
      <div className="md:pl-60">
        {/* 顶部用户信息栏 */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-brass/10 bg-abyss/80 px-4 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-brass md:hidden" />
            <span className="font-serif text-lg font-semibold text-ivory md:hidden">
              Compass
            </span>
          </div>
          {/* 右侧：用户信息 */}
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brass/40 bg-abyss-300 text-sm font-semibold text-brass"
              role="img"
              aria-label={`${userName} 头像`}
            >
              {avatarChar}
            </div>
            <span className="hidden text-sm text-ivory sm:inline">{userName}</span>
          </div>
        </header>

        {/* 页面内容：最大宽度 7xl 居中，移动端为底部标签栏预留空间 */}
        <main className="mx-auto max-w-7xl px-4 py-8 pb-24 md:px-8 md:pb-8">
          {children}
        </main>
      </div>

      {/* 移动端底部标签栏 */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-brass/15 bg-abyss-600/95 backdrop-blur-md md:hidden"
        role="navigation"
        aria-label="主导航"
      >
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          const label = t("nav", item.labelKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              title={label}
              className={cn(
                "group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2.5 px-1 min-h-[48px] text-[10px] leading-tight font-medium transition-colors",
                active ? "text-brass" : "text-starlight hover:text-ivory"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 h-1 w-1 rounded-full bg-brass"
                />
              )}
              <span className="hidden sm:inline truncate max-w-full">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
