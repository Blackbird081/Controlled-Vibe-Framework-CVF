'use client';

import { useState, useCallback } from 'react';
import { Template, Category } from '@/types';

// Extended type for community templates
interface CommunityTemplate extends Omit<Template, 'intentPattern' | 'outputExpected'> {
    author: string;
    downloads: number;
    rating: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: string;
}

// Sample community templates
const communityTemplates: CommunityTemplate[] = [
    {
        id: 'community_startup_pitch',
        name: 'Startup Pitch Deck',
        description: 'Tạo pitch deck chuẩn cho startup theo format của Y Combinator',
        category: 'business',
        difficulty: 'intermediate',
        estimatedTime: '15-20 phút',
        icon: '🚀',
        author: 'startupvn',
        downloads: 1240,
        rating: 4.8,
        fields: [],
    },
    {
        id: 'community_seo_audit',
        name: 'SEO Audit Checklist',
        description: 'Phân tích SEO toàn diện cho website theo chuẩn Google 2024',
        category: 'marketing',
        difficulty: 'advanced',
        estimatedTime: '25-30 phút',
        icon: '🔍',
        author: 'seomaster',
        downloads: 890,
        rating: 4.6,
        fields: [],
    },
    {
        id: 'community_api_design',
        name: 'RESTful API Design',
        description: 'Thiết kế API chuẩn RESTful với OpenAPI specs',
        category: 'technical',
        difficulty: 'advanced',
        estimatedTime: '20-25 phút',
        icon: '⚡',
        author: 'devpro',
        downloads: 720,
        rating: 4.9,
        fields: [],
    },
    {
        id: 'community_social_calendar',
        name: 'Social Media Calendar',
        description: 'Lên lịch content 30 ngày cho các nền tảng social',
        category: 'marketing',
        difficulty: 'beginner',
        estimatedTime: '10-15 phút',
        icon: '📅',
        author: 'contentking',
        downloads: 2100,
        rating: 4.7,
        fields: [],
    },
];

interface MarketplaceProps {
    onImport?: (template: CommunityTemplate) => void;
    onBack?: () => void;
}

export function TemplateMarketplace({ onImport, onBack }: MarketplaceProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
    const [showUpload, setShowUpload] = useState(false);

    const filteredTemplates = communityTemplates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleImport = useCallback((template: CommunityTemplate) => {
        if (onImport) {
            onImport(template);
        }
        alert(`🎉 Template "${template.name}" đã được thêm vào thư viện của bạn!`);
    }, [onImport]);

    const categories: (Category | 'all')[] = ['all', 'business', 'technical', 'marketing', 'content', 'product', 'security', 'research', 'development'];

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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🏪 Template Marketplace</h2>
                        <p className="text-gray-500 dark:text-gray-400">Khám phá và import templates từ cộng đồng</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowUpload(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <span>📤</span>
                    <span>Chia sẻ Template</span>
                </button>
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
                    <option value="content">✍️ Nội dung</option>
                    <option value="product">📦 Sản phẩm</option>
                </select>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 
                     hover:shadow-lg transition-all duration-200"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <span className="text-3xl">{template.icon}</span>
                            <div className="flex items-center gap-1 text-sm text-amber-500">
                                <span>⭐</span>
                                <span>{template.rating}</span>
                            </div>
                        </div>

                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{template.description}</p>

                        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                            <span>👤 {template.author}</span>
                            <span>📥 {template.downloads} downloads</span>
                        </div>

                        <button
                            onClick={() => handleImport(template)}
                            className="w-full py-2 rounded-lg bg-gray-100 dark:bg-gray-700 
                       text-gray-700 dark:text-gray-300 font-medium
                       hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300
                       transition-colors"
                        >
                            Import Template
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

            {/* Upload Modal */}
            {showUpload && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">📤 Chia sẻ Template của bạn</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Tính năng này sẽ sớm ra mắt. Bạn sẽ có thể chia sẻ templates của mình với cộng đồng!
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUpload(false)}
                                className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Đóng
                            </button>
                            <button
                                disabled
                                className="flex-1 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 
                         text-gray-500 cursor-not-allowed"
                            >
                                Coming Soon
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
