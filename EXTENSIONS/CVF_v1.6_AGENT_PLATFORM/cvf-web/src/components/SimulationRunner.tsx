'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import { type PolicyRule } from './PolicyEditor';

export interface SimulationScenario {
    id: number;
    description: string;
    cvf_risk_level: string;
    cvf_phase: string;
    risk_score: number;
    violation: boolean;
}

export interface SimulationResultItem {
    scenarioId: number;
    description: string;
    before: string;
    after: string;
    changed: boolean;
}

export interface SimulationSummary {
    totalScenarios: number;
    changedCount: number;
    impactRatio: number; // 0-100
    results: SimulationResultItem[];
}

interface SimulationRunnerProps {
    baselineRules: PolicyRule[];
    newRules: PolicyRule[];
    onSimulate?: (summary: SimulationSummary) => void;
}

const LABELS = {
    vi: {
        title: '🧪 Kết quả mô phỏng',
        run: 'Chạy mô phỏng',
        running: 'Đang chạy...',
        impact: 'Tác động',
        changed: 'Thay đổi',
        of: 'trong',
        decisions: 'quyết định',
        before: 'Trước',
        after: 'Sau',
        scenario: 'Tình huống',
        warning: '⚠️ Tác động > 30% — Hãy xem xét kỹ trước khi áp dụng',
        noResults: 'Nhấn "Chạy mô phỏng" để xem kết quả',
        loadSample: 'Nạp mẫu tình huống',
    },
    en: {
        title: '🧪 Simulation Results',
        run: 'Run Simulation',
        running: 'Running...',
        impact: 'Impact',
        changed: 'Changed',
        of: 'of',
        decisions: 'decisions',
        before: 'Before',
        after: 'After',
        scenario: 'Scenario',
        warning: '⚠️ Impact > 30% — Review carefully before applying',
        noResults: 'Click "Run Simulation" to see results',
        loadSample: 'Load sample scenarios',
    },
};

const SAMPLE_SCENARIOS: SimulationScenario[] = [
    { id: 1, description: 'Low risk intake', cvf_risk_level: 'R1', cvf_phase: 'INTAKE', risk_score: 10, violation: false },
    { id: 2, description: 'Medium build task', cvf_risk_level: 'R2', cvf_phase: 'BUILD', risk_score: 45, violation: false },
    { id: 3, description: 'High risk build', cvf_risk_level: 'R3', cvf_phase: 'BUILD', risk_score: 75, violation: false },
    { id: 4, description: 'Critical frozen change', cvf_risk_level: 'R4', cvf_phase: 'FREEZE', risk_score: 95, violation: true },
    { id: 5, description: 'Low design task', cvf_risk_level: 'R0', cvf_phase: 'DESIGN', risk_score: 5, violation: false },
    { id: 6, description: 'Violation in review', cvf_risk_level: 'R2', cvf_phase: 'REVIEW', risk_score: 55, violation: true },
];

/** Evaluate a single rule against a scenario */
function evaluateCondition(condition: string, scenario: SimulationScenario): boolean {
    // Simple DSL condition evaluator
    const parts = condition.split(/\s+AND\s+/i);
    return parts.every(part => {
        const match = part.match(/(\w+)\s*(>=|<=|>|<|=)\s*(\S+)/);
        if (!match) return false;
        const [, field, op, val] = match;

        let actual: number | string | boolean;
        switch (field) {
            case 'cvf_risk_level': actual = scenario.cvf_risk_level; break;
            case 'cvf_phase': actual = scenario.cvf_phase; break;
            case 'risk_score': actual = scenario.risk_score; break;
            case 'violation': actual = scenario.violation; break;
            default: return false;
        }

        // Risk level comparison
        if (field === 'cvf_risk_level') {
            const riskOrder = { R0: 0, R1: 1, R2: 2, R3: 3, R4: 4 };
            const actualNum = riskOrder[actual as keyof typeof riskOrder] ?? 0;
            const valNum = riskOrder[val as keyof typeof riskOrder] ?? 0;
            switch (op) {
                case '>=': return actualNum >= valNum;
                case '<=': return actualNum <= valNum;
                case '>': return actualNum > valNum;
                case '<': return actualNum < valNum;
                case '=': return actualNum === valNum;
            }
        }

        // Numeric comparison
        if (typeof actual === 'number') {
            const numVal = parseFloat(val);
            switch (op) {
                case '>=': return actual >= numVal;
                case '<=': return actual <= numVal;
                case '>': return actual > numVal;
                case '<': return actual < numVal;
                case '=': return actual === numVal;
            }
        }

        // Boolean
        if (typeof actual === 'boolean') {
            return actual === (val === 'true');
        }

        // String equality
        return String(actual) === val;
    });
}

