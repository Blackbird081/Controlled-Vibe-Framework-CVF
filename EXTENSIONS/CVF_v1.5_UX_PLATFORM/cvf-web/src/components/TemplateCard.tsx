'use client';

import { Template, CATEGORY_INFO, Category } from '@/types';

interface TemplateCardProps {
    template: Template;
    onClick: () => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
    const categoryInfo = CATEGORY_INFO[template.category as Category];

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl p-6 
                 border border-gray-200 dark:border-gray-700
                 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10
                 transition-all duration-200"
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

            <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                Use Template
                <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </div>
    );
}
