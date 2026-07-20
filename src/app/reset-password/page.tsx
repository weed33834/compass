'use client';

import { Suspense, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { CompassRose } from '@/components/CompassRose';
import { apiFetch } from '@/lib/api-fetch';

// 重置密码页 —— 设置新密码
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // 无 token：链接无效
  if (!token) {
    return (
      <Shell>
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl text-ivory sm:text-4xl">链接无效</h1>
          <p className="mt-2 font-sans text-sm text-starlight">重置链接缺失或已失效</p>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex w-full items-center justify-center rounded-lg border border-brass bg-brass/10 px-8 py-3 text-lg font-medium text-brass transition-all hover:bg-brass/20 hover:shadow-[0_0_20px_rgba(201,162,39,0.3)]"
        >
          重新申请
        </Link>
      </Shell>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('密码至少需要 8 位');
      return;
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        // API 返回 { error }（reset-password route 统一错误字段），不是 { message }
        setError(data?.error ?? '重置失败，请重试');
        setLoading(false);
        return;
      }
      setDone(true);
      setLoading(false);
    } catch {
      setError('网络异常，请重试');
      setLoading(false);
    }
  }

  // 重置成功提示
  if (done) {
    return (
      <Shell>
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl text-ivory sm:text-4xl">密码已重置</h1>
          <p className="mt-4 font-sans text-sm leading-relaxed text-starlight">
            你的新密码已生效，请使用新密码登录。
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="inline-flex w-full items-center justify-center rounded-lg border border-brass bg-brass/10 px-8 py-3 text-lg font-medium text-brass transition-all hover:bg-brass/20 hover:shadow-[0_0_20px_rgba(201,162,39,0.3)]"
        >
          前往登录
        </button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl text-ivory sm:text-4xl">设置新密码</h1>
        <p className="mt-2 font-sans text-sm text-starlight">为你的航程重新设定通行密令</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="新密码"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="至少 8 位"
          autoComplete="new-password"
          required
        />
        <Input
          label="确认密码"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="再次输入新密码"
          autoComplete="new-password"
          required
        />

        {error && (
          <p className="rounded-lg border border-coral/30 bg-coral/10 px-4 py-2 font-sans text-sm text-coral">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center rounded-lg border border-brass bg-brass/10 px-8 py-3 text-lg font-medium text-brass transition-all hover:bg-brass/20 hover:shadow-[0_0_20px_rgba(201,162,39,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '重置中…' : '重置密码'}
        </button>
      </form>
    </Shell>
  );
}

// 统一的卡片外壳
function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-abyss px-6 py-12">
      <CompassRose className="animate-spin-slow pointer-events-none absolute left-1/2 top-1/2 h-[125vmin] w-[125vmin] -translate-x-1/2 -translate-y-1/2 text-starlight opacity-[0.05]" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-starlight/15 bg-abyss-50/40 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-10">
        {children}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams 需在 Suspense 边界内使用
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-abyss px-6 py-12">
          <CompassRose className="animate-spin-slow pointer-events-none absolute left-1/2 top-1/2 h-[125vmin] w-[125vmin] -translate-x-1/2 -translate-y-1/2 text-starlight opacity-[0.05]" />
          <p className="relative z-10 font-sans text-starlight">加载中…</p>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
