'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Input } from '@/components/ui/Input';
import { CompassRose } from '@/components/CompassRose';
import { Illustration } from '@/components/Illustration';
import { useTranslation } from '@/components/i18n/useTranslation';
import { AuthLanguageSwitcher } from '@/components/i18n/AuthLanguageSwitcher';
import { GitHubIcon, GoogleIcon } from '@/components/ui/AuthIcons';

// 启用的 OAuth 提供商（逗号分隔，如 "github,google"；未配置则不显示 OAuth 入口）
const oauthProviders = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// 登录页 —— 欢迎回来
export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const { t } = useTranslation();
  // 为每个 input 生成稳定唯一 id，使 <label htmlFor> 与 <input id> 关联（a11y：点击 label 聚焦 + 屏幕阅读器关联）
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 已登录用户访问 /login → 跳转罗盘
  // !loading 守卫：避免与表单提交成功后的 router.push('/compass') 重复跳转
  useEffect(() => {
    if (status === 'authenticated' && !loading) {
      router.replace('/compass');
    }
  }, [status, loading, router]);

  // 会话加载中或已登录（即将跳转）时返回 null，避免闪烁登录表单
  if (status === 'loading' || status === 'authenticated') {
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        setError(t('auth', 'invalidCredentials'));
        setLoading(false);
        return;
      }
      router.push('/compass');
    } catch {
      setError(t('auth', 'loginFailed'));
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
          <Illustration name="auth-login" className="h-72 w-72 text-brass/60" />
        </div>

        <div className="w-full rounded-2xl border border-starlight/15 bg-abyss-50/40 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:max-w-md sm:p-10">
          <div className="absolute right-3 top-3">
            <AuthLanguageSwitcher />
          </div>
          {/* 移动端顶部小插画 */}
          <div className="mb-4 flex justify-center sm:hidden">
            <Illustration name="auth-login" className="h-24 w-24 text-brass/60" />
          </div>
          <div className="mb-8 text-center sm:pr-16">
            <h1 className="font-serif text-3xl text-ivory sm:text-4xl">{t('auth', 'loginTitle')}</h1>
            <p className="mt-2 font-sans text-sm text-starlight">{t('auth', 'loginSubtitle')}</p>
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
          <Input
            id={passwordId}
            label={t('auth', 'password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
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
            {loading ? t('auth', 'signingIn') : t('auth', 'signIn')}
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
                  {t('auth', 'github')}
                </button>
              )}
              {oauthProviders.includes('google') && (
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl: '/compass' })}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-starlight/20 bg-abyss-200/40 px-4 py-2.5 font-sans text-sm text-ivory transition-colors hover:bg-abyss-200/60"
                >
                  <GoogleIcon />
                  {t('auth', 'google')}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between font-sans text-sm">
          <Link href="/forgot-password" className="text-starlight transition-colors hover:text-brass">
            {t('auth', 'forgotPassword')}
          </Link>
          <span className="text-starlight/60">
            {t('auth', 'noAccount')}{' '}
            <Link href="/register" className="text-brass transition-colors hover:text-brass-light">
              {t('auth', 'signUp')}
            </Link>
          </span>
        </div>
        </div>
      </div>
    </main>
  );
}

