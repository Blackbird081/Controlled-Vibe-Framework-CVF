// contracts/memory.adapter.interface.ts
// CVF v1.7.3 — Memory Adapter Contract
// Defines the interface for memory/state persistence

export interface MemoryContext {
    namespace?: string
    userId?: string
    metadata?: Record<string, unknown>
}

export interface MemorySetRequest {
    key: string
    value: unknown
    ttl?: number
    context?: MemoryContext
}

export interface MemoryGetRequest {
    key: string
    context?: MemoryContext
}

export interface MemoryDeleteRequest {
    key: string
    context?: MemoryContext
}

export interface MemoryListRequest {
    prefix?: string
    context?: MemoryContext
}

export interface MemoryAdapter {

    /**
     * Unique adapter name
     */
    readonly name: string

    /**
     * Store a value
     */
    set(request: MemorySetRequest): Promise<void>

    /**
     * Retrieve a value
     */
    get<T = unknown>(request: MemoryGetRequest): Promise<T | null>

    /**
     * Delete a value
     */
    delete(request: MemoryDeleteRequest): Promise<void>

    /**
     * List keys by prefix (optional, may throw NotImplementedError)
     */
    list?(request: MemoryListRequest): Promise<string[]>
}
