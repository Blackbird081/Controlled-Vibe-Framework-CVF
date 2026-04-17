'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { ThemeToggle } from '@/lib/theme';
import { SkillLibrary } from '@/components/SkillLibrary';

const QUICK_TASKS = [
    { icon: '🏦', labelKey: 'skills.quickTask.fintech', task: 'build fintech payment dashboard' },
    { icon: '🛒', labelKey: 'skills.quickTask.ecommerce', task: 'ecommerce product catalog with cart' },
    { icon: '💄', labelKey: 'skills.quickTask.beauty', task: 'beauty spa booking landing page' },
    { icon: '🏥', labelKey: 'skills.quickTask.healthcare', task: 'healthcare patient portal' },
    { icon: '🎓', labelKey: 'skills.quickTask.education', task: 'education course platform LMS' },
    { icon: '🎮', labelKey: 'skills.quickTask.gaming', task: 'gaming leaderboard and store' },
];

const FEATURE_CARDS = [
    {
        icon: '🔍',
        titleKey: 'skills.featureCard.search.title',
        descKey: 'skills.featureCard.search.desc',
        href: '/skills/search',
        bg: 'from-blue-500/10 to-indigo-500/10',
        text: 'text-blue-600 dark:text-blue-400'
    },
    {
        icon: '📋',
        titleKey: 'skills.featureCard.plan.title',
        descKey: 'skills.featureCard.plan.desc',
        href: '/skills/search?tab=planner',
        bg: 'from-emerald-500/10 to-teal-500/10',
        text: 'text-emerald-600 dark:text-emerald-400'
    },
    {
        icon: '📚',
        titleKey: 'skills.featureCard.domains.title',
        descKey: 'skills.featureCard.domains.desc',
        href: '#library',
        bg: 'from-amber-500/10 to-orange-500/10',
        text: 'text-amber-600 dark:text-amber-400'
    },
];

export default function SkillsPage() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [quickSearch, setQuickSearch] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isVi = language === 'vi';

    const getTranslation = (key: string, fallback: string) => {
        const val = t(key);
        return val === key ? fallback : val;
    };

    const handleQuickSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (quickSearch.trim()) {
            router.push(`/skills/search?q=${encodeURIComponent(quickSearch.trim())}`);
        }
    };

    const handleQuickTask = (task: string) => {
        router.push(`/skills/search?tab=planner&task=${encodeURIComponent(task)}`);
    };

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#09090b] text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/70 dark:bg-[#09090b]/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/home" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                            CVF v1.6
                        </Link>
                        <span className="text-gray-300 dark:text-gray-700">|</span>
                        <h1 className="text-lg font-medium text-gray-600 dark:text-gray-300 tracking-tight">
                            {getTranslation('skills.title', 'Skill Library')}
                        </h1>
                    </div>
                    <nav className="flex items-center gap-2 sm:gap-4">
                        <Link href="/home" className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {getTranslation('nav.templates', 'Templates')}
                        </Link>
                        <Link href="/help" className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {getTranslation('nav.help', 'Help')}
                        </Link>
                        <Link href="/skills/search" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm hover:shadow-md">
                            {isVi ? 'Tìm & Lập Kế Hoạch' : 'Search & Plan'}
                        </Link>
                        <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-800 pl-4 ml-2">
                            <ThemeToggle />
                            <LanguageToggle />
                        </div>
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="sm:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Menu"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                            </svg>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="sm:hidden border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-lg px-4 py-3 space-y-1 absolute w-full z-40 shadow-xl">
                    <Link href="/skills/search" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800">
                        {getTranslation('skills.mobileMenu.search', 'Search Skills')}
                    </Link>
                    <Link href="/home" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        {getTranslation('skills.mobileMenu.home', 'Home')}
                    </Link>
                    <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        {getTranslation('skills.mobileMenu.docs', 'Docs')}
                    </Link>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Hero Section */}
                <section className="py-16 md:py-24 text-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
                    
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                        {getTranslation('skills.heroTitle', 'Governed Skill Library')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto mb-10 px-2 font-medium">
                        {getTranslation('skills.heroSubtitle', 'Discover curated, production-ready AI skills verified by CVF Governance.')}
                    </p>

                    {/* Quick Search Bar */}
                    <form onSubmit={handleQuickSearch} className="max-w-2xl mx-auto mb-14 px-2 sm:px-0 relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
                        <div className="relative flex items-center bg-white dark:bg-[#111113] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-1.5 focus-within:ring-2 ring-blue-500/50">
                            <span className="pl-4 pr-2 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                value={quickSearch}
                                onChange={(e) => setQuickSearch(e.target.value)}
                                placeholder={getTranslation('skills.quickSearchPlaceholder', 'Search skills, domains, or templates...')}
                                className="w-full bg-transparent border-none py-3 px-2 focus:outline-none focus:ring-0 text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
                            />
                            <button
                                type="submit"
                                className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm"
                            >
                                {getTranslation('skills.quickSearchButton', isVi ? 'Tìm Kiếm' : 'Search')}
                            </button>
                        </div>
                    </form>

                    {/* Quick Tasks */}
                    <div className="mb-16">
                        <p className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-5">
                            {getTranslation('skills.quickTask.label', 'Popular domains')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {QUICK_TASKS.map((qt) => (
                                <button
                                    key={qt.labelKey}
                                    onClick={() => handleQuickTask(qt.task)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-[#111113] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.2)] transition-all"
                                >
                                    <span className="text-base">{qt.icon}</span>
                                    <span>{getTranslation(qt.labelKey, qt.task)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-12">
                        {FEATURE_CARDS.map((card) => (
                            <Link
                                key={card.titleKey}
                                href={card.href}
                                className="group relative p-6 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111113] hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300 text-left overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent dark:from-white/[0.02] dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.bg} flex items-center justify-center text-2xl mb-4`}>
                                    {card.icon}
                                </div>
                                <h3 className={`font-semibold text-lg mb-2 ${card.text}`}>
                                    {getTranslation(card.titleKey, card.titleKey)}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                                    {getTranslation(card.descKey, card.descKey)}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Main Library rendering */}
                <section id="library" className="pb-24">
                    <div className="bg-white dark:bg-[#111113] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
                        <SkillLibrary />
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-800 py-8 bg-white dark:bg-[#09090b]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-gray-400 text-sm font-medium">
                    <p>{getTranslation('footer.tagline', 'CVF v1.6 — The standardized framework for governed AI adoption.')}</p>
                </div>
            </footer>
        </div>
    );
}
