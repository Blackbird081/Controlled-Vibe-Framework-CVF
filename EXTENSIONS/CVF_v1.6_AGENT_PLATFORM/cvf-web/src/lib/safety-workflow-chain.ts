/**
 * CVF SAF1 Safety Workflow Chain — server-safe severity-classified screening.
 *
 * This helper is the ERH-SAF1 runtime outcome. It replaces the 4-pattern
 * safety.ts screen on the /api/execute path with an 11-pattern
 * severity-classified engine (CRITICAL/HIGH/MEDIUM) that:
 *   - blocks CRITICAL and BLOCK-action patterns before provider execution;
 *   - strips HIGH STRIP-action patterns from the prompt;
 *   - logs MEDIUM LOG-action patterns for audit/readout;
 *   - emits an audit payload with severity, action, and pattern labels
 *     without storing raw prompt text.
 *
 * Claim boundary: deterministic regex only — no ML, no classifier, no
 * "advanced jailbreak detection" claim. Does not guarantee comprehensive
 * adversarial coverage.
 *
 * ERH_SAF1_MARKER: SAFETY_WORKFLOW_CHAIN_ACTIVE
 */

export type SafetyThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';
export type SafetyThreatAction = 'BLOCK' | 'STRIP' | 'LOG';

export interface SafetyThreat {
    pattern: string;
    severity: SafetyThreatSeverity;
    action: SafetyThreatAction;
}

export interface SafetyWorkflowResult {
    blocked: boolean;
    sanitized: string;
    threats: SafetyThreat[];
    highestSeverity: SafetyThreatSeverity | null;
    auditPayload: {
        blocked: boolean;
        threatCount: number;
        highestSeverity: SafetyThreatSeverity | null;
        patterns: string[];
        actions: string[];
    };
}

interface PatternDef {
    regex: RegExp;
    severity: SafetyThreatSeverity;
    action: SafetyThreatAction;
    label: string;
}

// Severity-classified deterministic patterns — server-safe (no 'use client').
// Source: derived from safety-status.ts INJECTION_PATTERNS (lines 115-135)
// with server-safe extraction as authorized by ERH-SAF1 work order.
const SAF1_PATTERNS: PatternDef[] = [
    // CRITICAL — governance override: always block before provider execution
    { regex: /disable\s+governance/gi, severity: 'CRITICAL', action: 'BLOCK', label: 'governance-disable' },
    { regex: /override\s+policy/gi, severity: 'CRITICAL', action: 'BLOCK', label: 'policy-override' },
    { regex: /bypass\s+(security|governance|policy)/gi, severity: 'CRITICAL', action: 'BLOCK', label: 'bypass-attempt' },
    { regex: /act\s+as\s+(un)?restricted/gi, severity: 'CRITICAL', action: 'BLOCK', label: 'unrestricted-mode' },
    { regex: /ignore\s+(all\s+)?previous\s+instruction/gi, severity: 'CRITICAL', action: 'BLOCK', label: 'instruction-override' },
    // HIGH — system behavior change: block or strip
    { regex: /set\s+risk\s*(score|level)?\s*to\s*0/gi, severity: 'HIGH', action: 'BLOCK', label: 'risk-manipulation' },
    { regex: /change\s+role\s+to/gi, severity: 'HIGH', action: 'STRIP', label: 'role-injection' },
    { regex: /system\s*:\s*/gi, severity: 'HIGH', action: 'STRIP', label: 'system-prompt-injection' },
    // MEDIUM — suspicious: strip or log
    { regex: /forget\s+(everything|all|context)/gi, severity: 'MEDIUM', action: 'STRIP', label: 'context-wipe' },
    { regex: /you\s+are\s+now/gi, severity: 'MEDIUM', action: 'LOG', label: 'identity-override' },
    { regex: /pretend\s+(to\s+be|you\s+are)/gi, severity: 'MEDIUM', action: 'LOG', label: 'persona-injection' },
];

const SEVERITY_RANK: Record<SafetyThreatSeverity, number> = {
    CRITICAL: 3,
    HIGH: 2,
    MEDIUM: 1,
};

function higherSeverity(
    a: SafetyThreatSeverity | null,
    b: SafetyThreatSeverity,
): SafetyThreatSeverity {
    if (a === null) return b;
    return SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a;
}

/**
 * Run the SAF1 severity-classified safety screening on the given text.
 * Returns a structured result; never includes raw prompt text in auditPayload.
 */
export function runSafetyWorkflowChain(text: string): SafetyWorkflowResult {
    const threats: SafetyThreat[] = [];
    let sanitized = text;
    let blocked = false;
    let highestSeverity: SafetyThreatSeverity | null = null;

    for (const def of SAF1_PATTERNS) {
        if (def.regex.test(sanitized)) {
            threats.push({ pattern: def.label, severity: def.severity, action: def.action });
            highestSeverity = higherSeverity(highestSeverity, def.severity);

            if (def.action === 'BLOCK') {
                blocked = true;
            } else if (def.action === 'STRIP') {
                sanitized = sanitized.replace(def.regex, '[REDACTED]');
            }
            // LOG action: recorded in threats, no text mutation
        }
        // reset lastIndex for global regexes after test()
        def.regex.lastIndex = 0;
    }

    return {
        blocked,
        sanitized,
        threats,
        highestSeverity,
        auditPayload: {
            blocked,
            threatCount: threats.length,
            highestSeverity,
            patterns: threats.map(t => t.pattern),
            actions: [...new Set(threats.map(t => t.action))],
        },
    };
}
