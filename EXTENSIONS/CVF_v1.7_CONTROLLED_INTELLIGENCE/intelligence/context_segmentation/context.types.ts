// context.types.ts
// Shared types cho context_segmentation layer

export interface ContextChunk {
    content: string
    timestamp: number
    role?: string
}

export interface PhaseSummary {
    role: string
    summary: string
    timestamp: number
}

export interface MemoryBoundary {
    forkId: string
    allowedScopes: string[]
}

export interface ForkedSession {
    forkId: string
    parentSessionId: string
    role: string
    createdAt: number
}
