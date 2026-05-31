import { describe, expect, it } from "vitest";
import {
  evaluateLifecycleTransition,
  MEMORY_LIFECYCLE_POLICY_VERSION,
} from "../src/memory-lifecycle-policy";

describe("memory lifecycle policy phase 2a", () => {
  it("promotes working memory to episodic when a session ends", () => {
    expect(evaluateLifecycleTransition({
      currentState: "working",
      ageDays: 0,
      accessCount: 1,
      sessionEnded: true,
    })).toMatchObject({
      contractVersion: MEMORY_LIFECYCLE_POLICY_VERSION,
      from: "working",
      to: "episodic",
      canReinject: false,
      durablePersistenceCreated: false,
    });
  });

  it("requires reinforcement and audit confirmation before semantic promotion", () => {
    expect(evaluateLifecycleTransition({
      currentState: "episodic",
      ageDays: 3,
      accessCount: 3,
      reinforced: true,
      auditConfirmed: true,
    })).toMatchObject({
      to: "semantic",
      canReinject: true,
      durablePersistenceCreated: false,
    });
  });

  it("prioritizes forget and contradiction rules", () => {
    expect(evaluateLifecycleTransition({
      currentState: "semantic",
      ageDays: 1,
      accessCount: 9,
      containsSecret: true,
      contradicted: true,
    })).toMatchObject({
      to: "forgotten",
      reason: "forget_policy_takes_precedence",
      canReinject: false,
    });

    expect(evaluateLifecycleTransition({
      currentState: "semantic",
      ageDays: 1,
      accessCount: 9,
      contradicted: true,
    })).toMatchObject({
      to: "disputed",
      reason: "contradiction_requires_review",
      canReinject: false,
    });
  });
});
