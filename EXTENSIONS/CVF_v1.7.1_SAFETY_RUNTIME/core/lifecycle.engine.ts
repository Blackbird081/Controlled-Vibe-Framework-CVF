import type { LifecycleInput, ExecutionResult, PolicyDecision } from "../types/index"
import { executePolicy } from "../policy/policy.executor"
import { recordExecution } from "../policy/execution.journal"
import { getPolicy } from "../policy/policy.registry"
import { nextState } from "../policy/approval.state-machine"
import { saveProposal } from "./proposal.store"
import { setState, getState } from "./state.store"
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
      const policy = getPolicy(input.policyVersion)

      // 1️⃣ Save proposal immutable
      saveProposal({
        id: input.id,
        payload: input.payload,
        policyVersion: policy.version,
        policyHash: policy.hash,
        createdAt: Date.now(),
      })

      // 2️⃣ Initialize state
      setState(input.id, "proposed")

      // 🔔 Emit: proposal submitted
      this.eventBus?.emitTyped("proposal:submitted", {
        proposalId: input.id,
        source: "lifecycle",
        action: "submit",
      })

      // 3️⃣ Validate phase
      const validatedState = nextState("proposed", "pending")
      setState(input.id, validatedState)

      // 4️⃣ Execute policy
      const decision: PolicyDecision = executePolicy(input.payload, input.policyVersion)

      const newState = nextState(validatedState, decision)
      setState(input.id, newState)

      // 🔔 Emit: proposal decided
      this.eventBus?.emitTyped("proposal:decided", {
        proposalId: input.id,
        decision,
        policyVersion: policy.version,
      })

      // 5️⃣ Record journal (production only)
      if (!input.simulateOnly) {
        recordExecution(input.id, policy.version, policy.hash, decision)

        // 🔔 Emit: proposal executed
        this.eventBus?.emitTyped("proposal:executed", {
          proposalId: input.id,
          result: decision,
        })
      }

      return {
        status: decision,
        state: getState(input.id),
        policyHash: policy.hash,
      }
    })
  }
}
