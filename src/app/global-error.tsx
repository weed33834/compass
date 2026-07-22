"use client";

import "./globals.css";

// 迷航插画（与 Illustration.tsx 的 not-found 风格一致）
// global-error 必须自包含（不能依赖全局 CSS/Tailwind 上下文），故内联 SVG
function StormIllustration() {
  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 200 200"
      fill="none"
      stroke="#C9A227"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ opacity: 0.7 }}
    >
      {/* 浓雾圆圈 */}
      <circle cx="100" cy="100" r="88" strokeDasharray="2 6" opacity="0.3" />
      {/* 破损罗盘 */}
      <circle cx="100" cy="100" r="55" opacity="0.5" />
      <circle cx="100" cy="100" r="40" opacity="0.4" strokeDasharray="3 3" />
      {/* 断裂的指针 */}
      <path d="M 100 50 L 108 100 L 100 95" fill="#C9A227" opacity="0.7" />
      <path d="M 100 150 L 92 105" fill="#C9A227" opacity="0.5" />
      {/* 闪电 */}
      <path d="M 150 35 L 140 60 L 152 65 L 138 95" stroke="#E07A5F" strokeWidth="1.8" opacity="0.7" />
      {/* 迷雾波浪 */}
      <path d="M 20 170 Q 40 160 60 170 T 100 170 T 140 170 T 180 170" opacity="0.3" strokeDasharray="5 3" />
      <path d="M 10 30 Q 30 25 50 30 T 90 30 T 130 30 T 170 30" opacity="0.2" strokeDasharray="5 3" />
    </svg>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          background: "#0B1426",
          color: "#F5F1E8",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            padding: "0 1rem",
            textAlign: "center",
          }}
        >
          <StormIllustration />
          <div>
            <h2 style={{ fontSize: "1.5rem", fontFamily: "serif", marginBottom: "0.5rem" }}>
              风暴袭击了船只
            </h2>
            <p style={{ maxWidth: "28rem", fontSize: "0.875rem", opacity: 0.6 }}>
              {error.message || "系统遇到了未预期的问题。可以尝试重新启航，或稍后再回来。"}
            </p>
          </div>
          <button
            onClick={reset}
            style={{
              borderRadius: "0.375rem",
              background: "#C9A227",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#0B1426",
              border: "none",
              cursor: "pointer",
            }}
          >
            重新启航
          </button>
        </div>
      </body>
    </html>
  );
}
