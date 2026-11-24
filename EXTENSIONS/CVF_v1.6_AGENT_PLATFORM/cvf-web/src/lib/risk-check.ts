// Text Encoding Exception: Vietnamese risk terms are evaluated as user input.
import { GENERATED_GOVERNANCE_MODEL } from './generated/governance-model.generated';

const RISK_LEVEL_ORDER = [...GENERATED_GOVERNANCE_MODEL.riskOrder, 'R4'] as const;
export type RiskLevel = typeof RISK_LEVEL_ORDER[number];
type RunnableRiskLevel = Exclude<RiskLevel, 'R4'>;

export interface RiskGateResult {
    status: 'ALLOW' | 'BLOCK' | 'NEEDS_APPROVAL';
    riskLevel: RiskLevel;
    reason: string;
}

const LEGACY_RISK_LABELS: ReadonlyMap<string, RiskLevel> = new Map([
    ['LOW', 'R0'], ['SAFE', 'R0'],
    ['MEDIUM', 'R1'], ['ATTENTION', 'R1'],
    ['HIGH', 'R2'], ['ELEVATED', 'R2'],
    ['CRITICAL', 'R3'], ['DANGEROUS', 'R3'],
    ['BLOCKED', 'R4'],
]);

export function parseRiskLevel(value: unknown): RiskLevel | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().toUpperCase();
    const match = normalized.match(/^R\s*([0-4])$/);
    return match ? (`R${match[1]}` as RiskLevel) : LEGACY_RISK_LABELS.get(normalized) ?? null;
}

export function normalizeRiskLevel(value?: unknown): RiskLevel {
    return parseRiskLevel(value) ?? 'R3';
}

export function normalizeRunnableRiskLevel(value?: string | null): RunnableRiskLevel {
    const risk = normalizeRiskLevel(value);
    if (risk === 'R4') throw new Error('Risk level R4 is blocked by policy.');
    return risk;
}

export function highestRisk(...levels: ReadonlyArray<RiskLevel | null | undefined>): RiskLevel | null {
    let highest: RiskLevel | null = null;
    for (const level of levels) {
        if (level && (!highest || RISK_LEVEL_ORDER.indexOf(level) > RISK_LEVEL_ORDER.indexOf(highest))) highest = level;
    }
    return highest;
}

export function inferRiskLevelFromText(
    text: string,
    { floor, fallback = null }: { floor?: RiskLevel | null; fallback?: RiskLevel | null } = {},
): RiskLevel | null {
    const critical = /\b(?:critical|production|deploy(?:ment|ing)?|security)\b|\b(?:delete|erase|purge)\b.{0,60}\b(?:data|records|files)\b|\bsend\b.{0,40}\b(?:emails?|notifications?)\b|nguy hiểm|bảo mật|xóa dữ liệu/i.test(text);
    const elevated = /\b(?:important|database|api)\b|quan trọng/i.test(text);
    const intrinsicRisk = critical ? 'R3' : elevated ? 'R2' : null;
    let risk = highestRisk(intrinsicRisk, floor) ?? fallback;
    for (const match of text.matchAll(/\bR\s*([0-4])\b/gi)) {
        risk = highestRisk(risk, parseRiskLevel(match[0]));
        if (risk === 'R4') return risk;
    }
    return risk;
}

/** Color mapping for risk severity indicators */
export function getRiskSeverityColor(riskLevel: RiskLevel): string {
    switch (riskLevel) {
        case 'R0': return 'gray-400';
        case 'R1': return 'green-500';
        case 'R2': return 'yellow-500';
        case 'R3': return 'red-500';
        case 'R4': return 'red-900';
    }
}

/**
 * R4 is blocked independently of the phase and operating mode.
 */
export function evaluateRiskGate(
    riskLevelInput: string | null | undefined,
    mode: 'simple' | 'governance' | 'full',
    phase?: string
): RiskGateResult {
    // Keep accepting the historical phase argument. R4 no longer has a phase exception.
    void phase;
    const riskLevel = normalizeRiskLevel(riskLevelInput);

    if (riskLevel === 'R4') {
        return {
            status: 'BLOCK',
            riskLevel,
            reason: 'Risk level R4 is blocked by policy.',
        };
    }

    if (mode === 'simple' && (riskLevel === 'R2' || riskLevel === 'R3')) {
        return {
            status: 'BLOCK',
            riskLevel,
            reason: 'R2+ requires governance/full mode.',
        };
    }

    if (riskLevel === 'R3') {
        return {
            status: 'NEEDS_APPROVAL',
            riskLevel,
            reason: 'R3 requires explicit human approval before execution.',
        };
    }

    return {
        status: 'ALLOW',
        riskLevel,
        reason: 'Allowed by policy.',
    };
}
