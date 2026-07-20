"use client";

import "./globals.css";

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
          <div>
            <h2 style={{ fontSize: "1.5rem", fontFamily: "serif", marginBottom: "0.5rem" }}>
              应用出现严重错误
            </h2>
            <p style={{ maxWidth: "28rem", fontSize: "0.875rem", opacity: 0.6 }}>
              {error.message || "系统遇到了未预期的问题。可以尝试重新加载，或稍后再回来。"}
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
            重新加载
          </button>
        </div>
      </body>
    </html>
  );
}
