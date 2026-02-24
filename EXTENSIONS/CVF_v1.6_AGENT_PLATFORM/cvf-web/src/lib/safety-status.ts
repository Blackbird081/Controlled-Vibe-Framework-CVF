/**
 * CVF Safety Status — Core Safety Logic for Web UI
 * 
 * Ported from:
 *   - CVF_v1.7_CONTROLLED_INTELLIGENCE/core/governance/risk.mapping.ts
 *   - CVF_v1.7_CONTROLLED_INTELLIGENCE/core/governance/policy.engine.ts
 *   - CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/input_boundary/prompt.sanitizer.ts
 *   - CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/determinism_control/entropy.guard.ts
 *   - CVF_v1.7_CONTROLLED_INTELLIGENCE/telemetry/anomaly.detector.ts (simplified)
 *   - CVF_v1.7.1_SAFETY_RUNTIME/policy/risk.engine.ts
 * 
 * Self-contained — no external dependencies.
 */

'use client';

// ==================== TYPES ====================

export type SafetyRiskLevel = 'R0' | 'R1' | 'R2' | 'R3';
export type PolicyDecision = 'ALLOW' | 'ESCALATE' | 'BLOCK';
export type ThreatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SafetyStatus {
    riskLevel: SafetyRiskLevel;
    riskScore: number;
    label: { vi: string; en: string };
    emoji: string;
    decision: PolicyDecision;
    description: { vi: string; en: string };
}

export interface SanitizationResult {
    sanitized: string;
    blocked: boolean;
    threats: ThreatDetection[];
}

export interface ThreatDetection {
    pattern: string;
    severity: ThreatSeverity;
    matchedText: string;
    action: 'STRIP' | 'BLOCK' | 'LOG';
}

export interface EntropyAssessment {
    entropyScore: number;
    unstable: boolean;
    reason?: string;
}

export interface OutputSafetyResult {
    safe: boolean;
    riskLevel: SafetyRiskLevel;
    label: { vi: string; en: string };
    emoji: string;
    issues: string[];
}

// ==================== CONSTANTS ====================

const GOVERNANCE_ESCALATION_THRESHOLD = 0.7;
const GOVERNANCE_HARD_RISK_THRESHOLD = 0.9;

const CVF_RISK_SCORE_MAP: Record<SafetyRiskLevel, number> = {
    R0: 0.1,
    R1: 0.45,
    R2: 0.72,
    R3: 0.92,
};

const RISK_LABELS: Record<SafetyRiskLevel, { vi: string; en: string; emoji: string }> = {
    R0: { vi: 'An toàn', en: 'Safe', emoji: '🟢' },
    R1: { vi: 'Cần chú ý', en: 'Attention', emoji: '🟡' },
    R2: { vi: 'Cần duyệt', en: 'Review Required', emoji: '🟠' },
    R3: { vi: 'Nguy hiểm', en: 'Dangerous', emoji: '🔴' },
};

const RISK_DESCRIPTIONS: Record<SafetyRiskLevel, { vi: string; en: string }> = {
    R0: { vi: 'AI đang hoạt động bình thường, không cần can thiệp', en: 'AI operating normally, no intervention needed' },
    R1: { vi: 'Phát hiện patterns cần chú ý, theo dõi thêm', en: 'Patterns detected that need attention, monitoring' },
    R2: { vi: 'Rủi ro trung bình, cần người duyệt trước khi tiếp tục', en: 'Medium risk, requires human review before continuing' },
    R3: { vi: 'Rủi ro cao — AI đã bị chặn, cần sự phê duyệt', en: 'High risk — AI blocked, requires governance approval' },
};

// ==================== RISK MAPPING ====================
// From: CVF_v1.7_CONTROLLED_INTELLIGENCE/core/governance/risk.mapping.ts

export function riskLevelToScore(level: SafetyRiskLevel): number {
    return CVF_RISK_SCORE_MAP[level];
}

export function scoreToRiskLevel(score: number): SafetyRiskLevel {
    if (score >= 0.9) return 'R3';
    if (score >= 0.7) return 'R2';
    if (score >= 0.35) return 'R1';
    return 'R0';
}

// ==================== POLICY ENGINE ====================
// From: CVF_v1.7_CONTROLLED_INTELLIGENCE/core/governance/policy.engine.ts

