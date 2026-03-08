import { beforeEach, describe, expect, it } from "vitest"
import { LifecycleEngine } from "../core/lifecycle.engine"
import { EventBus, type CVFEvent } from "../core/event-bus"
import { getCheckpoint, hasCheckpoint, _clearAllCheckpoints } from "../core/checkpoint.store"
import { getState, _clearAllStates } from "../core/state.store"
import { hasProposal, _clearAllProposals } from "../core/proposal.store"
import { getJournal, _clearJournal } from "../policy/execution.journal"
import { registerPolicy } from "../policy/policy.registry"
import type { PolicyRule } from "../types/index"

let testCounter = 0
function uniqueVersion() {
  return `checkpoint-test-v${++testCounter}-${Date.now()}`
}

describe("CVF v1.7.1 checkpoint/resume conformance", () => {
  let engine: LifecycleEngine
  let bus: EventBus
  let events: CVFEvent[]

  beforeEach(() => {
    _clearAllCheckpoints()
    _clearAllStates()
    _clearAllProposals()
    _clearJournal()

    bus = new EventBus()
    events = []
    bus.onAll((event) => events.push(event))
    engine = new LifecycleEngine({ eventBus: bus })
  })

  function registerApproveAll(version: string) {
    const rules: PolicyRule[] = [
      { id: "approve-all", description: "approve all proposals", evaluate: () => "approved" },
    ]
    registerPolicy(version, rules)
  }

  it("creates a validated checkpoint without executing the proposal", async () => {
    const version = uniqueVersion()
    registerApproveAll(version)

    const checkpoint = await engine.createCheckpoint({
      id: `cp-1-${version}`,
      payload: { action: "deploy" },
      policyVersion: version,
    })

    expect(checkpoint.state).toBe("validated")
    expect(hasCheckpoint(checkpoint.proposalId)).toBe(true)
    expect(hasProposal(checkpoint.proposalId)).toBe(true)
    expect(getState(checkpoint.proposalId)).toBe("validated")
    expect(getJournal()).toHaveLength(0)
    expect(events.map((event) => event.type)).toContain("proposal:submitted")
    expect(events.map((event) => event.type)).not.toContain("proposal:executed")
  })

  it("resumes a validated checkpoint and records execution", async () => {
    const version = uniqueVersion()
    registerApproveAll(version)

    const checkpoint = await engine.createCheckpoint({
      id: `cp-2-${version}`,
      payload: { estimatedCost: 25 },
      policyVersion: version,
    })

    const result = await engine.resumeFromCheckpoint(checkpoint.proposalId)

    expect(result.status).toBe("approved")
    expect(result.state).toBe("approved")
    expect(getCheckpoint(checkpoint.proposalId).state).toBe("validated")
    expect(getJournal()).toHaveLength(1)
    expect(events.map((event) => event.type)).toContain("proposal:decided")
    expect(events.map((event) => event.type)).toContain("proposal:executed")
  })

  it("fails closed when resuming a missing checkpoint", async () => {
    await expect(engine.resumeFromCheckpoint("missing-checkpoint")).rejects.toThrow("Checkpoint not found")
  })
})
