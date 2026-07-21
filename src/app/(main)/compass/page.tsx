"use client";

// 罗盘首页：刷题总览
// 路由：/compass
//
// 内容：
//   1. 首次进入欢迎引导卡（localStorage 标记，可关闭）
//   2. 今日待复习数 + 连续天数 + 题库数
//   3. 题库舰队网格（点击卡片 → /study?bankId=）
//   4. 快速入口：开始今日答题 / 错题重做

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Ship,
  Anchor,
  Layers,
  Flame,
  Calendar,
  ArrowRight,
  Loader2,
  AlertTriangle,
  X,
  Sparkles,
  Clock,
  Target,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/Button";

interface BankListItem {
  id: string;
  name: string;
  description: string | null;
  coverColor: string;
  tags: string[];
  source: string;
  totalQuestions: number;
  questionCount: number;
  dueCount: number;
  newCardsPerDay: number;
}

interface Overview {
  totalAnswers: number;
  recentAnswers: number;
  recentCorrect: number;
  recentAccuracy: number;
  banksCount: number;
  questionsCount: number;
  wrongCount: number;
  dueTodayCount: number;
  streak: number;
  stateDistribution: Array<{ state: string; count: number }>;
}

const COVER_GRADIENTS: Record<string, string> = {
  brass: "from-brass/25 to-brass-dark/5 border-brass/40",
  tide: "from-tide/25 to-tide-dark/5 border-tide/40",
  coral: "from-coral/25 to-coral-dark/5 border-coral/40",
  starlight: "from-starlight/20 to-starlight-dark/5 border-starlight/30",
};

const ONBOARDING_KEY = "compass:onboarding-v1.1-dismissed";

