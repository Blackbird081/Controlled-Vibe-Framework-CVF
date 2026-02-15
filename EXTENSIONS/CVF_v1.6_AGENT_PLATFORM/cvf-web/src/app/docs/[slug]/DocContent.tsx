'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { ThemeToggle } from '@/lib/theme';
import type { Lang } from '@/data/docs-data';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DocContentProps {
    slug: string;
    contentEn: string;
    contentVi: string;
    hasContent: boolean;
    meta: {
        title: Record<Lang, string>;
        category: Record<Lang, string>;
        categoryIcon: string;
    } | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DocContent({ slug, contentEn, contentVi, hasContent, meta }: DocContentProps) {
    const { language } = useLanguage();

    // Pick content for active language, fallback to the other if missing
    const content = (language === 'vi' ? contentVi : contentEn)
        || (language === 'vi' ? contentEn : contentVi);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            CVF v1.6
                        </Link>
                        <span className="text-gray-400 dark:text-gray-500">|</span>
                        <Link href="/docs" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {language === 'vi' ? '📚 Tài liệu' : '📚 Docs'}
                        </Link>
                        {meta && (
                            <>
                                <span className="text-gray-400 dark:text-gray-600">/</span>
                                <span className="text-sm text-gray-500 dark:text-gray-500">
                                    {meta.categoryIcon} {meta.category[language]}
                                </span>
                            </>
                        )}
                    </div>
                    <nav className="flex items-center gap-3">
                        <Link href="/docs" className="hidden sm:inline-flex px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {language === 'vi' ? '← Tất cả tài liệu' : '← All Docs'}
                        </Link>
                        <ThemeToggle />
                        <LanguageToggle />
                    </nav>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {!hasContent ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📄</div>
                        <h2 className="text-2xl font-bold mb-2">
                            {language === 'vi' ? 'Không tìm thấy tài liệu' : 'Document not found'}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {language === 'vi'
                                ? `Slug "${slug}" không tồn tại.`
                                : `Slug "${slug}" does not exist.`}
                        </p>
                        <Link
                            href="/docs"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {language === 'vi' ? '← Quay lại Tài liệu' : '← Back to Docs'}
                        </Link>
                    </div>
                ) : (
                    <>
                        <article className="prose prose-lg dark:prose-invert max-w-none
                            prose-headings:scroll-mt-20
                            prose-h1:text-3xl prose-h1:font-bold prose-h1:bg-gradient-to-r prose-h1:from-blue-500 prose-h1:to-purple-500 prose-h1:bg-clip-text prose-h1:text-transparent prose-h1:mb-8
                            prose-h2:text-2xl prose-h2:font-semibold prose-h2:text-gray-800 dark:prose-h2:text-gray-200 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-gray-700 prose-h2:pb-2 prose-h2:mt-12
                            prose-h3:text-xl prose-h3:text-gray-700 dark:prose-h3:text-gray-300
                            prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                            prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-pink-600 dark:prose-code:text-pink-400
                            prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-xl
                            prose-table:border-collapse
                            prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600
                            prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700
                            prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4
                            prose-li:text-gray-600 dark:prose-li:text-gray-300
                            prose-strong:text-gray-900 dark:prose-strong:text-white
                            prose-img:rounded-xl prose-img:shadow-lg
                        ">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw]}
                                components={{
                                    a: ({ href, children, ...props }) => {
                                        if (href?.startsWith('#')) {
                                            return <a href={href} {...props}>{children}</a>;
                                        }
                                        if (href?.startsWith('http')) {
                                            return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                                        }
                                        return <span {...props}>{children}</span>;
                                    },
                                    table: ({ children, ...props }) => (
                                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                                            <table {...props}>{children}</table>
                                        </div>
                                    ),
                                }}
                            >
                                {content}
                            </ReactMarkdown>
                        </article>

                        {/* Bottom Navigation */}
                        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <Link
                                href="/docs"
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                ← {language === 'vi' ? 'Tất cả tài liệu' : 'All Docs'}
                            </Link>
                            <Link
                                href="/help"
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                                {language === 'vi' ? 'Cần trợ giúp?' : 'Need help?'} →
                            </Link>
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 dark:border-gray-700/50 py-6 text-center text-sm text-gray-500 dark:text-gray-500 mt-8">
                CVF v1.6 · CC BY-NC-ND 4.0 · {language === 'vi' ? 'Không được dùng thương mại' : 'Non-commercial use only'}
            </footer>
        </div>
    );
}
