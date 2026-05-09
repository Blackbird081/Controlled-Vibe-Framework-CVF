import { beforeEach, describe, expect, it } from "vitest"
import { LifecycleEngine } from "../core/lifecycle.engine"
import { EventBus, type CVFEvent } from "../core/event-bus"
import { getCheckpoint, _clearAllCheckpoints } from "../core/checkpoint.store"
import { _clearAllStates } from "../core/state.store"
import { _clearAllProposals } from "../core/proposal.store"
import { _clearJournal } from "../policy/execution.journal"
import { registerPolicy } from "../policy/policy.registry"
import type { PolicyRule } from "../types/index"

let testCounter = 0
function uniqueVersion() {
  return `session-resume-test-v${++testCounter}-${Date.now()}`
}

describe("CVF v1.7.1 session resume conformance", () => {
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

  it("resumes a checkpoint only when session and token match", async () => {
    const version = uniqueVersion()
    registerApproveAll(version)

    const checkpoint = await engine.createCheckpoint({
      id: `session-cp-1-${version}`,
      payload: { action: "deploy" },
      policyVersion: version,
      sessionId: "session-1",
    })

    const result = await engine.resumeSession({
      proposalId: checkpoint.proposalId,
      sessionId: "session-1",
      resumeToken: checkpoint.resumeToken,
    })

    expect(result.status).toBe("approved")
    expect(getCheckpoint(checkpoint.proposalId).resumeCount).toBe(1)
    expect(events.map((event) => event.type)).toContain("proposal:resumed")
  })

  it("fails closed when session id does not match the checkpoint", async () => {
    const version = uniqueVersion()
    registerApproveAll(version)

    const checkpoint = await engine.createCheckpoint({
      id: `session-cp-2-${version}`,
      payload: { action: "deploy" },
      policyVersion: version,
      sessionId: "session-expected",
    })

    await expect(
      engine.resumeSession({
        proposalId: checkpoint.proposalId,
        sessionId: "session-other",
        resumeToken: checkpoint.resumeToken,
      })
    ).rejects.toThrow("Resume session mismatch")
  })

  it("fails closed when resume token does not match the checkpoint", async () => {
    const version = uniqueVersion()
    registerApproveAll(version)

    const checkpoint = await engine.createCheckpoint({
      id: `session-cp-3-${version}`,
      payload: { action: "deploy" },
      policyVersion: version,
      sessionId: "session-3",
    })

    await expect(
      engine.resumeSession({
        proposalId: checkpoint.proposalId,
        sessionId: "session-3",
        resumeToken: `${checkpoint.resumeToken}-wrong`,
      })
    ).rejects.toThrow("Resume token mismatch")
  })
})
