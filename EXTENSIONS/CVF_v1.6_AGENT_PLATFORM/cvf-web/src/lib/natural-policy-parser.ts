'use client';

/**
 * CVF v1.7.3 — Natural Language Policy Parser (ported for Web UI)
 * Converts natural language policy statements into structured rules.
 */

export interface ParsedPolicyRule {
    resource: string;
    action: string;
    decision: 'allow' | 'deny' | 'review' | 'sandbox';
    confidence: number;
    originalLine: string;
}

const DECISION_PRIORITY: Record<string, number> = {
    deny: 4,
    review: 3,
    sandbox: 2,
    allow: 1,
};

const INTENT_PATTERNS: Array<{
    pattern: RegExp;
    resource: string;
    action: string;
}> = [
        { pattern: /\b(file|tệp|tập tin)/i, resource: 'filesystem', action: 'access' },
        { pattern: /\b(delet|xóa|remov)/i, resource: 'filesystem', action: 'delete' },
        { pattern: /\b(writ|ghi|sửa|modif|edit)/i, resource: 'filesystem', action: 'write' },
        { pattern: /\b(read|đọc)/i, resource: 'filesystem', action: 'read' },
        { pattern: /\b(email|mail|thư)/i, resource: 'email', action: 'send' },
        { pattern: /\b(api|servic|dịch vụ)/i, resource: 'http', action: 'call' },
        { pattern: /\b(shell|command|lệnh|terminal)/i, resource: 'shell', action: 'execute' },
        { pattern: /\b(databas|db|dữ liệu)/i, resource: 'database', action: 'query' },
        { pattern: /\b(code|mã|script)/i, resource: 'shell', action: 'execute' },
    ];

const VI_DECISION_MAP: Record<string, string[]> = {
    allow: ['cho phép', 'được phép', 'chấp nhận'],
    deny: ['từ chối', 'không cho', 'cấm', 'chặn'],
    review: ['xem xét', 'kiểm tra', 'duyệt'],
    sandbox: ['sandbox', 'thử nghiệm', 'cách ly'],
};

function matchVietnamese(text: string, decision: string): boolean {
    return VI_DECISION_MAP[decision]?.some(v => text.includes(v)) ?? false;
}

function extractDecision(lower: string): 'allow' | 'deny' | 'review' | 'sandbox' | null {
    const decisions = ['allow', 'deny', 'review', 'sandbox'] as const;
    let best: (typeof decisions)[number] | null = null;
    let bestPriority = 0;

    for (const d of decisions) {
        if (lower.includes(d) || matchVietnamese(lower, d)) {
            const priority = DECISION_PRIORITY[d];
            if (priority > bestPriority) {
                best = d;
                bestPriority = priority;
            }
        }
    }
    return best;
}

function extractIntent(lower: string): { resource: string; action: string } | null {
    for (const p of INTENT_PATTERNS) {
        if (p.pattern.test(lower)) {
            return { resource: p.resource, action: p.action };
        }
    }
    return null;
}

/**
 * Parse multi-line natural language into structured policy rules.
 */
export function parseNaturalPolicy(input: string): ParsedPolicyRule[] {
    const rules: ParsedPolicyRule[] = [];
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
        const lower = line.toLowerCase();
        const decision = extractDecision(lower);
        if (!decision) continue;

        const intent = extractIntent(lower);
        rules.push({
            resource: intent?.resource ?? 'unknown',
            action: intent?.action ?? 'unknown',
            decision,
            confidence: intent ? 0.8 : 0.3,
            originalLine: line,
        });
    }

    return rules;
}

/**
 * Get decision badge color for UI rendering.
 */
export function getDecisionColor(decision: string): string {
    switch (decision) {
        case 'allow': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'deny': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
        case 'review': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
        case 'sandbox': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
}