export function evaluatePolicy(riskScore: number): { decision: PolicyDecision; reason?: string } {
    if (riskScore >= GOVERNANCE_HARD_RISK_THRESHOLD) {
        return { decision: 'BLOCK', reason: 'Risk exceeds hard threshold (≥ 0.9)' };
    }
    if (riskScore >= GOVERNANCE_ESCALATION_THRESHOLD) {
        return { decision: 'ESCALATE', reason: 'Risk requires escalation (≥ 0.7)' };
    }
    return { decision: 'ALLOW' };
}

// ==================== PROMPT SANITIZER ====================
// From: CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/input_boundary/prompt.sanitizer.ts

const INJECTION_PATTERNS: Array<{
    regex: RegExp;
    severity: ThreatSeverity;
    action: ThreatDetection['action'];
    label: string;
}> = [
        // CRITICAL — governance override
        { regex: /disable\s+governance/gi, severity: 'CRITICAL', action: 'BLOCK', label: 'governance-disable' },
        { regex: /override\s+policy/gi, severity: 'CRITICAL', action: 'BLOCK', label: 'policy-override' },
        { regex: /bypass\s+(security|governance|policy)/gi, severity: 'CRITICAL', action: 'BLOCK', label: 'bypass-attempt' },
        { regex: /act\s+as\s+(un)?restricted/gi, severity: 'CRITICAL', action: 'BLOCK', label: 'unrestricted-mode' },
        { regex: /ignore\s+(all\s+)?previous\s+instruction/gi, severity: 'CRITICAL', action: 'BLOCK', label: 'instruction-override' },
        // HIGH — system behavior change
        { regex: /set\s+risk\s*(score|level)?\s*to\s*0/gi, severity: 'HIGH', action: 'BLOCK', label: 'risk-manipulation' },
        { regex: /change\s+role\s+to/gi, severity: 'HIGH', action: 'STRIP', label: 'role-injection' },
        { regex: /system\s*:\s*/gi, severity: 'HIGH', action: 'STRIP', label: 'system-prompt-injection' },
        // MEDIUM — suspicious
        { regex: /forget\s+(everything|all|context)/gi, severity: 'MEDIUM', action: 'STRIP', label: 'context-wipe' },
        { regex: /you\s+are\s+now/gi, severity: 'MEDIUM', action: 'LOG', label: 'identity-override' },
        { regex: /pretend\s+(to\s+be|you\s+are)/gi, severity: 'MEDIUM', action: 'LOG', label: 'persona-injection' },
    ];

export function sanitizePrompt(input: string): SanitizationResult {
    const threats: ThreatDetection[] = [];
    let sanitized = input;
    let blocked = false;

    for (const pattern of INJECTION_PATTERNS) {
        const matches = input.match(pattern.regex);
        if (matches) {
            for (const match of matches) {
                threats.push({
                    pattern: pattern.label,
                    severity: pattern.severity,
                    matchedText: match,
                    action: pattern.action,
                });
                if (pattern.action === 'BLOCK') {
                    blocked = true;
                } else if (pattern.action === 'STRIP') {
                    sanitized = sanitized.replace(pattern.regex, '[REDACTED]');
                }
            }
        }
    }

    return { sanitized, blocked, threats };
}

export function isInputDangerous(input: string): boolean {
    const result = sanitizePrompt(input);
    return result.threats.some(t => t.severity === 'CRITICAL' || t.severity === 'HIGH');
}

// ==================== ENTROPY GUARD ====================
// From: CVF_v1.7_CONTROLLED_INTELLIGENCE/intelligence/determinism_control/entropy.guard.ts

function calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(p => (p - mean) ** 2);
    return squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
}

export function assessEntropy(options: {
    tokenProbabilities?: number[];
    tokenVariance?: number;
    threshold?: number;
}): EntropyAssessment {
    const threshold = options.threshold ?? 0.35;

    if (options.tokenProbabilities && options.tokenProbabilities.length > 0) {
        const variance = calculateVariance(options.tokenProbabilities);
        return {
            entropyScore: variance,
            unstable: variance > threshold,
            reason: variance > threshold
                ? `Entropy ${variance.toFixed(4)} exceeds threshold ${threshold}`
                : undefined,
        };
    }

    if (options.tokenVariance !== undefined) {
        return {
            entropyScore: options.tokenVariance,
            unstable: options.tokenVariance > threshold,
            reason: options.tokenVariance > threshold
                ? `Entropy ${options.tokenVariance.toFixed(4)} exceeds threshold ${threshold}`
                : undefined,
        };
    }

    return { entropyScore: 0, unstable: false };
}

