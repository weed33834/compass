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
  Brain,
  CalendarClock,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { Illustration } from "@/components/Illustration";

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
interface MemoryHealth {
  averageRetrievability: number;
  totalCards: number;
  atRiskCount: number;
  distribution: Array<{ bucket: string; label: string; count: number; color: string }>;
  forecast: Array<{ day: string; count: number }>;
}
interface HeatmapDay { day: string; total: number; correct: number; }

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
  const [memoryHealth, setMemoryHealth] = useState<MemoryHealth | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
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
      setMemoryHealth(data.memoryHealth ?? null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  // 热力图独立加载 365 天数据，不随 days 切换变化
  const loadHeatmap = useCallback(async () => {
    setHeatmapLoading(true);
    try {
      const res = await apiFetch(`/api/analytics?days=365`);
      if (!res.ok) return;
      const data = await res.json();
      const trend365: TrendPoint[] = data.trend ?? [];
      setHeatmap(trend365.map((t) => ({ day: t.day, total: t.total, correct: t.correct })));
    } finally {
      setHeatmapLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadHeatmap();
  }, [loadHeatmap]);

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

          {/* 365 天热力图 */}
          <Panel
            title="连续答题热力图"
            subtitle="近 365 天每日答题量，颜色越深答题越多"
            icon={<Calendar className="h-4 w-4 text-brass" />}
          >
            {heatmapLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-brass" />
              </div>
            ) : (
              <Heatmap days={heatmap} />
            )}
          </Panel>

          {/* 记忆健康度 + 7 天到期预测 */}
          {memoryHealth && memoryHealth.totalCards > 0 && (
            <Panel
              title="记忆健康度"
              subtitle="FSRS-6 衰退公式 R(t,S) = (1 + factor · t/9S)^decay"
              icon={<Brain className="h-4 w-4 text-brass" />}
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <MemoryHealthPanel health={memoryHealth} />
                <ForecastPanel forecast={memoryHealth.forecast} />
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
                <Illustration name="empty-analytics" className="mx-auto h-40 w-40 text-starlight/40" />
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
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-starlight/15 bg-abyss-50/30 p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-serif text-lg text-ivory">{title}</h2>
        </div>
        {subtitle && <p className="mt-0.5 font-sans text-xs text-starlight/60">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// 记忆健康度：平均 R + 警示 + 5 桶分布
function MemoryHealthPanel({ health }: { health: MemoryHealth }) {
  const avgPct = Math.round(health.averageRetrievability * 100);
  // 颜色按平均 R 区间映射
  const avgColor =
    avgPct >= 90 ? "text-f-emerald"
    : avgPct >= 70 ? "text-brass"
    : avgPct >= 50 ? "text-tide-light"
    : "text-coral";
  const avgRingColor =
    avgPct >= 90 ? "#10b981"
    : avgPct >= 70 ? "#c89b3c"
    : avgPct >= 50 ? "#38bdf8"
    : "#e0584a";

  const maxCount = Math.max(1, ...health.distribution.map((d) => d.count));

  // 颜色 token → 实际色值（SVG / 内联 style 用）
  const colorHex: Record<string, string> = {
    coral: "#e0584a",
    amber: "#f59e0b",
    tide: "#38bdf8",
    brass: "#c89b3c",
    emerald: "#10b981",
  };

  return (
    <div className="space-y-4">
      {/* 顶部：环形 R + 警示 */}
      <div className="flex items-center gap-4">
        <RetrievabilityRing value={health.averageRetrievability} color={avgRingColor} />
        <div className="min-w-0 flex-1">
          <p className="font-sans text-xs text-starlight/70">平均记忆留存率</p>
          <p className={`font-serif text-3xl ${avgColor}`}>{avgPct}%</p>
          <p className="mt-0.5 font-mono text-[10px] text-starlight/50">
            基于 {health.totalCards} 张 REVIEW / RELEARNING 卡
          </p>
        </div>
      </div>

      {/* 警示条 */}
      {health.atRiskCount > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 font-sans text-xs text-coral">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong className="font-mono">{health.atRiskCount}</strong> 张卡 R&lt;70%，即将遗忘——建议今天复习
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-f-emerald/30 bg-f-emerald/10 px-3 py-2 font-sans text-xs text-f-emerald">
          <Brain className="h-3.5 w-3.5 shrink-0" />
          <span>无濒危卡片，记忆状态健康</span>
        </div>
      )}

      {/* 5 桶分布 */}
      <div className="space-y-1.5">
        {health.distribution.map((d) => {
          const pct = (d.count / maxCount) * 100;
          return (
            <div key={d.bucket} className="flex items-center gap-2">
              <span className="w-16 shrink-0 font-sans text-[10px] text-starlight/70">
                {d.label}
              </span>
              <span className="w-14 shrink-0 font-mono text-[10px] text-starlight/50">
                {d.bucket}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-abyss-700/60">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: colorHex[d.color] }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-[10px] text-ivory">
                {d.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 环形进度图（SVG）：显示平均 R
function RetrievabilityRing({ value, color }: { value: number; color: string }) {
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgb(var(--color-starlight) / 0.15)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

// 未来 7 天到期预测：SVG 柱图
function ForecastPanel({ forecast }: { forecast: Array<{ day: string; count: number }> }) {
  const maxCount = Math.max(1, ...forecast.map((f) => f.count));
  const W = 320;
  const H = 160;
  const PAD = 24;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const barW = innerW / forecast.length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 font-sans text-xs text-starlight/70">
        <CalendarClock className="h-3.5 w-3.5" />
        未来 7 天到期卡数
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full min-w-[280px]">
          {/* Y 轴网格 */}
          {[0, 0.5, 1].map((p) => {
            const y = PAD + innerH - p * innerH;
            return (
              <line
                key={p}
                x1={PAD}
                x2={W - PAD}
                y1={y}
                y2={y}
                stroke="rgb(var(--color-starlight) / 0.1)"
                strokeDasharray="2 4"
              />
            );
          })}
          {/* 柱 */}
          {forecast.map((f, i) => {
            const barH = (f.count / maxCount) * innerH;
            const x = PAD + i * barW + barW * 0.2;
            const y = PAD + innerH - barH;
            const w = barW * 0.6;
            const isToday = f.day === todayStr;
            return (
              <g key={f.day}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={Math.max(2, barH)}
                  fill={isToday ? "rgb(var(--color-coral))" : "rgb(var(--color-brass))"}
                  rx="2"
                  opacity={f.count === 0 ? 0.3 : 1}
                >
                  <title>
                    {f.day}：{f.count} 张到期
                  </title>
                </rect>
                {f.count > 0 && (
                  <text
                    x={x + w / 2}
                    y={y - 4}
                    fontSize="10"
                    fill={isToday ? "rgb(var(--color-coral))" : "rgb(var(--color-brass-light))"}
                    fontFamily="ui-monospace"
                    textAnchor="middle"
                  >
                    {f.count}
                  </text>
                )}
                <text
                  x={x + w / 2}
                  y={H - 6}
                  fontSize="9"
                  fill="rgb(var(--color-starlight) / 0.5)"
                  fontFamily="ui-monospace"
                  textAnchor="middle"
                >
                  {isToday ? "今" : f.day.slice(5)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-1 font-sans text-[10px] text-starlight/50">
        红色=今天到期 · 黄铜=未来到期 · 数据来自 FSRS 调度的 dueAt
      </p>
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

// 365 天答题热力图（GitHub 风格）
function Heatmap({ days }: { days: HeatmapDay[] }) {
  // 构造完整 365 天序列：从今天往前 364 天
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalDays = 365;
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalDays - 1));

  // 把 trend 数据按 day 建索引
  const dataMap = new Map<string, HeatmapDay>();
  for (const d of days) dataMap.set(d.day, d);

  // 计算颜色级别
  // 0 题 → level 0；1-4 → 1；5-9 → 2；10-19 → 3；>=20 → 4
  const levelFor = (n: number): 0 | 1 | 2 | 3 | 4 => {
    if (n <= 0) return 0;
    if (n < 5) return 1;
    if (n < 10) return 2;
    if (n < 20) return 3;
    return 4;
  };
  const levelColor: Record<0 | 1 | 2 | 3 | 4, string> = {
    0: "rgba(240,234,214,0.06)",
    1: "rgba(201,155,60,0.35)",
    2: "rgba(201,155,60,0.55)",
    3: "rgba(201,155,60,0.80)",
    4: "rgba(201,155,60,1)",
  };

  // 按周分列：找到 startDate 对应的周日（GitHub 风格：每列从周日开始）
  // 这里用周一为列起点（中文习惯），让第一列对齐到周一
  // 计算需要前补多少天让第一列从周一开始
  const firstDow = startDate.getDay(); // 0=周日 ... 1=周一 ... 6=周六
  // 我们以周一为列起点：把 startDate 往前推到最近的周一
  const offsetToMonday = (firstDow + 6) % 7; // 0 if 周一, 1 if 周二, ... 6 if 周日
  const gridStartDate = new Date(startDate);
  gridStartDate.setDate(gridStartDate.getDate() - offsetToMonday);

  // 生成所有格子（按列扫描）
  const cells: Array<{ date: Date; inRange: boolean; data: HeatmapDay | null }> = [];
  const cursor = new Date(gridStartDate);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 1); // 含今天
  while (cursor < endDate) {
    const dayStr = cursor.toISOString().slice(0, 10);
    const inRange = cursor >= startDate;
    cells.push({
      date: new Date(cursor),
      inRange,
      data: inRange ? (dataMap.get(dayStr) ?? null) : null,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // 列数 = ceil(cells.length / 7)
  const totalCols = Math.ceil(cells.length / 7);
  const cellSize = 11;
  const gap = 3;
  const step = cellSize + gap;
  const labelOffset = 24; // 左侧周标签宽度
  const topOffset = 18; // 顶部月份标签高度
  const W = labelOffset + totalCols * step;
  const H = topOffset + 7 * step;

  // 月份标签：扫描每列首日（周一），如果月份变化就标
  const monthLabels: Array<{ col: number; label: string }> = [];
  let lastMonth = -1;
  for (let col = 0; col < totalCols; col++) {
    const idx = col * 7;
    if (idx >= cells.length) break;
    const d = cells[idx].date;
    const m = d.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ col, label: `${m + 1}月` });
      lastMonth = m;
    }
  }

  // 周标签：左侧显示 一 / 三 / 五（第 1/3/5 行）
  const weekLabels = [
    { row: 0, label: "一" },
    { row: 2, label: "三" },
    { row: 4, label: "五" },
  ];

  // 统计
  const totalAnswers = days.reduce((s, d) => s + d.total, 0);
  const activeDays = days.filter((d) => d.total > 0).length;

  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[640px] w-full" style={{ maxHeight: 200 }}>
          {/* 月份标签 */}
          {monthLabels.map((m) => (
            <text
              key={`${m.col}-${m.label}`}
              x={labelOffset + m.col * step}
              y={12}
              fontSize="10"
              fill="rgb(var(--color-starlight) / 0.6)"
              fontFamily="ui-sans-serif"
            >
              {m.label}
            </text>
          ))}
          {/* 周标签 */}
          {weekLabels.map((w) => (
            <text
              key={w.label}
              x={0}
              y={topOffset + w.row * step + cellSize - 1}
              fontSize="9"
              fill="rgb(var(--color-starlight) / 0.5)"
              fontFamily="ui-sans-serif"
            >
              {w.label}
            </text>
          ))}
          {/* 热力格 */}
          {cells.map((c, i) => {
            const col = Math.floor(i / 7);
            const row = i % 7;
            const x = labelOffset + col * step;
            const y = topOffset + row * step;
            const total = c.data?.total ?? 0;
            const level = levelFor(total);
            const dayStr = c.date.toISOString().slice(0, 10);
            const correct = c.data?.correct ?? 0;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={2}
                fill={c.inRange ? levelColor[level] : "transparent"}
                stroke={c.inRange ? "rgba(240,234,214,0.04)" : "transparent"}
                strokeWidth={1}
              >
                <title>
                  {dayStr}：{c.inRange ? `${total} 题（${correct} 对）` : "范围外"}
                </title>
              </rect>
            );
          })}
        </svg>
      </div>
      {/* 图例 + 统计 */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-sans text-xs text-starlight/70">
        <div className="flex items-center gap-2">
          <span>少</span>
          {([0, 1, 2, 3, 4] as const).map((l) => (
            <span
              key={l}
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: levelColor[l] }}
              title={`Level ${l}`}
            />
          ))}
          <span>多</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>共 <span className="text-brass">{totalAnswers}</span> 题</span>
          <span>活跃 <span className="text-brass">{activeDays}</span> 天</span>
        </div>
      </div>
    </div>
  );
}
