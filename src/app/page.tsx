'use client';

import Link from 'next/link';
import { Anchor, Navigation, Telescope } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/components/i18n/useTranslation';
import { AuthLanguageSwitcher } from '@/components/i18n/AuthLanguageSwitcher';

// 落地页 —— 深海航海仪器 × 现代极简主义，全屏沉浸式
export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Anchor,
      title: t('landing', 'featureAnchorTitle'),
      desc: t('landing', 'featureAnchorDesc'),
    },
    {
      icon: Navigation,
      title: t('landing', 'featurePlanTitle'),
      desc: t('landing', 'featurePlanDesc'),
    },
    {
      icon: Telescope,
      title: t('landing', 'featureCalibrateTitle'),
      desc: t('landing', 'featureCalibrateDesc'),
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-abyss text-ivory">
      {/* ============ Hero 区域 ============ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* 背景：brass 辉光 */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,162,39,0.12),transparent_70%)]" />

        {/* 右上角语言切换 */}
        <div className="absolute right-4 top-4 z-20 sm:right-8 sm:top-6">
          <AuthLanguageSwitcher />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <h1 className="font-serif text-5xl leading-tight tracking-tight text-ivory opacity-0 animate-fade-in-up sm:text-6xl md:text-7xl lg:text-8xl">
            {t('landing', 'heroTitle')}
          </h1>

          <p
            className="mt-6 font-sans text-base tracking-[0.2em] text-starlight opacity-0 animate-fade-in-up sm:text-lg"
            style={{ animationDelay: '0.4s' }}
          >
            {t('landing', 'heroTagline')}
          </p>

          <div
            className="mt-12 flex flex-col items-center gap-4 opacity-0 animate-fade-in-up sm:flex-row sm:gap-6"
            style={{ animationDelay: '0.8s' }}
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border border-brass bg-brass/10 px-8 py-3 text-lg font-medium text-brass transition-all hover:bg-brass/20 hover:shadow-[0_0_20px_rgba(201,162,39,0.3)]"
            >
              {t('landing', 'heroCta')}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-starlight/30 px-8 py-3 text-lg font-medium text-ivory transition-all hover:border-brass/50 hover:bg-brass/10"
            >
              {t('landing', 'heroLogin')}
            </Link>
          </div>
        </div>
      </section>

      {/* ============ 功能亮点区域 ============ */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-4xl text-ivory sm:text-5xl">{t('landing', 'featuresTitle')}</h2>
          <p className="mt-4 font-sans text-starlight">{t('landing', 'featuresSubtitle')}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card
              key={title}
              className="group flex flex-col items-start gap-5 rounded-2xl border border-starlight/10 bg-abyss-50/30 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-brass/40 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-brass/30 bg-brass/10 text-brass transition-colors group-hover:bg-brass/20">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl text-ivory">{title}</h3>
              <p className="font-sans text-sm leading-relaxed text-starlight">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ============ 底部 CTA ============ */}
      <section className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
        <div className="relative overflow-hidden rounded-3xl border border-brass/20 bg-gradient-to-b from-brass/10 to-transparent px-8 py-16 sm:px-16">
          <h2 className="relative font-serif text-4xl text-ivory sm:text-5xl">{t('landing', 'ctaTitle')}</h2>
          <p className="relative mt-4 font-sans text-starlight">
            {t('landing', 'ctaDesc')}
          </p>
          <Link
            href="/register"
            className="relative mt-10 inline-flex items-center justify-center rounded-lg border border-brass bg-brass/10 px-8 py-3 text-lg font-medium text-brass transition-all hover:bg-brass/20 hover:shadow-[0_0_20px_rgba(201,162,39,0.3)]"
          >
            {t('landing', 'heroCta')}
          </Link>
        </div>
      </section>

      {/* ============ 页脚 ============ */}
      <footer className="border-t border-starlight/10 px-6 py-8 text-center">
        <p className="font-sans text-sm text-starlight">{t('landing', 'copyright')}</p>
      </footer>
    </main>
  );
}