export default function CompassPage() {
  const [banks, setBanks] = useState<BankListItem[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [banksRes, ovRes] = await Promise.all([
        apiFetch("/api/banks"),
        apiFetch("/api/analytics?days=30"),
      ]);
      if (banksRes.ok) {
        const d = await banksRes.json();
        setBanks(d.banks ?? []);
      }
      if (ovRes.ok) {
        const d = await ovRes.json();
        setOverview(d.overview ?? null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // 首次进入显示 onboarding
    try {
      const dismissed = localStorage.getItem(ONBOARDING_KEY);
      if (!dismissed) setShowOnboarding(true);
    } catch {
      // localStorage 不可用时静默
    }
  }, [load]);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, "1");
    } catch {
      // 静默
    }
  };

  const totalDue = banks.reduce((s, b) => s + b.dueCount, 0);
  const totalQuestions = banks.reduce((s, b) => s + b.questionCount, 0);

  return (
    <div className="space-y-6">
      {/* 首次进入欢迎卡 */}
      {showOnboarding && (
        <div className="relative overflow-hidden rounded-2xl border border-brass/40 bg-gradient-to-br from-brass/10 via-abyss-50/40 to-abyss-700/40 p-6 sm:p-8">
          <button
            type="button"
            onClick={dismissOnboarding}
            aria-label="关闭引导"
            className="absolute right-4 top-4 rounded-full p-1 text-starlight/60 transition-colors hover:bg-white/5 hover:text-ivory"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-brass/40 bg-brass/10">
              <Sparkles className="h-7 w-7 text-brass" />
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-xl text-ivory">欢迎登船，航海者</h2>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-starlight">
                Compass 是基于 FSRS-6 算法的间隔重复刷题工具。导入你的题库，按 1/2/3/4 给回忆打分，
                算法会自动决定每张卡什么时候回来——答得越准，间隔越长。
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-starlight/20 bg-abyss-700/50 px-3 py-1 text-starlight">
                  <Clock className="h-3 w-3 text-brass" /> 4 题型 · 4 键评分
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-starlight/20 bg-abyss-700/50 px-3 py-1 text-starlight">
                  <Layers className="h-3 w-3 text-brass" /> Markdown / Excel / Word 导入
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-starlight/20 bg-abyss-700/50 px-3 py-1 text-starlight">
                  <Target className="h-3 w-3 text-brass" /> 学习画像 + 薄弱知识点
                </span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/study?mode=LEARN"
              onClick={dismissOnboarding}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-brass bg-brass/15 px-4 text-sm font-medium text-brass transition-colors hover:bg-brass/25"
            >
              <Ship className="h-4 w-4" /> 立即开始答题
            </Link>
            <Link
              href="/workshop"
              onClick={dismissOnboarding}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-starlight/30 px-4 text-sm font-medium text-ivory transition-colors hover:bg-brass/10"
            >
              <Layers className="h-4 w-4" /> 创建/导入题库
            </Link>
            <button
              type="button"
              onClick={dismissOnboarding}
              className="inline-flex h-9 items-center px-4 text-sm font-medium text-starlight/70 transition-colors hover:text-ivory"
            >
              稍后再说
            </button>
          </div>
        </div>
      )}

      {/* 顶部欢迎 + 快速操作 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ivory">罗盘</h1>
          <p className="mt-1 font-sans text-sm text-starlight">
            今日待复习 <span className="font-mono text-brass">{totalDue}</span> 题
            {overview && overview.streak > 0 && (
              <>
                {" · "}
                <Flame className="inline h-3.5 w-3.5 text-coral" />
                连续 <span className="font-mono text-coral">{overview.streak}</span> 天
              </>
            )}
            {totalQuestions > 0 && (
              <>
                {" · "}
                共 <span className="font-mono text-ivory">{totalQuestions}</span> 题
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/study?mode=LEARN"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-brass bg-brass/10 px-5 text-sm font-medium text-brass transition-colors hover:bg-brass/20"
          >
            <Ship className="h-4 w-4" /> 开始今日答题
          </Link>
          <Link
            href="/study?mode=WRONG_REDO"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-starlight/40 px-5 text-sm font-medium text-ivory transition-colors hover:bg-brass/10"
          >
            <Anchor className="h-4 w-4" /> 错题重做
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 font-sans text-sm text-coral">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 总览统计条 */}
      {overview && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<Ship className="h-4 w-4" />}
            label="今日待复习"
            value={overview.dueTodayCount}
            color="brass"
          />
          <StatCard
            icon={<Flame className="h-4 w-4" />}
            label="连续天数"
            value={overview.streak}
            color="coral"
          />
          <StatCard
            icon={<Calendar className="h-4 w-4" />}
            label="近 30 天答题"
            value={overview.recentAnswers}
            color="tide"
          />
          <StatCard
            icon={<Anchor className="h-4 w-4" />}
            label="错题本"
            value={overview.wrongCount}
            color="starlight"
          />
        </div>
      )}

      {/* 题库舰队 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ivory">题库舰队</h2>
          <Link
            href="/workshop"
            className="inline-flex items-center gap-1 font-sans text-xs text-starlight hover:text-brass"
          >
            管理全部 <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-brass" />
          </div>
        ) : banks.length === 0 ? (
          <EmptyFleet />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {banks.map((bank) => (
              <BankMiniCard key={bank.id} bank={bank} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "brass" | "coral" | "tide" | "starlight";
}) {
  const colorMap: Record<string, string> = {
    brass: "text-brass",
    coral: "text-coral",
    tide: "text-tide-light",
    starlight: "text-starlight",
  };
  return (
    <div className="rounded-xl border border-starlight/15 bg-abyss-50/30 p-4 transition-colors hover:border-brass/30">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs text-starlight/70">{label}</span>
        <span className={colorMap[color]}>{icon}</span>
      </div>
      <p className={`mt-2 font-serif text-3xl ${colorMap[color]}`}>{value}</p>
    </div>
  );
}

function BankMiniCard({ bank }: { bank: BankListItem }) {
  const gradient = COVER_GRADIENTS[bank.coverColor] ?? COVER_GRADIENTS.brass;
  const progress = bank.questionCount > 0
    ? Math.min(100, Math.round(((bank.questionCount - bank.dueCount) / bank.questionCount) * 100))
    : 0;
  return (
    <Link
      href={`/study?bankId=${bank.id}&mode=LEARN`}
      className={`group block rounded-xl border bg-gradient-to-br p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brass/10 ${gradient}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-brass" />
          <h3 className="font-serif text-base text-ivory group-hover:text-brass-light">
            {bank.name}
          </h3>
        </div>
        {bank.dueCount > 0 ? (
          <span className="rounded-full border border-coral/40 bg-coral/10 px-2 py-0.5 font-mono text-[10px] text-coral">
            {bank.dueCount} 待复习
          </span>
        ) : (
          <span className="rounded-full border border-f-emerald/30 bg-f-emerald/5 px-2 py-0.5 font-mono text-[10px] text-f-emerald">
            已完成
          </span>
        )}
      </div>

      {bank.description && (
        <p className="mt-2 line-clamp-2 font-sans text-xs leading-relaxed text-starlight/80">
          {bank.description}
        </p>
      )}

      {bank.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {bank.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded border border-starlight/20 bg-abyss-700/30 px-1.5 py-0.5 font-mono text-[10px] text-starlight/70"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 进度条 */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-starlight/60">
          <span>共 {bank.questionCount} 题</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-abyss-700/60">
          <div
            className="h-full bg-gradient-to-r from-brass-dark to-brass transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function EmptyFleet() {
  return (
    <div className="rounded-2xl border border-dashed border-starlight/20 bg-abyss-50/20 p-10 text-center">
      <Ship className="mx-auto h-10 w-10 text-brass/50" />
      <h3 className="mt-3 font-serif text-lg text-ivory">还没有题库</h3>
      <p className="mt-1 font-sans text-xs text-starlight">
        先去造船工坊创建一个题库，或从文件导入
      </p>
      <Link
        href="/workshop"
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-brass bg-brass/10 px-4 text-sm font-medium text-brass hover:bg-brass/20"
      >
        <Layers className="h-4 w-4" /> 前往造船工坊
      </Link>
    </div>
  );
}
