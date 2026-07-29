"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Ship, Loader2, AlertTriangle, Layers, Clock, Star, Ban, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { MobileCard, MobileSectionTitle } from "@/components/mobile/MobilePrimitives";
import { MobileTopBar } from "@/components/mobile/MobileShell";
import { QUESTION_TYPE_LABELS, type QuestionType } from "@/app/(main)/study/types";

interface BankDetail {
  id: string;
  name: string;
  description: string | null;
  coverColor: string;
  tags: string[];
  totalQuestions: number;
  dueCount: number;
  newCardsPerDay: number;
}

interface BankStats {
  totalCount: number;
  dueCount: number;
  learnedCount: number;
  wrongCount: number;
}

interface QuestionListItem {
  id: string;
  type: QuestionType;
  stem: string;
  isStarred: boolean;
  isDisabled: boolean;
}

const COVER: Record<string, string> = {
  brass: "from-brass/30 to-brass-dark/10 border-brass/40",
  tide: "from-tide/30 to-tide-dark/10 border-tide/40",
  coral: "from-coral/30 to-coral-dark/10 border-coral/40",
  starlight: "from-starlight/25 to-starlight-dark/10 border-starlight/30",
};

export function MobileBankDetail() {
  const params = useParams();
  const router = useRouter();
  const bankId = String(params.id);
  const [bank, setBank] = useState<BankDetail | null>(null);
  const [stats, setStats] = useState<BankStats | null>(null);
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, qRes] = await Promise.all([
        apiFetch(`/api/banks/${bankId}`),
        apiFetch(`/api/banks/${bankId}/questions?pageSize=50`),
      ]);
      if (bRes.ok) {
        const d = await bRes.json();
        setBank(d.bank);
        setStats(d.stats);
      }
      if (qRes.ok) {
        const d = await qRes.json();
        setQuestions(d.questions ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [bankId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-starlight">
        <Loader2 className="h-8 w-8 animate-spin text-brass" />
        <p>正在解缆…</p>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-starlight">
        <AlertTriangle className="h-10 w-10 text-f-coral2" />
        <p>题库不存在或已下架</p>
        <Link href="/workshop" className="rounded-xl bg-brass px-5 py-2.5 font-semibold text-abyss">
          返回工坊
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <MobileTopBar title={bank.name} onBack={() => router.push("/workshop")} />

      {/* 概览 */}
      <div className={`rounded-3xl border bg-gradient-to-br p-5 ${COVER[bank.coverColor] ?? COVER.brass}`}>
        {bank.description && <p className="mb-3 text-sm text-starlight">{bank.description}</p>}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-serif text-2xl text-ivory">{bank.totalQuestions}</div>
            <div className="text-[11px] text-starlight">总题数</div>
          </div>
          <div>
            <div className="font-serif text-2xl text-brass">{stats?.dueCount ?? 0}</div>
            <div className="text-[11px] text-starlight">待复习</div>
          </div>
          <div>
            <div className="font-serif text-2xl text-coral">{stats?.wrongCount ?? 0}</div>
            <div className="text-[11px] text-starlight">错题</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/study?bankId=${bank.id}`)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brass py-3.5 text-base font-semibold text-abyss active:bg-brass-dark"
        >
          <Ship className="h-5 w-5" /> 开始刷题
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-f-coral2/30 bg-f-coral2/10 p-3 text-sm text-f-coral2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* 题目列表 */}
      <div>
        <MobileSectionTitle>
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-brass" /> 题目清单（{questions.length}）
          </span>
        </MobileSectionTitle>
        {questions.length === 0 ? (
          <p className="px-1 text-sm text-starlight">该题库暂无题目</p>
        ) : (
          <div className="space-y-2.5">
            {questions.map((q, i) => (
              <MobileCard key={q.id} className="flex items-center gap-3 py-3">
                <span className="w-6 shrink-0 text-center font-mono text-xs text-starlight">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 font-sans text-sm text-ivory">{q.stem}</p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-starlight">
                    <span className="rounded-full bg-starlight/10 px-2 py-0.5">
                      {QUESTION_TYPE_LABELS[q.type]}
                    </span>
                    {q.isStarred && <Star className="h-3.5 w-3.5 text-brass" />}
                    {q.isDisabled && <Ban className="h-3.5 w-3.5 text-f-coral2" />}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-starlight/50" />
              </MobileCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
