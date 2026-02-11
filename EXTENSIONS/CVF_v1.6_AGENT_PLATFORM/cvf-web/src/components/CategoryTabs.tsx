'use client';

import { CATEGORY_INFO, Category } from '@/types';
import { useLanguage } from '@/lib/i18n';

interface CategoryTabsProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
    const { language } = useLanguage();
    const categories = ['all', ...Object.keys(CATEGORY_INFO)] as const;

    return (
        <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
                const isActive = activeCategory === cat;
                const info = cat === 'all'
                    ? { name: language === 'en' ? 'All' : 'Tất cả', nameEn: 'All', icon: '🎯', color: 'gray' }
                    : CATEGORY_INFO[cat as Category];

                const displayName = language === 'en' ? info.nameEn : info.name;

                return (
                    <button
                        key={cat}
                        onClick={() => onCategoryChange(cat)}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${isActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }
            `}
                    >
                        <span>{info.icon}</span>
                        <span>{displayName}</span>
                    </button>
                );
            })}
        </div>
    );
}
