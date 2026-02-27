/**
 * Dependency Injection Container — Decouples modules for testing and flexibility.
 *
 * Core modules depend on interfaces, not implementations.
 * The container wires everything together at startup.
 */

import type {
  IProposalRepository,
  IExecutionJournalRepository,
  IPolicyRepository,
  ISnapshotRepository,
  IAuditRepository,
  IUsageRepository,
} from "../repositories/interfaces"

// ─── Service Interfaces ─────────────────────────────────────

export interface ILifecycleEngine {
  submit(input: unknown): Promise<unknown>
}

export interface IPolicyExecutor {
  execute(proposal: unknown, policyVersion: string): string
}

export interface IEventBus {
  emit(event: string, data: unknown): void
  on(event: string, handler: (data: unknown) => void): void
  off(event: string, handler: (data: unknown) => void): void
}

// ─── Container ──────────────────────────────────────────────

type Factory<T> = () => T

interface ServiceMap {
  proposalRepo: IProposalRepository
  journalRepo: IExecutionJournalRepository
  policyRepo: IPolicyRepository
  snapshotRepo: ISnapshotRepository
  auditRepo: IAuditRepository
  usageRepo: IUsageRepository
  lifecycleEngine: ILifecycleEngine
  policyExecutor: IPolicyExecutor
  eventBus: IEventBus
}

type ServiceKey = keyof ServiceMap

class DIContainer {
  private factories = new Map<string, Factory<unknown>>()
  private singletons = new Map<string, unknown>()

  /** Register a factory for a service (lazy instantiation) */
  register<K extends ServiceKey>(key: K, factory: Factory<ServiceMap[K]>): void {
    this.factories.set(key, factory)
    this.singletons.delete(key) // clear cached instance
  }

  /** Register a pre-created instance */
  registerInstance<K extends ServiceKey>(key: K, instance: ServiceMap[K]): void {
    this.singletons.set(key, instance)
  }

  /** Resolve a service — creates it on first call, then caches */
  resolve<K extends ServiceKey>(key: K): ServiceMap[K] {
    // Return cached singleton
    const existing = this.singletons.get(key)
    if (existing) return existing as ServiceMap[K]

    // Create from factory
    const factory = this.factories.get(key)
    if (!factory) {
      throw new Error(`Service not registered: ${key}`)
    }

    const instance = factory()
    this.singletons.set(key, instance)
    return instance as ServiceMap[K]
  }

  /** Check if a service is registered */
  has(key: ServiceKey): boolean {
    return this.factories.has(key) || this.singletons.has(key)
  }

  /** Reset container (useful for testing) */
  reset(): void {
    this.factories.clear()
    this.singletons.clear()
  }
}

// ─── Global Container Instance ──────────────────────────────

export const container = new DIContainer()

export { DIContainer }
