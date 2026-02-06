'use client';

import { useState } from 'react';
import { Category } from '@/types';

// Sample templates for demo
interface SampleTemplate {
    id: string;
    name: string;
    description: string;
    category: Category;
    icon: string;
    author: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const sampleTemplates: SampleTemplate[] = [
    {
        id: 'sample_startup_pitch',
        name: 'Startup Pitch Deck',
        description: 'Tạo pitch deck chuẩn cho startup theo format của Y Combinator',
        category: 'business',
        difficulty: 'intermediate',
        icon: '🚀',
        author: 'CVF Team',
    },
    {
        id: 'sample_seo_audit',
        name: 'SEO Audit Checklist',
        description: 'Phân tích SEO toàn diện cho website theo chuẩn Google 2024',
        category: 'marketing',
        difficulty: 'advanced',
        icon: '🔍',
        author: 'CVF Team',
    },
    {
        id: 'sample_api_design',
        name: 'RESTful API Design',
        description: 'Thiết kế API chuẩn RESTful với OpenAPI specs',
        category: 'technical',
        difficulty: 'advanced',
        icon: '⚡',
        author: 'CVF Team',
    },
    {
        id: 'sample_social_calendar',
        name: 'Social Media Calendar',
        description: 'Lên lịch content 30 ngày cho các nền tảng social',
        category: 'marketing',
        difficulty: 'beginner',
        icon: '📅',
        author: 'CVF Team',
    },
];

interface MarketplaceProps {
    onBack?: () => void;
}

export function TemplateMarketplace({ onBack }: MarketplaceProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

    const filteredTemplates = sampleTemplates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📦 Sample Templates</h2>
                        <p className="text-gray-500 dark:text-gray-400">Xem trước các templates sắp ra mắt</p>
                    </div>
                </div>
                <div className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-lg font-medium flex items-center gap-2">
                    <span>🚧</span>
                    <span>Coming Soon</span>
                </div>
            </div>

            {/* Coming Soon Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 
                            border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <span className="text-4xl">🏪</span>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Template Marketplace - Coming Soon!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                            Chúng tôi đang phát triển marketplace để bạn có thể:
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>✨ Khám phá templates từ cộng đồng</li>
                            <li>📤 Chia sẻ templates của bạn</li>
                            <li>⭐ Đánh giá và review templates</li>
                            <li>📥 Import trực tiếp vào thư viện</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm templates..."
                        className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-200 dark:border-gray-700 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as Category | 'all')}
                    className="px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                    <option value="all">Tất cả danh mục</option>
                    <option value="business">💼 Kinh doanh</option>
                    <option value="technical">⚙️ Kỹ thuật</option>
                    <option value="marketing">📣 Marketing</option>
                </select>
            </div>

            {/* Sample Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 
                     opacity-75 relative"
                    >
                        {/* Preview Badge */}
                        <div className="absolute top-3 right-3 px-2 py-1 bg-gray-100 dark:bg-gray-700 
                                        text-gray-500 dark:text-gray-400 text-xs rounded-full">
                            Preview
                        </div>

                        <div className="flex items-start mb-3">
                            <span className="text-3xl">{template.icon}</span>
                        </div>

                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{template.description}</p>

                        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                            <span>👤 {template.author}</span>
                            <span className={`px-2 py-0.5 rounded-full ${template.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                    template.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                }`}>
                                {template.difficulty}
                            </span>
                        </div>

                        <button
                            disabled
                            className="w-full py-2 rounded-lg bg-gray-100 dark:bg-gray-700 
                       text-gray-400 dark:text-gray-500 font-medium cursor-not-allowed"
                        >
                            Coming Soon
                        </button>
                    </div>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <p>Không tìm thấy template phù hợp.</p>
                </div>
            )}
        </div>
    );
}
