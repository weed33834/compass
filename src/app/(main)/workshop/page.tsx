"use client";

// 造船工坊：题库管理
// 路由：/workshop
//
// 功能：
//   1. 列出当前用户的全部题库（卡片网格）
//   2. 新建题库（手动 / 导入文件）
//   3. 点击题库卡片 → 进入题库详情 /workshop/[id]

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  Search,
  Ship,
  Layers,
  X,
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface BankListItem {
  id: string;
  name: string;
  description: string | null;
  coverColor: string;
  tags: string[];
  visibility: string;
  source: string;
  totalQuestions: number;
  questionCount: number;
  dueCount: number;
  fsrsEnabled: boolean;
  newCardsPerDay: number;
  createdAt: string;
  updatedAt: string;
}

const COVER_COLORS: Record<string, string> = {
  brass: "from-brass/30 to-brass-dark/10 border-brass/40",
  tide: "from-tide/30 to-tide-dark/10 border-tide/40",
  coral: "from-coral/30 to-coral-dark/10 border-coral/40",
  starlight: "from-starlight/20 to-starlight-dark/10 border-starlight/30",
};

function coverClass(color: string): string {
  return COVER_COLORS[color] ?? COVER_COLORS.brass;
}

export default function WorkshopPage() {
  const [banks, setBanks] = useState<BankListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  // 新建/导入对话框
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const loadBanks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/banks");
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "加载失败");
        return;
      }
      const data = await res.json();
      setBanks(data.banks ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  const filtered = banks.filter((b) => {
    if (!keyword) return true;
    const kw = keyword.toLowerCase();
    return (
      b.name.toLowerCase().includes(kw) ||
      b.tags.some((t) => t.toLowerCase().includes(kw))
    );
  });

  return (
    <div className="space-y-6">
      {/* 顶部标题 + 操作 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ivory">造船工坊</h1>
          <p className="mt-1 font-sans text-sm text-starlight">
            在这里打造你的题库舰队：手动创建或从 Markdown / Excel / Word 导入
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4" /> 导入文件
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> 新建题库
          </Button>
        </div>
      </div>

      {/* 搜索 */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-starlight/50" />
        <Input
          type="text"
          placeholder="按名称或标签搜索..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-coral/30 bg-coral/10 px-4 py-3 font-sans text-sm text-coral">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 题库网格 */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-brass" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onCreate={() => setShowCreate(true)} onImport={() => setShowImport(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((bank) => (
            <BankCard key={bank.id} bank={bank} />
          ))}
        </div>
      )}

      {/* 新建对话框 */}
      {showCreate && (
        <CreateBankDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadBanks();
          }}
        />
      )}

      {/* 导入对话框 */}
      {showImport && (
        <ImportDialog
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            loadBanks();
          }}
        />
      )}
    </div>
  );
}

