import type {
  LifecycleInput,
  ExecutionResult,
  LifecycleCheckpoint,
  PolicyDecision,
  ResumeCheckpointInput,
} from "../types/index"
import { executePolicy } from "../policy/policy.executor"
import { recordExecution } from "../policy/execution.journal"
import { getPolicy } from "../policy/policy.registry"
import { nextState } from "../policy/approval.state-machine"
import { getProposal, saveProposal } from "./proposal.store"
import { setState, getState } from "./state.store"
import { getCheckpoint, saveCheckpoint } from "./checkpoint.store"
import { runWithinBoundary } from "./execution.boundary"
import type { EventBus } from "./event-bus"

export interface LifecycleEngineDeps {
  eventBus?: EventBus
}

export class LifecycleEngine {
  private eventBus?: EventBus

  constructor(deps?: LifecycleEngineDeps) {
    this.eventBus = deps?.eventBus
  }

  async submit(input: LifecycleInput): Promise<ExecutionResult> {
    return runWithinBoundary(async () => {
      const checkpoint = this.createCheckpointInternal(input, "submit")
      return this.resumeInternal({ proposalId: checkpoint.proposalId })
    })
  }

  async createCheckpoint(input: LifecycleInput): Promise<LifecycleCheckpoint> {
    return runWithinBoundary(async () => {
      return this.createCheckpointInternal(input, "checkpoint")
    })
  }

  async resumeFromCheckpoint(proposalId: string): Promise<ExecutionResult> {
    return runWithinBoundary(async () => {
      return this.resumeInternal({ proposalId })
    })
  }

  async resumeSession(input: ResumeCheckpointInput): Promise<ExecutionResult> {
    return runWithinBoundary(async () => {
      return this.resumeInternal(input)
    })
  }

  private createCheckpointInternal(
    input: LifecycleInput,
    action: "submit" | "checkpoint"
  ): LifecycleCheckpoint {
    const policy = getPolicy(input.policyVersion)

    saveProposal({
      id: input.id,
      payload: input.payload,
      policyVersion: policy.version,
      policyHash: policy.hash,
      createdAt: Date.now(),
    })

    setState(input.id, "proposed")

    this.eventBus?.emitTyped("proposal:submitted", {
      proposalId: input.id,
      source: "lifecycle",
      action,
    })

    const validatedState = nextState("proposed", "pending")
    setState(input.id, validatedState)

    const checkpoint: LifecycleCheckpoint = {
      proposalId: input.id,
      state: validatedState,
      policyVersion: policy.version,
      policyHash: policy.hash,
      simulateOnly: Boolean(input.simulateOnly),
      checkpointedAt: Date.now(),
      sessionId: input.sessionId,
      resumeToken: this.createResumeToken(input.id, policy.version),
      resumeCount: 0,
    }

    saveCheckpoint(checkpoint)
    return checkpoint
  }

  private resumeInternal(input: ResumeCheckpointInput): ExecutionResult {
    const checkpoint = getCheckpoint(input.proposalId)
    const proposal = getProposal(input.proposalId)
    const currentState = getState(input.proposalId)

    this.assertResumeAccess(checkpoint, input)

    if (currentState !== "validated") {
      throw new Error(`Cannot resume proposal from state=${currentState ?? "missing"}`)
    }

    const decision: PolicyDecision = executePolicy(proposal.payload, checkpoint.policyVersion)
    const newState = nextState(currentState, decision)
    setState(input.proposalId, newState)

    checkpoint.resumeCount += 1
    checkpoint.lastResumedAt = Date.now()
    saveCheckpoint(checkpoint)

    this.eventBus?.emitTyped("proposal:resumed", {
      proposalId: input.proposalId,
      sessionId: checkpoint.sessionId,
      resumeCount: checkpoint.resumeCount,
    })

    this.eventBus?.emitTyped("proposal:decided", {
      proposalId: input.proposalId,
      decision,
      policyVersion: checkpoint.policyVersion,
    })

    if (!checkpoint.simulateOnly) {
      recordExecution(
        input.proposalId,
        checkpoint.policyVersion,
        checkpoint.policyHash,
        decision,
        {
          sessionId: checkpoint.sessionId,
          checkpointedAt: checkpoint.checkpointedAt,
          lastResumedAt: checkpoint.lastResumedAt,
          resumeCount: checkpoint.resumeCount,
          resumeAuthorized: true,
        }
      )

      this.eventBus?.emitTyped("proposal:executed", {
        proposalId: input.proposalId,
        result: decision,
      })
    }

    return {
      status: decision,
      state: getState(input.proposalId),
      policyHash: checkpoint.policyHash,
    }
  }

  private assertResumeAccess(checkpoint: LifecycleCheckpoint, input: ResumeCheckpointInput) {
    if (input.resumeToken && input.resumeToken !== checkpoint.resumeToken) {
      throw new Error("Resume token mismatch")
    }

    if (checkpoint.sessionId && input.sessionId && input.sessionId !== checkpoint.sessionId) {
      throw new Error("Resume session mismatch")
    }
  }

  private createResumeToken(proposalId: string, policyVersion: string): string {
    return `${proposalId}:${policyVersion}:${Date.now()}`
  }
}
