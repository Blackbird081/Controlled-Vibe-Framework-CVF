// contracts/runtime.adapter.interface.ts
// CVF v1.7.3 — Runtime Adapter Contract
// Defines the universal runtime interface (OpenClaw, PicoClaw, ZeroClaw, etc.)

export type RuntimeCapability =
    | "filesystem"
    | "http"
    | "email"
    | "database"
    | "shell"
    | "storage"
    | "custom"

export interface RuntimeContext {
    traceId?: string
    userId?: string
    metadata?: Record<string, unknown>
}

export interface RuntimeRequest {
    capability: RuntimeCapability
    action: string
    payload?: Record<string, unknown>
    context?: RuntimeContext
}

export interface RuntimeResult {
    success: boolean
    data?: unknown
    error?: string
    raw?: unknown
}

export interface RuntimeAdapter {

    /**
     * Unique adapter name (e.g., "openclaw", "picoclaw", "zeroclaw")
     */
    readonly name: string

    /**
     * List of supported capabilities
     */
    readonly capabilities: RuntimeCapability[]

    /**
     * Execute a runtime action within a capability domain
     */
    execute(request: RuntimeRequest): Promise<RuntimeResult>
}
