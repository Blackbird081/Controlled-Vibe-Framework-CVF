'use client';

import { useState } from 'react';
import Link from 'next/link';
import WorkflowVisualizer, { type PipelineTab } from './WorkflowVisualizer';

const PATHWAY_CARDS = [
  { icon: '🚀', title: { vi: 'Mới dùng Vibe Coding?', en: 'New to Vibe Coding?' }, desc: { vi: 'Bắt đầu với 3 bước đơn giản', en: 'Start with 3 simple steps' }, href: '/docs', border: 'border-indigo-500/30 hover:border-indigo-400/60' },
  { icon: '🔧', title: { vi: 'Đang dùng?', en: 'Already using?' }, desc: { vi: 'Khám phá templates nâng cao', en: 'Explore advanced templates' }, href: '/marketplace', border: 'border-violet-500/30 hover:border-violet-400/60' },
  { icon: '🏗️', title: { vi: 'Muốn hiểu CVF?', en: 'Want to understand CVF?' }, desc: { vi: 'Kiến trúc governance pipeline', en: 'Governance pipeline architecture' }, href: '/docs', border: 'border-emerald-500/30 hover:border-emerald-400/60' },
  { icon: '⚡', title: { vi: 'Mẹo hay & tính năng mới', en: 'Tips & new features' }, desc: { vi: 'Cập nhật và tính năng mới nhất', en: 'Latest updates and features' }, href: '/help', border: 'border-amber-500/30 hover:border-amber-400/60' },
];

const TABS: { key: PipelineTab; label: { vi: string; en: string } }[] = [
  { key: 'template', label: { vi: 'Template → Output', en: 'Template → Output' } },
  { key: 'chat',     label: { vi: 'AI Agent Chat', en: 'AI Agent Chat' } },
  { key: 'wizard',   label: { vi: 'App Builder Wizard', en: 'App Builder Wizard' } },
];

export default function InsideVibCode({ lang }: { lang: 'vi' | 'en' }) {
  const [tab, setTab] = useState<PipelineTab>('template');

  return (
    <section id="inside-vibcode" className="bg-gray-950 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">
            {lang === 'vi' ? 'Bên trong Vibe Coding' : 'Inside Vibe Coding'}
          </p>
          <h2 className="text-3xl font-extrabold font-serif-display text-white md:text-4xl">
            {lang === 'vi' ? 'Kiến trúc AI lấy con người làm trọng tâm kiểm soát' : 'Human-Governed AI Architecture'}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-400">
            {lang === 'vi'
              ? 'Tất cả yêu cầu đều đi qua governance pipeline — không có AI nào chạy tự do không kiểm soát.'
              : 'Every request goes through a governance pipeline — no AI runs unchecked.'}
          </p>
        </div>

        {/* Pathway Cards 2×2 */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2">
          {PATHWAY_CARDS.map((c, i) => (
            <Link
              key={i}
              href={c.href}
              className={`group rounded-2xl border ${c.border} bg-gray-900 p-5 transition-all hover:bg-gray-800`}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gray-800 text-xl group-hover:bg-gray-700">
                  {c.icon}
                </span>
                <div>
                  <h3 className="mb-1 font-bold text-white transition-colors group-hover:text-indigo-300">
                    {lang === 'vi' ? c.title.vi : c.title.en}
                  </h3>
                  <p className="text-sm text-gray-400">{lang === 'vi' ? c.desc.vi : c.desc.en}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Governance Pipeline Visualizer */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="mb-5 text-center text-sm font-semibold text-gray-400">
            {lang === 'vi'
              ? 'CVF Governance Pipeline — bấm vào bước để xem chi tiết'
              : 'CVF Governance Pipeline — click a step for details'}
          </p>

          {/* Tab Switcher */}
          <div className="mb-5 flex rounded-xl bg-gray-800 p-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  tab === t.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {lang === 'vi' ? t.label.vi : t.label.en}
              </button>
            ))}
          </div>

          <WorkflowVisualizer tab={tab} lang={lang} />
        </div>
      </div>
    </section>
  );
}
