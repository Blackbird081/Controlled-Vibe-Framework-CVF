// context.segmenter.ts
// Main entry point for context_segmentation layer.
// Wraps pruner, fork, summary injection into a single controlled interface.

import { ContextChunk, PhaseSummary, ForkedSession } from "./context.types"
import { pruneContext } from "./context.pruner"
import { injectSummary } from "./summary.injector"
import { createFork } from "./session.fork"
import { canAccessScope } from "./memory.boundary"

export interface SegmentedContext {
    prunedChunks: ContextChunk[]
    activeSummaries: PhaseSummary[]
    currentFork?: ForkedSession
}

/**
 * Main controller: prune chunks + inject latest summary into a clean context.
 */
export function segmentContext(
    sessionId: string,
    role: string,
    chunks: ContextChunk[],
    summaries: PhaseSummary[],
    newSummary?: PhaseSummary,
    maxChunks = 20,
    maxSummaries = 10
): SegmentedContext {
    const prunedChunks = pruneContext(chunks, maxChunks)

    const activeSummaries = newSummary
        ? injectSummary(summaries, newSummary, maxSummaries)
        : summaries

    const currentFork = createFork(sessionId, role)

    return {
        prunedChunks,
        activeSummaries,
        currentFork
    }
}

export { pruneContext, injectSummary, createFork, canAccessScope }
