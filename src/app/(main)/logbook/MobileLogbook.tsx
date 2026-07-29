"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, AlertTriangle, BookOpen, ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { MobileCard, MobileSectionTitle, MobileEmpty } from "@/components/mobile/MobilePrimitives";
import { QUESTION_TYPE_LABELS, type QuestionType } from "@/app/(main)/study/types";

interface LogRecord {
  id: string;
  questionId: string;
  bankId: string;
  bankName: string;
  bankCoverColor: string;
  stem: string;
  type: QuestionType;
  isCorrect: boolean;
  partialScore: number;
  timeSpentSec: number | null;
  createdAt: string;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function MobileLogbook() {
  const [records, setRecords] = useState<LogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;

  const load = useCallback(
    async (p: number, append: boolean) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
        const res = await apiFetch(`/api/logbook?${qs.toString()}`);
        if (res.ok) {
          const d = await res.json();
          const rows: LogRecord[] = d.records ?? [];
          setRecords((prev) => (append ? [...prev, ...rows] : rows));
          setHasMore(rows.length >= pageSize);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  return (
    <div className="space-y-5">
      <MobileSectionTitle>航海日志</MobileSectionTitle>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-f-coral2/30 bg-f-coral2/10 p-3 text-sm text-f-coral2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {loading && records.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-starlight">
          <Loader2 className="h-8 w-8 animate-spin text-brass" />
          <p>正在翻阅日志…</p>
        </div>
      ) : records.length === 0 ? (
        <MobileEmpty icon={<BookOpen className="h-10 w-10" />} title="还没有答题记录" hint="去答题舱刷几题吧" />
      ) : (
        <div className="space-y-2.5">
          {records.map((r) => (
            <MobileCard key={r.id} className="flex items-start gap-3">
              <div
                className={[
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  r.isCorrect
                    ? "bg-f-emerald/15 text-f-emerald"
                    : "bg-f-coral2/15 text-f-coral2",
                ].join(" ")}
              >
                {r.isCorrect ? "✓" : "✗"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-sans text-sm leading-relaxed text-ivory">{r.stem}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-starlight">
                  <span>{r.bankName}</span>
                  <span>·</span>
                  <span>{QUESTION_TYPE_LABELS[r.type]}</span>
                  <span>·</span>
                  <span>{fmtDate(r.createdAt)}</span>
                  {r.timeSpentSec != null && <span>· {r.timeSpentSec}s</span>}
                </div>
              </div>
            </MobileCard>
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={() => {
                const next = page + 1;
                setPage(next);
                load(next, true);
              }}
              disabled={loading}
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-brass/30 py-3 text-sm text-starlight active:bg-white/5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
              加载更早的记录
            </button>
          )}
        </div>
      )}
    </div>
  );
}
