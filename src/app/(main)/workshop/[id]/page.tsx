"use client";

// 题库详情：列出题目 + 答题入口 + 题目内联编辑 + FSRS 调优 + 导出
// 路由：/workshop/[id]
//
// V1.3 升级：
//   - 题目内联编辑：题干 / 选项 / 答案 / 解析 / 知识点 / 难度 / 收藏 / 启用 / 删除
//   - 每库 FSRS 参数调优：fsrsEnabled / desiredRetention / newCardsPerDay / maxReviewsPerDay
//   - 导出：CSV（与导入兼容）/ Anki 文本（Anki 桌面端直接导入）

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
  Pencil,
  Trash2,
  Save,
  X,
  Download,
  Settings2,
  Check,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type QuestionType = "SINGLE_CHOICE" | "MULTI_CHOICE" | "TRUE_FALSE" | "FILL_BLANK";

interface QuestionListItem {
  id: string;
  type: QuestionType;
  stem: string;
  options: unknown;
  answer: unknown;
  explanation: string | null;
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
  maxReviewsPerDay: number;
  desiredRetention: number;
  fsrsEnabled: boolean;
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
  const [showFsrsPanel, setShowFsrsPanel] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "anki" | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const loadBank = useCallback(async () => {
    const res = await apiFetch(`/api/banks/${bankId}`);
    if (res.ok) {
      const data = await res.json();
      const b = data.bank ?? data;
      setBank({
        id: b.id,
        name: b.name,
        description: b.description ?? null,
        coverColor: b.coverColor,
        tags: b.tags ?? [],
        source: b.source,
        totalQuestions: b.totalQuestions,
        dueCount: b.stats?.dueCount ?? b.dueCount ?? 0,
        newCardsPerDay: b.newCardsPerDay,
        maxReviewsPerDay: b.maxReviewsPerDay,
        desiredRetention: b.desiredRetention,
        fsrsEnabled: b.fsrsEnabled,
      });
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBank();
  }, [loadBank]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQuestions();
  }, [loadQuestions]);

