'use client';

import { useState } from 'react';
import Link from 'next/link';

type Lang = 'vi' | 'en';

const content = {
    hero: {
        title: { vi: 'AI không cần kỹ thuật', en: 'AI without the complexity' },
        subtitle: {
            vi: 'CVF v1.6 giúp bạn dùng AI chuyên nghiệp — chỉ cần chọn template, điền form, nhận kết quả.',
            en: 'CVF v1.6 helps you use AI professionally — just pick a template, fill the form, get results.',
        },
        cta: { vi: 'Bắt đầu ngay', en: 'Get Started' },
        ctaSecondary: { vi: 'Xem hướng dẫn', en: 'See How It Works' },
    },
    steps: [
        {
            icon: '📋',
            title: { vi: '1. Chọn Template', en: '1. Pick a Template' },
            desc: { vi: 'Hơn 20 templates cho kinh doanh, marketing, thiết kế, phân tích dữ liệu và nhiều hơn.', en: 'Over 20 templates for business, marketing, design, data analysis, and more.' },
        },
        {
            icon: '✏️',
            title: { vi: '2. Điền Form', en: '2. Fill the Form' },
            desc: { vi: 'Trả lời vài câu hỏi đơn giản — không cần viết prompt hay biết lập trình.', en: 'Answer a few simple questions — no prompt writing or coding needed.' },
        },
        {
            icon: '🚀',
            title: { vi: '3. Nhận Kết Quả', en: '3. Get Results' },
            desc: { vi: 'AI tạo output chuyên nghiệp. Duyệt lại, chỉnh sửa, và xuất ngay.', en: 'AI generates professional output. Review, edit, and export instantly.' },
        },
    ],
    features: [
        {
            icon: '🤖',
            title: { vi: 'AI Agent Chat', en: 'AI Agent Chat' },
            desc: { vi: 'Trò chuyện trực tiếp với AI agent — hỏi bất cứ điều gì.', en: 'Chat directly with an AI agent — ask anything.' },
        },
        {
            icon: '🏗️',
            title: { vi: 'App Builder Wizard', en: 'App Builder Wizard' },
            desc: { vi: 'Xây dựng spec ứng dụng qua 8 bước có hướng dẫn.', en: 'Build app specs through 8 guided steps.' },
        },
        {
            icon: '🛡️',
            title: { vi: 'CVF Governance', en: 'CVF Governance' },
            desc: { vi: 'Kiểm soát chất lượng AI output với framework được thiết kế sẵn.', en: 'Control AI output quality with a built-in governance framework.' },
        },
        {
            icon: '🌐',
            title: { vi: 'Song ngữ EN/VI', en: 'Bilingual EN/VI' },
            desc: { vi: 'Chuyển đổi Anh-Việt dễ dàng ở mọi trang.', en: 'Switch between English and Vietnamese on every page.' },
        },
    ],
    footer: {
        text: { vi: 'CVF v1.6 — Người dùng không cần biết CVF để dùng CVF', en: 'CVF v1.6 — Users don\'t need to know CVF to use CVF' },
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
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-white">
            {/* Nav */}
            <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">
                <div className="text-xl font-bold">⚡ CVF v1.6</div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleLang}
                        className="px-3 py-1.5 text-sm font-bold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors border border-gray-200 dark:border-gray-700"
                    >
                        {lang === 'vi' ? '🌐 EN' : '🌐 VI'}
                    </button>
                    <Link
                        href="/login"
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors text-sm"
                    >
                        {lang === 'vi' ? 'Đăng nhập' : 'Sign in'}
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-4xl mx-auto text-center px-6 py-16 md:py-24">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                    {t(content.hero.title)}
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    {t(content.hero.subtitle)}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/login"
                        className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-colors shadow-lg shadow-blue-500/25"
                    >
                        {t(content.hero.cta)} →
                    </Link>
                    <Link
                        href="/docs"
                        className="px-8 py-3 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-lg transition-colors"
                    >
                        {t(content.hero.ctaSecondary)}
                    </Link>
                </div>
            </section>

            {/* 3-step flow */}
            <section className="max-w-5xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {content.steps.map((step, i) => (
                        <div key={i} className="text-center p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="text-4xl mb-4">{step.icon}</div>
                            <h3 className="text-lg font-bold mb-2">{t(step.title)}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t(step.desc)}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features grid */}
            <section className="max-w-5xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold text-center mb-12">
                    {lang === 'vi' ? '✨ Tính năng nổi bật' : '✨ Key Features'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {content.features.map((feat, i) => (
                        <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="text-3xl flex-shrink-0">{feat.icon}</div>
                            <div>
                                <h3 className="font-bold text-base mb-1">{t(feat.title)}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t(feat.desc)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-4xl mx-auto text-center px-6 py-16">
                <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                        {lang === 'vi' ? 'Sẵn sàng bắt đầu?' : 'Ready to get started?'}
                    </h2>
                    <p className="text-blue-100 mb-6 max-w-md mx-auto">
                        {lang === 'vi'
                            ? 'Đăng nhập miễn phí và trải nghiệm sức mạnh AI ngay hôm nay.'
                            : 'Sign in for free and experience the power of AI today.'}
                    </p>
                    <Link
                        href="/login"
                        className="inline-block px-8 py-3 rounded-xl bg-white text-blue-600 font-bold text-lg hover:bg-blue-50 transition-colors"
                    >
                        {t(content.hero.cta)} →
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
                    <div>{t(content.footer.text)}</div>
                    <div className="text-xs text-gray-400 mt-1">Tien-Tan Thuan Port @2026</div>
                </div>
            </footer>
        </div>
    );
}
