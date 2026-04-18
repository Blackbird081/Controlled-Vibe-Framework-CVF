'use client';

import { useState, useEffect, useRef } from 'react';

const PROMPTS = [
  { vi: 'Tạo app quản lý chi tiêu cá nhân...', en: 'Create a personal expense tracker app...' },
  { vi: 'Viết chiến lược marketing cho startup...', en: 'Write a marketing strategy for a startup...' },
  { vi: 'Phân tích dữ liệu bán hàng Q1...', en: 'Analyze Q1 sales data report...' },
];

/* Fake dashboard that "appears" after the prompt is typed */
function MockDashboard({ lang }: { lang: 'vi' | 'en' }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-xl shadow-indigo-500/5 dark:border-indigo-900/40 dark:bg-gray-900">
      {/* Topbar */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {lang === 'vi' ? 'Kết quả AI' : 'AI Result'}
          </span>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          {lang === 'vi' ? '✓ Hoàn tất' : '✓ Complete'}
        </span>
      </div>

      {/* Fake content rows */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-sm dark:bg-indigo-900/40">📊</div>
          <div className="flex-1">
            <div className="h-2.5 w-3/4 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="mt-1.5 h-2 w-1/2 rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">$2,450</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-sm dark:bg-violet-900/40">📈</div>
          <div className="flex-1">
            <div className="h-2.5 w-2/3 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="mt-1.5 h-2 w-2/5 rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+18%</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-sm dark:bg-amber-900/40">🎯</div>
          <div className="flex-1">
            <div className="h-2.5 w-4/5 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="mt-1.5 h-2 w-3/5 rounded-full bg-gray-100 dark:bg-gray-800" />
          </div>
          <div className="text-xs font-bold text-violet-600 dark:text-violet-400">12 tasks</div>
        </div>
      </div>

      {/* Fake chart bars */}
      <div className="mt-4 flex items-end gap-1.5 h-12">
        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-t from-indigo-500 to-violet-400 opacity-80 dark:from-indigo-600 dark:to-violet-500"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function HeroVisualizer({ lang }: { lang: 'vi' | 'en' }) {
  const [phase, setPhase] = useState<'typing' | 'result'>('typing');
  const [displayText, setDisplayText] = useState('');
  const [promptIdx, setPromptIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPrompt = PROMPTS[promptIdx][lang];

  useEffect(() => {
    setPhase('typing');
    setDisplayText('');
    let charIndex = 0;

    intervalRef.current = setInterval(() => {
      charIndex += 1;
      if (charIndex <= currentPrompt.length) {
        setDisplayText(currentPrompt.slice(0, charIndex));
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => setPhase('result'), 600);
        setTimeout(() => {
          setPhase('typing');
          setDisplayText('');
          setPromptIdx(prev => (prev + 1) % PROMPTS.length);
        }, 4500);
      }
    }, 45);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [promptIdx, lang, currentPrompt]);

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Prompt bar */}
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-lg shadow-indigo-500/5 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
            {lang === 'vi' ? 'nhập yêu cầu' : 'enter your request'}
          </span>
        </div>
        <div className="min-h-[28px] text-base font-medium text-gray-800 dark:text-gray-200">
          {displayText}
          <span className="inline-block w-0.5 h-5 bg-indigo-500 ml-0.5 animate-pulse align-text-bottom" />
        </div>
      </div>

      {/* Result appears */}
      <div
        className={`mt-4 transition-all duration-700 ease-out ${
          phase === 'result'
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <MockDashboard lang={lang} />
      </div>
    </div>
  );
}
