// {domain}.validation.rules.ts
// Template: Copy and rename for your domain
// Domain-specific output validation rules

import type { IValidationRule, ValidationResult } from "../../02_TOOLKIT_CORE/interfaces"

// Example validation rule
export class DomainOutputAccuracyRule implements IValidationRule {
    ruleId = "domain-output-accuracy"
    ruleName = "Domain Output Accuracy Check"
    domain = "your-domain"  // <-- CHANGE THIS
    severity: "error" | "warning" | "info" = "error"

    validate(output: unknown): ValidationResult {
        // Implement domain-specific validation logic
        const data = output as Record<string, unknown>

        if (!data || typeof data !== "object") {
            return {
                passed: false,
                ruleId: this.ruleId,
                message: "Output must be a valid object",
                severity: this.severity
            }
        }

        return {
            passed: true,
            ruleId: this.ruleId,
            message: "Domain output validation passed",
            severity: "info"
        }
    }
}

// Example disclaimer rule (for R3+ skills)
export class DomainDisclaimerRule implements IValidationRule {
    ruleId = "domain-disclaimer"
    ruleName = "Domain Disclaimer Check"
    domain = "your-domain"  // <-- CHANGE THIS
    severity: "error" | "warning" | "info" = "error"

    validate(output: unknown): ValidationResult {
        const data = output as Record<string, unknown>
        const hasDisclaimer = data?.disclaimer !== undefined

        return {
            passed: hasDisclaimer,
            ruleId: this.ruleId,
            message: hasDisclaimer
                ? "Disclaimer present"
                : "R3+ skills must include disclaimer in output",
            severity: this.severity
        }
    }
}

// Validation engine for this domain
export class DomainValidationEngine {
    private rules: IValidationRule[] = [
        new DomainOutputAccuracyRule(),
        new DomainDisclaimerRule()
    ]

    validate(output: unknown): ValidationResult[] {
        return this.rules.map(rule => rule.validate(output))
    }

    allPassed(output: unknown): boolean {
        return this.validate(output).every(r => r.passed)
    }
}

export const domainValidationEngine = new DomainValidationEngine()
