'use client';

import { useState } from 'react';
import { Category } from '@/types';
import { useLanguage } from '@/lib/i18n';

// Sample templates for demo
interface SampleTemplate {
    id: string;
    name: string;
    description: string;
    descriptionEn?: string;
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
        descriptionEn: 'Create a Y Combinator-style pitch deck for your startup',
        category: 'business',
        difficulty: 'intermediate',
        icon: '🚀',
        author: 'CVF Team',
    },
    {
        id: 'sample_seo_audit',
        name: 'SEO Audit Checklist',
        description: 'Phân tích SEO toàn diện cho website theo chuẩn Google 2024',
        descriptionEn: 'Comprehensive SEO analysis for websites following Google 2024 standards',
        category: 'marketing',
        difficulty: 'advanced',
        icon: '🔍',
        author: 'CVF Team',
    },
    {
        id: 'sample_api_design',
        name: 'RESTful API Design',
        description: 'Thiết kế API chuẩn RESTful với OpenAPI specs',
        descriptionEn: 'Design RESTful APIs with OpenAPI specs',
        category: 'technical',
        difficulty: 'advanced',
        icon: '⚡',
        author: 'CVF Team',
    },
    {
        id: 'sample_social_calendar',
        name: 'Social Media Calendar',
        description: 'Lên lịch content 30 ngày cho các nền tảng social',
        descriptionEn: 'Plan 30 days of content across social media platforms',
        category: 'marketing',
        difficulty: 'beginner',
        icon: '📅',
        author: 'CVF Team',
    },
    {
        id: 'sample_business_plan',
        name: 'Business Plan Generator',
        description: 'Tạo kế hoạch kinh doanh hoàn chỉnh với phân tích tài chính',
        descriptionEn: 'Generate a complete business plan with financial analysis',
        category: 'business',
        difficulty: 'intermediate',
        icon: '📋',
        author: 'CVF Community',
    },
    {
        id: 'sample_user_persona',
        name: 'User Persona Builder',
        description: 'Xây dựng chân dung khách hàng mục tiêu chi tiết',
        descriptionEn: 'Build detailed target customer personas',
        category: 'marketing',
        difficulty: 'beginner',
        icon: '👤',
        author: 'CVF Community',
    },
    {
        id: 'sample_db_schema',
        name: 'Database Schema Design',
        description: 'Thiết kế cấu trúc database tối ưu cho ứng dụng',
        descriptionEn: 'Design optimized database schemas for applications',
        category: 'technical',
        difficulty: 'advanced',
        icon: '🗄️',
        author: 'CVF Community',
    },
    {
        id: 'sample_email_sequence',
        name: 'Email Drip Campaign',
        description: 'Tạo chuỗi email marketing tự động theo hành trình khách hàng',
        descriptionEn: 'Create automated email marketing sequences based on customer journey',
        category: 'marketing',
        difficulty: 'intermediate',
        icon: '📧',
        author: 'CVF Community',
    },
    {
        id: 'sample_swot',
        name: 'SWOT Analysis',
        description: 'Phân tích điểm mạnh, yếu, cơ hội và thách thức',
        descriptionEn: 'Analyze strengths, weaknesses, opportunities, and threats',
        category: 'business',
        difficulty: 'beginner',
        icon: '📊',
        author: 'CVF Community',
    },
    {
        id: 'sample_code_review',
        name: 'Code Review Checklist',
        description: 'Danh sách kiểm tra code review theo best practices',
        descriptionEn: 'Code review checklist following industry best practices',
        category: 'technical',
        difficulty: 'intermediate',
        icon: '✅',
        author: 'CVF Community',
    },
];

interface MarketplaceProps {
    onBack?: () => void;
}

