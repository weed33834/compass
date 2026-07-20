"use client";

// 题库详情：列出题目 + 答题入口
// 路由：/workshop/[id]

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Ship,
  Loader2,
  AlertTriangle,
  Search,
  Star,
  Plus,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface QuestionListItem {
  id: string;
  type: "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";
  stem: string;
  options: unknown;
  knowledgePoints: string[];
  difficulty: number;
  isStarred: boolean;
  isDisabled: boolean;
  position: number;
}

interface BankDetail {
  id: string;
  name: string;
  description: string | null;
  coverColor: string;
  tags: string[];
  source: string;
  totalQuestions: number;
  dueCount: number;
  newCardsPerDay: number;
}

const TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: "单选",
  MULTI_CHOICE: "多选",
  TRUE_FALSE: "判断",
  FILL_BLANK: "填空",
};

export default function BankDetailPage() {
  const params = useParams();
  const bankId = String(params.id);

  const [bank, setBank] = useState<BankDetail | null>(null);
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("");

  const loadBank = useCallback(async () => {
    const res = await apiFetch(`/api/banks/${bankId}`);
    if (res.ok) {
      const data = await res.json();
      setBank(data.bank ?? data);
    }
  }, [bankId]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const p = new URLSearchParams();
      p.set("page", String(page));
      p.set("pageSize", "20");
      if (keyword) p.set("keyword", keyword);
      if (typeFilter) p.set("type", typeFilter);
      const res = await apiFetch(`/api/banks/${bankId}/questions?${p.toString()}`);
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "加载失败");
        return;
      }
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
      setTotal(data.pagination?.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [bankId, page, keyword, typeFilter]);

  useEffect(() => {
    loadBank();
  }, [loadBank]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  return (
    <div className="space-y-6">
      {/* 顶部：返回 + 题库信息 + 答题按钮 */}
      <div className="flex items-center gap-3">
        <Link
          href="/workshop"
          className="rounded-md p-2 text-starlight hover:bg-white/5 hover:text-ivory"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-serif text-2xl text-ivory">{bank?.name ?? "题库"}</h1>
          {bank?.description && (
            <p className="mt-0.5 font-sans text-xs text-starlight">{bank.description}</p>
          )}
        </div>
        <Link
          href={`/study?bankId=${bankId}&mode=LEARN`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-brass bg-brass/10 px-5 text-sm font-medium text-brass transition-colors hover:bg-brass/20"
        >
          <Ship className="h-4 w-4" /> 开始答题
        </Link>
      </div>

      {/* 统计条 */}
      {bank && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="题目总数" value={bank.totalQuestions} color="brass" />
          <StatCard label="待复习" value={bank.dueCount} color="coral" />
          <StatCard label="每日新题" value={bank.newCardsPerDay} color="tide" />
          <StatCard label="标签" value={bank.tags.length} color="starlight" />
        </div>
      )}

      {/* 工具条：筛选 + 搜索 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-starlight/15 bg-abyss-700/30 p-1">
          {[
            { key: "", label: "全部" },
            { key: "SINGLE_CHOICE", label: "单选" },
            { key: "MULTI_CHOICE", label: "多选" },
            { key: "TRUE_FALSE", label: "判断" },
            { key: "FILL_BLANK", label: "填空" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTypeFilter(t.key);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1 font-sans text-xs transition-colors ${
                typeFilter === t.key
                  ? "bg-brass/20 text-brass"
                  : "text-starlight hover:text-ivory"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-starlight/50" />
          <Input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            placeholder="按题干关键词搜索..."
            className="pl-9"
          />
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 font-sans text-sm text-coral">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 题目列表 */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-brass" />
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-starlight/20 bg-abyss-50/20 p-10 text-center">
          <p className="font-sans text-sm text-starlight">
            {total === 0 ? "这个题库还没有题目" : "没有符合条件的题目"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {questions.map((q, i) => (
              <QuestionRow
                key={q.id}
                question={q}
                index={(page - 1) * 20 + i + 1}
              />
            ))}
          </div>

          {/* 分页 */}
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

function StatCard({
  label,
  value,
  color,
}: {
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
    <div className="rounded-xl border border-starlight/15 bg-abyss-50/30 p-3 text-center">
      <p className={`font-serif text-2xl ${colorMap[color]}`}>{value}</p>
      <p className="mt-1 font-sans text-[11px] text-starlight/70">{label}</p>
    </div>
  );
}

function QuestionRow({
  question,
  index,
}: {
  question: QuestionListItem;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const stemPreview = question.stem.length > 100
    ? question.stem.slice(0, 100) + "..."
    : question.stem;

  return (
    <div
      className="cursor-pointer rounded-lg border border-starlight/15 bg-abyss-50/30 px-4 py-3 transition-colors hover:border-brass/40"
      onClick={() => setExpanded((e) => !e)}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 font-mono text-xs text-starlight/60">{index}.</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded border border-starlight/20 bg-abyss-700/40 px-1.5 py-0.5 font-mono text-[10px] text-starlight/80">
              {TYPE_LABELS[question.type] ?? question.type}
            </span>
            {question.isStarred && <Star className="h-3 w-3 fill-brass text-brass" />}
            <span className="font-mono text-[10px] text-starlight/50">
              难度 {question.difficulty.toFixed(1)}
            </span>
          </div>
          <p className={`mt-1.5 font-sans text-sm text-ivory ${expanded ? "" : "line-clamp-2"}`}>
            {expanded ? question.stem : stemPreview}
          </p>
          {expanded && question.knowledgePoints.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {question.knowledgePoints.map((kp) => (
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
      </div>
    </div>
  );
}
