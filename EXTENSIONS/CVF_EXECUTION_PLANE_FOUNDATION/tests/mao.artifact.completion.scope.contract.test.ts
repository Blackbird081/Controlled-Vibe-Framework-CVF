import { describe, expect, it } from "vitest";
import {
  evaluateArtifactCompletionScope,
  type MaoArtifactCompletionScopeInput,
} from "../src/mao/artifact.completion.scope.contract";

const baseInput = (): MaoArtifactCompletionScopeInput => ({
  dispatchId: "hyperframes-p0-dispatch",
  evaluatedAt: "2026-09-25T00:00:00.000Z",
  sourcePin: "7129340ae8e96fc32bb45102174528dd5ecafb56",
  assemblyVerifierId: "assembly-verifier",
  concurrencyCap: 2,
  declaredWorkItemIds: ["frame-1", "frame-2", "frame-3", "frame-4", "frame-5"],
  scheduledWorkItemIds: ["frame-1", "frame-2", "frame-3", "frame-4", "frame-5"],
  expectedArtifacts: [
    { workItemId: "frame-1", path: "frames/1.json", assignedWriterId: "worker-a" },
    { workItemId: "frame-2", path: "frames/2.json", assignedWriterId: "worker-b" },
    { workItemId: "frame-3", path: "frames/3.json", assignedWriterId: "worker-a" },
    { workItemId: "frame-4", path: "frames/4.json", assignedWriterId: "worker-b" },
    { workItemId: "frame-5", path: "frames/5.json", assignedWriterId: "worker-a" },
  ],
  observedArtifacts: [
    {
      path: "frames/1.json",
      contentHash: "hash-1",
      writerId: "worker-a",
      verifiedBy: "assembly-verifier",
    },
    {
      path: "frames/2.json",
      contentHash: "hash-2",
      writerId: "worker-b",
      verifiedBy: "assembly-verifier",
    },
    {
      path: "frames/3.json",
      contentHash: "hash-3",
      writerId: "worker-a",
      verifiedBy: "assembly-verifier",
    },
    {
      path: "frames/4.json",
      contentHash: "hash-4",
      writerId: "worker-b",
      verifiedBy: "assembly-verifier",
    },
    {
      path: "frames/5.json",
      contentHash: "hash-5",
      writerId: "worker-a",
      verifiedBy: "assembly-verifier",
    },
  ],
  workerNotifications: [
    { workItemId: "frame-1", workerId: "worker-a", status: "COMPLETE" },
  ],
});

describe("MAO artifact completion and scope preservation", () => {
  it("uses the concurrency cap only to batch the complete declared scope", () => {
    const result = evaluateArtifactCompletionScope(baseInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.batches).toEqual([
      ["frame-1", "frame-2"],
      ["frame-3", "frame-4"],
      ["frame-5"],
    ]);
    expect(result.receipt.scopePreserved).toBe(true);
  });

  it("rejects a scheduled scope that drops a declared work item", () => {
    const input = baseInput();
    const result = evaluateArtifactCompletionScope({
      ...input,
      scheduledWorkItemIds: input.scheduledWorkItemIds.slice(0, 4),
    });
    expect(result).toEqual({ ok: false, issues: ["SCHEDULED_SCOPE_MISMATCH"] });
  });

  it("rejects duplicate scheduling instead of treating it as batching", () => {
    const input = baseInput();
    const result = evaluateArtifactCompletionScope({
      ...input,
      scheduledWorkItemIds: ["frame-1", "frame-2", "frame-3", "frame-4", "frame-4"],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContain("DUPLICATE_SCHEDULED_WORK_ITEM");
    expect(result.issues).toContain("SCHEDULED_SCOPE_MISMATCH");
  });

  it("keeps child completion notifications non-authoritative", () => {
    const input = baseInput();
    const result = evaluateArtifactCompletionScope({
      ...input,
      observedArtifacts: [],
      workerNotifications: input.declaredWorkItemIds.map((workItemId) => ({
        workItemId,
        workerId: "worker-a",
        status: "COMPLETE" as const,
      })),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.status).toBe("INCOMPLETE");
    expect(result.receipt.notificationAuthority).toBe("NON_AUTHORITATIVE");
    expect(result.receipt.issues).toContain("MISSING_ARTIFACT");
  });

  it("does not complete when an expected artifact is absent", () => {
    const input = baseInput();
    const result = evaluateArtifactCompletionScope({
      ...input,
      observedArtifacts: input.observedArtifacts.slice(0, 4),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.status).toBe("INCOMPLETE");
    expect(result.receipt.verifiedArtifactCount).toBe(4);
  });

  it("rejects an artifact written outside its assigned write owner", () => {
    const input = baseInput();
    const result = evaluateArtifactCompletionScope({
      ...input,
      observedArtifacts: input.observedArtifacts.map((artifact, index) =>
        index === 0 ? { ...artifact, writerId: "worker-b" } : artifact,
      ),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.status).toBe("INCOMPLETE");
    expect(result.receipt.issues).toContain("WRITE_OWNER_MISMATCH");
  });

  it("requires verification by the named assembly verifier", () => {
    const input = baseInput();
    const result = evaluateArtifactCompletionScope({
      ...input,
      observedArtifacts: input.observedArtifacts.map((artifact, index) =>
        index === 0 ? { ...artifact, verifiedBy: "worker-a" } : artifact,
      ),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.status).toBe("INCOMPLETE");
    expect(result.receipt.issues).toContain("ASSEMBLY_VERIFIER_MISMATCH");
  });

  it("completes only when every expected artifact is hashed and verified", () => {
    const result = evaluateArtifactCompletionScope(baseInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.receipt.status).toBe("COMPLETE");
    expect(result.receipt.verifiedArtifactCount).toBe(5);
    expect(result.receipt.completionAuthority).toBe(
      "ARTIFACT_AND_ASSEMBLY_VERIFICATION",
    );
  });

  it("produces the same receipt for equivalent observed-artifact order", () => {
    const input = baseInput();
    const first = evaluateArtifactCompletionScope(input);
    const second = evaluateArtifactCompletionScope({
      ...input,
      observedArtifacts: [...input.observedArtifacts].reverse(),
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.receipt.receiptHash).toBe(second.receipt.receiptHash);
  });
});
