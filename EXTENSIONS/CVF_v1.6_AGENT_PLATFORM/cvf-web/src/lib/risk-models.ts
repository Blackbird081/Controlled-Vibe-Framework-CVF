'use client';

import {
    GENERATED_DESTRUCTIVE_RULES,
    GENERATED_ESCALATION_THRESHOLDS,
    GENERATED_RISK_MATRIX,
} from './generated/risk-models.generated';

export interface RiskMatrixEntry {
    intent: string;
    label: { vi: string; en: string };
    baseScore: number;
    category: 'safe' | 'caution' | 'dangerous' | 'critical';
}

export interface DestructiveRule {
    pattern: string;
    label: { vi: string; en: string };
    riskBoost: number;
}

export interface EscalationThreshold {
    level: string;
    minScore: number;
    maxScore: number;
    action: string;
    color: string;
    label: { vi: string; en: string };
}

function normalizeCategory(category: string): RiskMatrixEntry['category'] {
    switch (category) {
        case 'safe':
        case 'caution':
        case 'dangerous':
        case 'critical':
            return category;
        default:
            return 'caution';
    }
}

export const RISK_MATRIX: RiskMatrixEntry[] = GENERATED_RISK_MATRIX.map((entry) => ({
    ...entry,
    category: normalizeCategory(entry.category),
}));
export const DESTRUCTIVE_RULES: DestructiveRule[] = GENERATED_DESTRUCTIVE_RULES;
export const ESCALATION_THRESHOLDS: EscalationThreshold[] = GENERATED_ESCALATION_THRESHOLDS;

export function getRiskScoreForIntent(intent: string): number {
    const found = RISK_MATRIX.find((entry) => entry.intent === intent);
    return found ? found.baseScore : 0;
}

export function toCvfRiskBand(score: number): 'R1' | 'R2' | 'R3' | 'R4' {
    const threshold = ESCALATION_THRESHOLDS.find(
        (item) => score >= item.minScore && score <= item.maxScore
    );

    if (!threshold) {
        return score >= 90 ? 'R4' : score >= 70 ? 'R3' : score >= 40 ? 'R2' : 'R1';
    }

    if (threshold.level === 'DENY') return 'R4';
    if (threshold.level === 'SANDBOX') return 'R3';
    if (threshold.level === 'REVIEW') return 'R2';
    return 'R1';
}

export function getCategoryColor(category: string): string {
    switch (category) {
        case 'safe': return 'text-emerald-600 dark:text-emerald-400';
        case 'caution': return 'text-amber-600 dark:text-amber-400';
        case 'dangerous': return 'text-orange-600 dark:text-orange-400';
        case 'critical': return 'text-red-600 dark:text-red-400';
        default: return 'text-gray-600 dark:text-gray-400';
    }
}

export function getCategoryBg(category: string): string {
    switch (category) {
        case 'safe': return 'bg-emerald-100 dark:bg-emerald-900/30';
        case 'caution': return 'bg-amber-100 dark:bg-amber-900/30';
        case 'dangerous': return 'bg-orange-100 dark:bg-orange-900/30';
        case 'critical': return 'bg-red-100 dark:bg-red-900/30';
        default: return 'bg-gray-100 dark:bg-gray-800';
    }
}

export function getScoreBar(score: number): string {
    if (score >= 90) return 'bg-red-500';
    if (score >= 70) return 'bg-orange-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-emerald-500';
}
