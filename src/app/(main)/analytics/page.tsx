"use client";

// 航迹分析：学情仪表盘
// 路由：/analytics
//
// 功能：
//   1. 总览卡片：总答题数、正确率、连续天数、FSRS 状态分布
//   2. 近 30 天趋势图（用 SVG 折线）
//   3. 题型分布
//   4. 知识点薄弱 TOP10

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Loader2,
  AlertTriangle,
  Flame,
  Target,
  Layers,
  TrendingUp,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";

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
interface TrendPoint { day: string; total: number; correct: number; rate: number; }
interface TypeStat { type: string; total: number; correct: number; rate: number; }
interface WeakPoint { point: string; count: number; }

const TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: "单选题",
  MULTI_CHOICE: "多选题",
  TRUE_FALSE: "判断题",
  FILL_BLANK: "填空题",
};
const STATE_LABELS: Record<string, string> = {
  NEW: "未学",
  LEARNING: "学习中",
  REVIEW: "复习",
  RELEARNING: "重学",
};

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [typeStats, setTypeStats] = useState<TypeStat[]>([]);
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/api/analytics?days=${days}`);
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "加载失败");
        return;
      }
      const data = await res.json();
      setOverview(data.overview ?? null);
      setTrend(data.trend ?? []);
      setTypeStats(data.typeStats ?? []);
      setWeakPoints(data.weakPoints ?? []);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ivory">航迹分析</h1>
          <p className="mt-1 font-sans text-sm text-starlight">
            追踪你的学习曲线与薄弱知识点
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-10 rounded-md border border-starlight/20 bg-abyss-700/40 px-3 font-sans text-sm text-ivory focus:border-brass focus:outline-none"
        >
          <option value={7}>近 7 天</option>
          <option value={30}>近 30 天</option>
          <option value={90}>近 90 天</option>
          <option value={365}>近 1 年</option>
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 font-sans text-sm text-coral">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brass" />
        </div>
      ) : overview ? (
        <>
          {/* 总览 */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Target className="h-4 w-4" />} label="总答题数" value={overview.totalAnswers} color="brass" />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label={`近 ${days} 天正确率`} value={`${Math.round(overview.recentAccuracy * 100)}%`} color="tide" />
            <StatCard icon={<Flame className="h-4 w-4" />} label="连续天数" value={overview.streak} color="coral" />
            <StatCard icon={<Layers className="h-4 w-4" />} label="题库数" value={overview.banksCount} color="starlight" />
          </div>

          {/* FSRS 状态分布 */}
          {overview.stateDistribution.length > 0 && (
            <Panel title="卡片状态分布" subtitle="FSRS 调度状态">
              <div className="space-y-2">
                {overview.stateDistribution.map((s) => {
                  const total = overview.stateDistribution.reduce((a, b) => a + b.count, 0);
                  const pct = total > 0 ? (s.count / total) * 100 : 0;
                  return (
                    <div key={s.state}>
                      <div className="mb-1 flex items-center justify-between font-sans text-xs">
                        <span className="text-ivory">{STATE_LABELS[s.state] ?? s.state}</span>
                        <span className="font-mono text-starlight/70">
                          {s.count} · {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-abyss-700/60">
                        <div
                          className="h-full bg-gradient-to-r from-brass-dark to-brass"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* 趋势图 */}
          {trend.length > 0 && (
            <Panel title={`每日答题趋势（近 ${days} 天）`} subtitle="蓝色=答题数 / 黄铜=正确率">
              <TrendChart trend={trend} />
            </Panel>
          )}

          {/* 题型分布 */}
          {typeStats.length > 0 && (
            <Panel title="题型正确率" subtitle="按题型分组的答题表现">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {typeStats.map((t) => (
                  <div
                    key={t.type}
                    className="rounded-lg border border-starlight/15 bg-abyss-700/30 p-3 text-center"
                  >
                    <p className="font-sans text-xs text-starlight">
                      {TYPE_LABELS[t.type] ?? t.type}
                    </p>
                    <p className="mt-1 font-serif text-2xl text-brass">
                      {Math.round(t.rate * 100)}%
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-starlight/60">
                      {t.correct}/{t.total}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* 薄弱知识点 */}
          {weakPoints.length > 0 && (
            <Panel title="薄弱知识点 TOP10" subtitle="按近期错误次数排序">
              <div className="space-y-2">
                {weakPoints.map((w, i) => {
                  const maxCount = weakPoints[0]?.count ?? 1;
                  const pct = (w.count / maxCount) * 100;
                  return (
                    <div key={w.point} className="flex items-center gap-3">
                      <span className="w-6 font-mono text-xs text-starlight/60">{i + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="truncate font-sans text-xs text-ivory">{w.point}</span>
                          <span className="font-mono text-xs text-coral">{w.count} 次</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-abyss-700/60">
                          <div
                            className="h-full bg-gradient-to-r from-coral-dark to-coral"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}

          {trend.length === 0 && typeStats.length === 0 && weakPoints.length === 0 && (
            <Panel title="尚无数据" subtitle="">
              <div className="py-8 text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-starlight/40" />
                <p className="mt-3 font-sans text-sm text-starlight">
                  先去答题，分析数据会自动填充
                </p>
              </div>
            </Panel>
          )}
        </>
      ) : null}
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
  value: number | string;
  color: "brass" | "coral" | "tide" | "starlight";
}) {
  const colorMap: Record<string, string> = {
    brass: "text-brass",
    coral: "text-coral",
    tide: "text-tide-light",
    starlight: "text-starlight",
  };
  return (
    <div className="rounded-xl border border-starlight/15 bg-abyss-50/30 p-4">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs text-starlight/70">{label}</span>
        <span className={colorMap[color]}>{icon}</span>
      </div>
      <p className={`mt-2 font-serif text-3xl ${colorMap[color]}`}>{value}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-starlight/15 bg-abyss-50/30 p-5">
      <div className="mb-4">
        <h2 className="font-serif text-lg text-ivory">{title}</h2>
        {subtitle && <p className="mt-0.5 font-sans text-xs text-starlight/60">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// SVG 折线图：每日答题数（条）+ 正确率（线）
function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const W = 800;
  const H = 200;
  const PAD = 28;
  const maxTotal = Math.max(1, ...trend.map((t) => t.total));
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const step = trend.length > 1 ? innerW / (trend.length - 1) : innerW;

  // 正确率折线点
  const ratePoints = trend.map((t, i) => {
    const x = PAD + i * step;
    const y = PAD + innerH - t.rate * innerH;
    return { x, y, rate: t.rate, day: t.day, total: t.total, correct: t.correct };
  });
  const ratePath = ratePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full min-w-[600px]">
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const y = PAD + innerH - p * innerH;
          return (
            <g key={p}>
              <line
                x1={PAD}
                x2={W - PAD}
                y1={y}
                y2={y}
                stroke="rgb(var(--color-starlight) / 0.15)"
                strokeDasharray="2 4"
              />
              <text
                x={4}
                y={y + 4}
                fontSize="10"
                fill="rgb(var(--color-starlight) / 0.6)"
                fontFamily="ui-monospace"
              >
                {Math.round(p * 100)}%
              </text>
            </g>
          );
        })}

        {/* 每日答题数条形 */}
        {trend.map((t, i) => {
          const x = PAD + i * step - Math.min(8, step / 2);
          const barW = Math.min(16, step);
          const barH = (t.total / maxTotal) * innerH;
          const y = PAD + innerH - barH;
          return (
            <rect
              key={t.day}
              x={x}
              y={y}
              width={barW}
              height={Math.max(1, barH)}
              fill="rgb(var(--color-tide) / 0.5)"
              rx="2"
            >
              <title>
                {t.day}：{t.total} 题（{t.correct} 对）
              </title>
            </rect>
          );
        })}

        {/* 正确率折线 */}
        <path d={ratePath} fill="none" stroke="rgb(var(--color-brass))" strokeWidth="2" />
        {ratePoints.map((p) => (
          <circle
            key={p.day}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="rgb(var(--color-brass-light))"
          >
            <title>
              {p.day}：正确率 {Math.round(p.rate * 100)}%
            </title>
          </circle>
        ))}

        {/* X 轴日期（稀疏显示） */}
        {trend.map((t, i) => {
          if (trend.length > 14 && i % Math.ceil(trend.length / 7) !== 0) return null;
          const x = PAD + i * step;
          return (
            <text
              key={t.day}
              x={x}
              y={H - 6}
              fontSize="9"
              fill="rgb(var(--color-starlight) / 0.5)"
              fontFamily="ui-monospace"
              textAnchor="middle"
            >
              {t.day.slice(5)}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-4 font-sans text-xs text-starlight/70">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded bg-tide/60" /> 答题数
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 bg-brass" /> 正确率
        </span>
      </div>
    </div>
  );
}
