// contracts/policy.contract.ts
// CVF v1.7.3 — Policy Contract
// Aligned with v1.7.1 PolicyDecision vocabulary

/**
 * Policy decisions — aligned with v1.7.1 Safety Runtime.
 * "pending" is the safe default (matches v1.7.1's no-match behavior).
 */
export type PolicyDecision =
    | "allow"
    | "deny"
    | "review"
    | "sandbox"
    | "pending"

export interface PolicyContext {
    userId?: string
    role?: string
    environment?: string
    traceId?: string
    metadata?: Record<string, unknown>
}

export interface PolicyEvaluationRequest {
    action: string
    resource?: string
    input?: unknown
    context?: PolicyContext
}

export interface PolicyEvaluationResult {
    decision: PolicyDecision
    reason?: string
    riskScore?: number
    metadata?: Record<string, unknown>
}

export interface PolicyContract {

    /**
     * Unique policy name
     */
    readonly name: string

    /**
     * Evaluate an action against this policy
     */
    evaluate(
        request: PolicyEvaluationRequest
    ): Promise<PolicyEvaluationResult>
}
