"use client";

// 错题漂流瓶：列出 lapses > 0 的题目
// 路由：/wrongbook
//
// 功能：
//   1. 列出错题（按 lastErrorAt 降序）
//   2. 展开查看题干 + 正确答案 + 解析
//   3. 标记"已掌握"（isBuried=true → 从错题本移除）
//   4. 跳转到该题所在题库重做

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Anchor,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
  RefreshCw,
  Inbox,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/Button";
import { Illustration } from "@/components/Illustration";

interface WrongItem {
  reviewItemId: string;
  questionId: string;
  bankId: string;
  bankName: string;
  bankCoverColor: string;
  stem: string;
  type: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";
  options: unknown;
  answer: unknown;
  explanation: string | null;
  knowledgePoints: string[];
  isStarred: boolean;
  lapses: number;
  state: string;
  dueAt: string;
  lastReviewAt: string | null;
  firstErrorAt: string | null;
  lastErrorAt: string | null;
  errorTags: string[];
}

const TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: "单选",
  MULTI_CHOICE: "多选",
  TRUE_FALSE: "判断",
  FILL_BLANK: "填空",
};

export default function WrongbookPage() {
  const [items, setItems] = useState<WrongItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = new URLSearchParams();
      p.set("page", String(page));
      p.set("pageSize", "20");
      const res = await apiFetch(`/api/wrongbook?${p.toString()}`);
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "加载失败");
        return;
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const handleMastered = async (reviewItemId: string) => {
    const res = await apiFetch("/api/wrongbook", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewItemId, isBuried: true }),
    });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.reviewItemId !== reviewItemId));
      setTotal((t) => Math.max(0, t - 1));
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ivory">错题漂流瓶</h1>
          <p className="mt-1 font-sans text-sm text-starlight">
            {total > 0 ? `共有 ${total} 道错题等待重做` : "暂无误入瓶中的错题"}
          </p>
        </div>
        {total > 0 && (
          <Link
            href="/study?mode=WRONG_REDO"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-brass bg-brass/10 px-5 text-sm font-medium text-brass hover:bg-brass/20"
          >
            <RefreshCw className="h-4 w-4" /> 一键重做错题
          </Link>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 font-sans text-sm text-coral">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brass" />
        </div>
      ) : items.length === 0 ? (
        <EmptyBottle />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => {
              const expanded = expandedIds.has(item.reviewItemId);
              return (
                <div
                  key={item.reviewItemId}
                  className="rounded-xl border border-starlight/15 bg-abyss-50/30 p-4"
                >
                  <div className="flex items-start gap-3">
                    <Anchor className="mt-1 h-4 w-4 shrink-0 text-coral" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="rounded border border-starlight/20 bg-abyss-700/40 px-1.5 py-0.5 font-mono text-starlight/80">
                          {TYPE_LABELS[item.type] ?? item.type}
                        </span>
                        <span className="rounded border border-brass/30 bg-brass/10 px-1.5 py-0.5 font-mono text-brass">
                          {item.bankName}
                        </span>
                        <span className="font-mono text-coral">
                          错 {item.lapses} 次
                        </span>
                        {item.lastErrorAt && (
                          <span className="font-mono text-starlight/50">
                            最近错于 {new Date(item.lastErrorAt).toLocaleDateString("zh-CN")}
                          </span>
                        )}
                      </div>
                      <p
                        className={`mt-2 font-sans text-sm text-ivory ${
                          expanded ? "" : "line-clamp-2"
                        }`}
                      >
                        {item.stem}
                      </p>

                      {expanded && (
                        <div className="mt-3 space-y-2 border-t border-starlight/10 pt-3">
                          <div>
                            <p className="font-sans text-xs text-starlight">正确答案</p>
                            <p className="mt-0.5 font-mono text-sm text-f-emerald">
                              {formatAnswer(item.type, item.answer)}
                            </p>
                          </div>
                          {item.explanation && (
                            <div>
                              <p className="font-sans text-xs text-starlight">解析</p>
                              <p className="mt-0.5 whitespace-pre-wrap font-sans text-xs text-ivory/90">
                                {item.explanation}
                              </p>
                            </div>
                          )}
                          {item.knowledgePoints.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {item.knowledgePoints.map((kp) => (
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

                    {/* 右侧操作 */}
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.reviewItemId)}
                        className="rounded p-1.5 text-starlight hover:bg-white/5 hover:text-ivory"
                        aria-label={expanded ? "收起" : "展开"}
                      >
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 底部操作 */}
                  <div className="mt-3 flex justify-end gap-2 border-t border-starlight/10 pt-3">
                    <Link
                      href={`/study?bankId=${item.bankId}&mode=WRONG_REDO`}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-starlight/30 px-3 font-sans text-xs text-ivory hover:bg-brass/10"
                    >
                      <RefreshCw className="h-3 w-3" /> 重做
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleMastered(item.reviewItemId)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-f-emerald/40 bg-f-emerald/10 px-3 font-sans text-xs text-f-emerald hover:bg-f-emerald/20"
                    >
                      <Check className="h-3 w-3" /> 已掌握
                    </button>
                  </div>
                </div>
              );
            })}
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

function EmptyBottle() {
  return (
    <div className="rounded-2xl border border-dashed border-starlight/20 bg-abyss-50/20 p-12 text-center">
      <Illustration name="empty-wrongbook" className="mx-auto h-44 w-44 text-f-emerald/50" />
      <h2 className="mt-3 font-serif text-2xl text-ivory">瓶中无错题</h2>
      <p className="mt-2 font-sans text-sm text-starlight">
        坚持答题，错题会自动漂入瓶中等待重做
      </p>
      <Link
        href="/study?mode=LEARN"
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-brass bg-brass/10 px-4 text-sm font-medium text-brass hover:bg-brass/20"
      >
        <Anchor className="h-4 w-4" /> 去答题
      </Link>
    </div>
  );
}

function formatAnswer(type: string, answer: unknown): string {
  if (answer == null) return "—";
  if (type === "TRUE_FALSE") {
    return answer === true ? "正确" : answer === false ? "错误" : String(answer);
  }
  if (Array.isArray(answer)) {
    return answer.join(" | ");
  }
  return String(answer);
}