/**
 * Simple text-based entropy check for browser use.
 * Detects repetitive or anomalous output patterns.
 */
export function checkOutputEntropy(output: string): EntropyAssessment {
    if (!output || output.length < 20) {
        return { entropyScore: 0, unstable: false };
    }

    const issues: string[] = [];
    let score = 0;

    // Check for excessive repetition
    const words = output.split(/\s+/);
    if (words.length > 10) {
        const uniqueRatio = new Set(words.map(w => w.toLowerCase())).size / words.length;
        if (uniqueRatio < 0.3) {
            score += 0.4;
            issues.push('Excessive word repetition');
        }
    }

    // Check for repeated phrases (3+ word sequences appearing 3+ times)
    for (let len = 3; len <= 6; len++) {
        const phrases = new Map<string, number>();
        for (let i = 0; i <= words.length - len; i++) {
            const phrase = words.slice(i, i + len).join(' ').toLowerCase();
            phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
        }
        const maxRepeat = Math.max(0, ...phrases.values());
        if (maxRepeat >= 3) {
            score += 0.2;
            issues.push(`Phrase repeated ${maxRepeat}x`);
        }
    }

    // Check for very long lines without breaks (possible data dump)
    const lines = output.split('\n');
    if (lines.some(l => l.length > 2000)) {
        score += 0.15;
        issues.push('Extremely long line detected');
    }

    const unstable = score > 0.35;
    return {
        entropyScore: Math.min(score, 1),
        unstable,
        reason: unstable ? issues.join('; ') : undefined,
    };
}

// ==================== OUTPUT ANOMALY DETECTION ====================
// Simplified from: CVF_v1.7_CONTROLLED_INTELLIGENCE/telemetry/anomaly.detector.ts
// Browser-compatible — analyzes output text instead of server metrics

const DANGEROUS_PATTERNS = [
    { regex: /\b(rm\s+-rf|del\s+\/[fqs]|format\s+[a-z]:)/gi, label: 'destructive-command' },
    { regex: /\b(DROP\s+TABLE|DELETE\s+FROM|TRUNCATE)/gi, label: 'sql-destructive' },
    { regex: /<script\b[^>]*>/gi, label: 'xss-injection' },
    { regex: /\beval\s*\(/gi, label: 'code-injection' },
    { regex: /\b(password|secret|api[_-]?key)\s*[:=]\s*['"][^'"]+['"]/gi, label: 'credential-leak' },
];

export function analyzeOutputSafety(output: string): OutputSafetyResult {
    const issues: string[] = [];

    // Pattern-based detection
    for (const p of DANGEROUS_PATTERNS) {
        if (p.regex.test(output)) {
            issues.push(p.label);
            p.regex.lastIndex = 0; // reset for next call
        }
    }

    // Entropy check
    const entropy = checkOutputEntropy(output);
    if (entropy.unstable) {
        issues.push('high-entropy');
    }

    // Determine risk level
    let riskLevel: SafetyRiskLevel;
    if (issues.some(i => ['credential-leak', 'xss-injection', 'code-injection'].includes(i))) {
        riskLevel = 'R3';
    } else if (issues.some(i => ['destructive-command', 'sql-destructive'].includes(i))) {
        riskLevel = 'R2';
    } else if (issues.length > 0) {
        riskLevel = 'R1';
    } else {
        riskLevel = 'R0';
    }

    const label = RISK_LABELS[riskLevel];
    return {
        safe: riskLevel === 'R0',
        riskLevel,
        label: { vi: label.vi, en: label.en },
        emoji: label.emoji,
        issues,
    };
}

// ==================== STATUS HELPERS ====================

export function getSafetyStatus(riskLevel: SafetyRiskLevel): SafetyStatus {
    const score = riskLevelToScore(riskLevel);
    const { decision } = evaluatePolicy(score);
    const label = RISK_LABELS[riskLevel];
    const desc = RISK_DESCRIPTIONS[riskLevel];

    return {
        riskLevel,
        riskScore: score,
        label: { vi: label.vi, en: label.en },
        emoji: label.emoji,
        decision,
        description: desc,
    };
}

export function getAllRiskLevels(): SafetyStatus[] {
    return (['R0', 'R1', 'R2', 'R3'] as SafetyRiskLevel[]).map(getSafetyStatus);
}

// Re-export constants for external use
export { RISK_LABELS, RISK_DESCRIPTIONS, GOVERNANCE_ESCALATION_THRESHOLD, GOVERNANCE_HARD_RISK_THRESHOLD };
