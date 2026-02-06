'use client';

import { useState, useEffect } from 'react';
import {
    CVFPhase,
    PhaseChecklist,
    getPhaseChecklist,
    autoCheckItems,
    calculatePhaseCompliance,
    getNextPhase
} from '@/lib/cvf-checklists';

interface PhaseGateModalProps {
    phase: CVFPhase;
    response: string;
    language: 'vi' | 'en';
    onApprove: () => void;
    onReject: () => void;
    onClose: () => void;
}

export function PhaseGateModal({
    phase,
    response,
    language,
    onApprove,
    onReject,
    onClose
}: PhaseGateModalProps) {
    const checklist = getPhaseChecklist(phase);
    const [checkedItems, setCheckedItems] = useState<string[]>([]);

    // Auto-check items on mount
    useEffect(() => {
        const autoChecked = autoCheckItems(phase, response);
        setCheckedItems(autoChecked);
    }, [phase, response]);

    if (!checklist) return null;

    const compliance = calculatePhaseCompliance(phase, checkedItems);
    const nextPhase = getNextPhase(phase);

    const colorClasses = {
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
        green: 'from-green-500 to-green-600',
        orange: 'from-orange-500 to-orange-600',
    };

    const toggleItem = (id: string) => {
        setCheckedItems(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className={`px-6 py-4 bg-gradient-to-r ${colorClasses[checklist.color as keyof typeof colorClasses]} text-white`}>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{checklist.icon}</span>
                        <div>
                            <h2 className="text-lg font-bold">
                                {language === 'vi' ? checklist.titleVi : checklist.title}
                            </h2>
                            <p className="text-sm opacity-80">
                                {language === 'vi' ? checklist.descriptionVi : checklist.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Compliance Score */}
                <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'vi' ? 'Tỷ lệ tuân thủ' : 'Compliance'}
                        </span>
                        <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${compliance.passed ? 'bg-green-500' : 'bg-yellow-500'}`}
                                    style={{ width: `${compliance.score}%` }}
                                />
                            </div>
                            <span className={`text-sm font-medium ${compliance.passed ? 'text-green-600' : 'text-yellow-600'}`}>
                                {compliance.score}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Checklist */}
                <div className="px-6 py-4 max-h-64 overflow-y-auto">
                    <div className="space-y-2">
                        {checklist.items.map(item => (
                            <label
                                key={item.id}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={checkedItems.includes(item.id)}
                                    onChange={() => toggleItem(item.id)}
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <span className={`text-sm ${checkedItems.includes(item.id) ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                        {language === 'vi' ? item.labelVi : item.label}
                                    </span>
                                    {item.required && (
                                        <span className="ml-1 text-red-500 text-xs">*</span>
                                    )}
                                </div>
                                {item.autoCheck && checkedItems.includes(item.id) && (
                                    <span className="text-xs text-green-500" title="Auto-detected">
                                        ✓ Auto
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Gate Question */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        {language === 'vi' ? checklist.gateQuestionVi : checklist.gateQuestion}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onApprove}
                            disabled={!compliance.passed}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2
                                ${compliance.passed
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}`}
                        >
                            <span>✓</span>
                            <span>
                                {language === 'vi'
                                    ? (nextPhase ? `Duyệt → ${nextPhase}` : 'Chấp nhận')
                                    : (nextPhase ? `Approve → ${nextPhase}` : 'Accept')
                                }
                            </span>
                        </button>

                        <button
                            onClick={onReject}
                            className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <span>✕</span>
                            <span>{language === 'vi' ? 'Yêu cầu sửa' : 'Request Revision'}</span>
                        </button>
                    </div>

                    {!compliance.passed && (
                        <p className="mt-3 text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                            <span>⚠️</span>
                            {language === 'vi'
                                ? `Cần hoàn thành ${compliance.missing.length} mục bắt buộc để duyệt`
                                : `${compliance.missing.length} required items missing`
                            }
                        </p>
                    )}
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/80 hover:text-white"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
