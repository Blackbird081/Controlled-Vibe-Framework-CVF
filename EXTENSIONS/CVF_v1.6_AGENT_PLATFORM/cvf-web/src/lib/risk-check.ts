export type RiskLevel = 'R0' | 'R1' | 'R2' | 'R3' | 'R4';

export interface RiskGateResult {
    status: 'ALLOW' | 'BLOCK' | 'NEEDS_APPROVAL';
    riskLevel: RiskLevel;
    reason: string;
}

const RISK_LEVEL_ORDER: Record<RiskLevel, number> = {
    R0: 0,
    R1: 1,
    R2: 2,
    R3: 3,
    R4: 4,
};

export function normalizeRiskLevel(value?: string | null): RiskLevel {
    if (!value) return 'R1';
    const match = value.trim().toUpperCase().match(/R\s*([0-4])/);
    if (!match) return 'R1';
    return (`R${match[1]}`) as RiskLevel;
}

export function inferRiskLevelFromText(text: string): RiskLevel | null {
    if (!text) return null;
    const explicit = text.match(/risk\s*level\s*[:\-]?\s*R\s*([0-4])/i)
        || text.match(/risk\s*[:\-]?\s*R\s*([0-4])/i)
        || text.match(/\bR\s*([0-4])\b/i);
    if (!explicit) return null;
    return (`R${explicit[1]}`) as RiskLevel;
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
 * Phase-aware risk gate evaluation.
 * R4 always BLOCK unless phase is FREEZE (which can handle R4).
 */
export function evaluateRiskGate(
    riskLevelInput: string | null | undefined,
    mode: 'simple' | 'governance' | 'full',
    phase?: string
): RiskGateResult {
    const riskLevel = normalizeRiskLevel(riskLevelInput);

    if (riskLevel === 'R4') {
        // Only Phase FREEZE can handle R4
        if (phase === 'FREEZE') {
            return {
                status: 'NEEDS_APPROVAL',
                riskLevel,
                reason: 'R4 in FREEZE phase requires executive approval.',
            };
        }
        return {
            status: 'BLOCK',
            riskLevel,
            reason: 'Risk level R4 is blocked by policy.',
        };
    }

    if (mode === 'simple' && RISK_LEVEL_ORDER[riskLevel] >= RISK_LEVEL_ORDER.R2) {
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
