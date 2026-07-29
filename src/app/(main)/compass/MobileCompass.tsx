"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ship,
  Flame,
  Anchor,
  Layers,
  Loader2,
  AlertTriangle,
  ArrowRight,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { MobileCard, MobileSectionTitle, MobileEmpty } from "@/components/mobile/MobilePrimitives";

interface BankListItem {
  id: string;
  name: string;
  description: string | null;
  coverColor: string;
  tags: string[];
  questionCount: number;
  dueCount: number;
  totalQuestions: number;
}

interface Overview {
  dueTodayCount: number;
  streak: number;
  wrongCount: number;
  banksCount: number;
  questionsCount: number;
  recentAccuracy: number;
}

const COVER: Record<string, string> = {
  brass: "from-brass/30 to-brass-dark/10 border-brass/40",
  tide: "from-tide/30 to-tide-dark/10 border-tide/40",
  coral: "from-coral/30 to-coral-dark/10 border-coral/40",
  starlight: "from-starlight/25 to-starlight-dark/10 border-starlight/30",
};

export function MobileCompass() {
  const router = useRouter();
  const [banks, setBanks] = useState<BankListItem[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

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
    load();
    try {
      if (!localStorage.getItem("compass:onboarding-v1.1-dismissed")) setShowGuide(true);
    } catch {
      /* 静默 */
    }
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-starlight">
        <Loader2 className="h-8 w-8 animate-spin text-brass" />
        <p>正在校准罗盘…</p>
      </div>
    );
  }

  const dueTotal = banks.reduce((s, b) => s + (b.dueCount ?? 0), 0);
  const streak = overview?.streak ?? 0;

  return (
    <div className="space-y-5">
      {showGuide && (
        <div className="relative rounded-2xl border border-brass/40 bg-gradient-to-br from-brass/10 to-abyss-700/40 p-4">
          <button
            type="button"
            onClick={() => {
              setShowGuide(false);
              try {
                localStorage.setItem("compass:onboarding-v1.1-dismissed", "1");
              } catch {}
            }}
            aria-label="关闭引导"
            className="absolute right-3 top-3 rounded-full p-1 text-starlight/60"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="font-serif text-lg text-ivory">欢迎登船，航海者</p>
          <p className="mt-1 text-sm leading-relaxed text-starlight">
            基于 FSRS-6 间隔重复。答完按记忆程度评分，算法自动安排复习。
          </p>
        </div>
      )}

      {/* Hero：今日待复习 + 开始刷题 */}
      <div className="rounded-3xl border border-brass/30 bg-gradient-to-br from-brass/15 to-abyss-700/30 p-5">
        <p className="text-sm text-starlight">今日待复习</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="font-serif text-5xl font-semibold text-ivory">{dueTotal}</span>
          <span className="mb-1.5 text-starlight">张</span>
        </div>
        <button
          type="button"
          onClick={() => router.push("/study")}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brass py-3.5 text-base font-semibold text-abyss active:bg-brass-dark"
        >
          <Ship className="h-5 w-5" /> 开始今日答题
        </button>
      </div>

      {/* 统计条 */}
      <div className="grid grid-cols-3 gap-3">
        <MobileCard className="flex flex-col items-center py-3">
          <Flame className="h-5 w-5 text-coral" />
          <span className="mt-1 font-serif text-2xl text-ivory">{streak}</span>
          <span className="text-[11px] text-starlight">连续天</span>
        </MobileCard>
        <MobileCard className="flex flex-col items-center py-3">
          <Layers className="h-5 w-5 text-tide-light" />
          <span className="mt-1 font-serif text-2xl text-ivory">{banks.length}</span>
          <span className="text-[11px] text-starlight">题库</span>
        </MobileCard>
        <MobileCard className="flex flex-col items-center py-3">
          <Anchor className="h-5 w-5 text-brass" />
          <span className="mt-1 font-serif text-2xl text-ivory">{overview?.wrongCount ?? 0}</span>
          <span className="text-[11px] text-starlight">错题</span>
        </MobileCard>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-f-coral2/30 bg-f-coral2/10 p-3 text-sm text-f-coral2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* 题库舰队 */}
      <div>
        <MobileSectionTitle>题库舰队</MobileSectionTitle>
        {banks.length === 0 ? (
          <MobileEmpty
            icon={<Layers className="h-10 w-10" />}
            title="还没有题库"
            hint="去造船工坊导入你的第一份题库"
          />
        ) : (
          <div className="space-y-3">
            {banks.map((b) => (
              <Link key={b.id} href={`/study?bankId=${b.id}`} className="block">
                <MobileCard className={`bg-gradient-to-br ${COVER[b.coverColor] ?? COVER.brass}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-base font-semibold text-ivory">{b.name}</p>
                      {b.description && (
                        <p className="mt-0.5 truncate text-xs text-starlight">{b.description}</p>
                      )}
                      <p className="mt-1.5 text-xs text-starlight">
                        {b.questionCount} 题
                        {b.dueCount > 0 && (
                          <span className="ml-2 rounded-full bg-brass/15 px-2 py-0.5 text-brass">
                            {b.dueCount} 待复习
                          </span>
                        )}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 shrink-0 text-starlight" />
                  </div>
                </MobileCard>
              </Link>
            ))}
          </div>
        )}
      </div>

      {overview && overview.wrongCount > 0 && (
        <Link
          href="/wrongbook"
          className="flex items-center justify-center gap-2 rounded-xl border border-coral/40 bg-coral/10 py-3 font-semibold text-coral active:bg-coral/20"
        >
          <Anchor className="h-4 w-4" /> 错题漂流瓶重做
        </Link>
      )}
    </div>
  );
}
