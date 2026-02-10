'use client';

import { useRouter } from 'next/navigation';
import { useExecutionStore } from '@/lib/store';
import { useLanguage } from '@/lib/i18n';
import { HistoryList } from '@/components';

export default function HistoryPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const { executions, setCurrentExecution } = useExecutionStore();

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
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('main.historyTitle')}</h2>
            </div>
            <HistoryList
                executions={executions}
                onSelect={(exec) => {
                    setCurrentExecution(exec);
                    // Navigate to result via home page workflow
                    router.push('/');
                }}
                onBrowse={() => router.push('/')}
            />
        </div>
    );
}
