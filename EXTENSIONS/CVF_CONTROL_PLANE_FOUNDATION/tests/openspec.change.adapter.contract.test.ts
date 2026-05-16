import { describe, expect, it } from "vitest";
import {
  OpenSpecChangeAdapterContract,
  createOpenSpecChangeAdapterContract,
  type OpenSpecChangePacketInput,
  type OpenSpecDeltaSpec,
} from "../src/openspec.change.adapter.contract";

const FIXED_NOW = "2026-05-16T11:00:00.000Z";

function makeContract(): OpenSpecChangeAdapterContract {
  return new OpenSpecChangeAdapterContract({ now: () => FIXED_NOW });
}

function makeDelta(overrides: Partial<OpenSpecDeltaSpec> = {}): OpenSpecDeltaSpec {
  return {
    kind: "ADDED",
    summary: "Add governed capability",
    riskImpact: "medium runtime expansion",
    policyImpact: "policy review required",
    approvalImpact: "human approval required",
    dlpImpact: "no sensitive payload",
    rollbackNote: "disable new path",
    evidenceRequired: "unit test and receipt",
    ...overrides,
  };
}

function makePacket(overrides: Partial<OpenSpecChangePacketInput> = {}): OpenSpecChangePacketInput {
  return {
    changeId: "chg-001",
    requestedBy: "codex",
    artifacts: [
      { kind: "proposal.md", path: "changes/chg-001/proposal.md", content: "proposal" },
      { kind: "design.md", path: "changes/chg-001/design.md", content: "design" },
      { kind: "tasks.md", path: "changes/chg-001/tasks.md", content: "tasks" },
    ],
    deltas: [makeDelta()],
    ...overrides,
  };
}

describe("OpenSpecChangeAdapterContract", () => {
  it("factory returns a contract instance", () => {
    expect(createOpenSpecChangeAdapterContract()).toBeInstanceOf(OpenSpecChangeAdapterContract);
  });

  it("maps proposal, design, and tasks into CVF phases without direct execution authority", () => {
    const packet = makeContract().adapt(makePacket());
    expect(packet.requiredCvfPhases).toEqual(["INTAKE", "DESIGN", "BUILD"]);
    expect(packet.mappings.every((mapping) => mapping.directExecutionAllowed === false)).toBe(true);
    expect(packet.decision).toBe("accepted_as_packet");
  });

  it("maps apply as a governed request, not direct authority", () => {
    const packet = makeContract().adapt(makePacket({
      artifacts: [{ kind: "apply", path: "changes/chg-001/apply", content: "apply" }],
    }));
    expect(packet.mappings[0].authority).toBe("governed_request");
    expect(packet.archiveSyncBoundary.receiptRequired).toBe(true);
    expect(packet.mappings[0].directExecutionAllowed).toBe(false);
  });

  it("blocks direct apply bypass attempts", () => {
    const packet = makeContract().adapt(makePacket({
      allowDirectApply: true,
      artifacts: [{ kind: "apply", path: "changes/chg-001/apply", content: "apply" }],
    }));
    expect(packet.decision).toBe("blocked_direct_authority");
    expect(packet.violations).toContain("OpenSpec apply cannot bypass CVF governed execution");
  });

  it("maps verify as REVIEW evidence input", () => {
    const packet = makeContract().adapt(makePacket({
      artifacts: [{ kind: "verify", path: "changes/chg-001/verify", content: "verify" }],
    }));
    expect(packet.requiredCvfPhases).toEqual(["REVIEW"]);
    expect(packet.mappings[0].authority).toBe("evidence_input");
  });

  it("maps archive as FREEZE archive candidate requiring receipt", () => {
    const packet = makeContract().adapt(makePacket({
      artifacts: [{ kind: "archive", path: "changes/chg-001/archive", content: "archive" }],
    }));
    expect(packet.requiredCvfPhases).toEqual(["FREEZE"]);
    expect(packet.archiveSyncBoundary.archiveCandidateOnly).toBe(true);
    expect(packet.archiveSyncBoundary.freezeRequired).toBe(true);
    expect(packet.archiveSyncBoundary.receiptRequired).toBe(true);
    expect(packet.decision).toBe("review_required");
  });

  it("blocks archive or sync canonical overwrite attempts", () => {
    const packet = makeContract().adapt(makePacket({
      allowCanonicalOverwrite: true,
      artifacts: [{ kind: "sync", path: "changes/chg-001/sync", content: "sync" }],
    }));
    expect(packet.decision).toBe("blocked_direct_authority");
    expect(packet.archiveSyncBoundary.canonicalOverwriteAllowed).toBe(false);
    expect(packet.violations).toContain("OpenSpec archive/sync cannot overwrite canonical CVF truth");
  });

  it("requires CVF governance extension fields on deltas", () => {
    const packet = makeContract().adapt(makePacket({
      deltas: [makeDelta({ riskImpact: "", approvalImpact: "" })],
    }));
    expect(packet.decision).toBe("review_required");
    expect(packet.deltaValidations[0].missingGovernanceFields).toEqual(["riskImpact", "approvalImpact"]);
  });

  it("validates RENAMED deltas require explicit from/to fields", () => {
    const packet = makeContract().adapt(makePacket({
      deltas: [makeDelta({ kind: "RENAMED", renamedFrom: "", renamedTo: "" })],
    }));
    expect(packet.deltaValidations[0].valid).toBe(false);
    expect(packet.deltaValidations[0].violations).toContain("RENAMED delta requires renamedFrom and renamedTo");
  });

  it("rejects RENAMED deltas that hide behavior changes", () => {
    const packet = makeContract().adapt(makePacket({
      deltas: [makeDelta({
        kind: "RENAMED",
        summary: "Rename path and change approval behavior",
        renamedFrom: "old",
        renamedTo: "new",
      })],
    }));
    expect(packet.deltaValidations[0].violations).toContain("RENAMED delta must not hide behavior changes");
  });

  it("requires explicit rollback or deprecation note for REMOVED deltas", () => {
    const packet = makeContract().adapt(makePacket({
      deltas: [makeDelta({ kind: "REMOVED", rollbackNote: "n/a" })],
    }));
    expect(packet.deltaValidations[0].violations).toContain("REMOVED delta requires explicit rollback or deprecation note");
  });

  it("collects evidence requirements from deltas", () => {
    const packet = makeContract().adapt(makePacket({
      deltas: [
        makeDelta({ evidenceRequired: "unit evidence" }),
        makeDelta({ kind: "MODIFIED", evidenceRequired: "approval receipt" }),
      ],
    }));
    expect(packet.evidenceRequired).toEqual(["unit evidence", "approval receipt"]);
  });

  it("is deterministic for same input and timestamp", () => {
    const first = makeContract().adapt(makePacket());
    const second = makeContract().adapt(makePacket());
    expect(first.packetId).toBe(second.packetId);
  });

  it("throws when packet identity is missing", () => {
    expect(() => makeContract().adapt(makePacket({ changeId: "" }))).toThrowError("changeId");
  });
});
