'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { ThemeToggle } from '@/lib/theme';
import { SkillLibrary } from '@/components/SkillLibrary';

const QUICK_TASKS = [
    { icon: '🏦', labelKey: 'skills.quickTask.fintech', task: 'build fintech payment dashboard', color: 'from-blue-500 to-cyan-500' },
    { icon: '🛒', labelKey: 'skills.quickTask.ecommerce', task: 'ecommerce product catalog with cart', color: 'from-purple-500 to-pink-500' },
    { icon: '💄', labelKey: 'skills.quickTask.beauty', task: 'beauty spa booking landing page', color: 'from-pink-500 to-rose-500' },
    { icon: '🏥', labelKey: 'skills.quickTask.healthcare', task: 'healthcare patient portal', color: 'from-emerald-500 to-teal-500' },
    { icon: '🎓', labelKey: 'skills.quickTask.education', task: 'education course platform LMS', color: 'from-amber-500 to-orange-500' },
    { icon: '🎮', labelKey: 'skills.quickTask.gaming', task: 'gaming leaderboard and store', color: 'from-indigo-500 to-violet-500' },
];

const FEATURE_CARDS = [
    {
        icon: '🔍',
        titleKey: 'skills.featureCard.search.title',
        descKey: 'skills.featureCard.search.desc',
        href: '/skills/search',
        gradient: 'from-blue-500 to-purple-500',
    },
    {
        icon: '📋',
        titleKey: 'skills.featureCard.plan.title',
        descKey: 'skills.featureCard.plan.desc',
        href: '/skills/search',
        tab: 'planner',
        gradient: 'from-emerald-500 to-teal-500',
    },
    {
        icon: '📚',
        titleKey: 'skills.featureCard.domains.title',
        descKey: 'skills.featureCard.domains.desc',
        href: '#library',
        gradient: 'from-amber-500 to-orange-500',
    },
];

export default function SkillsPage() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [quickSearch, setQuickSearch] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isVi = language === 'vi';

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
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            CVF v1.6
                        </Link>
                        <span className="text-gray-400 dark:text-gray-500">|</span>
                        <h1 className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('skills.title')}</h1>
                    </div>
                    <nav className="flex items-center gap-2 sm:gap-3">
                        <Link href="/" className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {t('nav.templates')}
                        </Link>
                        <Link href="/help" className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {t('nav.help')}
                        </Link>
                        <Link href="/docs" className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {t('nav.docs')}
                        </Link>
                        <Link href="/skills/search" className="hidden sm:inline-flex px-3 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all">
                            🔍 Search & Plan
                        </Link>
                        <ThemeToggle />
                        <LanguageToggle />
                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="sm:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
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
                <div className="sm:hidden border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 space-y-1">
                    <Link href="/skills/search" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400">
                        {t('skills.mobileMenu.search')}
                    </Link>
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        {t('skills.mobileMenu.home')}
                    </Link>
                    <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                        {t('skills.mobileMenu.docs')}
                    </Link>
                </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Hero Section — Non-coder friendly */}
                <section className="py-10 text-center">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {t('skills.heroTitle')}
                        </span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
                        {t('skills.heroSubtitle')}
                    </p>

                    {/* Quick Search Bar */}
                    <form onSubmit={handleQuickSearch} className="max-w-xl mx-auto mb-8 sm:mb-10 px-2 sm:px-0">
                        <div className="relative">
                            <input
                                type="text"
                                value={quickSearch}
                                onChange={(e) => setQuickSearch(e.target.value)}
                                placeholder={t('skills.quickSearchPlaceholder')}
                                className="w-full pl-10 sm:pl-12 pr-20 sm:pr-24 py-3 sm:py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-shadow hover:shadow-xl"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
                            >
                                {t('skills.quickSearchButton') || (isVi ? 'Tìm' : 'Search')}
                            </button>
                        </div>
                    </form>

                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
                        {FEATURE_CARDS.map((card) => (
                            <Link
                                key={card.titleKey}
                                href={card.href}
                                className="group p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:shadow-lg transition-all hover:-translate-y-0.5 text-left"
                            >
                                <div className={`text-3xl mb-3 w-12 h-12 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white`}>
                                    {card.icon}
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {t(card.titleKey)}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t(card.descKey)}
                                </p>
                            </Link>
                        ))}
                    </div>

                    {/* Quick Task Chips */}
                    <div className="mb-8">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            {t('skills.quickTask.label')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {QUICK_TASKS.map((qt) => (
                                <button
                                    key={qt.labelKey}
                                    onClick={() => handleQuickTask(qt.task)}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r ${qt.color} hover:shadow-md hover:scale-105 transition-all`}
                                >
                                    <span>{qt.icon}</span>
                                    <span>{t(qt.labelKey)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Domain Report + Skill Library */}
                <section id="library" className="py-8">
                    <SkillLibrary />
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-700/50 mt-12 py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-gray-500 text-sm">
                    <p>{t('footer.tagline')}</p>
                </div>
            </footer>
        </div>
    );
}
