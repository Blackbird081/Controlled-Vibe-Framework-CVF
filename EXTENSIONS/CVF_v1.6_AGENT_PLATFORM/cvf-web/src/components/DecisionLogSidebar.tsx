'use client';

import { DecisionLogEntry } from '@/lib/cvf-checklists';

interface DecisionLogSidebarProps {
    entries: DecisionLogEntry[];
    onClose: () => void;
    onClear: () => void;
    language?: 'vi' | 'en';
}

export function DecisionLogSidebar({
    entries,
    onClose,
    onClear,
    language = 'vi',
}: DecisionLogSidebarProps) {
    const labels = {
        vi: {
            title: 'Decision Log',
            empty: 'Chưa có quyết định nào',
            clear: 'Xóa log',
            close: 'Đóng',
        },
        en: {
            title: 'Decision Log',
            empty: 'No decisions yet',
            clear: 'Clear log',
            close: 'Close',
        },
    };
    const l = labels[language];

    const actionLabels: Record<DecisionLogEntry['action'], string> = {
        gate_approved: language === 'vi' ? 'Duyệt Phase' : 'Gate approved',
        gate_rejected: language === 'vi' ? 'Từ chối Phase' : 'Gate rejected',
        checklist_updated: language === 'vi' ? 'Cập nhật quyết định' : 'Decision updated',
        retry_requested: language === 'vi' ? 'Yêu cầu retry' : 'Retry requested',
    };

    const actionColors: Record<DecisionLogEntry['action'], string> = {
        gate_approved: 'text-green-600',
        gate_rejected: 'text-red-600',
        checklist_updated: 'text-blue-600',
        retry_requested: 'text-yellow-600',
    };

    return (
        <div className="fixed inset-0 z-40 md:static md:z-auto">
            <div className="absolute inset-0 bg-black/40 md:hidden" onClick={onClose} />
            <aside className="absolute right-0 top-0 h-full w-full md:static md:h-auto md:w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 dark:text-white">{l.title}</h4>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    title={l.close}
                >
                    ✕
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {entries.length === 0 && (
                    <p className="text-sm text-gray-500">{l.empty}</p>
                )}
                {entries.map(entry => (
                    <div key={entry.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{entry.phase}</span>
                            <span>{entry.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <div className={`mt-1 text-sm font-medium ${actionColors[entry.action]}`}>
                            {actionLabels[entry.action]}
                        </div>
                        {entry.details && (
                            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                {entry.details}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={onClear}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    {l.clear}
                </button>
            </div>
        </aside>
        </div>
    );
}