  const showToast = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = async (format: "csv" | "anki") => {
    setExporting(format);
    try {
      const res = await apiFetch(`/api/banks/${bankId}/export?format=${format}`);
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        showToast("err", d?.error ?? "导出失败");
        return;
      }
      const blob = await res.blob();
      // 从 Content-Disposition 取文件名
      const cd = res.headers.get("Content-Disposition") ?? "";
      const m = cd.match(/filename\*=UTF-8''([^;]+)/i);
      const fileName = m ? decodeURIComponent(m[1]) : `${bank?.name ?? "bank"}.${format === "csv" ? "csv" : "txt"}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("ok", `已导出 ${format === "csv" ? "CSV" : "Anki"} 文件`);
    } finally {
      setExporting(null);
    }
  };

  const handleQuestionUpdated = useCallback(async () => {
    await Promise.all([loadBank(), loadQuestions()]);
  }, [loadBank, loadQuestions]);

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
        <button
          type="button"
          onClick={() => setShowFsrsPanel((s) => !s)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-starlight/30 px-4 text-sm font-medium text-ivory transition-colors hover:bg-brass/10"
          title="FSRS 参数调优"
        >
          <Settings2 className="h-4 w-4" /> <span className="hidden sm:inline">FSRS</span>
        </button>
        <button
          type="button"
          onClick={() => handleExport("csv")}
          disabled={exporting !== null}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-starlight/30 px-4 text-sm font-medium text-ivory transition-colors hover:bg-brass/10 disabled:opacity-50"
          title="导出 CSV"
        >
          <Download className="h-4 w-4" /> <span className="hidden sm:inline">{exporting === "csv" ? "..." : "CSV"}</span>
        </button>
        <button
          type="button"
          onClick={() => handleExport("anki")}
          disabled={exporting !== null}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-starlight/30 px-4 text-sm font-medium text-ivory transition-colors hover:bg-brass/10 disabled:opacity-50"
          title="导出 Anki 文本"
        >
          <Download className="h-4 w-4" /> <span className="hidden sm:inline">{exporting === "anki" ? "..." : "Anki"}</span>
        </button>
        <Link
          href={`/study?bankId=${bankId}&mode=LEARN`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-brass bg-brass/10 px-5 text-sm font-medium text-brass transition-colors hover:bg-brass/20"
        >
          <Ship className="h-4 w-4" /> 开始答题
        </Link>
      </div>

      {/* FSRS 参数调优面板 */}
      {showFsrsPanel && bank && (
        <FsrsPanel bank={bank} onSaved={loadBank} showToast={showToast} />
      )}

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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-lg border px-4 py-2 font-sans text-sm shadow-lg ${
            toast.kind === "ok"
              ? "border-f-emerald/40 bg-f-emerald/10 text-f-emerald"
              : "border-coral/40 bg-coral/10 text-coral"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.kind === "ok" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {toast.msg}
          </div>
        </div>
      )}

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
                onUpdated={handleQuestionUpdated}
                showToast={showToast}
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

// ============ FSRS 参数调优面板 ============
function FsrsPanel({
  bank,
  onSaved,
  showToast,
}: {
  bank: BankDetail;
  onSaved: () => Promise<void>;
  showToast: (kind: "ok" | "err", msg: string) => void;
}) {
  const [fsrsEnabled, setFsrsEnabled] = useState(bank.fsrsEnabled);
  const [desiredRetention, setDesiredRetention] = useState(bank.desiredRetention);
  const [newCardsPerDay, setNewCardsPerDay] = useState(bank.newCardsPerDay);
  const [maxReviewsPerDay, setMaxReviewsPerDay] = useState(bank.maxReviewsPerDay);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/banks/${bank.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fsrsEnabled,
          desiredRetention,
          newCardsPerDay,
          maxReviewsPerDay,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        showToast("err", d?.error ?? "保存失败");
        return;
      }
      await onSaved();
      showToast("ok", "FSRS 参数已更新");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-brass/30 bg-gradient-to-br from-brass/5 via-abyss-50/40 to-abyss-700/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-brass" />
        <h2 className="font-serif text-lg text-ivory">FSRS 参数调优</h2>
        <span className="font-mono text-[10px] text-starlight/50">仅对此题库生效</span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* FSRS 开关 */}
        <div className="space-y-2">
          <label className="font-sans text-xs text-starlight">FSRS 调度</label>
          <button
            type="button"
            onClick={() => setFsrsEnabled((v) => !v)}
            className={`flex h-10 w-full items-center justify-between rounded-md border px-3 font-sans text-sm transition-colors ${
              fsrsEnabled
                ? "border-f-emerald/40 bg-f-emerald/10 text-f-emerald"
                : "border-starlight/30 bg-abyss-700/40 text-starlight"
            }`}
          >
            <span>{fsrsEnabled ? "已启用" : "已禁用"}</span>
            <span className={`relative inline-block h-5 w-9 rounded-full transition-colors ${fsrsEnabled ? "bg-f-emerald" : "bg-starlight/30"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-ivory transition-transform ${fsrsEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
            </span>
          </button>
          <p className="font-sans text-[10px] text-starlight/50">关闭后该库不参与 FSRS 调度</p>
        </div>

        {/* 目标记忆留存率 */}
        <div className="space-y-2">
          <label className="font-sans text-xs text-starlight">
            目标留存率 <span className="font-mono text-brass">{(desiredRetention * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min={0.7}
            max={0.99}
            step={0.01}
            value={desiredRetention}
            onChange={(e) => setDesiredRetention(Number(e.target.value))}
            className="h-10 w-full accent-brass"
          />
          <p className="font-sans text-[10px] text-starlight/50">越高复习越频繁，推荐 90%</p>
        </div>

        {/* 每日新题数 */}
        <div className="space-y-2">
          <label className="font-sans text-xs text-starlight">每日新题数</label>
          <Input
            type="number"
            min={1}
            max={500}
            value={newCardsPerDay}
            onChange={(e) => setNewCardsPerDay(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
          />
          <p className="font-sans text-[10px] text-starlight/50">每天最多引入的新卡数</p>
        </div>

        {/* 每日复习上限 */}
        <div className="space-y-2">
          <label className="font-sans text-xs text-starlight">每日复习上限</label>
          <Input
            type="number"
            min={10}
            max={2000}
            value={maxReviewsPerDay}
            onChange={(e) => setMaxReviewsPerDay(Math.max(10, Math.min(2000, Number(e.target.value) || 10)))}
          />
          <p className="font-sans text-[10px] text-starlight/50">到期卡每天最多展示数</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={resetForm} disabled={saving}>
          重置
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="gap-1.5"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          保存
        </Button>
      </div>
    </div>
  );

  function resetForm() {
    setFsrsEnabled(bank.fsrsEnabled);
    setDesiredRetention(bank.desiredRetention);
    setNewCardsPerDay(bank.newCardsPerDay);
    setMaxReviewsPerDay(bank.maxReviewsPerDay);
  }
}

// ============ 题目行 + 内联编辑 ============
interface EditableOption {
  key: string;
  text: string;
  correct: boolean;
  answer?: string;
  placeholder?: string;
}

function QuestionRow({
  question,
  index,
  onUpdated,
  showToast,
}: {
  question: QuestionListItem;
  index: number;
  onUpdated: () => Promise<void>;
  showToast: (kind: "ok" | "err", msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const stemPreview = question.stem.length > 100
    ? question.stem.slice(0, 100) + "..."
    : question.stem;

  return (
    <div className="rounded-lg border border-starlight/15 bg-abyss-50/30 px-4 py-3 transition-colors hover:border-brass/40">
      {editing ? (
        <QuestionEditor
          question={question}
          onCancel={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false);
            await onUpdated();
          }}
          showToast={showToast}
        />
      ) : (
        <div
          className="flex items-start gap-3"
          onClick={() => setExpanded((e) => !e)}
          role="button"
          tabIndex={0}
        >
          <span className="mt-0.5 font-mono text-xs text-starlight/60">{index}.</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded border border-starlight/20 bg-abyss-700/40 px-1.5 py-0.5 font-mono text-[10px] text-starlight/80">
                {TYPE_LABELS[question.type] ?? question.type}
              </span>
              {question.isStarred && <Star className="h-3 w-3 fill-brass text-brass" />}
              {question.isDisabled && (
                <span className="rounded border border-coral/40 bg-coral/10 px-1.5 py-0.5 font-mono text-[10px] text-coral">
                  已禁用
                </span>
              )}
              <span className="font-mono text-[10px] text-starlight/50">
                难度 {question.difficulty.toFixed(1)}
              </span>
            </div>
            <p className={`mt-1.5 font-sans text-sm text-ivory ${expanded ? "" : "line-clamp-2"}`}>
              {expanded ? question.stem : stemPreview}
            </p>
            {expanded && (
              <>
                {question.knowledgePoints.length > 0 && (
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
                {question.explanation && (
                  <div className="mt-2 rounded border border-starlight/10 bg-abyss-700/30 p-2">
                    <p className="font-sans text-[10px] text-starlight/60">解析</p>
                    <p className="mt-0.5 whitespace-pre-wrap font-sans text-xs text-ivory/85">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          {/* 编辑 / 删除按钮 */}
          <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1.5 text-starlight transition-colors hover:bg-brass/10 hover:text-brass"
              title="编辑"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <DeleteButton question={question} onDeleted={onUpdated} showToast={showToast} />
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteButton({
  question,
  onDeleted,
  showToast,
}: {
  question: QuestionListItem;
  onDeleted: () => Promise<void>;
  showToast: (kind: "ok" | "err", msg: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded p-1.5 text-starlight transition-colors hover:bg-coral/10 hover:text-coral"
        title="删除（软删除）"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    );
  }

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/questions/${question.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        showToast("err", d?.error ?? "删除失败");
        return;
      }
      showToast("ok", "题目已删除");
      await onDeleted();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded border border-coral/40 bg-coral/10 px-2 py-1 font-sans text-[10px] text-coral hover:bg-coral/20"
      >
        {deleting ? "..." : "确认"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded border border-starlight/30 px-2 py-1 font-sans text-[10px] text-starlight hover:bg-white/5"
      >
        取消
      </button>
    </div>
  );
}

// ============ 题目编辑器 ============
function QuestionEditor({
  question,
  onCancel,
  onSaved,
  showToast,
}: {
  question: QuestionListItem;
  onCancel: () => void;
  onSaved: () => Promise<void>;
  showToast: (kind: "ok" | "err", msg: string) => void;
}) {
  const [stem, setStem] = useState(question.stem);
  const [type, setType] = useState<QuestionType>(question.type);
  const [explanation, setExplanation] = useState(question.explanation ?? "");
  const [knowledgePointsStr, setKnowledgePointsStr] = useState(question.knowledgePoints.join(", "));
  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [isStarred, setIsStarred] = useState(question.isStarred);
  const [isDisabled, setIsDisabled] = useState(question.isDisabled);
  const [saving, setSaving] = useState(false);

  // 选项 / 答案状态
  const initialOptions = normalizeOptions(question.type, question.options);
  const [options, setOptions] = useState<EditableOption[]>(initialOptions);
  const initialAnswer = normalizeAnswer(question.type, question.answer);
  const [answerStr, setAnswerStr] = useState(initialAnswer);

  // 切换题型时重置选项 / 答案
  const handleTypeChange = (newType: QuestionType) => {
    setType(newType);
    if (newType === "TRUE_FALSE") {
      setOptions([
        { key: "T", text: "正确", correct: false },
        { key: "F", text: "错误", correct: false },
      ]);
      setAnswerStr("");
    } else if (newType === "FILL_BLANK") {
      setOptions([{ key: "1", text: "", correct: false, answer: "", placeholder: "第 1 空" }]);
      setAnswerStr("");
    } else if (newType === "SINGLE_CHOICE" || newType === "MULTI_CHOICE") {
      // 切换到选择类：保留有 text 的选项，否则给两个空选项
      const textOpts = options.filter((o) => o.text && o.text.length > 0);
      const base = textOpts.length > 0 ? textOpts : [
        { key: "A", text: "", correct: false },
        { key: "B", text: "", correct: false },
      ];
      // 重新分配 key
      const rekeyed = base.map((o, i) => ({
        ...o,
        key: String.fromCharCode(65 + i),
        correct: false,
      }));
      setOptions(rekeyed);
      setAnswerStr("");
    }
  };

  const updateOption = (idx: number, patch: Partial<EditableOption>) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      { key: String.fromCharCode(65 + prev.length), text: "", correct: false },
    ]);
  };

  const removeOption = (idx: number) => {
    setOptions((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((o, i) => ({ ...o, key: String.fromCharCode(65 + i) }))
    );
  };

  const handleSave = async () => {
    if (stem.trim().length === 0) {
      showToast("err", "题干不能为空");
      return;
    }
    setSaving(true);

    // 组装最终 options 和 answer
    const finalOptions: unknown = buildOptionsForType(type, options);
    const finalAnswer: unknown = buildAnswerForType(type, options, answerStr);

    try {
      const res = await apiFetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          stem: stem.trim(),
          options: finalOptions,
          answer: finalAnswer,
          explanation: explanation.trim() || null,
          knowledgePoints: knowledgePointsStr
            .split(/[,，]/)
            .map((s) => s.trim())
            .filter(Boolean),
          difficulty: Number(difficulty),
          isStarred,
          isDisabled,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        showToast("err", d?.error ?? "保存失败");
        return;
      }
      showToast("ok", "已保存");
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Pencil className="h-3.5 w-3.5 text-brass" />
        <span className="font-sans text-xs text-brass">编辑题目</span>
      </div>

      {/* 题型 + 难度 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="font-sans text-[11px] text-starlight/70">题型</label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
            className="h-9 w-full rounded-md border border-starlight/20 bg-abyss-700/40 px-2 font-sans text-sm text-ivory focus:border-brass focus:outline-none"
          >
            <option value="SINGLE_CHOICE">单选</option>
            <option value="MULTI_CHOICE">多选</option>
            <option value="TRUE_FALSE">判断</option>
            <option value="FILL_BLANK">填空</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="font-sans text-[11px] text-starlight/70">
            难度 <span className="font-mono text-brass">{difficulty.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={0.1}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="h-9 w-full accent-brass"
          />
        </div>
        <div className="flex items-end gap-3">
          <button
            type="button"
            onClick={() => setIsStarred((v) => !v)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 font-sans text-xs ${
              isStarred ? "border-brass bg-brass/10 text-brass" : "border-starlight/30 text-starlight"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${isStarred ? "fill-brass" : ""}`} /> 收藏
          </button>
          <button
            type="button"
            onClick={() => setIsDisabled((v) => !v)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-md border px-3 font-sans text-xs ${
              isDisabled ? "border-coral bg-coral/10 text-coral" : "border-starlight/30 text-starlight"
            }`}
          >
            {isDisabled ? "已禁用" : "启用中"}
          </button>
        </div>
      </div>

      {/* 题干 */}
      <div className="space-y-1">
        <label className="font-sans text-[11px] text-starlight/70">题干（Markdown）</label>
        <textarea
          value={stem}
          onChange={(e) => setStem(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-md border border-starlight/20 bg-abyss-700/40 px-3 py-2 font-sans text-sm text-ivory focus:border-brass focus:outline-none"
        />
      </div>

      {/* 选项 / 答案（按题型） */}
      {(type === "SINGLE_CHOICE" || type === "MULTI_CHOICE") && (
        <div className="space-y-2">
          <label className="font-sans text-[11px] text-starlight/70">
            选项（勾选正确答案{type === "MULTI_CHOICE" ? "，可多选" : "，仅一个"}）
          </label>
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type={type === "MULTI_CHOICE" ? "checkbox" : "radio"}
                name="correct-option"
                checked={o.correct}
                onChange={() => {
                  if (type === "SINGLE_CHOICE") {
                    setOptions((prev) => prev.map((x, j) => ({ ...x, correct: j === i })));
                  } else {
                    setOptions((prev) => prev.map((x, j) => (j === i ? { ...x, correct: !x.correct } : x)));
                  }
                }}
                className="h-4 w-4 accent-brass"
              />
              <span className="w-5 font-mono text-xs text-brass">{o.key}.</span>
              <Input
                value={o.text}
                onChange={(e) => updateOption(i, { text: e.target.value })}
                placeholder={`选项 ${o.key}`}
                className="flex-1"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  className="rounded p-1 text-starlight hover:text-coral"
                  title="删除选项"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {options.length < 8 && (
            <button
              type="button"
              onClick={addOption}
              className="inline-flex items-center gap-1 rounded-md border border-starlight/30 px-3 py-1.5 font-sans text-xs text-starlight hover:bg-brass/10 hover:text-brass"
            >
              <Plus className="h-3 w-3" /> 添加选项
            </button>
          )}
        </div>
      )}

      {type === "TRUE_FALSE" && (
        <div className="space-y-2">
          <label className="font-sans text-[11px] text-starlight/70">答案</label>
          <div className="flex gap-2">
            {[
              { v: true, label: "正确" },
              { v: false, label: "错误" },
            ].map((opt) => (
              <button
                key={String(opt.v)}
                type="button"
                onClick={() => {
                  setOptions((prev) =>
                    prev.map((o) => ({ ...o, correct: (o.key === "T") === opt.v }))
                  );
                }}
                className={`flex-1 rounded-md border px-4 py-2 font-sans text-sm ${
                  options.find((o) => o.key === "T")?.correct === opt.v
                    ? "border-f-emerald bg-f-emerald/10 text-f-emerald"
                    : "border-starlight/30 text-starlight hover:bg-white/5"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {type === "FILL_BLANK" && (
        <div className="space-y-2">
          <label className="font-sans text-[11px] text-starlight/70">
            答案（多空用 <span className="font-mono text-brass">||</span> 分隔，可接受答案用 <span className="font-mono text-brass">|</span> 分隔）
          </label>
          <Input
            value={answerStr}
            onChange={(e) => setAnswerStr(e.target.value)}
            placeholder="如：北京|Beijing||长江|Yangtze"
          />
          <p className="font-sans text-[10px] text-starlight/50">
            示例：<span className="font-mono">北京|Beijing</span> 表示该空接受「北京」或「Beijing」
          </p>
        </div>
      )}

      {/* 解析 */}
      <div className="space-y-1">
        <label className="font-sans text-[11px] text-starlight/70">解析（Markdown，可选）</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-md border border-starlight/20 bg-abyss-700/40 px-3 py-2 font-sans text-sm text-ivory focus:border-brass focus:outline-none"
        />
      </div>

      {/* 知识点 */}
      <div className="space-y-1">
        <label className="font-sans text-[11px] text-starlight/70">知识点（逗号分隔）</label>
        <Input
          value={knowledgePointsStr}
          onChange={(e) => setKnowledgePointsStr(e.target.value)}
          placeholder="如：马原-辩证法, 真题-2024"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2 border-t border-starlight/10 pt-3">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          取消
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          保存
        </Button>
      </div>
    </div>
  );
}

// ============ 工具函数：选项 / 答案标准化 ============
function normalizeOptions(type: QuestionType, raw: unknown): EditableOption[] {
  if (!Array.isArray(raw)) {
    if (type === "TRUE_FALSE") {
      return [
        { key: "T", text: "正确", correct: false },
        { key: "F", text: "错误", correct: false },
      ];
    }
    return [];
  }
  const opts = raw as Array<Record<string, unknown>>;
  return opts.map((o) => ({
    key: String(o.key ?? ""),
    text: typeof o.text === "string" ? o.text : "",
    correct: Boolean(o.correct),
    answer: typeof o.answer === "string" ? o.answer : undefined,
    placeholder: typeof o.placeholder === "string" ? o.placeholder : undefined,
  }));
}

function normalizeAnswer(type: QuestionType, raw: unknown): string {
  if (raw == null) return "";
  if (type === "TRUE_FALSE") return raw === true ? "正确" : "错误";
  if (type === "MULTI_CHOICE") {
    if (Array.isArray(raw)) return (raw as string[]).join(",");
    return String(raw);
  }
  if (type === "SINGLE_CHOICE") return String(raw);
  if (type === "FILL_BLANK") {
    if (Array.isArray(raw)) return (raw as string[]).join("||");
    return String(raw);
  }
  return String(raw);
}

function buildOptionsForType(type: QuestionType, options: EditableOption[]): unknown {
  if (type === "TRUE_FALSE") {
    return options.map((o) => ({ key: o.key, text: o.text, correct: o.correct }));
  }
  if (type === "FILL_BLANK") {
    // answer 字符串 → blanks 数组 → 选项结构
    // 但 options 已经是空结构，这里填空题的 options 应基于 answerStr 重建
    // 实际填空题选项由 buildAnswerForType 处理，这里返回 []（与导入端一致：填空题 options 可空）
    return [];
  }
  // 选择题
  return options.map((o) => ({ key: o.key, text: o.text, correct: o.correct }));
}

function buildAnswerForType(type: QuestionType, options: EditableOption[], answerStr: string): unknown {
  if (type === "SINGLE_CHOICE") {
    const correct = options.find((o) => o.correct);
    return correct?.key ?? "";
  }
  if (type === "MULTI_CHOICE") {
    return options.filter((o) => o.correct).map((o) => o.key);
  }
  if (type === "TRUE_FALSE") {
    const t = options.find((o) => o.key === "T");
    if (t) return t.correct;
    return false;
  }
  if (type === "FILL_BLANK") {
    // answerStr: "北京|Beijing||长江|Yangtze" → ["北京|Beijing", "长江|Yangtze"]
    if (!answerStr.trim()) return [];
    return answerStr.split("||").map((s) => s.trim()).filter((s) => s.length > 0 || true);
  }
  return null;
}
