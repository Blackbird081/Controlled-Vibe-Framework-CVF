// contracts/tool.adapter.interface.ts
// CVF v1.7.3 — Tool Adapter Contract
// Defines the interface for individual tool execution

export interface ToolExecutionContext {
    traceId?: string
    userId?: string
    metadata?: Record<string, unknown>
}

export interface ToolRequest {
    toolName: string
    action: string
    payload?: Record<string, unknown>
    context?: ToolExecutionContext
}

export interface ToolResult {
    success: boolean
    data?: unknown
    error?: string
    raw?: unknown
}

export interface ToolAdapter {

    /**
     * Unique adapter name
     */
    readonly name: string

    /**
     * List of supported tools
     */
    readonly tools: string[]

    /**
     * Execute a tool action
     */
    execute(request: ToolRequest): Promise<ToolResult>
}
