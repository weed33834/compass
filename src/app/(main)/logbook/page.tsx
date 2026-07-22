"use client";

// 航海日志：答题历史时间线
// 路由：/logbook
//
// 功能：
//   1. 按时间倒序列出全部答题记录
//   2. 按题库筛选
//   3. 展开查看题干 + 用户答案 + 对错 + 用时

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Inbox,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/Button";
import { Illustration } from "@/components/Illustration";

interface LogRecord {
  id: string;
  questionId: string;
  bankId: string;
  bankName: string;
  bankCoverColor: string;
  stem: string;
  type: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";
  knowledgePoints: string[];
  userAnswer: unknown;
  isCorrect: boolean;
  partialScore: number;
  timeSpentSec: number | null;
  errorReason: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: "单选",
  MULTI_CHOICE: "多选",
  TRUE_FALSE: "判断",
  FILL_BLANK: "填空",
};

export default function LogbookPage() {
  const [records, setRecords] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [bankFilter, setBankFilter] = useState<string>("");
  const [banks, setBanks] = useState<Array<{ id: string; name: string }>>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const loadBanks = useCallback(async () => {
    const res = await apiFetch("/api/banks");
    if (res.ok) {
      const d = await res.json();
      setBanks((d.banks ?? []).map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })));
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = new URLSearchParams();
      p.set("page", String(page));
      p.set("pageSize", "30");
      if (bankFilter) p.set("bankId", bankFilter);
      const res = await apiFetch(`/api/logbook?${p.toString()}`);
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "加载失败");
        return;
      }
      const data = await res.json();
      setRecords(data.records ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, bankFilter]);

  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 按日期分组
  const grouped = records.reduce<Record<string, LogRecord[]>>((acc, r) => {
    const day = new Date(r.createdAt).toLocaleDateString("zh-CN", {
      year: "numeric", month: "long", day: "numeric", weekday: "long",
    });
    (acc[day] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ivory">航海日志</h1>
          <p className="mt-1 font-sans text-sm text-starlight">
            {total > 0 ? `共 ${total} 条答题记录` : "尚未启航"}
          </p>
        </div>
        {banks.length > 0 && (
          <select
            value={bankFilter}
            onChange={(e) => {
              setBankFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-md border border-starlight/20 bg-abyss-700/40 px-3 font-sans text-sm text-ivory focus:border-brass focus:outline-none"
          >
            <option value="">全部题库</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 font-sans text-sm text-coral">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brass" />
        </div>
      ) : records.length === 0 ? (
        <EmptyLogbook />
      ) : (
        <>
          <div className="space-y-6">
            {Object.entries(grouped).map(([day, dayRecords]) => (
              <div key={day}>
                <div className="mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brass" />
                  <h2 className="font-serif text-sm text-brass">{day}</h2>
                  <span className="font-mono text-xs text-starlight/60">
                    · {dayRecords.length} 题
                  </span>
                </div>
                <div className="space-y-2">
                  {dayRecords.map((r) => (
                    <LogRow
                      key={r.id}
                      record={r}
                      expanded={expandedIds.has(r.id)}
                      onToggle={() => toggleExpand(r.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                上一页
              </Button>
              <span className="font-mono text-xs text-starlight">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LogRow({
  record,
  expanded,
  onToggle,
}: {
  record: LogRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const time = new Date(record.createdAt).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="rounded-lg border border-starlight/15 bg-abyss-50/30 px-4 py-3">
      <div className="flex items-start gap-3">
        {record.isCorrect ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-f-emerald" />
        ) : (
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-f-coral2" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-mono text-starlight/70">{time}</span>
            <span className="rounded border border-starlight/20 bg-abyss-700/40 px-1.5 py-0.5 font-mono text-starlight/80">
              {TYPE_LABELS[record.type] ?? record.type}
            </span>
            <span className="font-mono text-brass">{record.bankName}</span>
            {record.partialScore > 0 && record.partialScore < 1 && (
              <span className="font-mono text-f-amber">
                部分 {Math.round(record.partialScore * 100)}%
              </span>
            )}
            {record.timeSpentSec != null && (
              <span className="flex items-center gap-0.5 font-mono text-starlight/50">
                <Clock className="h-2.5 w-2.5" />
                {record.timeSpentSec}s
              </span>
            )}
          </div>
          <p
            className={`mt-1.5 font-sans text-sm text-ivory ${
              expanded ? "" : "line-clamp-1"
            }`}
          >
            {record.stem}
          </p>

          {expanded && (
            <div className="mt-2 space-y-1 border-t border-starlight/10 pt-2">
              <p className="font-sans text-xs text-starlight">
                你的答案：
                <span
                  className={`ml-1 font-mono ${
                    record.isCorrect ? "text-f-emerald" : "text-f-coral2"
                  }`}
                >
                  {formatAnswer(record.type, record.userAnswer)}
                </span>
              </p>
              {record.knowledgePoints.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {record.knowledgePoints.map((kp) => (
                    <span
                      key={kp}
                      className="rounded border border-starlight/20 bg-abyss-700/40 px-1.5 py-0.5 font-mono text-[10px] text-starlight/70"
                    >
                      {kp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="rounded p-1.5 text-starlight hover:bg-white/5 hover:text-ivory"
          aria-label={expanded ? "收起" : "展开"}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function EmptyLogbook() {
  return (
    <div className="rounded-2xl border border-dashed border-starlight/20 bg-abyss-50/20 p-12 text-center">
      <Illustration name="empty-logbook" className="mx-auto h-44 w-44 text-brass/50" />
      <h2 className="mt-3 font-serif text-2xl text-ivory">日志尚未启航</h2>
      <p className="mt-2 font-sans text-sm text-starlight">
        答完第一道题，航海日志就会自动记录每一次出航
      </p>
      <Link
        href="/study?mode=LEARN"
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-brass bg-brass/10 px-4 text-sm font-medium text-brass hover:bg-brass/20"
      >
        <BookOpen className="h-4 w-4" /> 开始答题
      </Link>
    </div>
  );
}

function formatAnswer(type: string, answer: unknown): string {
  if (answer == null) return "（未作答）";
  if (type === "TRUE_FALSE") {
    return answer === true ? "正确" : answer === false ? "错误" : String(answer);
  }
  if (Array.isArray(answer)) {
    return answer.join(" | ");
  }
  return String(answer);
}
