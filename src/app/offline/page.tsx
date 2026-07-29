import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "离线模式 · Compass",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-abyss px-6">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-brass/30 bg-brass/5">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-brass"
          >
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
            <path d="M8 12h8M12 8v8" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl text-ivory">当前处于离线模式</h1>
        <p className="mt-3 max-w-sm font-sans text-sm leading-relaxed text-starlight">
          网络连接不可用。请检查网络后重试。
          <br />
          部分已缓存的页面和题库仍可查看。
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-brass bg-brass/10 px-5 text-sm font-medium text-brass transition-colors hover:bg-brass/20"
        >
          重新连接
        </button>
      </div>
    </main>
  );
}
