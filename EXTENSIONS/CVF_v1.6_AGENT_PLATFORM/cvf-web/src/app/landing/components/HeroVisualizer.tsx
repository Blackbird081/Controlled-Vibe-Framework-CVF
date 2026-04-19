'use client';

import { useState, useEffect } from 'react';

type Msg = { role: 'user' | 'ai'; text: string; delay: number };

const VI_MSGS: Msg[] = [
  { role: 'user', delay: 0,    text: 'Tôi muốn làm app đặt bàn cho nhà hàng nhỏ...' },
  { role: 'ai',   delay: 1500, text: 'Tuyệt! Mình đã dựng form đặt bàn với chọn giờ, số khách và ghi chú đặc biệt.' },
  { role: 'user', delay: 3000, text: 'Thêm nhắc lịch qua email nhé' },
  { role: 'ai',   delay: 4500, text: 'Đã thêm! Email tự động gửi 2h trước giờ đặt bàn.' },
];

const EN_MSGS: Msg[] = [
  { role: 'user', delay: 0,    text: 'I want to build a reservation app for my small restaurant...' },
  { role: 'ai',   delay: 1500, text: 'Done! I built a booking form with time picker, guest count, and special notes.' },
  { role: 'user', delay: 3000, text: 'Add email reminders too' },
  { role: 'ai',   delay: 4500, text: 'Added! Email reminders auto-send 2h before each reservation.' },
];

function AppPreview({ lang }: { lang: 'vi' | 'en' }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-lg shadow-indigo-500/5 dark:border-indigo-900/40 dark:bg-gray-900">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          {lang === 'vi' ? '✓ App đã tạo xong' : '✓ App generated'}
        </span>
      </div>
      <div className="space-y-2">
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          🗓 {lang === 'vi' ? 'Chọn ngày & giờ' : 'Select date & time'}
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          👥 {lang === 'vi' ? 'Số khách: 4 người' : 'Guests: 4 people'}
        </div>
        <div className="rounded-lg bg-indigo-600 px-3 py-2 text-center text-xs font-bold text-white">
          {lang === 'vi' ? 'Đặt bàn ngay' : 'Reserve Now'}
        </div>
      </div>
    </div>
  );
}

export default function HeroVisualizer({ lang }: { lang: 'vi' | 'en' }) {
  const [cycle, setCycle] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const messages = lang === 'vi' ? VI_MSGS : EN_MSGS;

  useEffect(() => {
    setVisibleCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];

    messages.forEach((msg, i) => {
      const t = setTimeout(() => setVisibleCount(i + 1), msg.delay + 300);
      timers.push(t);
    });

    const last = messages[messages.length - 1].delay;
    const loop = setTimeout(() => setCycle(c => c + 1), last + 3500);
    timers.push(loop);

    return () => timers.forEach(clearTimeout);
  }, [lang, cycle]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto w-full max-w-md space-y-3">
      {/* Chat window */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-lg shadow-indigo-500/5 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2 dark:border-gray-800">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-[10px] font-bold text-white">V</span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Vibe Coding</span>
          <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <div className="min-h-[128px] space-y-2.5">
          {messages.slice(0, visibleCount).map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'rounded-br-sm bg-indigo-600 text-white'
                  : 'rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {visibleCount > 0 && visibleCount < messages.length && (
            <div className="flex justify-start">
              <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-3.5 py-2.5 dark:bg-gray-800">
                {(['animate-delay-0', 'animate-delay-150', 'animate-delay-300'] as const).map(cls => (
                  <span key={cls} className={`h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce ${cls}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App preview after last message */}
      <div className={`transition-all duration-700 ${visibleCount >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}>
        <AppPreview lang={lang} />
      </div>
    </div>
  );
}
