/**
 * Execution Boundary — Error handling, logging, and recovery for lifecycle operations.
 *
 * Wraps async operations with structured error handling,
 * timing, and error context propagation.
 */

import { eventBus } from "./event-bus"

export interface BoundaryOptions {
  /** Identifier for the operation (used in error reporting) */
  operationId?: string
  /** Whether to suppress the error after logging (default: false) */
  suppressError?: boolean
}

export async function runWithinBoundary<T>(
  fn: () => Promise<T>,
  options?: BoundaryOptions
): Promise<T> {
  const startTime = Date.now()
  const opId = options?.operationId ?? "unknown"

  try {
    const result = await fn()
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    const elapsed = Date.now() - startTime

    // Emit error event for observability
    eventBus.emitTyped("error", {
      source: `execution-boundary:${opId}`,
      message: `Operation failed after ${elapsed}ms: ${message}`,
      stack,
    })

    if (options?.suppressError) {
      return undefined as T
    }

    throw err
  }
}