/** Apply rules to scenario, return first matching action or ALLOW */
export function applyRules(rules: PolicyRule[], scenario: SimulationScenario): string {
    for (const rule of rules) {
        if (evaluateCondition(rule.condition, scenario)) {
            return rule.action;
        }
    }
    return 'ALLOW';
}

export function runSimulation(baselineRules: PolicyRule[], newRules: PolicyRule[], scenarios: SimulationScenario[]): SimulationSummary {
    const results: SimulationResultItem[] = scenarios.map(sc => {
        const before = applyRules(baselineRules, sc);
        const after = applyRules(newRules, sc);
        return {
            scenarioId: sc.id,
            description: sc.description,
            before,
            after,
            changed: before !== after,
        };
    });

    const changedCount = results.filter(r => r.changed).length;
    return {
        totalScenarios: scenarios.length,
        changedCount,
        impactRatio: scenarios.length > 0 ? Math.round((changedCount / scenarios.length) * 100) : 0,
        results,
    };
}

export function SimulationRunner({ baselineRules, newRules, onSimulate }: SimulationRunnerProps) {
    const { language } = useLanguage();
    const l = LABELS[language];
    const [summary, setSummary] = useState<SimulationSummary | null>(null);
    const [running, setRunning] = useState(false);
    const [scenarios] = useState<SimulationScenario[]>(SAMPLE_SCENARIOS);

    const handleRun = useCallback(() => {
        setRunning(true);
        // Simulate async processing
        setTimeout(() => {
            const result = runSimulation(baselineRules, newRules, scenarios);
            setSummary(result);
            onSimulate?.(result);
            setRunning(false);
        }, 300);
    }, [baselineRules, newRules, onSimulate, scenarios]);

    // Auto-run when newRules changes (triggered by the bottom "Chạy mô phỏng" button in PolicyEditor)
    const prevRulesRef = useRef(newRules);
    useEffect(() => {
        if (newRules !== prevRulesRef.current && newRules.length > 0) {
            prevRulesRef.current = newRules;
            // Defer execution to avoid sync state updates inside the effect body.
            const timer = setTimeout(() => handleRun(), 0);
            return () => clearTimeout(timer);
        }
    }, [newRules, handleRun]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {l.title}
                </h3>
                <button
                    onClick={handleRun}
                    disabled={running || newRules.length === 0}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded disabled:opacity-50 transition-colors"
                >
                    {running ? l.running : l.run}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                {!summary ? (
                    <p className="text-sm text-gray-400 text-center py-8">{l.noResults}</p>
                ) : (
                    <div className="space-y-4">
                        {/* Impact Summary */}
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="text-center">
                                <p className={`text-3xl font-bold ${summary.impactRatio > 30 ? 'text-red-500' : summary.impactRatio > 0 ? 'text-yellow-500' : 'text-green-500'
                                    }`}>
                                    {summary.impactRatio}%
                                </p>
                                <p className="text-xs text-gray-500">{l.impact}</p>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {l.changed}: {summary.changedCount} {l.of} {summary.totalScenarios} {l.decisions}
                            </div>
                        </div>

                        {summary.impactRatio > 30 && (
                            <div className="p-2 rounded bg-red-50 dark:bg-red-950 text-xs text-red-600 dark:text-red-400">
                                {l.warning}
                            </div>
                        )}

                        {/* Results Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs min-w-[360px]">
                                <thead>
                                    <tr className="text-gray-500 border-b border-gray-200 dark:border-gray-700">
                                        <th className="text-left py-2 px-1">#</th>
                                        <th className="text-left py-2 px-1">{l.scenario}</th>
                                        <th className="text-center py-2 px-1">{l.before}</th>
                                        <th className="text-center py-2 px-1">{l.after}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.results.map(r => (
                                        <tr key={r.scenarioId} className={r.changed ? 'bg-yellow-50 dark:bg-yellow-950/30' : ''}>
                                            <td className="py-1.5 px-1">{r.scenarioId}</td>
                                            <td className="py-1.5 px-1">{r.description}</td>
                                            <td className="py-1.5 px-1 text-center">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${r.before === 'BLOCK' ? 'bg-red-100 text-red-700' :
                                                    r.before === 'NEEDS_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {r.before}
                                                </span>
                                            </td>
                                            <td className="py-1.5 px-1 text-center">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${r.after === 'BLOCK' ? 'bg-red-100 text-red-700' :
                                                    r.after === 'NEEDS_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                    {r.after}
                                                </span>
                                                {r.changed && <span className="ml-1">🔀</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
