'use client';

import { CATEGORY_INFO, Category } from '@/types';
import { useLanguage } from '@/lib/i18n';

interface CategoryTabsProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    counts?: Partial<Record<string, number>>;
}

export function CategoryTabs({ activeCategory, onCategoryChange, counts }: CategoryTabsProps) {
    const { language } = useLanguage();
    const categories = ['all', ...Object.keys(CATEGORY_INFO)] as const;

    return (
        <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => {
                const isActive = activeCategory === cat;
                const info = cat === 'all'
                    ? { name: language === 'en' ? 'All' : 'Tất cả', nameEn: 'All', icon: '🎯', color: 'gray' }
                    : CATEGORY_INFO[cat as Category];

                const displayName = language === 'en' ? info.nameEn : info.name;
                const count = counts?.[cat];

                return (
                    <button
                        key={cat}
                        onClick={() => onCategoryChange(cat)}
                        className={`
              flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium
              transition-all duration-200 border
              ${isActive
                                ? 'border-indigo-500/60 bg-indigo-600 text-white shadow-[0_12px_30px_-18px_rgba(79,70,229,0.85)] dark:bg-indigo-500 dark:text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/[0.07] dark:bg-[#171b29] dark:text-white/65 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05]'
                            }
            `}
                    >
                        <span>{info.icon}</span>
                        <span>{displayName}</span>
                        {count !== undefined && (
                            <span
                                className={`
                  rounded-full px-2 py-0.5 text-[11px] font-semibold
                  ${isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-100 text-slate-500 dark:bg-white/[0.07] dark:text-white/35'
                                    }
                `}
                            >
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
