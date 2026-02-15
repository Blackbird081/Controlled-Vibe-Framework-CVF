'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { ThemeToggle } from '@/lib/theme';
import { DOCS } from '@/data/docs-data';
import type { Lang } from '@/data/docs-data';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DocsPage() {
    const { language } = useLanguage();
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const filteredDocs = activeCategory
        ? DOCS.filter(c => c.id === activeCategory)
        : DOCS;

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
                        <h1 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                            {language === 'vi' ? '📚 Tài liệu' : '📚 Documentation'}
                        </h1>
                    </div>
                    <nav className="flex items-center gap-3">
                        <Link href="/" className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {language === 'vi' ? '🏠 Trang chủ' : '🏠 Home'}
                        </Link>
                        <Link href="/help" className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {language === 'vi' ? '❓ Hướng dẫn' : '❓ Help'}
                        </Link>
                        <ThemeToggle />
                        <LanguageToggle />
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
                <h2 className="text-2xl sm:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                    {language === 'vi' ? 'Tài liệu CVF' : 'CVF Documentation'}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                    {language === 'vi'
                        ? 'Guides, tutorials, concepts — tất cả bạn cần để sử dụng CVF hiệu quả.'
                        : 'Guides, tutorials, concepts — everything you need to use CVF effectively.'}
                </p>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            activeCategory === null
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                    >
                        {language === 'vi' ? 'Tất cả' : 'All'}
                    </button>
                    {DOCS.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                activeCategory === cat.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {cat.icon} {cat.label[language]}
                        </button>
                    ))}
                </div>
            </section>

            {/* Docs Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
                {filteredDocs.map(category => (
                    <div key={category.id} className="mb-12">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200">
                            <span className="text-2xl">{category.icon}</span>
                            {category.label[language]}
                        </h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.items.map((item, idx) => (
                                <Link
                                    key={idx}
                                    href={`/docs/${item.slug}`}
                                    className="group relative bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer no-underline"
                                >
                                    {item.tag && (
                                        <span className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                                            {item.tag[language]}
                                        </span>
                                    )}
                                    <div className="text-3xl mb-3">{item.icon}</div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {item.title[language]}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {item.desc[language]}
                                    </p>
                                    <span className="mt-3 inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {language === 'vi' ? 'Đọc thêm →' : 'Read more →'}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            {/* Info Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-8 text-center">
                    <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                        {language === 'vi'
                            ? '💡 Tất cả tài liệu đều có 2 ngôn ngữ (EN/VI) và cập nhật liên tục.'
                            : '💡 All documentation is bilingual (EN/VI) and continuously updated.'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'vi'
                            ? 'Cần trợ giúp ngay? Thử '
                            : 'Need help now? Try '}
                        <Link href="/help" className="text-blue-600 dark:text-blue-400 underline hover:no-underline">
                            {language === 'vi' ? 'trang Hướng dẫn' : 'the Help page'}
                        </Link>
                        {language === 'vi'
                            ? ' hoặc bấm nút ❓ ở góc phải.'
                            : ' or click the ❓ button in the bottom-right corner.'}
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-700/50 py-6 text-center text-sm text-gray-500 dark:text-gray-500">
                CVF v1.6 · CC BY-NC-ND 4.0 · {language === 'vi' ? 'Không được dùng thương mại' : 'Non-commercial use only'}
            </footer>
        </div>
    );
}
