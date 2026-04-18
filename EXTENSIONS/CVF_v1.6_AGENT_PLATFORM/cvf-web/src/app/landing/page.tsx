'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, PenLine, Rocket, MessageSquare, LayoutGrid, Shield, Globe, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import HeroVisualizer from './components/HeroVisualizer';

type Lang = 'vi' | 'en';

const content = {
  hero: {
    badge: { vi: 'Nền tảng AI cho mọi người', en: 'AI platform for everyone' },
    title: {
      vi: ['Biến ý tưởng thành', 'ứng dụng thực tế', 'không cần viết code'],
      en: ['Turn your ideas into', 'real applications', 'no coding required'],
    },
    subtitle: {
      vi: 'Chỉ cần mô tả bằng tiếng Việt — AI sẽ xây dựng spec, chiến lược, phân tích dữ liệu và hơn thế nữa cho bạn.',
      en: 'Just describe what you need — AI will build specs, strategies, data analysis and more for you.',
    },
    cta: { vi: 'Tạo App đầu tiên — Miễn phí', en: 'Create Your First App — Free' },
    ctaSecondary: { vi: 'Xem cách hoạt động ↓', en: 'See how it works ↓' },
  },
  compare: {
    title: { vi: 'Quên đi sự phức tạp', en: 'Forget the complexity' },
    subtitle: {
      vi: 'Bạn không cần biết lập trình. VibCode biến mọi thứ phức tạp thành vài bước đơn giản.',
      en: "You don't need to know programming. VibCode turns complexity into a few simple steps.",
    },
    before: {
      label: { vi: 'Cách truyền thống', en: 'The old way' },
      lines: [
        'npm init -y && npm i express',
        'const app = require("express")()',
        'app.get("/api/data", async (req, res) => {',
        '  const db = await connectDB()',
        '  const rows = await db.query("...")',
        '  return res.json(rows)',
        '})',
        'app.listen(3000)',
        '// ...hàng trăm dòng code nữa',
      ],
    },
    after: {
      label: { vi: 'Với VibCode', en: 'With VibCode' },
    },
  },
  steps: [
    {
      icon: ClipboardList,
      title: { vi: 'Chọn Template', en: 'Pick a Template' },
      desc: {
        vi: '20+ templates chuyên nghiệp cho kinh doanh, marketing, thiết kế sản phẩm, phân tích dữ liệu.',
        en: '20+ professional templates for business, marketing, product design, data analysis.',
      },
    },
    {
      icon: PenLine,
      title: { vi: 'Điền Form đơn giản', en: 'Fill a Simple Form' },
      desc: {
        vi: 'Trả lời vài câu hỏi bằng tiếng Việt hoặc tiếng Anh — không cần viết prompt hay biết thuật ngữ kỹ thuật.',
        en: 'Answer a few questions in plain language — no prompt writing or technical jargon needed.',
      },
    },
    {
      icon: Rocket,
      title: { vi: 'Nhận kết quả chuyên nghiệp', en: 'Get Professional Results' },
      desc: {
        vi: 'AI tạo output hoàn chỉnh. Duyệt lại, chỉnh sửa và xuất ra Word/PDF ngay lập tức.',
        en: 'AI generates polished output. Review, edit and export to Word/PDF instantly.',
      },
    },
  ],
  features: [
    {
      icon: MessageSquare,
      title: { vi: 'Trò chuyện với AI Agent', en: 'Chat with AI Agent' },
      desc: {
        vi: 'Hỏi bất cứ điều gì — AI trả lời thông minh và hiểu ngữ cảnh công việc của bạn.',
        en: 'Ask anything — AI responds intelligently and understands your work context.',
      },
    },
    {
      icon: LayoutGrid,
      title: { vi: 'Wizard xây dựng ứng dụng', en: 'App Builder Wizard' },
      desc: {
        vi: 'Tạo spec ứng dụng hoàn chỉnh qua 8 bước hướng dẫn trực quan — từ ý tưởng đến thiết kế.',
        en: 'Build complete app specs through 8 guided steps — from idea to design.',
      },
    },
    {
      icon: Shield,
      title: { vi: 'Kiểm soát chất lượng AI', en: 'AI Quality Governance' },
      desc: {
        vi: 'Framework quản trị tích hợp giúp AI output luôn chuẩn mực, an toàn và đáng tin cậy.',
        en: 'Built-in governance framework ensures AI output is always accurate, safe and trustworthy.',
      },
    },
    {
      icon: Globe,
      title: { vi: 'Song ngữ Việt — Anh', en: 'Bilingual Vietnamese — English' },
      desc: {
        vi: 'Mọi trang, mọi template đều hỗ trợ cả tiếng Việt lẫn tiếng Anh. Chuyển đổi chỉ 1 click.',
        en: 'Every page, every template supports both Vietnamese and English. Switch with 1 click.',
      },
    },
  ],
  trust: {
    title: { vi: 'Được xây dựng trên nền tảng doanh nghiệp', en: 'Built on enterprise foundations' },
    badges: [
      { vi: 'Quản trị AI 45 lớp bảo vệ', en: '45-layer AI governance', icon: Shield },
      { vi: 'Bảo mật cấp Enterprise', en: 'Enterprise-grade security', icon: Shield },
      { vi: 'Hỗ trợ song ngữ', en: 'Bilingual support', icon: Globe },
    ],
  },
  cta: {
    title: { vi: 'Sẵn sàng thử sức?', en: 'Ready to get started?' },
    desc: {
      vi: 'Đăng nhập miễn phí và trải nghiệm sức mạnh AI — không cần thẻ tín dụng, không cần biết code.',
      en: 'Sign in for free and experience the power of AI — no credit card, no coding required.',
    },
    cta: { vi: 'Bắt đầu tạo — Miễn phí', en: 'Start Creating — Free' },
  },
  footer: {
    text: { vi: 'VibCode — AI cho mọi người, không chỉ cho lập trình viên', en: 'VibCode — AI for everyone, not just developers' },
  },
};

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en';
    const saved = localStorage.getItem('cvf_language');
    return saved === 'vi' || saved === 'en' ? saved : 'en';
  });

  const toggleLang = () => {
    const next = lang === 'vi' ? 'en' : 'vi';
    setLang(next);
    localStorage.setItem('cvf_language', next);
  };

  const t = (obj: { vi: string; en: string }) => obj[lang];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/20 text-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/10 dark:text-white">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-gray-800/50 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/landing" className="flex items-center gap-2.5 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-sm shadow-indigo-500/25">
              V
            </span>
            <span className="text-lg font-bold group-hover:text-indigo-600 transition-colors dark:group-hover:text-indigo-400">
              VibCode
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/50"
            >
              {lang === 'vi' ? '🌐 EN' : '🌐 VI'}
            </button>
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/25 transition-all hover:shadow-md hover:shadow-indigo-500/30 hover:brightness-110"
            >
              {lang === 'vi' ? 'Đăng nhập' : 'Sign in'}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 pb-12 pt-16 md:pb-20 md:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — copy */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 dark:border-indigo-800 dark:bg-indigo-950/50">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                {t(content.hero.badge)}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-[3.25rem]">
              {content.hero.title[lang].map((line, i) => (
                <span key={i}>
                  {i === 1 ? (
                    <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                      {line}
                    </span>
                  ) : (
                    line
                  )}
                  {i < 2 && <br />}
                </span>
              ))}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
              {t(content.hero.subtitle)}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:brightness-110"
              >
                {t(content.hero.cta)}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-7 py-3.5 text-base font-medium transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/30"
              >
                {t(content.hero.ctaSecondary)}
              </a>
            </div>
          </div>

          {/* Right — interactive visualizer */}
          <div className="lg:pl-4">
            <HeroVisualizer lang={lang} />
          </div>
        </div>
      </section>

      {/* ── Before / After ── */}
      <section className="border-y border-gray-100 bg-white py-16 dark:border-gray-800 dark:bg-gray-900/50 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold md:text-4xl">{t(content.compare.title)}</h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-gray-400">
              {t(content.compare.subtitle)}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Before — code */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400" /><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t(content.compare.before.label)}</span>
              </div>
              <div className="bg-slate-900 p-5 font-mono text-xs leading-relaxed text-slate-300">
                {content.compare.before.lines.map((line, i) => (
                  <div key={i} className="whitespace-pre">
                    <span className="mr-3 text-slate-600">{String(i + 1).padStart(2, ' ')}</span>
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* After — VibCode form */}
            <div className="rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 overflow-hidden shadow-lg shadow-indigo-500/5">
              <div className="flex items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-4 py-2.5 dark:border-indigo-900 dark:bg-indigo-950/50">
                <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">{t(content.compare.after.label)}</span>
              </div>
              <div className="bg-white p-5 dark:bg-gray-900">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {lang === 'vi' ? 'Tên ứng dụng' : 'App name'}
                    </label>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {lang === 'vi' ? 'Quản lý chi tiêu' : 'Expense Tracker'}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {lang === 'vi' ? 'Mô tả ngắn' : 'Short description'}
                    </label>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {lang === 'vi' ? 'App theo dõi thu chi hằng ngày...' : 'Daily income & expense tracker...'}
                    </div>
                  </div>
                  <button className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white">
                    {lang === 'vi' ? '✨ Tạo với AI' : '✨ Generate with AI'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-Step Flow ── */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">
            {lang === 'vi' ? 'Chỉ 3 bước đơn giản' : 'Just 3 simple steps'}
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {content.steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="group relative rounded-2xl border border-gray-200/60 bg-white p-6 text-center transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 dark:border-gray-700/60 dark:bg-gray-900 dark:hover:border-indigo-800">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50">
                  <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-bold">{t(step.title)}</h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{t(step.desc)}</p>
                {i < 2 && (
                  <ChevronRight className="absolute -right-4 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-indigo-300 md:block dark:text-indigo-700" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-y border-gray-100 bg-white py-16 dark:border-gray-800 dark:bg-gray-900/50 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-extrabold md:text-4xl">
            {lang === 'vi' ? 'Tính năng nổi bật' : 'Key Features'}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {content.features.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex items-start gap-4 rounded-2xl border border-gray-200/60 bg-white p-5 transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 dark:border-gray-700/60 dark:bg-gray-900 dark:hover:border-indigo-800">
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50">
                    <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-bold">{t(feat.title)}</h3>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{t(feat.desc)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="mb-6 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          {t(content.trust.title)}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {content.trust.badges.map((badge, i) => (
            <div key={i} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <Shield className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <span>{t(badge)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-center text-white shadow-xl shadow-indigo-500/20 md:p-12">
          <h2 className="text-2xl font-extrabold md:text-3xl">{t(content.cta.title)}</h2>
          <p className="mx-auto mt-3 max-w-md text-indigo-100">{t(content.cta.desc)}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-bold text-indigo-600 shadow-sm transition-all hover:bg-indigo-50 hover:shadow-md"
          >
            {t(content.cta.cta)}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 py-8 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-indigo-600 to-violet-600 text-[10px] font-bold text-white">V</span>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t(content.footer.text)}</span>
          </div>
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">Tien-Tan Thuan Port @2026</div>
        </div>
      </footer>
    </div>
  );
}
