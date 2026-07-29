"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, Upload, Loader2, AlertTriangle, ArrowRight, Plus } from "lucide-react";
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
}

const COVER: Record<string, string> = {
  brass: "from-brass/30 to-brass-dark/10 border-brass/40",
  tide: "from-tide/30 to-tide-dark/10 border-tide/40",
  coral: "from-coral/30 to-coral-dark/10 border-coral/40",
  starlight: "from-starlight/25 to-starlight-dark/10 border-starlight/30",
};

export function MobileWorkshop() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [banks, setBanks] = useState<BankListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/banks");
      if (res.ok) {
        const d = await res.json();
        setBanks(d.banks ?? []);
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

  const onImport = async (file: File) => {
    setImporting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/banks/import", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "导入失败");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-starlight">
        <Loader2 className="h-8 w-8 animate-spin text-brass" />
        <p>正在装载舰队…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <MobileSectionTitle>造船工坊</MobileSectionTitle>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-1.5 rounded-xl bg-brass px-3 py-2 text-sm font-semibold text-abyss active:bg-brass-dark disabled:opacity-50"
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          导入
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,.txt,.csv,.xlsx,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-f-coral2/30 bg-f-coral2/10 p-3 text-sm text-f-coral2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {banks.length === 0 ? (
        <MobileEmpty
          icon={<Layers className="h-10 w-10" />}
          title="还没有题库"
          hint="点右上角「导入」，支持 Markdown / Excel / Word"
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

      <button
        type="button"
        onClick={() => router.push("/study")}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brass/30 py-3 text-sm text-starlight active:bg-white/5"
      >
        <Plus className="h-4 w-4" /> 开始一场无指定题库的练习
      </button>
    </div>
  );
}
