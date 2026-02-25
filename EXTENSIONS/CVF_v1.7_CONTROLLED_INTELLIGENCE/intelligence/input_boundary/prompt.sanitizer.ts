// prompt.sanitizer.ts
// Input boundary hardening — detect and neutralize prompt injection patterns.
// Runs BEFORE reasoning gate. Reasoning gate no longer receives raw input.

export interface SanitizationResult {
    sanitized: string
    blocked: boolean
    threats: ThreatDetection[]
}

export interface ThreatDetection {
    pattern: string
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    matchedText: string
    action: "STRIP" | "BLOCK" | "LOG"
}

// Injection patterns — ordered by severity
const INJECTION_PATTERNS: Array<{
    regex: RegExp
    severity: ThreatDetection["severity"]
    action: ThreatDetection["action"]
    label: string
}> = [
        // CRITICAL — attempt to override governance
        { regex: /disable\s+governance/gi, severity: "CRITICAL", action: "BLOCK", label: "governance-disable" },
        { regex: /override\s+policy/gi, severity: "CRITICAL", action: "BLOCK", label: "policy-override" },
        { regex: /bypass\s+(security|governance|policy)/gi, severity: "CRITICAL", action: "BLOCK", label: "bypass-attempt" },
        { regex: /act\s+as\s+(un)?restricted/gi, severity: "CRITICAL", action: "BLOCK", label: "unrestricted-mode" },
        { regex: /ignore\s+(all\s+)?previous\s+instruction/gi, severity: "CRITICAL", action: "BLOCK", label: "instruction-override" },

        // HIGH — attempt to change system behavior
        { regex: /set\s+risk\s*(score|level)?\s*to\s*0/gi, severity: "HIGH", action: "BLOCK", label: "risk-manipulation" },
        { regex: /change\s+role\s+to/gi, severity: "HIGH", action: "STRIP", label: "role-injection" },
        { regex: /system\s*:\s*/gi, severity: "HIGH", action: "STRIP", label: "system-prompt-injection" },

        // MEDIUM — suspicious patterns
        { regex: /forget\s+(everything|all|context)/gi, severity: "MEDIUM", action: "STRIP", label: "context-wipe" },
        { regex: /you\s+are\s+now/gi, severity: "MEDIUM", action: "LOG", label: "identity-override" },
        { regex: /pretend\s+(to\s+be|you\s+are)/gi, severity: "MEDIUM", action: "LOG", label: "persona-injection" },
    ]

/**
 * Sanitize input text — detect threats, strip or block as needed.
 * Returns sanitized text and list of detected threats.
 */
export function sanitizePrompt(input: string): SanitizationResult {
    const threats: ThreatDetection[] = []
    let sanitized = input
    let blocked = false

    for (const pattern of INJECTION_PATTERNS) {
        const matches = input.match(pattern.regex)
        if (matches) {
            for (const match of matches) {
                threats.push({
                    pattern: pattern.label,
                    severity: pattern.severity,
                    matchedText: match,
                    action: pattern.action
                })

                if (pattern.action === "BLOCK") {
                    blocked = true
                } else if (pattern.action === "STRIP") {
                    sanitized = sanitized.replace(pattern.regex, "[REDACTED]")
                }
            }
        }
    }

    return { sanitized, blocked, threats }
}

/**
 * Quick check — returns true if any CRITICAL or HIGH threat detected.
 */
export function isInputDangerous(input: string): boolean {
    const result = sanitizePrompt(input)
    return result.threats.some(t => t.severity === "CRITICAL" || t.severity === "HIGH")
}
