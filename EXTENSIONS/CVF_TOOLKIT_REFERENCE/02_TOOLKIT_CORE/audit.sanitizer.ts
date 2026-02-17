// audit.sanitizer.ts
// CVF Toolkit Core — Audit Record Sanitizer
// Filters sensitive data before logging.

import { AUDIT_CONFIG } from "./cvf.config"

const REDACTED = "[REDACTED]"

export class AuditSanitizer {

    private sensitivePatterns: string[]

    constructor() {
        this.sensitivePatterns = [...AUDIT_CONFIG.sensitiveFields]
    }

    sanitize(details: Record<string, unknown>): Record<string, unknown> {
        if (!details || typeof details !== "object") return details
        return this.deepSanitize({ ...details })
    }

    private deepSanitize(obj: Record<string, unknown>): Record<string, unknown> {
        const result: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(obj)) {
            if (this.isSensitiveKey(key)) {
                result[key] = REDACTED
            } else if (value && typeof value === "object" && !Array.isArray(value)) {
                result[key] = this.deepSanitize(value as Record<string, unknown>)
            } else if (typeof value === "string" && this.containsSensitiveValue(value)) {
                result[key] = REDACTED
            } else {
                result[key] = value
            }
        }

        return result
    }

    private isSensitiveKey(key: string): boolean {
        const lower = key.toLowerCase()
        return this.sensitivePatterns.some(pattern =>
            lower.includes(pattern.toLowerCase())
        )
    }

    private containsSensitiveValue(value: string): boolean {
        // Detect API key patterns (sk-..., key-..., etc.)
        const keyPatterns = [
            /^sk-[a-zA-Z0-9]{20,}$/,
            /^key-[a-zA-Z0-9]{20,}$/,
            /^Bearer\s+.{20,}$/
        ]
        return keyPatterns.some(p => p.test(value))
    }

    addSensitivePattern(pattern: string): void {
        if (!this.sensitivePatterns.includes(pattern)) {
            this.sensitivePatterns.push(pattern)
        }
    }
}

export const auditSanitizer = new AuditSanitizer()