export function TemplateMarketplace({ onBack }: MarketplaceProps) {
    const { language } = useLanguage();
    const isVi = language === 'vi';
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
    const [selectedTemplate, setSelectedTemplate] = useState<SampleTemplate | null>(null);

    const filteredTemplates = sampleTemplates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const difficultyLabel = (d: string) => {
        if (!isVi) return d;
        return d === 'beginner' ? 'Cơ bản' : d === 'intermediate' ? 'Trung bình' : 'Nâng cao';
    };

    const categoryLabel = (c: string) => {
        if (!isVi) return c;
        return c === 'business' ? 'Kinh doanh' : c === 'technical' ? 'Kỹ thuật' : 'Marketing';
    };

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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📦 {isVi ? 'Template Marketplace' : 'Template Marketplace'}</h2>
                        <p className="text-gray-500 dark:text-gray-400">{isVi ? 'Khám phá templates từ cộng đồng' : 'Discover community templates'}</p>
                    </div>
                </div>
                <div className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-lg font-medium flex items-center gap-2">
                    <span>✨</span>
                    <span>{isVi ? `${sampleTemplates.length} templates` : `${sampleTemplates.length} templates`}</span>
                </div>
            </div>

            {/* Marketplace Info Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 
                            border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <span className="text-4xl">🏪</span>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            {isVi ? 'Template Marketplace' : 'Template Marketplace'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                            {isVi ? 'Các template được đóng góp bởi đội ngũ CVF và cộng đồng:' : 'Templates contributed by CVF team and community:'}
                        </p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>✨ {isVi ? 'Khám phá templates từ cộng đồng' : 'Discover community templates'}</li>
                            <li>📤 {isVi ? 'Chia sẻ templates của bạn (sắp ra mắt)' : 'Share your templates (coming soon)'}</li>
                            <li>⭐ {isVi ? 'Đánh giá và review templates' : 'Rate and review templates'}</li>
                            <li>📥 {isVi ? 'Xem chi tiết và áp dụng vào workflow' : 'View details and apply to your workflow'}</li>
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
                        placeholder={isVi ? 'Tìm kiếm templates...' : 'Search templates...'}
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
                    <option value="all">{isVi ? 'Tất cả danh mục' : 'All categories'}</option>
                    <option value="business">{isVi ? '💼 Kinh doanh' : '💼 Business'}</option>
                    <option value="technical">{isVi ? '⚙️ Kỹ thuật' : '⚙️ Technical'}</option>
                    <option value="marketing">📣 Marketing</option>
                </select>
            </div>

            {/* Sample Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 
                     hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all cursor-pointer relative"
                    >
                        {/* Badge */}
                        <div className="absolute top-3 right-3 px-2 py-1 bg-blue-100 dark:bg-blue-900/40 
                                        text-blue-600 dark:text-blue-400 text-xs rounded-full font-medium">
                            {template.author === 'CVF Team' ? (isVi ? 'Chính thức' : 'Official') : (isVi ? 'Cộng đồng' : 'Community')}
                        </div>

                        <div className="flex items-start mb-3">
                            <span className="text-3xl">{template.icon}</span>
                        </div>

                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{template.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{isVi ? template.description : (template.descriptionEn || template.description)}</p>

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
                            onClick={() => setSelectedTemplate(template)}
                            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700
                       text-white font-medium transition-colors"
                        >
                            {isVi ? 'Xem chi tiết' : 'View Details'}
                        </button>
                    </div>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <p>{isVi ? 'Không tìm thấy template phù hợp.' : 'No matching templates found.'}</p>
                </div>
            )}

            {/* Template Detail Modal */}
            {selectedTemplate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    onClick={() => setSelectedTemplate(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">{selectedTemplate.icon}</span>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTemplate.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">👤 {selectedTemplate.author}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedTemplate(null)}
                                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                    {isVi ? 'Mô tả' : 'Description'}
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300">
                                    {isVi ? selectedTemplate.description : (selectedTemplate.descriptionEn || selectedTemplate.description)}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isVi ? 'Danh mục' : 'Category'}</p>
                                    <p className="font-medium text-gray-900 dark:text-white capitalize">{categoryLabel(selectedTemplate.category)}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isVi ? 'Độ khó' : 'Difficulty'}</p>
                                    <p className={`font-medium capitalize ${selectedTemplate.difficulty === 'beginner' ? 'text-green-600' :
                                        selectedTemplate.difficulty === 'intermediate' ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {difficultyLabel(selectedTemplate.difficulty)}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isVi ? 'Nguồn' : 'Source'}</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {selectedTemplate.author === 'CVF Team' ? (isVi ? '✅ Chính thức' : '✅ Official') : (isVi ? '🌐 Cộng đồng' : '🌐 Community')}
                                    </p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{isVi ? 'Trạng thái' : 'Status'}</p>
                                    <p className="font-medium text-green-600">✅ {isVi ? 'Sẵn sàng' : 'Ready'}</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    💡 {isVi
                                        ? 'Template này có thể áp dụng trực tiếp vào workflow CVF. Sử dụng AI Agent để bắt đầu với template này.'
                                        : 'This template can be applied directly to your CVF workflow. Use AI Agent to get started with this template.'}
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                                           hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                            >
                                {isVi ? 'Đóng' : 'Close'}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedTemplate(null);
                                    // Could navigate to AI Agent with this template pre-loaded
                                    alert(isVi
                                        ? `Template "${selectedTemplate.name}" đã được chọn! Mở AI Agent để sử dụng.`
                                        : `Template "${selectedTemplate.name}" selected! Open AI Agent to use it.`);
                                }}
                                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                            >
                                {isVi ? '🚀 Sử dụng template' : '🚀 Use Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
