'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
    GovernanceState,
    SelfUATResult,
    buildSelfUATPrompt,
    getAllowedActions,
} from '@/lib/governance-context';

interface GovernancePanelProps {
    governanceState: GovernanceState;
    onRunSelfUAT: (prompt: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

const UAT_CATEGORIES: { key: string; labelVi: string; labelEn: string; icon: string }[] = [
    { key: 'governance_awareness', labelVi: 'Nhận thức Governance', labelEn: 'Governance Awareness', icon: '🧠' },
    { key: 'phase_discipline', labelVi: 'Kỷ luật Phase', labelEn: 'Phase Discipline', icon: '📋' },
    { key: 'role_authority', labelVi: 'Quyền hạn Role', labelEn: 'Role Authority', icon: '👤' },
    { key: 'risk_boundary', labelVi: 'Giới hạn Risk', labelEn: 'Risk Boundary', icon: '⚠️' },
    { key: 'skill_governance', labelVi: 'Quản trị Skill', labelEn: 'Skill Governance', icon: '🛠️' },
    { key: 'refusal_quality', labelVi: 'Chất lượng Từ chối', labelEn: 'Refusal Quality', icon: '🚫' },
];

export function GovernancePanel({ governanceState, onRunSelfUAT, isOpen, onClose }: GovernancePanelProps) {
    const { language } = useLanguage();
    const [uatResults, setUatResults] = useState<SelfUATResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [uatHistory, setUatHistory] = useState<{ date: string; result: string; score: number }[]>([]);
    const isVi = language === 'vi';

    const handleRunSelfUAT = useCallback(() => {
        setIsRunning(true);
        setUatResults(UAT_CATEGORIES.map(cat => ({
            category: cat.key,
            categoryLabel: isVi ? cat.labelVi : cat.labelEn,
            status: 'PENDING' as const,
            evidence: '',
        })));

        const prompt = buildSelfUATPrompt(governanceState, language);
        onRunSelfUAT(prompt);

        // Auto-reset running state after timeout
        setTimeout(() => setIsRunning(false), 30000);
    }, [governanceState, language, isVi, onRunSelfUAT]);

    const allowedActions = getAllowedActions(governanceState.phase, governanceState.role);

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        🛡️ {isVi ? 'Governance Panel' : 'Governance Panel'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Current State */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {isVi ? 'Trạng thái hiện tại' : 'Current State'}
                </h3>
                <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">📋 Phase</span>
                        <span className="font-medium">{governanceState.phase}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">👤 Role</span>
                        <span className="font-medium">{governanceState.role}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">⚠️ Risk</span>
                        <span className="font-medium">{governanceState.riskLevel}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">🔘 Toolkit</span>
                        <span className={`font-medium ${governanceState.toolkitEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                            {governanceState.toolkitEnabled
                                ? (isVi ? 'Bật' : 'ON')
                                : (isVi ? 'Tắt' : 'OFF')
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Allowed Actions */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {isVi ? 'Hành động được phép' : 'Allowed Actions'}
                </h3>
                {allowedActions.length > 0 ? (
                    <ul className="space-y-1">
                        {allowedActions.map((action, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-1.5">
                                <span className="text-green-500 mt-0.5">✅</span>
                                <span>{action}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-red-500">
                        ❌ {isVi ? 'Không có hành động nào được phép' : 'No actions allowed'}
                    </p>
                )}
            </div>

            {/* Self-UAT Section */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    🧪 Self-UAT
                </h3>
                <button
                    onClick={handleRunSelfUAT}
                    disabled={isRunning || !governanceState.toolkitEnabled}
                    className={`
                        w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors
                        ${isRunning
                            ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 cursor-wait'
                            : governanceState.toolkitEnabled
                                ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                        }
                    `}
                >
                    {isRunning
                        ? (isVi ? '⏳ Đang kiểm tra...' : '⏳ Running...')
                        : (isVi ? '▶️ Chạy Self-UAT' : '▶️ Run Self-UAT')
                    }
                </button>

                {/* UAT Results */}
                {uatResults.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                        {uatResults.map((result) => {
                            const cat = UAT_CATEGORIES.find(c => c.key === result.category);
                            return (
                                <div
                                    key={result.category}
                                    className={`
                                        flex items-center justify-between p-2 rounded-md text-sm
                                        ${result.status === 'PASS'
                                            ? 'bg-green-50 dark:bg-green-950'
                                            : result.status === 'FAIL'
                                                ? 'bg-red-50 dark:bg-red-950'
                                                : 'bg-gray-50 dark:bg-gray-700'
                                        }
                                    `}
                                >
                                    <span className="flex items-center gap-1.5">
                                        {cat?.icon}
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {isVi ? cat?.labelVi : cat?.labelEn}
                                        </span>
                                    </span>
                                    <span className={`font-medium ${result.status === 'PASS' ? 'text-green-600' :
                                            result.status === 'FAIL' ? 'text-red-600' :
                                                'text-gray-400'
                                        }`}>
                                        {result.status === 'PENDING' ? '⏳' : result.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* UAT History */}
            {uatHistory.length > 0 && (
                <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        📜 {isVi ? 'Lịch sử UAT' : 'UAT History'}
                    </h3>
                    <div className="space-y-1.5">
                        {uatHistory.map((entry, i) => (
                            <div key={i} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                                <span>{entry.date}</span>
                                <span className={entry.result === 'PASS' ? 'text-green-600' : 'text-red-600'}>
                                    {entry.result} ({entry.score}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
