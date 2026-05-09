'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
    GovernanceState,
    SelfUATResult,
    SelfUATSummary,
    buildSelfUATPrompt,
    parseSelfUATResponse,
    getAllowedActions,
} from '@/lib/governance-context';

interface GovernancePanelProps {
    governanceState: GovernanceState;
    onRunSelfUAT: (prompt: string) => Promise<string>;
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
    const [uatSummary, setUatSummary] = useState<SelfUATSummary | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [uatError, setUatError] = useState<string | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [uatHistory, setUatHistory] = useState<{ date: string; finalResult: string; score: number }[]>([]);
    const isVi = language === 'vi';

    const handleRunSelfUAT = useCallback(async () => {
        setIsRunning(true);
        setUatError(null);
        setUatSummary(null);
        setExpandedCategory(null);

        // Show pending state immediately
        setUatResults(UAT_CATEGORIES.map(cat => ({
            category: cat.key,
            categoryLabel: isVi ? cat.labelVi : cat.labelEn,
            status: 'PENDING' as const,
            evidence: '',
        })));

        try {
            const prompt = buildSelfUATPrompt(governanceState, language);
            const aiResponse = await onRunSelfUAT(prompt);

            // Parse AI response
            const summary = parseSelfUATResponse(aiResponse, language);
            setUatResults(summary.results);
            setUatSummary(summary);

            // Add to history
            const now = new Date();
            const dateStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            setUatHistory(prev => [
                { date: dateStr, finalResult: summary.finalResult, score: summary.score },
                ...prev.slice(0, 9), // Keep last 10
            ]);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            setUatError(isVi ? `Lỗi: ${msg}` : `Error: ${msg}`);
            setUatResults([]);
        } finally {
            setIsRunning(false);
        }
    }, [governanceState, language, isVi, onRunSelfUAT]);

    const allowedActions = getAllowedActions(governanceState.phase, governanceState.role);

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
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
                        w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all
                        ${isRunning
                            ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 cursor-wait animate-pulse'
                            : governanceState.toolkitEnabled
                                ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer shadow-sm hover:shadow-md'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                        }
                    `}
                >
                    {isRunning
                        ? (isVi ? '⏳ Đang gọi AI kiểm tra...' : '⏳ Calling AI for testing...')
                        : (isVi ? '▶️ Chạy Self-UAT' : '▶️ Run Self-UAT')
                    }
                </button>

                {!governanceState.toolkitEnabled && (
                    <p className="mt-2 text-xs text-gray-400">
                        {isVi ? 'Bật CVF Toolkit để sử dụng Self-UAT' : 'Enable CVF Toolkit to use Self-UAT'}
                    </p>
                )}

                {/* Error */}
                {uatError && (
                    <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
                        ⚠️ {uatError}
                    </div>
                )}

                {/* Score Badge */}
                {uatSummary && (
                    <div className="mt-3 flex items-center gap-3">
                        <div className={`
                            px-4 py-2 rounded-xl text-center font-bold text-lg
                            ${uatSummary.finalResult === 'PASS'
                                ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                                : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                            }
                        `}>
                            {uatSummary.finalResult === 'PASS' ? '✅' : '❌'} {uatSummary.score}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            <div className="font-medium">
                                {uatSummary.finalResult === 'PASS'
                                    ? (isVi ? 'VƯỢT QUA' : 'PASSED')
                                    : (isVi ? 'KHÔNG ĐẠT' : 'FAILED')
                                }
                            </div>
                            <div>
                                {isVi ? 'Chế độ Production: ' : 'Production mode: '}
                                <span className={uatSummary.productionMode === 'ENABLED' ? 'text-green-600' : 'text-red-500'}>
                                    {uatSummary.productionMode}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* UAT Results with expandable evidence */}
                {uatResults.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                        {uatResults.map((result) => {
                            const cat = UAT_CATEGORIES.find(c => c.key === result.category);
                            const isExpanded = expandedCategory === result.category;
                            return (
                                <div key={result.category}>
                                    <button
                                        onClick={() => setExpandedCategory(
                                            isExpanded ? null : result.category
                                        )}
                                        disabled={result.status === 'PENDING'}
                                        className={`
                                            w-full flex items-center justify-between p-2.5 rounded-md text-sm transition-colors
                                            ${result.status === 'PASS'
                                                ? 'bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900'
                                                : result.status === 'FAIL'
                                                    ? 'bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900'
                                                    : 'bg-gray-50 dark:bg-gray-700'
                                            }
                                        `}
                                    >
                                        <span className="flex items-center gap-1.5">
                                            {cat?.icon}
                                            <span className="text-gray-700 dark:text-gray-300 text-left">
                                                {isVi ? cat?.labelVi : cat?.labelEn}
                                            </span>
                                        </span>
                                        <span className={`font-medium ${result.status === 'PASS' ? 'text-green-600' :
                                            result.status === 'FAIL' ? 'text-red-600' :
                                                'text-gray-400'
                                            }`}>
                                            {result.status === 'PENDING' ? '⏳' : result.status}
                                        </span>
                                    </button>
                                    {/* Evidence expandable */}
                                    {isExpanded && result.evidence && (
                                        <div className="mx-2 mt-1 mb-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300 border-l-2 border-blue-400">
                                            💬 {result.evidence}
                                        </div>
                                    )}
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
                            <div key={i} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                                <span>{entry.date}</span>
                                <span className={entry.finalResult === 'PASS' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                    {entry.finalResult === 'PASS' ? '✅' : '❌'} {entry.score}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
