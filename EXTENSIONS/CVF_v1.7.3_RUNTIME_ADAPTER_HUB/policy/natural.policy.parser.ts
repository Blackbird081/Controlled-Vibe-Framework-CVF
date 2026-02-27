// policy/natural.policy.parser.ts
// CVF v1.7.3 — Natural Language Policy Parser
// Converts natural language policy statements into structured rules
// Fixed: priority-based keyword matching prevents conflicting rules

export interface ParsedPolicyRule {
    resource: string
    action: string
    decision: 'allow' | 'deny' | 'review' | 'sandbox'
    confidence: number
    originalLine: string
}

/**
 * Priority order for decisions (higher priority wins).
 * "deny" beats "review" beats "sandbox" beats "allow".
 */
const DECISION_PRIORITY: Record<string, number> = {
    deny: 4,
    review: 3,
    sandbox: 2,
    allow: 1,
}

/**
 * Keyword patterns for intent detection.
 * Each pattern produces a (resource, action) pair.
 */
const INTENT_PATTERNS: Array<{
    pattern: RegExp
    resource: string
    action: string
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
    ]

export class NaturalPolicyParser {

    /**
     * Parse multi-line natural language into structured policy rules.
     * Each non-empty line produces at most one rule (highest-priority decision wins).
     */
    parse(input: string): ParsedPolicyRule[] {
        const rules: ParsedPolicyRule[] = []
        const lines = input.split('\n').map(l => l.trim()).filter(Boolean)

        for (const line of lines) {
            const rule = this.parseLine(line)
            if (rule) {
                rules.push(rule)
            }
        }

        return rules
    }

    private parseLine(line: string): ParsedPolicyRule | null {
        const lower = line.toLowerCase()

        // 1. Find the highest-priority decision keyword
        const decision = this.extractDecision(lower)
        if (!decision) return null

        // 2. Find the best-matching intent
        const intent = this.extractIntent(lower)

        return {
            resource: intent?.resource ?? 'unknown',
            action: intent?.action ?? 'unknown',
            decision,
            confidence: intent ? 0.8 : 0.3,
            originalLine: line,
        }
    }

    /**
     * Extract decision using priority — if a line says "deny all except allow reading",
     * the highest-priority decision (deny) wins.
     */
    private extractDecision(lower: string): 'allow' | 'deny' | 'review' | 'sandbox' | null {
        const decisions = ['allow', 'deny', 'review', 'sandbox'] as const
        let best: (typeof decisions)[number] | null = null
        let bestPriority = 0

        for (const d of decisions) {
            if (lower.includes(d) || this.matchVietnamese(lower, d)) {
                const priority = DECISION_PRIORITY[d]
                if (priority > bestPriority) {
                    best = d
                    bestPriority = priority
                }
            }
        }

        return best
    }

    private matchVietnamese(text: string, decision: string): boolean {
        const viMap: Record<string, string[]> = {
            allow: ['cho phép', 'được phép', 'chấp nhận'],
            deny: ['từ chối', 'không cho', 'cấm', 'chặn'],
            review: ['xem xét', 'kiểm tra', 'duyệt'],
            sandbox: ['sandbox', 'thử nghiệm', 'cách ly'],
        }
        return viMap[decision]?.some(v => text.includes(v)) ?? false
    }

    private extractIntent(lower: string): { resource: string; action: string } | null {
        for (const p of INTENT_PATTERNS) {
            if (p.pattern.test(lower)) {
                return { resource: p.resource, action: p.action }
            }
        }
        return null
    }
}
