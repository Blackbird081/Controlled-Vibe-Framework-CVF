'use client';

import Link from 'next/link';
import { Execution } from '@/types';

interface HistoryListProps {
    executions: Execution[];
    onSelect: (execution: Execution) => void;
}

export function HistoryList({ executions, onSelect }: HistoryListProps) {
    if (executions.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No executions yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Start by selecting a template and submitting your first request.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 
                     text-white font-medium rounded-lg transition-colors"
                >
                    <span>Browse Templates</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        );
    }

    const acceptedCount = executions.filter(e => e.result === 'accepted').length;
    const rejectedCount = executions.filter(e => e.result === 'rejected').length;

    return (
        <div>
            {/* Stats */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                        📊 Stats: {executions.length} total
                    </span>
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-green-600 dark:text-green-400">
                            ✅ {acceptedCount} accepted
                        </span>
                        <span className="text-red-600 dark:text-red-400">
                            ❌ {rejectedCount} rejected
                        </span>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {executions.map((execution) => (
                    <div
                        key={execution.id}
                        onClick={() => onSelect(execution)}
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl 
                       border border-gray-200 dark:border-gray-700
                       hover:border-blue-500 hover:shadow-md
                       cursor-pointer transition-all duration-200"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex items-start sm:items-center gap-3">
                                <span className={execution.result === 'accepted' ? 'text-green-500' : 'text-red-500'}>
                                    {execution.result === 'accepted' ? '✅' : '❌'}
                                </span>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                        {execution.templateName}
                                    </h4>
                                    <p className="text-sm text-gray-500 line-clamp-1">
                                        {Object.values(execution.input)[0]}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-end gap-3 text-sm text-gray-500">
                                <span>
                                    {new Date(execution.createdAt).toLocaleDateString()}
                                </span>
                                {execution.qualityScore && (
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                        {execution.qualityScore.toFixed(1)}/10
                                    </span>
                                )}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
