"use client";

// 账户中心
// 路由：/account
//
// 功能：
//   1. 显示用户基本信息（头像、邮箱、注册时间）
//   2. 主题切换（深海 / 羊皮纸）
//   3. FSRS 全局参数预览（只读；后续可加编辑）
//   4. 退出登录

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  User,
  Mail,
  Calendar,
  Palette,
  LogOut,
  Sun,
  Moon,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

type Theme = "deep-sea" | "parchment";

export default function AccountPage() {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<Theme>("deep-sea");
  const [createdAt, setCreatedAt] = useState<string>("");

  // 读取本地存储的主题
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("compass-theme")) as Theme | null;
    if (saved) setTheme(saved);
    // 读取用户注册时间（从 session JWT 中若有 emailUpdatedAt 则用，否则无）
    if (session?.user) {
      // session 中没有 createdAt；先留空
    }
  }, [session]);

  // 应用主题：在 body 上设置 data-theme
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("compass-theme", theme);
  }, [theme]);

  const userName = session?.user?.name ?? "航海者";
  const userEmail = session?.user?.email ?? "";
  const avatarChar = (Array.from(userName)[0] ?? "U").toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ivory">账户中心</h1>
        <p className="mt-1 font-sans text-sm text-starlight">管理个人信息与界面偏好</p>
      </div>

      {/* 个人信息卡片 */}
      <div className="rounded-2xl border border-starlight/15 bg-abyss-50/30 p-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border border-brass/40 bg-abyss-300 font-serif text-2xl text-brass"
            role="img"
            aria-label={`${userName} 头像`}
          >
            {avatarChar}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-brass" />
              <h2 className="font-serif text-xl text-ivory">{userName}</h2>
            </div>
            <div className="mt-1 flex items-center gap-2 font-sans text-xs text-starlight">
              <Mail className="h-3 w-3" />
              <span className="truncate">{userEmail || "—"}</span>
            </div>
            {createdAt && (
              <div className="mt-1 flex items-center gap-2 font-sans text-xs text-starlight/60">
                <Calendar className="h-3 w-3" />
                <span>注册于 {new Date(createdAt).toLocaleDateString("zh-CN")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 主题偏好 */}
      <div className="rounded-2xl border border-starlight/15 bg-abyss-50/30 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-brass" />
          <h2 className="font-serif text-lg text-ivory">界面主题</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ThemeCard
            active={theme === "deep-sea"}
            onClick={() => setTheme("deep-sea")}
            title="深海航海"
            desc="深色背景 + 黄铜辉光"
            icon={<Moon className="h-4 w-4" />}
            previewClass="bg-abyss-700 border-brass/40"
          />
          <ThemeCard
            active={theme === "parchment"}
            onClick={() => setTheme("parchment")}
            title="羊皮纸"
            desc="暖色奶油 + 深棕字"
            icon={<Sun className="h-4 w-4" />}
            previewClass="bg-ivory-200 border-tide/40"
          />
        </div>
      </div>

      {/* FSRS 参数预览 */}
      <div className="rounded-2xl border border-starlight/15 bg-abyss-50/30 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-4 w-4 text-brass" />
          <h2 className="font-serif text-lg text-ivory">学习算法</h2>
        </div>
        <div className="space-y-2 font-sans text-xs">
          <Row label="算法版本" value="FSRS-6（21 个权重）" />
          <Row label="目标记忆保留率" value="90%" />
          <Row label="最大间隔" value="100 年" />
          <Row label="学习步骤" value="1 分钟 → 10 分钟" />
          <Row label="重学步骤" value="10 分钟" />
          <Row label="模糊度" value="开启（±5%）" />
        </div>
        <p className="mt-4 font-sans text-[11px] text-starlight/60">
          算法参数当前由系统统一管理。后续将开放个人调优入口。
        </p>
      </div>

      {/* 快速跳转 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/analytics"
          className="rounded-xl border border-starlight/15 bg-abyss-50/30 p-4 transition-colors hover:border-brass/40"
        >
          <h3 className="font-serif text-sm text-ivory">查看航迹分析</h3>
          <p className="mt-1 font-sans text-[11px] text-starlight/70">学情数据与薄弱知识点</p>
        </Link>
        <Link
          href="/workshop"
          className="rounded-xl border border-starlight/15 bg-abyss-50/30 p-4 transition-colors hover:border-brass/40"
        >
          <h3 className="font-serif text-sm text-ivory">管理题库</h3>
          <p className="mt-1 font-sans text-[11px] text-starlight/70">新建 / 导入 / 编辑题目</p>
        </Link>
      </div>

      {/* 退出登录 */}
      <div className="rounded-2xl border border-coral/20 bg-coral/5 p-6">
        <h2 className="font-serif text-lg text-ivory">退出登录</h2>
        <p className="mt-1 font-sans text-xs text-starlight/70">
          退出当前账户后需要重新登录才能继续刷题
        </p>
        <Button
          variant="secondary"
          className="mt-4 border-coral/40 text-coral hover:bg-coral/10"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" /> 退出登录
        </Button>
      </div>
    </div>
  );
}

function ThemeCard({
  active,
  onClick,
  title,
  desc,
  icon,
  previewClass,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
  icon: React.ReactNode;
  previewClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
        active
          ? "border-brass bg-brass/10"
          : "border-starlight/15 bg-abyss-700/30 hover:border-starlight/30"
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${previewClass}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-sm text-ivory">{title}</p>
        <p className="mt-0.5 font-sans text-[11px] text-starlight/70">{desc}</p>
      </div>
      {active && (
        <span className="font-mono text-[10px] text-brass">●</span>
      )}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-starlight/10 pb-1.5">
      <span className="text-starlight/70">{label}</span>
      <span className="font-mono text-ivory">{value}</span>
    </div>
  );
}
