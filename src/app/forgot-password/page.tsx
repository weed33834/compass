'use client';

import { useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { CompassRose } from '@/components/CompassRose';
import { useTranslation } from '@/components/i18n/useTranslation';
import { AuthLanguageSwitcher } from '@/components/i18n/AuthLanguageSwitcher';

// 忘记密码页 —— 重置密码
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  // 为 input 生成稳定唯一 id，使 <label htmlFor> 与 <input id> 关联（a11y）
  const emailId = useId();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError(t('auth', 'requestFailed'));
        setLoading(false);
        return;
      }
      setSent(true);
      setLoading(false);
    } catch {
      setError(t('auth', 'networkError'));
      setLoading(false);
    }
  }

  // 发送成功提示
  if (sent) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-abyss px-6 py-12">
        <CompassRose className="animate-spin-slow pointer-events-none absolute left-1/2 top-1/2 h-[125vmin] w-[125vmin] -translate-x-1/2 -translate-y-1/2 text-starlight opacity-[0.05]" />

        <div className="relative z-10 w-full max-w-md rounded-2xl border border-starlight/15 bg-abyss-50/40 p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-10">
          <div className="absolute right-3 top-3">
            <AuthLanguageSwitcher />
          </div>
          <h1 className="font-serif text-3xl text-ivory sm:pr-16 sm:text-4xl">{t('auth', 'resetSentTitle')}</h1>
          <p className="mt-4 font-sans text-sm leading-relaxed text-starlight">
            {t('auth', 'resetSentBody')}
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center rounded-lg border border-brass bg-brass/10 px-8 py-3 text-lg font-medium text-brass transition-all hover:bg-brass/20 hover:shadow-[0_0_20px_rgba(201,162,39,0.3)]"
          >
            {t('auth', 'backToLogin')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-abyss px-6 py-12">
      {/* 背景罗盘装饰 */}
      <CompassRose className="animate-spin-slow pointer-events-none absolute left-1/2 top-1/2 h-[125vmin] w-[125vmin] -translate-x-1/2 -translate-y-1/2 text-starlight opacity-[0.05]" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-starlight/15 bg-abyss-50/40 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-10">
        <div className="absolute right-3 top-3">
          <AuthLanguageSwitcher />
        </div>
        <div className="mb-8 text-center sm:pr-16">
          <h1 className="font-serif text-3xl text-ivory sm:text-4xl">{t('auth', 'resetTitle')}</h1>
          <p className="mt-2 font-sans text-sm text-starlight">{t('auth', 'resetSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id={emailId}
            label={t('auth', 'email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="captain@compass.app"
            autoComplete="email"
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
            {loading ? t('auth', 'sending') : t('auth', 'sendResetEmail')}
          </button>
        </form>

        <p className="mt-6 text-center font-sans text-sm text-starlight/60">
          {t('auth', 'remembered')}{' '}
          <Link href="/login" className="text-brass transition-colors hover:text-brass-light">
            {t('auth', 'backToLogin')}
          </Link>
        </p>
      </div>
    </main>
  );
}
