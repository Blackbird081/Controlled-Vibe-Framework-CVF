/**
 * Zod Validation Schemas — Input validation at all boundaries.
 *
 * Every input entering the CVF system must pass through these schemas
 * before reaching core logic. Invalid payloads are rejected early.
 */

import { z } from "zod"

// ─── Proposal Schemas ───────────────────────────────────────

export const ProposalSourceSchema = z.enum(["openclaw", "structured", "api"])

export const RiskLevelSchema = z.enum(["low", "medium", "high"])

export const ProposalEnvelopeSchema = z.object({
    id: z.string().uuid(),
    source: ProposalSourceSchema,
    action: z.string().min(1).max(200),
    payload: z.record(z.string(), z.unknown()),
    createdAt: z.number().int().positive(),
    confidence: z.number().min(0).max(1),
    riskLevel: RiskLevelSchema,
})

export const CreateProposalRequestSchema = z.object({
    instruction: z.string().min(1).max(5000).trim(),
})

export const ExecuteProposalRequestSchema = z.object({
    proposalId: z.string().uuid(),
})

// ─── Lifecycle Schemas ──────────────────────────────────────

export const LifecycleInputSchema = z.object({
    id: z.string().uuid(),
    payload: z.record(z.string(), z.unknown()),
    policyVersion: z.string().min(1).max(50),
    simulateOnly: z.boolean().optional().default(false),
})

// ─── AI Settings Schemas ────────────────────────────────────

export const AISettingsSchema = z.object({
    provider: z.string().min(1).max(50),
    maxTokens: z.number().int().positive().max(128000).optional(),
    temperature: z.number().min(0).max(2).optional(),
})

export const AIGenerationRequestSchema = z.object({
    systemPrompt: z.string().max(10000).optional(),
    userPrompt: z.string().min(1).max(50000).trim(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().max(128000).optional(),
})

// ─── OpenClaw Message Schemas ───────────────────────────────

export const OpenClawMessageSchema = z.object({
    userId: z.string().min(1).max(100),
    message: z.string().min(1).max(10000).trim(),
    metadata: z.record(z.string(), z.unknown()).optional(),
})

// ─── Policy Schemas ─────────────────────────────────────────

export const PolicyDecisionSchema = z.enum(["approved", "rejected", "pending"])

export const RegisterPolicySchema = z.object({
    version: z.string().min(1).max(50).regex(/^v\d+(\.\d+)*$/, {
        message: "Version must match format: v1, v1.0, v1.2.3",
    }),
    rules: z.array(
        z.object({
            id: z.string().min(1).max(100),
            description: z.string().min(1).max(500),
        })
    ).min(1),
})

// ─── Budget Schemas ─────────────────────────────────────────

export const BudgetScopeSchema = z.enum([
    "EXECUTION",
    "USER_DAILY",
    "ORG_MONTHLY",
    "SESSION_LOOP",
])

export const BudgetCheckInputSchema = z.object({
    userId: z.string().min(1),
    estimatedCostUsd: z.number().nonnegative(),
    estimatedTokens: z.number().int().nonnegative(),
})

// ─── Auth Schemas ───────────────────────────────────────────

export const LoginRequestSchema = z.object({
    username: z.string().min(3).max(50).trim(),
    password: z.string().min(8).max(128),
})

export const TokenPayloadSchema = z.object({
    userId: z.string().min(1),
    role: z.enum(["admin", "operator", "viewer"]),
})

// ─── Validation Helper ──────────────────────────────────────

export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; errors: string[] }

export function validate<T>(
    schema: z.ZodType<T>,
    data: unknown
): ValidationResult<T> {
    const result = schema.safeParse(data)
    if (result.success) {
        return { success: true, data: result.data }
    }
    return {
        success: false,
        errors: result.error.issues.map(
            (e) => `${e.path.join(".")}: ${e.message}`
        ),
    }
}

