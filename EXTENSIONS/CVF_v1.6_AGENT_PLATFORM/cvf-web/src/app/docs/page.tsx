'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { ThemeToggle } from '@/lib/theme';

type Lang = 'vi' | 'en';

/* ------------------------------------------------------------------ */
/*  Data: all docs organized by category                               */
/* ------------------------------------------------------------------ */

interface DocItem {
    icon: string;
    title: Record<Lang, string>;
    desc: Record<Lang, string>;
    tag?: string;
}

interface DocCategory {
    id: string;
    icon: string;
    label: Record<Lang, string>;
    items: DocItem[];
}

const DOCS: DocCategory[] = [
    {
        id: 'start',
        icon: '🚀',
        label: { vi: 'Bắt Đầu', en: 'Getting Started' },
        items: [
            {
                icon: '⭐',
                title: { vi: 'Hướng dẫn Bắt đầu', en: 'Getting Started Guide' },
                desc: {
                    vi: 'Hướng dẫn toàn diện cho 3 persona: Solo Dev, Team Lead, Enterprise. Bắt đầu từ đây!',
                    en: 'Comprehensive guide for 3 personas: Solo Dev, Team Lead, Enterprise. Start here!',
                },
                tag: 'START HERE',
            },
            {
                icon: '⚡',
                title: { vi: 'CVF Lite (Tiếng Việt)', en: 'CVF Lite (Vietnamese)' },
                desc: {
                    vi: 'Phiên bản rút gọn bằng tiếng Việt — nắm ý tưởng chính trong 2 phút.',
                    en: 'Condensed Vietnamese version — grasp the key ideas in 2 minutes.',
                },
            },
        ],
    },
    {
        id: 'guides',
        icon: '📖',
        label: { vi: 'Hướng Dẫn Theo Vai Trò', en: 'Role-Based Guides' },
        items: [
            {
                icon: '👤',
                title: { vi: 'Solo Developer', en: 'Solo Developer' },
                desc: {
                    vi: 'Làm việc một mình? Áp dụng CVF nhanh nhất — từ 0 đến productive trong 30 phút.',
                    en: 'Working alone? Apply CVF fastest — from 0 to productive in 30 minutes.',
                },
            },
            {
                icon: '👥',
                title: { vi: 'Team Setup', en: 'Team Setup' },
                desc: {
                    vi: 'Triển khai CVF cho nhóm 3-10 người, phân vai trò, thiết lập governance.',
                    en: 'Deploy CVF for teams of 3-10, assign roles, set up governance.',
                },
            },
            {
                icon: '🏢',
                title: { vi: 'Enterprise', en: 'Enterprise' },
                desc: {
                    vi: 'Tích hợp CVF vào tổ chức lớn: CI/CD, compliance, multi-team coordination.',
                    en: 'Integrate CVF into large organizations: CI/CD, compliance, multi-team coordination.',
                },
            },
        ],
    },
    {
        id: 'tutorials',
        icon: '📝',
        label: { vi: 'Tutorials (Step-by-Step)', en: 'Tutorials (Step-by-Step)' },
        items: [
            {
                icon: '1️⃣',
                title: { vi: 'Dự án đầu tiên', en: 'First Project' },
                desc: {
                    vi: 'Tạo dự án CVF đầu tiên từ A-Z: init → 4 phases → review → hoàn thành.',
                    en: 'Create your first CVF project A-Z: init → 4 phases → review → done.',
                },
            },
            {
                icon: '🌐',
                title: { vi: 'Cài đặt Web UI', en: 'Web UI Setup' },
                desc: {
                    vi: 'Cài đặt v1.6 Web UI trên máy local: Node.js, npm install, npm run dev.',
                    en: 'Set up v1.6 Web UI locally: Node.js, npm install, npm run dev.',
                },
            },
            {
                icon: '🤖',
                title: { vi: 'Agent Platform', en: 'Agent Platform' },
                desc: {
                    vi: 'Sử dụng AI Agent Chat, Multi-Agent, GovernanceBar, và Self-UAT.',
                    en: 'Use AI Agent Chat, Multi-Agent, GovernanceBar, and Self-UAT.',
                },
            },
            {
                icon: '🧩',
                title: { vi: 'Custom Skills', en: 'Custom Skills' },
                desc: {
                    vi: 'Tạo skill riêng theo chuẩn CVF: metadata, contract, validation, publish.',
                    en: 'Create custom skills following CVF standards: metadata, contract, validation, publish.',
                },
            },
        ],
    },
    {
        id: 'concepts',
        icon: '💡',
        label: { vi: 'Khái Niệm Chuyên Sâu', en: 'Core Concepts' },
        items: [
            {
                icon: '🎯',
                title: { vi: 'Triết lý CVF', en: 'Core Philosophy' },
                desc: {
                    vi: '"Không nhanh hơn, mà đúng hơn" — hiểu tại sao CVF tồn tại và khác biệt gì.',
                    en: '"Not faster, but smarter" — why CVF exists and what makes it different.',
                },
            },
            {
                icon: '🔄',
                title: { vi: 'Quy trình 4 Phase', en: '4-Phase Process' },
                desc: {
                    vi: 'Discovery → Design → Build → Review — mỗi phase có role, gate, và rules riêng.',
                    en: 'Discovery → Design → Build → Review — each phase has its own roles, gates, and rules.',
                },
            },
            {
                icon: '🏛️',
                title: { vi: 'Mô hình Governance', en: 'Governance Model' },
                desc: {
                    vi: '3 modes (Minimal/Standard/Full), Authority Matrix, Phase Gates, Escalation.',
                    en: '3 modes (Minimal/Standard/Full), Authority Matrix, Phase Gates, Escalation.',
                },
            },
            {
                icon: '📚',
                title: { vi: 'Hệ thống Skill', en: 'Skill System' },
                desc: {
                    vi: '124 skills, 12 domains — cách tìm, dùng, và tạo skill mới.',
                    en: '124 skills, 12 domains — how to find, use, and create new skills.',
                },
            },
            {
                icon: '⚠️',
                title: { vi: 'Mô hình Rủi ro', en: 'Risk Model' },
                desc: {
                    vi: 'R0-R3 risk levels, escalation rules, và cách CVF tự bảo vệ bạn.',
                    en: 'R0-R3 risk levels, escalation rules, and how CVF protects you.',
                },
            },
            {
                icon: '📈',
                title: { vi: 'Lịch sử phiên bản', en: 'Version Evolution' },
                desc: {
                    vi: 'Từ v1.0 (core) → v1.6 (agent platform): mỗi version thêm gì.',
                    en: 'From v1.0 (core) → v1.6 (agent platform): what each version added.',
                },
            },
        ],
    },
    {
        id: 'cheatsheets',
        icon: '🔧',
        label: { vi: 'Tham Khảo Nhanh', en: 'Quick Reference' },
        items: [
            {
                icon: '🗺️',
                title: { vi: 'Chọn Version', en: 'Version Picker' },
                desc: {
                    vi: 'Decision tree: bạn nên dùng version nào? So sánh tính năng.',
                    en: 'Decision tree: which version should you use? Feature comparison.',
                },
            },
            {
                icon: '🔧',
                title: { vi: 'Troubleshooting', en: 'Troubleshooting' },
                desc: {
                    vi: 'Lỗi thường gặp + cách khắc phục. FAQ cho người mới.',
                    en: 'Common errors + fixes. FAQ for beginners.',
                },
            },
        ],
    },
    {
        id: 'case-studies',
        icon: '📊',
        label: { vi: 'Case Studies', en: 'Case Studies' },
        items: [
            {
                icon: '🏦',
                title: { vi: 'Fintech: Hệ thống tín dụng', en: 'Fintech: Credit Approval' },
                desc: {
                    vi: 'CVF áp dụng cho hệ thống phê duyệt tín dụng — risk management thực tế.',
                    en: 'CVF applied to credit approval system — real-world risk management.',
                },
            },
            {
                icon: '🏥',
                title: { vi: 'Healthcare: Quản lý bệnh nhân', en: 'Healthcare: Patient Management' },
                desc: {
                    vi: 'CVF trong lĩnh vực y tế — compliance, data protection, governance.',
                    en: 'CVF in healthcare — compliance, data protection, governance.',
                },
            },
            {
                icon: '🛒',
                title: { vi: 'E-commerce: MVP 2 tuần', en: 'E-commerce: 2-Week MVP' },
                desc: {
                    vi: 'Xây dựng MVP e-commerce với CVF trong 2 tuần — timeline thực tế.',
                    en: 'Build an e-commerce MVP with CVF in 2 weeks — realistic timeline.',
                },
            },
        ],
    },
];

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
                        <Link href="/" className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {language === 'vi' ? '🏠 Trang chủ' : '🏠 Home'}
                        </Link>
                        <Link href="/help" className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                            {language === 'vi' ? '❓ Hướng dẫn' : '❓ Help'}
                        </Link>
                        <ThemeToggle />
                        <LanguageToggle />
                    </nav>
                </div>
            </header>

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
                <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
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
                                <div
                                    key={idx}
                                    className="group relative bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/50 rounded-xl p-6 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-lg transition-all duration-200"
                                >
                                    {item.tag && (
                                        <span className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                                            {item.tag}
                                        </span>
                                    )}
                                    <div className="text-3xl mb-3">{item.icon}</div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {item.title[language]}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {item.desc[language]}
                                    </p>
                                </div>
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
