'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';

const STORAGE_KEY = 'cvf_onboarding_seen';

interface OnboardingTourProps {
    onDismiss?: () => void;
}

const TOUR_STEPS = [
    {
        id: 'templates',
        icon: '🗂️',
        titleEn: 'Pick a task from the template gallery',
        titleVi: 'Chọn task từ thư viện template',
        bodyEn: 'Browse pre-built templates by category. Each one has a guided form — no prompt writing needed. Click any card to start.',
        bodyVi: 'Duyệt template theo nhóm. Mỗi template có form hướng dẫn sẵn — không cần viết prompt. Click vào card bất kỳ để bắt đầu.',
    },
    {
        id: 'governance',
        icon: '🛡️',
        titleEn: 'CVF checks every request before it runs',
        titleVi: 'CVF kiểm tra mọi yêu cầu trước khi chạy',
        bodyEn: 'After you submit, the governance panel shows the risk level, which guard reviewed it, and whether it was allowed, blocked, or needs approval. This is CVF working for you.',
        bodyVi: 'Sau khi gửi, panel governance hiển thị mức độ rủi ro, guard nào đã kiểm tra, và kết quả: cho phép, chặn, hay cần duyệt. Đây là CVF bảo vệ bạn.',
    },
    {
        id: 'provider',
        icon: '🔑',
        titleEn: 'Connect an AI provider to run live tasks',
        titleVi: 'Kết nối AI provider để chạy task thực',
        bodyEn: 'Go to Settings → Provider Keys and add an Alibaba (Qwen) or DeepSeek API key. Free-tier keys work. Without a key, only demo mode is available.',
        bodyVi: 'Vào Settings → Provider Keys và thêm API key của Alibaba (Qwen) hoặc DeepSeek. Free-tier là đủ. Không có key thì chỉ dùng được demo mode.',
    },
];

export function OnboardingTour({ onDismiss }: OnboardingTourProps) {
    const { language } = useLanguage();
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) !== '1') {
            const timer = setTimeout(() => setVisible(true), 600);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = useCallback(() => {
        localStorage.setItem(STORAGE_KEY, '1');
        setVisible(false);
        onDismiss?.();
    }, [onDismiss]);

    const next = useCallback(() => {
        if (step < TOUR_STEPS.length - 1) {
            setStep(s => s + 1);
        } else {
            dismiss();
        }
    }, [step, dismiss]);

    const prev = useCallback(() => {
        setStep(s => Math.max(0, s - 1));
    }, []);

    if (!visible) return null;

    const current = TOUR_STEPS[step];
    const isLast = step === TOUR_STEPS.length - 1;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={language === 'en' ? 'CVF onboarding tour' : 'Hướng dẫn CVF'}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                onClick={dismiss}
                aria-hidden="true"
            />

            <div className="relative w-full max-w-lg rounded-[32px] border border-slate-200/80 bg-white p-8 shadow-[0_32px_80px_-20px_rgba(15,23,42,0.45)] dark:border-white/[0.07] dark:bg-[#171b29]">
                <button
                    onClick={dismiss}
                    aria-label={language === 'en' ? 'Skip tour' : 'Bỏ qua hướng dẫn'}
                    className="absolute right-5 top-5 rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.07] dark:hover:text-white/80"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex items-center gap-2 mb-6">
                    {TOUR_STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all ${
                                i === step
                                    ? 'w-8 bg-indigo-500'
                                    : i < step
                                        ? 'w-4 bg-indigo-300 dark:bg-indigo-500/50'
                                        : 'w-4 bg-slate-200 dark:bg-white/[0.08]'
                            }`}
                        />
                    ))}
                    <span className="ml-auto text-xs font-medium text-slate-400 dark:text-white/35">
                        {step + 1} / {TOUR_STEPS.length}
                    </span>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl dark:bg-indigo-500/10">
                    {current.icon}
                </div>

                <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                    {language === 'en' ? current.titleEn : current.titleVi}
                </h2>

                <p className="mt-3 text-base leading-7 text-slate-500 dark:text-white/55">
                    {language === 'en' ? current.bodyEn : current.bodyVi}
                </p>

                {current.id === 'provider' && (
                    <button
                        onClick={() => {
                            window.dispatchEvent(new CustomEvent('cvf:openApiKeyWizard'));
                            dismiss();
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300"
                    >
                        {language === 'en' ? 'Open Settings → Provider Keys' : 'Mở Settings → Provider Keys'}
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}

                <div className="mt-8 flex items-center justify-between">
                    <button
                        onClick={prev}
                        disabled={step === 0}
                        className="cvf-control rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-0 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/75 dark:hover:bg-white/[0.07]"
                    >
                        {language === 'en' ? '← Back' : '← Quay lại'}
                    </button>

                    <button
                        onClick={next}
                        className="cvf-control rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                        {isLast
                            ? (language === 'en' ? 'Get started →' : 'Bắt đầu →')
                            : (language === 'en' ? 'Next →' : 'Tiếp →')}
                    </button>
                </div>
            </div>
        </div>
    );
}