// ============ 题库卡片 ============
function BankCard({ bank }: { bank: BankListItem }) {
  const updated = new Date(bank.updatedAt);
  const updatedStr = `${updated.getMonth() + 1} 月 ${updated.getDate()} 日`;
  return (
    <Link
      href={`/workshop/${bank.id}`}
      className={`group block rounded-xl border bg-gradient-to-br p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${coverClass(
        bank.coverColor
      )}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-brass" />
          <h3 className="font-serif text-lg text-ivory group-hover:text-brass-light">
            {bank.name}
          </h3>
        </div>
        {bank.dueCount > 0 && (
          <span className="rounded-full border border-coral/40 bg-coral/10 px-2 py-0.5 font-mono text-[11px] text-coral">
            待复习 {bank.dueCount}
          </span>
        )}
      </div>

      {bank.description && (
        <p className="mt-2 line-clamp-2 font-sans text-xs text-starlight/80">
          {bank.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-4 font-mono text-xs text-starlight/70">
        <span>共 {bank.questionCount} 题</span>
        {bank.tags.length > 0 && (
          <span className="truncate">· {bank.tags.slice(0, 2).join(" / ")}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between font-sans text-[11px] text-starlight/50">
        <span>{sourceLabel(bank.source)}</span>
        <span>更新于 {updatedStr}</span>
      </div>
    </Link>
  );
}

function sourceLabel(source: string): string {
  switch (source) {
    case "MANUAL": return "手动";
    case "IMPORT_MD": return "Markdown 导入";
    case "IMPORT_EXCEL": return "Excel 导入";
    case "IMPORT_WORD": return "Word 导入";
    case "IMPORT_ANKI": return "Anki 导入";
    case "AGENT_GENERATED": return "智能体生成";
    default: return source;
  }
}

// ============ 空状态 ============
function EmptyState({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-starlight/20 bg-abyss-50/20 p-12 text-center">
      <Ship className="mx-auto h-12 w-12 text-brass/50" />
      <h2 className="mt-4 font-serif text-2xl text-ivory">还没有题库</h2>
      <p className="mt-2 font-sans text-sm text-starlight">
        新建一个空题库，或直接从 Markdown / Excel / Word 文件导入
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button variant="secondary" onClick={onImport}>
          <Upload className="h-4 w-4" /> 导入文件
        </Button>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4" /> 新建题库
        </Button>
      </div>
    </div>
  );
}

// ============ 新建题库对话框 ============
function CreateBankDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverColor, setCoverColor] = useState("brass");
  const [tags, setTags] = useState("");
  const [newCardsPerDay, setNewCardsPerDay] = useState("20");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim()) {
      setError("题库名称不能为空");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await apiFetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          coverColor,
          tags: tags ? tags.split(/[,，]/).map((s) => s.trim()).filter(Boolean) : [],
          newCardsPerDay: parseInt(newCardsPerDay, 10) || 20,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "创建失败");
        return;
      }
      onCreated();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell title="新建题库" onClose={onClose}>
      <div className="space-y-4">
        <Field label="题库名称 *">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：考研政治马原"
            maxLength={100}
          />
        </Field>

        <Field label="描述（可选）">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简要描述题库范围与用途"
            rows={2}
            maxLength={300}
            className="w-full rounded-md border border-starlight/20 bg-abyss-700/40 px-3 py-2 font-sans text-sm text-ivory placeholder:text-starlight/40 focus:border-brass focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="封面色">
            <select
              value={coverColor}
              onChange={(e) => setCoverColor(e.target.value)}
              className="h-10 w-full rounded-md border border-starlight/20 bg-abyss-700/40 px-3 font-sans text-sm text-ivory focus:border-brass focus:outline-none"
            >
              <option value="brass">黄铜</option>
              <option value="tide">潮汐</option>
              <option value="coral">珊瑚</option>
              <option value="starlight">星光</option>
            </select>
          </Field>
          <Field label="每日新题数">
            <Input
              type="number"
              value={newCardsPerDay}
              onChange={(e) => setNewCardsPerDay(e.target.value)}
              min={1}
              max={500}
            />
          </Field>
        </div>

        <Field label="标签（逗号分隔）">
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="例如：考研, 政治"
          />
        </Field>

        {error && (
          <p className="rounded-md border border-coral/30 bg-coral/10 px-3 py-2 font-sans text-xs text-coral">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button onClick={submit} loading={submitting}>
            创建
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ============ 导入文件对话框 ============
function ImportDialog({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (info: { bankName: string; questionCount: number }) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [newCardsPerDay, setNewCardsPerDay] = useState("20");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!file) {
      setError("请先选择文件");
      return;
    }
    setSubmitting(true);
    setError("");
    setWarnings([]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (name.trim()) fd.append("name", name.trim());
      if (description.trim()) fd.append("description", description.trim());
      if (tags.trim()) fd.append("tags", tags.trim());
      fd.append("newCardsPerDay", newCardsPerDay);

      const res = await apiFetch("/api/banks/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "导入失败");
        if (data?.warnings) setWarnings(data.warnings);
        return;
      }
      if (data.warnings?.length) setWarnings(data.warnings);
      onImported({ bankName: data.bankName, questionCount: data.questionCount });
    } finally {
      setSubmitting(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  return (
    <ModalShell title="从文件导入题库" onClose={onClose}>
      <div className="space-y-4">
        {/* 文件选择区 */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-starlight/20 bg-abyss-700/30 px-6 py-8 text-center transition-colors hover:border-brass/50 hover:bg-brass/5"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".md,.markdown,.txt,.xlsx,.xls,.csv,.docx"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-brass" />
              <p className="font-sans text-sm text-ivory">{file.name}</p>
              <p className="font-mono text-xs text-starlight/60">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-starlight/50" />
              <p className="font-sans text-sm text-ivory">点击或拖拽文件到此处</p>
              <p className="font-sans text-xs text-starlight/60">
                支持 .md / .txt / .xlsx / .csv / .docx（最大 10 MB）
              </p>
            </div>
          )}
        </div>

        {/* 格式说明 */}
        <details className="rounded-md border border-starlight/15 bg-abyss-700/30 px-3 py-2">
          <summary className="cursor-pointer font-sans text-xs text-starlight/80">
            查看文件格式约定
          </summary>
          <div className="mt-2 space-y-2 font-sans text-[11px] leading-relaxed text-starlight/70">
            <p><span className="text-brass">Markdown</span>：用 <code className="text-brass-light">---</code> 分隔题目；题型用 <code className="text-brass-light">## 单选题</code> 标识；选项 <code className="text-brass-light">A. xxx</code>；答案行 <code className="text-brass-light">答案：B</code>。</p>
            <p><span className="text-brass">Excel/CSV</span>：首行为表头，列名 type/stem/options/answer/explanation/difficulty/knowledge/source；选项用 | 分隔。</p>
            <p><span className="text-brass">Word</span>：可写 Markdown 风格（## 题型 + --- 分隔），或每题空行分隔、首行写题型。</p>
          </div>
        </details>

        {/* 元信息 */}
        <Field label="题库名（可选，缺省用文件名）">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：2024 国考行测真题" />
        </Field>

        <Field label="描述（可选）">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="题库简介"
            className="w-full rounded-md border border-starlight/20 bg-abyss-700/40 px-3 py-2 font-sans text-sm text-ivory placeholder:text-starlight/40 focus:border-brass focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="标签（逗号分隔）">
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="考研, 政治" />
          </Field>
          <Field label="每日新题数">
            <Input
              type="number"
              value={newCardsPerDay}
              onChange={(e) => setNewCardsPerDay(e.target.value)}
              min={1}
              max={500}
            />
          </Field>
        </div>

        {error && (
          <p className="rounded-md border border-coral/30 bg-coral/10 px-3 py-2 font-sans text-xs text-coral">
            {error}
          </p>
        )}

        {warnings.length > 0 && (
          <details className="rounded-md border border-f-amber/30 bg-f-amber/5 px-3 py-2">
            <summary className="cursor-pointer font-sans text-xs text-f-amber">
              解析告警（{warnings.length} 条）
            </summary>
            <ul className="mt-2 space-y-1 font-mono text-[11px] text-f-amber/80">
              {warnings.slice(0, 20).map((w, i) => (
                <li key={i}>· {w}</li>
              ))}
            </ul>
          </details>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button onClick={submit} loading={submitting} disabled={!file}>
            导入
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

// ============ 共享小组件 ============
function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-abyss-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-brass/30 bg-abyss-300/95 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ivory">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-starlight hover:bg-white/5 hover:text-ivory"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-sans text-xs text-starlight">{label}</label>
      {children}
    </div>
  );
}
