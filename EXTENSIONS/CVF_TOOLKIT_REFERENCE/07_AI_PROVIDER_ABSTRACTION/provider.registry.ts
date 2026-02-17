// provider.registry.ts
// CVF Toolkit — Runtime Provider Registry & Model Approval Validation
// Validates models against approved list before invocation.

import { auditLogger } from "../02_TOOLKIT_CORE/audit.logger"
import { ProviderError } from "../02_TOOLKIT_CORE/errors"
import type { AIProvider, AIRequest, AIResponse } from "../02_TOOLKIT_CORE/interfaces"
import { PROVIDER_CONFIG } from "../02_TOOLKIT_CORE/cvf.config"

// --- Approved Models (from model.approval.list.md) ---

const APPROVED_MODELS: ReadonlyMap<string, readonly string[]> = new Map([
    ["openai", ["gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-3.5-turbo"]],
    ["claude", ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"]],
    ["gemini", ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash"]]
])

// --- Provider Registry ---

class ProviderRegistry {

    private providers: Map<string, AIProvider> = new Map()
    private healthStatus: Map<string, { healthy: boolean; lastCheck: string }> = new Map()

    register(provider: AIProvider): void {
        if (this.providers.has(provider.name)) {
            throw new ProviderError(`Provider '${provider.name}' already registered`)
        }
        this.providers.set(provider.name, provider)
    }

    get(name: string): AIProvider {
        const provider = this.providers.get(name)
        if (!provider) {
            throw new ProviderError(`Provider '${name}' not registered`)
        }
        return provider
    }

    list(): string[] {
        return Array.from(this.providers.keys())
    }

    isModelApproved(providerName: string, model: string): boolean {
        const approved = APPROVED_MODELS.get(providerName)
        if (!approved) return false
        return approved.includes(model)
    }

    validateModel(providerName: string, model: string): void {
        if (!this.isModelApproved(providerName, model)) {
            throw new ProviderError(
                `Model '${model}' is not approved for provider '${providerName}'. ` +
                `Check model.approval.list.md.`
            )
        }
    }

    async invoke(
        providerName: string,
        request: AIRequest
    ): Promise<AIResponse> {
        // Validate model approval
        this.validateModel(providerName, request.model)

        const provider = this.get(providerName)
        const startTime = Date.now()

        try {
            const response = await provider.invoke(request)
            const latencyMs = Date.now() - startTime

            auditLogger.log({
                eventType: "PROVIDER_CALL",
                details: {
                    provider: providerName,
                    model: request.model,
                    tokensUsed: response.usage?.totalTokens,
                    latencyMs,
                    success: true
                }
            })

            return response
        } catch (error) {
            const latencyMs = Date.now() - startTime

            auditLogger.log({
                eventType: "PROVIDER_CALL",
                details: {
                    provider: providerName,
                    model: request.model,
                    latencyMs,
                    success: false,
                    error: (error as Error).message
                }
            })

            throw new ProviderError(
                `Provider '${providerName}' invocation failed: ${(error as Error).message}`
            )
        }
    }

    async healthCheck(providerName: string): Promise<boolean> {
        const provider = this.get(providerName)

        if (!provider.healthCheck) {
            return true // No health check defined = assumed healthy
        }

        try {
            const healthy = await provider.healthCheck()
            this.healthStatus.set(providerName, {
                healthy,
                lastCheck: new Date().toISOString()
            })
            return healthy
        } catch {
            this.healthStatus.set(providerName, {
                healthy: false,
                lastCheck: new Date().toISOString()
            })
            return false
        }
    }

    async healthCheckAll(): Promise<Record<string, boolean>> {
        const results: Record<string, boolean> = {}
        for (const name of this.providers.keys()) {
            results[name] = await this.healthCheck(name)
        }
        return results
    }

    getHealthStatus(): ReadonlyMap<string, { healthy: boolean; lastCheck: string }> {
        return this.healthStatus
    }

    async invokeWithFallback(
        primaryProvider: string,
        fallbackProvider: string,
        request: AIRequest
    ): Promise<AIResponse> {
        try {
            return await this.invoke(primaryProvider, request)
        } catch {
            auditLogger.log({
                eventType: "PROVIDER_CALL",
                details: {
                    action: "fallback_triggered",
                    from: primaryProvider,
                    to: fallbackProvider,
                    model: request.model
                }
            })
            return await this.invoke(fallbackProvider, request)
        }
    }
}

export const providerRegistry = new ProviderRegistry()
