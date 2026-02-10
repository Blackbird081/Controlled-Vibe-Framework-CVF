'use client';

import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';
import { AnalyticsDashboard } from '@/components';

export default function AnalyticsPage() {
    const { t } = useLanguage();
    const router = useRouter();

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.push('/')}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('main.analyticsTitle')}</h2>
            </div>
            <AnalyticsDashboard />
        </div>
    );
}
