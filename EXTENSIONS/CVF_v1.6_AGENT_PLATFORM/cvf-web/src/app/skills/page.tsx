'use client';

import Link from 'next/link';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { ThemeToggle } from '@/lib/theme';
import { SkillLibrary } from '@/components/SkillLibrary';

export default function SkillsPage() {
    const { t } = useLanguage();

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
                    <nav className="flex items-center gap-3">
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
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <SkillLibrary />
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
