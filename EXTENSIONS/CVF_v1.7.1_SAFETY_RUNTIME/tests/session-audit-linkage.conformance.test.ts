import { beforeEach, describe, expect, it } from "vitest"
import { LifecycleEngine } from "../core/lifecycle.engine"
import { EventBus } from "../core/event-bus"
import { getCheckpoint, _clearAllCheckpoints } from "../core/checkpoint.store"
import { _clearAllStates } from "../core/state.store"
import { _clearAllProposals } from "../core/proposal.store"
import { getJournal, _clearJournal } from "../policy/execution.journal"
import { registerPolicy } from "../policy/policy.registry"
import type { PolicyRule } from "../types/index"

let testCounter = 0
function uniqueVersion() {
  return `session-audit-test-v${++testCounter}-${Date.now()}`
}

describe("CVF v1.7.1 session audit linkage conformance", () => {
  let engine: LifecycleEngine

  beforeEach(() => {
    _clearAllCheckpoints()
    _clearAllStates()
    _clearAllProposals()
    _clearJournal()
    engine = new LifecycleEngine({ eventBus: new EventBus() })
  })

  function registerApproveAll(version: string) {
    const rules: PolicyRule[] = [
      { id: "approve-all", description: "approve all proposals", evaluate: () => "approved" },
    ]
    registerPolicy(version, rules)
  }

  it("records checkpoint/session linkage into the execution journal after resume", async () => {
    const version = uniqueVersion()
    registerApproveAll(version)

    const checkpoint = await engine.createCheckpoint({
      id: `session-audit-1-${version}`,
      payload: { action: "deploy" },
      policyVersion: version,
      sessionId: "audit-session-1",
    })

    await engine.resumeSession({
      proposalId: checkpoint.proposalId,
      sessionId: "audit-session-1",
      resumeToken: checkpoint.resumeToken,
    })

    const entry = getJournal()[0]
    expect(entry.resumeContext).toEqual({
      sessionId: "audit-session-1",
      checkpointedAt: checkpoint.checkpointedAt,
      lastResumedAt: getCheckpoint(checkpoint.proposalId).lastResumedAt,
      resumeCount: 1,
      resumeAuthorized: true,
    })
  })

  it("preserves checkpoint resume metadata even when simulateOnly avoids journal writes", async () => {
    const version = uniqueVersion()
    registerApproveAll(version)

    const checkpoint = await engine.createCheckpoint({
      id: `session-audit-2-${version}`,
      payload: { action: "deploy" },
      policyVersion: version,
      sessionId: "audit-session-2",
      simulateOnly: true,
    })

    await engine.resumeSession({
      proposalId: checkpoint.proposalId,
      sessionId: "audit-session-2",
      resumeToken: checkpoint.resumeToken,
    })

    const resumed = getCheckpoint(checkpoint.proposalId)
    expect(resumed.resumeCount).toBe(1)
    expect(getJournal()).toHaveLength(0)
  })

  it("does not write audit linkage when resume authorization fails", async () => {
    const version = uniqueVersion()
    registerApproveAll(version)

    const checkpoint = await engine.createCheckpoint({
      id: `session-audit-3-${version}`,
      payload: { action: "deploy" },
      policyVersion: version,
      sessionId: "audit-session-3",
    })

    await expect(
      engine.resumeSession({
        proposalId: checkpoint.proposalId,
        sessionId: "wrong-session",
        resumeToken: checkpoint.resumeToken,
      })
    ).rejects.toThrow("Resume session mismatch")

    expect(getJournal()).toHaveLength(0)
  })
})
