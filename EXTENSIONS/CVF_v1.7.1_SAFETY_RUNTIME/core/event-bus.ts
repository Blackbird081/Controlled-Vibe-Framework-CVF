/**
 * Event Bus — Decoupled observability and extensibility.
 *
 * Core engine emits events; listeners can observe without coupling.
 * Supports: proposal lifecycle, policy changes, AI usage, errors.
 */

// ─── Event Types ────────────────────────────────────────────

export interface CVFEvent {
  type: string
  timestamp: number
  data: unknown
}

export interface ProposalSubmittedEvent extends CVFEvent {
  type: "proposal:submitted"
  data: { proposalId: string; source: string; action: string }
}

export interface ProposalDecidedEvent extends CVFEvent {
  type: "proposal:decided"
  data: { proposalId: string; decision: string; policyVersion: string }
}

export interface ProposalExecutedEvent extends CVFEvent {
  type: "proposal:executed"
  data: { proposalId: string; result: string }
}

export interface PolicyRegisteredEvent extends CVFEvent {
  type: "policy:registered"
  data: { version: string; rulesCount: number; hash: string }
}

export interface AIUsageEvent extends CVFEvent {
  type: "ai:usage"
  data: { provider: string; tokens: number; costUsd: number }
}

export interface ErrorEvent extends CVFEvent {
  type: "error"
  data: { source: string; message: string; stack?: string }
}

export type CVFEventType =
  | ProposalSubmittedEvent
  | ProposalDecidedEvent
  | ProposalExecutedEvent
  | PolicyRegisteredEvent
  | AIUsageEvent
  | ErrorEvent

// ─── Event Bus Implementation ───────────────────────────────

type EventHandler = (event: CVFEvent) => void

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>()
  private allHandlers = new Set<EventHandler>()

  /** Subscribe to a specific event type */
  on(type: string, handler: EventHandler): void {
    let set = this.handlers.get(type)
    if (!set) {
      set = new Set()
      this.handlers.set(type, set)
    }
    set.add(handler)
  }

  /** Subscribe to ALL events (useful for logging/audit) */
  onAll(handler: EventHandler): void {
    this.allHandlers.add(handler)
  }

  /** Unsubscribe from a specific event type */
  off(type: string, handler: EventHandler): void {
    this.handlers.get(type)?.delete(handler)
  }

  /** Unsubscribe from ALL events */
  offAll(handler: EventHandler): void {
    this.allHandlers.delete(handler)
  }

  /** Emit an event to all matching listeners */
  emit(event: CVFEvent): void {
    // Type-specific handlers
    const typeHandlers = this.handlers.get(event.type)
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        try {
          handler(event)
        } catch (err) {
          console.error(`[EventBus] Handler error for ${event.type}:`, err)
        }
      }
    }

    // Wildcard handlers
    for (const handler of this.allHandlers) {
      try {
        handler(event)
      } catch (err) {
        console.error(`[EventBus] Wildcard handler error:`, err)
      }
    }
  }

  /** Helper: create and emit a typed event */
  emitTyped<T extends CVFEvent["type"]>(
    type: T,
    data: Extract<CVFEventType, { type: T }>["data"]
  ): void {
    this.emit({ type, timestamp: Date.now(), data })
  }

  /** Get listener count for a specific event type */
  listenerCount(type: string): number {
    return (this.handlers.get(type)?.size ?? 0) + this.allHandlers.size
  }

  /** Remove all listeners */
  clear(): void {
    this.handlers.clear()
    this.allHandlers.clear()
  }
}

// ─── Singleton ──────────────────────────────────────────────

export const eventBus = new EventBus()
