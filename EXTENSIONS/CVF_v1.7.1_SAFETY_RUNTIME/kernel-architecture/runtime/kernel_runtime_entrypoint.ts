import {
  ExecutionOrchestrator,
  ExecutionOrchestratorOptions,
  OrchestratorInput
} from "./execution_orchestrator"
import { LLMProvider } from "./llm_adapter"

export interface KernelRuntimeEntrypointOptions {
  llmProvider?: LLMProvider
  policyVersion?: string
  llmTimeoutMs?: number
}

/**
 * Mandatory runtime entrypoint.
 * All execution paths must call this gateway instead of constructing lower layers directly.
 */
export class KernelRuntimeEntrypoint {
  private orchestrator: ExecutionOrchestrator

  constructor(options: KernelRuntimeEntrypointOptions = {}) {
    const orchestratorOptions: ExecutionOrchestratorOptions = {
      llmProvider: options.llmProvider,
      policyVersion: options.policyVersion,
      llmTimeoutMs: options.llmTimeoutMs
    }
    this.orchestrator = ExecutionOrchestrator.create(orchestratorOptions)
  }

  async execute(input: OrchestratorInput) {
    return this.orchestrator.execute(input)
  }

  getTelemetry() {
    return this.orchestrator.getTelemetry()
  }

  getPolicyVersion(): string {
    return this.orchestrator.getPolicyVersion()
  }
}
