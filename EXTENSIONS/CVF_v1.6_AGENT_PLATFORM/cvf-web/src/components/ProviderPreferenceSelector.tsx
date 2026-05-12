'use client';

import type { ProviderPreference } from '@/lib/provider-policy-engine';

interface Props {
    value: ProviderPreference;
    onChange: (value: ProviderPreference) => void;
    lang: 'vi' | 'en';
}

const LABELS: Record<ProviderPreference, { vi: string; en: string; description: { vi: string; en: string } }> = {
    auto: {
        vi: 'Tự động',
        en: 'Auto',
        description: {
            vi: 'CVF chọn nhà cung cấp tốt nhất theo chính sách',
            en: 'CVF selects the best provider per governance policy',
        },
    },
    fast: {
        vi: 'Tiết kiệm',
        en: 'Fast',
        description: {
            vi: 'Ưu tiên nhà cung cấp chi phí thấp nhất',
            en: 'Prefer lowest-cost configured provider',
        },
    },
    accurate: {
        vi: 'Chính xác',
        en: 'Accurate',
        description: {
            vi: 'Ưu tiên mô hình có năng lực cao nhất',
            en: 'Prefer highest-capability configured provider',
        },
    },
};

const TIERS: ProviderPreference[] = ['auto', 'fast', 'accurate'];

export function ProviderPreferenceSelector({ value, onChange, lang }: Props) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {lang === 'vi' ? 'Ưu tiên nhà cung cấp' : 'Provider Preference'}
            </label>
            <div className="grid grid-cols-3 gap-2">
                {TIERS.map((tier) => {
                    const label = LABELS[tier];
                    const active = value === tier;
                    return (
                        <button
                            key={tier}
                            type="button"
                            onClick={() => onChange(tier)}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors text-left
                                ${active
                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300'
                                }`}
                        >
                            <div>{lang === 'vi' ? label.vi : label.en}</div>
                            <div className="text-xs mt-0.5 font-normal text-gray-500 dark:text-gray-400 leading-tight">
                                {lang === 'vi' ? label.description.vi : label.description.en}
                            </div>
                        </button>
                    );
                })}
            </div>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                {lang === 'vi'
                    ? 'R2/R3 sẽ bỏ qua ưu tiên này theo quy định quản trị'
                    : 'R2/R3 requests override this preference per governance policy'}
            </p>
        </div>
    );
}
