'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { CompassRose } from '@/components/CompassRose';
import { Illustration } from '@/components/Illustration';
import { useTranslation } from '@/components/i18n/useTranslation';
import { apiFetch } from '@/lib/api-fetch';
import { AuthLanguageSwitcher } from '@/components/i18n/AuthLanguageSwitcher';
import { GitHubIcon, GoogleIcon } from '@/components/ui/AuthIcons';

// 启用的 OAuth 提供商（逗号分隔，如 "github,google"；未配置则不显示 OAuth 入口）
const oauthProviders = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// 注册页 —— 开始你的航程
export default function RegisterPage() {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useTranslation();
  // 为每个 input 生成稳定唯一 id，使 <label htmlFor> 与 <input id> 关联（a11y）
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 已登录用户访问 /register → 跳转罗盘首页
  // !loading 守卫：注册提交成功后会 router.push('/compass')，此时 loading 仍为 true，
  // 守卫确保不抢占跳转流程；仅"挂载时已登录"的情况才跳转 compass
  useEffect(() => {
    if (status === 'authenticated' && !loading) {
      router.replace('/compass');
    }
  }, [status, loading, router]);

  // 会话加载中或已登录（即将跳转）时返回 null，避免闪烁注册表单
  if (status === 'loading' || status === 'authenticated') {
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. 创建账户
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        // API 返回 { error, code? }（register route 统一错误字段）
        // 邮箱已注册：明确告知用户去登录，而不是用通用 registerFailed 文案
        if (res.status === 409 && data?.code === 'email_exists') {
          setError(data.error ?? '该邮箱已注册，请直接登录');
        } else {
          setError(data?.error ?? t('auth', 'registerFailed'));
        }
        setLoading(false);
        return;
      }
      // 2. 注册成功后自动登录
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        // 自动登录失败：账户已创建，引导用户手动登录（不静默跳转，给用户反馈）
        setError('账户已创建，请使用邮箱密码登录');
        setLoading(false);
        router.push('/login');
        return;
      }
      router.push('/compass');
    } catch {
      setError(t('auth', 'networkError'));
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-abyss px-6 py-12">
      {/* 背景罗盘装饰 */}
      <CompassRose className="animate-spin-slow pointer-events-none absolute left-1/2 top-1/2 h-[125vmin] w-[125vmin] -translate-x-1/2 -translate-y-1/2 text-starlight opacity-[0.05]" />

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 sm:flex-row sm:items-stretch">
        {/* 左侧插画（≥sm 显示） */}
        <div className="hidden flex-1 items-center justify-center sm:flex">
          <Illustration name="auth-register" className="h-72 w-72 text-brass/60" />
        </div>

        <div className="w-full rounded-2xl border border-starlight/15 bg-abyss-50/40 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:max-w-md sm:p-10">
          <div className="absolute right-3 top-3">
            <AuthLanguageSwitcher />
          </div>
          {/* 移动端顶部小插画 */}
          <div className="mb-4 flex justify-center sm:hidden">
            <Illustration name="auth-register" className="h-24 w-24 text-brass/60" />
          </div>
          <div className="mb-8 text-center sm:pr-16">
            <h1 className="font-serif text-3xl text-ivory sm:text-4xl">{t('auth', 'registerTitle')}</h1>
            <p className="mt-2 font-sans text-sm text-starlight">{t('auth', 'registerSubtitle')}</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id={nameId}
            label={t('auth', 'name')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="你的称呼"
            autoComplete="name"
            required
          />
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
          <Input
            id={passwordId}
            label={t('auth', 'password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
            {loading ? t('auth', 'signingUp') : t('auth', 'signUp')}
          </button>
        </form>

        {oauthProviders.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 font-sans text-xs text-starlight/50">
              <span className="h-px flex-1 bg-starlight/15" aria-hidden="true" />
              {t('auth', 'oauthDivider')}
              <span className="h-px flex-1 bg-starlight/15" aria-hidden="true" />
            </div>
            <div className="grid gap-2">
              {oauthProviders.includes('github') && (
                <button
                  type="button"
                  onClick={() => signIn('github', { callbackUrl: '/compass' })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-starlight/20 bg-abyss-200/40 px-4 py-2.5 font-sans text-sm text-ivory transition-colors hover:bg-abyss-200/60"
                >
                  <GitHubIcon />
                  {t('auth', 'githubRegister')}
                </button>
              )}
              {oauthProviders.includes('google') && (
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/compass' })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-starlight/20 bg-abyss-200/40 px-4 py-2.5 font-sans text-sm text-ivory transition-colors hover:bg-abyss-200/60"
                >
                  <GoogleIcon />
                  {t('auth', 'googleRegister')}
                </button>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-center font-sans text-sm text-starlight/60">
          {t('auth', 'haveAccount')}{' '}
          <Link href="/login" className="text-brass transition-colors hover:text-brass-light">
            {t('auth', 'signIn')}
          </Link>
        </p>
        </div>
      </div>
    </main>
  );
}

