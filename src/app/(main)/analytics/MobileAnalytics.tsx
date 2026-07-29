"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  AlertTriangle,
  BarChart3,
  Flame,
  Target,
  Anchor,
  Layers,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { MobileCard, MobileSectionTitle } from "@/components/mobile/MobilePrimitives";
import { MobileTopBar } from "@/components/mobile/MobileShell";

interface Overview {
  dueTodayCount: number;
  streak: number;
  wrongCount: number;
  banksCount: number;
  questionsCount: number;
  recentAccuracy: number;
  stateDistribution: Array<{ state: string; count: number }>;
}

interface TypeStat {
  type: string;
  total: number;
  correct: number;
  rate: number;
}

interface WeakPoint {
  point: string;
  count: number;
}

const STATE_LABEL: Record<string, string> = {
  NEW: "新卡",
  LEARNING: "学习中",
  REVIEW: "复习",
  RELEARNING: "重学",
};

const TYPE_LABEL: Record<string, string> = {
  SINGLE_CHOICE: "单选",
  MULTI_CHOICE: "多选",
  TRUE_FALSE: "判断",
  FILL_BLANK: "填空",
};

export function MobileAnalytics() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [typeStats, setTypeStats] = useState<TypeStat[]>([]);
  const [weak, setWeak] = useState<WeakPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/analytics?days=30");
      if (res.ok) {
        const d = await res.json();
        setOverview(d.overview ?? null);
        setTypeStats(d.typeStats ?? []);
        setWeak(d.weakPoints ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-starlight">
        <Loader2 className="h-8 w-8 animate-spin text-brass" />
        <p>正在测绘航迹…</p>
      </div>
    );
  }

  const accuracy = Math.round((overview?.recentAccuracy ?? 0) * 100);
  const maxType = Math.max(1, ...typeStats.map((t) => t.total));

  return (
    <div className="space-y-5">
      <MobileTopBar title="航迹分析" />

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-f-coral2/30 bg-f-coral2/10 p-3 text-sm text-f-coral2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* 核心指标 */}
      <div className="grid grid-cols-2 gap-3">
        <MobileCard className="flex flex-col items-center py-4">
          <Target className="h-5 w-5 text-f-emerald" />
          <span className="mt-1 font-serif text-3xl text-ivory">{accuracy}%</span>
          <span className="text-[11px] text-starlight">近 30 天正确率</span>
        </MobileCard>
        <MobileCard className="flex flex-col items-center py-4">
          <Flame className="h-5 w-5 text-coral" />
          <span className="mt-1 font-serif text-3xl text-ivory">{overview?.streak ?? 0}</span>
          <span className="text-[11px] text-starlight">连续打卡</span>
        </MobileCard>
        <MobileCard className="flex flex-col items-center py-4">
          <Anchor className="h-5 w-5 text-brass" />
          <span className="mt-1 font-serif text-3xl text-ivory">{overview?.wrongCount ?? 0}</span>
          <span className="text-[11px] text-starlight">错题数</span>
        </MobileCard>
        <MobileCard className="flex flex-col items-center py-4">
          <Layers className="h-5 w-5 text-tide-light" />
          <span className="mt-1 font-serif text-3xl text-ivory">{overview?.questionsCount ?? 0}</span>
          <span className="text-[11px] text-starlight">总题量</span>
        </MobileCard>
      </div>

      {/* 卡片状态分布 */}
      {overview?.stateDistribution?.length ? (
        <div>
          <MobileSectionTitle>
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-brass" /> 记忆状态
            </span>
          </MobileSectionTitle>
          <MobileCard className="space-y-2.5">
            {overview.stateDistribution.map((s) => (
              <div key={s.state} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-xs text-starlight">{STATE_LABEL[s.state] ?? s.state}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-abyss-700">
                  <div className="h-full rounded-full bg-brass" style={{ width: `${Math.min(100, s.count)}%` }} />
                </div>
                <span className="w-8 text-right font-mono text-xs text-ivory">{s.count}</span>
              </div>
            ))}
          </MobileCard>
        </div>
      ) : null}

      {/* 题型正确率 */}
      {typeStats.length > 0 && (
        <div>
          <MobileSectionTitle>
            <span className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brass" /> 题型正确率
            </span>
          </MobileSectionTitle>
          <MobileCard className="space-y-3">
            {typeStats.map((t) => (
              <div key={t.type}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-ivory">{TYPE_LABEL[t.type] ?? t.type}</span>
                  <span className="text-starlight">
                    {Math.round(t.rate * 100)}% · {t.total} 题
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-abyss-700">
                  <div
                    className="h-full rounded-full bg-tide-light"
                    style={{ width: `${(t.total / maxType) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </MobileCard>
        </div>
      )}

      {/* 薄弱知识点 */}
      {weak.length > 0 && (
        <div>
          <MobileSectionTitle>薄弱知识点</MobileSectionTitle>
          <div className="flex flex-wrap gap-2">
            {weak.map((w) => (
              <span
                key={w.point}
                className="rounded-full border border-coral/30 bg-coral/10 px-3 py-1.5 text-sm text-coral"
              >
                {w.point} <span className="font-mono text-xs opacity-70">{w.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/logbook"
        className="flex items-center justify-center gap-1 rounded-xl border border-brass/30 py-3 text-sm text-starlight active:bg-white/5"
      >
        查看完整航海日志 <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
