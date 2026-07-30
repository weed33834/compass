'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Anchor, Navigation, Telescope, Upload, Brain, Keyboard, Repeat, Check, Shield, Database, Lock, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/components/i18n/useTranslation';
import { AuthLanguageSwitcher } from '@/components/i18n/AuthLanguageSwitcher';
import { CompassRose } from '@/components/CompassRose';

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

  // 能力清单（Hero 下方细条，纯定性，避免虚报数字）
  const capabilities = ['FSRS-6 科学算法', 'Word / Excel / Markdown 导入', '错题本 + 航迹分析', '桌面 / 移动双端'];

  // 「工作原理」四步
  const steps = [
    {
      icon: Upload,
      title: '导入题库',
      desc: 'Word、Excel、Markdown 一键导入，自动解析为结构化题目，保留选项与解析。',
    },
    {
      icon: Brain,
      title: '算法排程',
      desc: 'FSRS-6 根据你的作答表现动态计算遗忘曲线，自动安排每一天的最优复习量。',
    },
    {
      icon: Keyboard,
      title: '极速答题',
      desc: '键盘驱动的交互界面，单选 / 多选 / 填空全支持，专注不被鼠标打断。',
    },
    {
      icon: Repeat,
      title: '间隔复习',
      desc: '在快要遗忘的临界点出现，错题自动进入漂流瓶循环，直到真正掌握。',
    },
  ];

  // 「定价」两档
  const plans = [
    {
      name: '免费版',
      price: '¥0',
      period: '永久免费',
      highlight: false,
      cta: t('landing', 'heroCta'),
      features: ['无限题库导入与题目', 'FSRS-6 间隔重复', '错题漂流瓶', '单设备本地使用'],
    },
    {
      name: '进阶版',
      price: '¥29',
      period: '每月',
      highlight: true,
      cta: '升级进阶版',
      features: [
        '多设备云同步',
        '高级航迹分析报表',
        '自定义 FSRS 算法参数',
        '团队 / 共享空间',
        '优先邮件支持',
      ],
    },
  ];

  // 「常见问题」
  const faqs = [
    {
      q: '我的数据存在哪里？安全吗？',
      a: 'Compass 以自托管为优先设计：你可以把整套服务部署在自己的服务器或 VPS 上，数据库完全由你掌控。我们也提供官方托管，所有数据加密存储，绝不用于广告或第三方训练。',
    },
    {
      q: '支持哪些题库格式？',
      a: '目前支持 Markdown、Excel（.xlsx/.xls）、CSV 与 Word（.docx）。Markdown 采用带标题层级的简洁语法，官方提供多套示例题库，导入即学。',
    },
    {
      q: 'FSRS 是什么？比 Anki 好在哪？',
      a: 'FSRS（Free Spaced Repetition Scheduler）是开源的现代间隔重复算法，基于真实记忆模型动态优化复习间隔。Compass 在其基础上提供更适合刷题场景的交互与错题闭环，且可完全自托管、无订阅绑架。',
    },
    {
      q: '可以自己部署吗？',
      a: '可以。Compass 是标准 Next.js + PostgreSQL 应用，支持 Vercel + Neon、Railway/Render 以及自建 VPS（Docker）三种方式，文档涵盖从环境变量到反向代理的完整步骤。',
    },
    {
      q: '移动端体验如何？',
      a: '移动端与桌面端是完全独立的组件树，并非简单缩放：底部导航、悬浮学习按钮、滑动评分都针对触控重新设计，iOS / Android 浏览器均适配安全区。',
    },
  ];

  // 「隐私 / 自托管」卖点
  const privacyPoints = [
    { icon: Database, text: '数据本地优先，可完全自托管' },
    { icon: Lock, text: '开放导入导出，随时带走' },
    { icon: Shield, text: '无广告、无行为追踪' },
    { icon: Check, text: '算法开源，调度逻辑可审计' },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-abyss text-ivory">
      {/* ============ Hero 区域 ============ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* 背景：brass 辉光 */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,162,39,0.12),transparent_70%)]" />
        {/* 背景装饰：巨型罗盘玫瑰 */}
        <CompassRose className="pointer-events-none absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 text-brass/8 animate-[spin_120s_linear_infinite]" />

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

          {/* 能力清单细条 */}
          <div
            className="mt-14 flex flex-wrap items-center justify-center gap-3 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '1.1s' }}
          >
            {capabilities.map((c) => (
              <span
                key={c}
                className="rounded-full border border-starlight/15 bg-abyss-50/40 px-4 py-1.5 text-xs tracking-wide text-starlight"
              >
                {c}
              </span>
            ))}
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

      {/* ============ 工作原理 ============ */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-4xl text-ivory sm:text-5xl">{t('landing', 'howTitle')}</h2>
          <p className="mt-4 font-sans text-starlight">{t('landing', 'howSubtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="relative flex flex-col gap-4 rounded-2xl border border-starlight/10 bg-abyss-50/30 p-7 transition-all duration-300 hover:border-brass/40"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brass/40 bg-brass/10 font-serif text-sm text-brass">
                  {i + 1}
                </span>
                <Icon className="h-6 w-6 text-brass" />
              </div>
              <h3 className="font-serif text-xl text-ivory">{title}</h3>
              <p className="font-sans text-sm leading-relaxed text-starlight">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 定价 / 套餐 ============ */}
      <section className="relative mx-auto max-w-5xl px-6 py-24 sm:py-32">
        <div className="mb-16 text-center">
          <h2 className="font-serif text-4xl text-ivory sm:text-5xl">{t('landing', 'pricingTitle')}</h2>
          <p className="mt-4 font-sans text-starlight">{t('landing', 'pricingSubtitle')}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                'flex flex-col rounded-3xl border p-8 transition-all duration-300 ' +
                (plan.highlight
                  ? 'border-brass bg-gradient-to-b from-brass/15 to-transparent shadow-[0_0_40px_-10px_rgba(201,162,39,0.35)]'
                  : 'border-starlight/15 bg-abyss-50/30')
              }
            >
              {plan.highlight && (
                <span className="mb-4 self-start rounded-full border border-brass/50 bg-brass/15 px-3 py-1 text-xs tracking-wide text-brass">
                  推荐
                </span>
              )}
              <h3 className="font-serif text-2xl text-ivory">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-serif text-5xl text-ivory">{plan.price}</span>
                <span className="font-sans text-sm text-starlight">/ {plan.period}</span>
              </div>
              <ul className="mt-8 flex flex-1 flex-col gap-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 font-sans text-sm text-starlight">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brass" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={
                  'mt-8 inline-flex items-center justify-center rounded-lg border px-8 py-3 text-base font-medium transition-all ' +
                  (plan.highlight
                    ? 'border-brass bg-brass/20 text-brass hover:bg-brass/30 hover:shadow-[0_0_20px_rgba(201,162,39,0.3)]'
                    : 'border-starlight/30 text-ivory hover:border-brass/50 hover:bg-brass/10')
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 常见问题 ============ */}
      <section className="relative mx-auto max-w-3xl px-6 py-24 sm:py-32">
        <div className="mb-14 text-center">
          <h2 className="font-serif text-4xl text-ivory sm:text-5xl">{t('landing', 'faqTitle')}</h2>
          <p className="mt-4 font-sans text-starlight">{t('landing', 'faqSubtitle')}</p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((item, i) => {
            const open = openFaq === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-starlight/10 bg-abyss-50/30"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-sans text-ivory">{item.q}</span>
                  <ChevronDown
                    className={
                      'h-5 w-5 shrink-0 text-brass transition-transform duration-300 ' +
                      (open ? 'rotate-180' : '')
                    }
                  />
                </button>
                <div
                  className="grid transition-all duration-300 ease-in-out"
                  style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 font-sans text-sm leading-relaxed text-starlight">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ 隐私 / 自托管 ============ */}
      <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="overflow-hidden rounded-3xl border border-brass/20 bg-gradient-to-b from-tide/10 to-transparent px-8 py-16 sm:px-16">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl text-ivory sm:text-5xl">{t('landing', 'privacyTitle')}</h2>
            <p className="mt-4 font-sans text-starlight">{t('landing', 'privacySubtitle')}</p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {privacyPoints.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 font-sans text-sm text-ivory">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brass/30 bg-brass/10 text-brass">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
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
