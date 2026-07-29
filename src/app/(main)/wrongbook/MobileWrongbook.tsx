"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor, Loader2, AlertTriangle, RotateCcw, XCircle, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { MobileCard, MobileSectionTitle, MobileEmpty } from "@/components/mobile/MobilePrimitives";
import { CARD_STATE_LABELS, QUESTION_TYPE_LABELS, type QuestionType, type CardState } from "@/app/(main)/study/types";

interface WrongItem {
  reviewItemId: string;
  questionId: string;
  bankId: string;
  bankName: string;
  bankCoverColor: string;
  stem: string;
  type: QuestionType;
  state: CardState;
  lapses: number;
  lastErrorAt: string | null;
}

export function MobileWrongbook() {
  const router = useRouter();
  const [items, setItems] = useState<WrongItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/wrongbook");
      if (res.ok) {
        const d = await res.json();
        setItems(d.items ?? []);
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-starlight">
        <Loader2 className="h-8 w-8 animate-spin text-brass" />
        <p>正在打捞漂流瓶…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <MobileSectionTitle>错题漂流瓶</MobileSectionTitle>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-f-coral2/30 bg-f-coral2/10 p-3 text-sm text-f-coral2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {items.length === 0 ? (
        <MobileEmpty icon={<Anchor className="h-10 w-10" />} title="暂无错题" hint="答错的题会沉入漂流瓶，等你重捞" />
      ) : (
        <>
          <button
            type="button"
            onClick={() => router.push("/study?mode=WRONG_REDO")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-coral py-3 font-semibold text-ivory active:bg-coral-dark"
          >
            <RotateCcw className="h-4 w-4" /> 一次性重做全部 {items.length} 道
          </button>
          <div className="space-y-3">
            {items.map((it) => (
              <Link key={it.reviewItemId} href={`/study?bankId=${it.bankId}&mode=WRONG_REDO`} className="block">
                <MobileCard>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="truncate text-xs text-starlight">{it.bankName}</span>
                        <span className="rounded-full bg-coral/15 px-2 py-0.5 text-[10px] text-coral">
                          {QUESTION_TYPE_LABELS[it.type]}
                        </span>
                      </div>
                      <p className="line-clamp-2 font-sans text-sm leading-relaxed text-ivory">{it.stem}</p>
                      <p className="mt-1.5 text-xs text-starlight">
                        错 {it.lapses} 次 · {CARD_STATE_LABELS[it.state]}
                      </p>
                    </div>
                    <XCircle className="h-5 w-5 shrink-0 text-coral/70" />
                  </div>
                </MobileCard>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
