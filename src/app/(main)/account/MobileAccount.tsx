"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  BarChart3,
  BookOpen,
  LogOut,
  ChevronRight,
  Settings,
  Anchor,
} from "lucide-react";
import { MobileCard, MobileSectionTitle } from "@/components/mobile/MobilePrimitives";

const SECONDARY = [
  { href: "/analytics", label: "航迹分析", icon: BarChart3 },
  { href: "/logbook", label: "航海日志", icon: BookOpen },
  { href: "/wrongbook", label: "错题漂流瓶", icon: Anchor },
] as const;

export function MobileAccount() {
  const { data: session } = useSession();
  const router = useRouter();
  const userName = session?.user?.name ?? "航海者";
  const userEmail = session?.user?.email ?? "";
  const avatarChar = (Array.from(userName)[0] ?? "U").toUpperCase();

  return (
    <div className="space-y-5">
      {/* 个人卡片 */}
      <MobileCard className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-brass/40 bg-abyss-300 text-2xl font-semibold text-brass">
          {avatarChar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-xl font-semibold text-ivory">{userName}</p>
          <p className="truncate text-sm text-starlight">{userEmail}</p>
        </div>
      </MobileCard>

      {/* 次要导航（桌面侧栏其余目的地） */}
      <div>
        <MobileSectionTitle>航行工具</MobileSectionTitle>
        <div className="space-y-2.5">
          {SECONDARY.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="block">
                <MobileCard className="flex items-center gap-3 py-3.5">
                  <Icon className="h-5 w-5 text-brass" />
                  <span className="flex-1 font-medium text-ivory">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-starlight/50" />
                </MobileCard>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 退出登录 */}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-coral/40 bg-coral/10 py-3.5 font-semibold text-coral active:bg-coral/20"
      >
        <LogOut className="h-4 w-4" /> 退出登录
      </button>

      <p className="px-1 text-center text-xs text-starlight/50">
        Compass · 基于 FSRS-6 的间隔重复刷题工具
      </p>
    </div>
  );
}
