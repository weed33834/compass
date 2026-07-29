"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Ship } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { useTranslation } from "@/components/i18n/useTranslation";
import { AuthLanguageSwitcher } from "@/components/i18n/AuthLanguageSwitcher";

type Mode = "login" | "register" | "forgot" | "reset";

export function MobileAuth({ mode }: { mode: Mode }) {
  const router = useRouter();
  const search = useSearchParams();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState(search.get("token") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const title =
    mode === "login"
      ? t("auth", "loginTitle")
      : mode === "register"
        ? t("auth", "registerTitle")
        : mode === "forgot"
          ? "找回密码"
          : "重置密码";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await signIn("credentials", { email, password, redirect: false });
        if (!res || res.error) {
          setError(t("auth", "invalidCredentials"));
          setLoading(false);
          return;
        }
        router.push("/compass");
        return;
      }

      if (mode === "register") {
        const res = await apiFetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          setError(d?.error ?? t("auth", "registerFailed"));
          setLoading(false);
          return;
        }
        const r = await signIn("credentials", { email, password, redirect: false });
        if (!r || r.error) {
          setError("账户已创建，请使用邮箱密码登录");
          router.push("/login");
          return;
        }
        router.push("/compass");
        return;
      }

      if (mode === "forgot") {
        const res = await apiFetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (res.ok) setInfo("若邮箱存在，重置链接已发送，请查收邮件。");
        else setError("发送失败，请稍后重试");
        setLoading(false);
        return;
      }

      if (mode === "reset") {
        const res = await apiFetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          setError(d?.error ?? "重置失败");
          setLoading(false);
          return;
        }
        setInfo("密码已重置，正在前往登录…");
        setTimeout(() => router.push("/login"), 1200);
        return;
      }
    } catch {
      setError(t("auth", "networkError"));
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-xl border border-starlight/20 bg-abyss-700/50 px-4 py-3.5 font-sans text-base text-ivory placeholder:text-starlight/40 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass/40";

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brass/15">
          <Ship className="h-8 w-8 text-brass" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-ivory">{title}</h1>
        {(mode === "login" || mode === "register") && (
          <p className="mt-1 text-sm text-starlight">
            {mode === "login" ? t("auth", "loginSubtitle") : t("auth", "registerSubtitle")}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === "register" && (
          <input
            className={field}
            placeholder={t("auth", "name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            inputMode="text"
          />
        )}
        {mode !== "reset" && (
          <input
            className={field}
            type="email"
            placeholder={t("auth", "email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
          />
        )}
        {mode !== "forgot" && (
          <input
            className={field}
            type="password"
            placeholder={t("auth", "password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            required
          />
        )}
        {mode === "register" && (
          <input
            className={field}
            type="password"
            placeholder="确认密码"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        )}

        {error && <p className="text-center text-sm text-f-coral2">{error}</p>}
        {info && <p className="text-center text-sm text-f-emerald">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brass py-3.5 text-base font-semibold text-abyss active:bg-brass-dark disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "login"
            ? t("auth", "signIn")
            : mode === "register"
              ? t("auth", "signUp")
              : mode === "forgot"
                ? "发送重置邮件"
                : "重置密码"}
        </button>
      </form>

      {/* 切换入口 */}
      <div className="mt-6 space-y-2 text-center text-sm">
        {mode === "login" && (
          <>
            <p>
              <button type="button" onClick={() => router.push("/forgot-password")} className="text-brass">
                {t("auth", "forgotPassword")}
              </button>
            </p>
            <p className="text-starlight">
              {t("auth", "noAccount")}{" "}
              <button type="button" onClick={() => router.push("/register")} className="text-brass">
                {t("auth", "signUp")}
              </button>
            </p>
          </>
        )}
        {mode === "register" && (
          <p className="text-starlight">
            {t("auth", "haveAccount")}{" "}
            <button type="button" onClick={() => router.push("/login")} className="text-brass">
              {t("auth", "signIn")}
            </button>
          </p>
        )}
        {(mode === "forgot" || mode === "reset") && (
          <p className="text-starlight">
            <button type="button" onClick={() => router.push("/login")} className="text-brass">
              {t("auth", "signIn")}
            </button>
          </p>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <AuthLanguageSwitcher />
      </div>
    </div>
  );
}
