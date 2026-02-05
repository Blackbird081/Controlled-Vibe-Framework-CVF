'use client';

import { Template, CATEGORY_INFO, Category } from '@/types';

interface TemplateCardProps {
    template: Template;
    onClick: () => void;
    onPreview?: (e: React.MouseEvent) => void;
}

export function TemplateCard({ template, onClick, onPreview }: TemplateCardProps) {
    const categoryInfo = CATEGORY_INFO[template.category as Category];

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 
                 border border-gray-200 dark:border-gray-700
                 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10
                 transition-all duration-200 relative"
        >
            <div className="flex items-start justify-between">
                <div className="text-3xl">{template.icon}</div>
                <span className={`text-xs px-2 py-1 rounded-full 
                         bg-${categoryInfo.color}-100 text-${categoryInfo.color}-700
                         dark:bg-${categoryInfo.color}-900 dark:text-${categoryInfo.color}-300`}>
                    {categoryInfo.name}
                </span>
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white
                     group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {template.name}
            </h3>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {template.description}
            </p>

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                    Use Template
                    <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>

                {onPreview && template.sampleOutput && (
                    <button
                        onClick={onPreview}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Preview output"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
