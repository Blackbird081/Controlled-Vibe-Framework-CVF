import { describe, expect, it } from "vitest";
import {
  validateClosureReport,
  validateDelegationContract,
  validateWriteScope,
  type DelegationContract,
} from "../src/delegation.contract";

const contract = (overrides: Partial<DelegationContract> = {}): DelegationContract => ({
  parentTaskId: "parent-001",
  workerAgentId: "worker-001",
  delegationId: "delegation-001",
  ownership: {
    ownedFiles: ["src/owned.ts", "docs/owned.md"],
    ownedModules: ["src/module"],
    forbiddenPaths: ["src/module/secrets", "docs/private.md"],
    writeScope: "modify-listed",
  },
  inheritedBoundaries: {
    riskCeiling: "R1",
    policyIds: ["policy-001"],
    sandboxTier: 1,
  },
  reportRequirement: {
    finalChangedFiles: "required",
    finalEvidenceReceipts: "required",
    interimCheckpoints: "optional",
  },
  blockedActions: [{ action: "delete-repo", reason: "destructive" }],
  ...overrides,
});

describe("DelegationContract", () => {
  it("validates a complete delegation contract", () => {
    expect(validateDelegationContract(contract()).valid).toBe(true);
  });

  it("allows writes to an explicitly owned file", () => {
    expect(validateWriteScope("src/owned.ts", contract()).allowed).toBe(true);
  });

  it("allows Windows-style paths after normalization", () => {
    expect(validateWriteScope("src\\owned.ts", contract()).allowed).toBe(true);
  });

  it("allows writes inside an owned module", () => {
    expect(validateWriteScope("src/module/component.ts", contract()).allowed).toBe(true);
  });

  it("rejects writes to forbidden paths", () => {
    expect(validateWriteScope("docs/private.md", contract()).allowed).toBe(false);
  });

  it("rejects writes inside forbidden directories", () => {
    expect(validateWriteScope("src/module/secrets/key.txt", contract()).allowed).toBe(false);
  });

  it("rejects writes outside owned files and modules", () => {
    expect(validateWriteScope("src/other.ts", contract()).allowed).toBe(false);
  });

  it("rejects empty paths", () => {
    expect(validateWriteScope(" ", contract()).reason).toBe("path is required");
  });

  it("passes closure when changed files and evidence receipts are present", () => {
    expect(
      validateClosureReport(contract(), ["src/owned.ts"], ["receipt-001"]).valid,
    ).toBe(true);
  });

  it("fails closure when changed files are empty", () => {
    expect(validateClosureReport(contract(), [], ["receipt-001"]).violations).toContain(
      "finalChangedFiles are required for delegation closure",
    );
  });

  it("fails closure when evidence receipts are empty", () => {
    expect(validateClosureReport(contract(), ["src/owned.ts"], []).violations).toContain(
      "finalEvidenceReceipts are required for delegation closure",
    );
  });

  it("reports out-of-scope changed files during closure", () => {
    const result = validateClosureReport(contract(), ["src/other.ts"], ["receipt"]);
    expect(result.valid).toBe(false);
  });

  it("reports forbidden changed files during closure", () => {
    const result = validateClosureReport(contract(), ["docs/private.md"], ["receipt"]);
    expect(result.violations[0]).toContain("forbidden");
  });

  it("returns multiple closure violations together", () => {
    const result = validateClosureReport(contract(), [], []);
    expect(result.violations).toHaveLength(2);
  });

  it("accepts risk ceiling R0 and sandbox tier 0", () => {
    expect(
      validateDelegationContract(
        contract({ inheritedBoundaries: { riskCeiling: "R0", policyIds: [], sandboxTier: 0 } }),
      ).valid,
    ).toBe(true);
  });

  it("accepts empty policyIds", () => {
    expect(
      validateDelegationContract(
        contract({ inheritedBoundaries: { riskCeiling: "R1", policyIds: [], sandboxTier: 1 } }),
      ).valid,
    ).toBe(true);
  });

  it("accepts append-only write scope", () => {
    expect(
      validateDelegationContract(
        contract({ ownership: { ...contract().ownership, writeScope: "append-only" } }),
      ).valid,
    ).toBe(true);
  });

  it("accepts create-only write scope", () => {
    expect(
      validateDelegationContract(
        contract({ ownership: { ...contract().ownership, writeScope: "create-only" } }),
      ).valid,
    ).toBe(true);
  });

  it("flags invalid write scope", () => {
    const subject = contract({
      ownership: {
        ...contract().ownership,
        writeScope: "replace-all" as DelegationContract["ownership"]["writeScope"],
      },
    });

    expect(validateDelegationContract(subject).violations).toContain(
      "ownership.writeScope is invalid",
    );
  });

  it("flags empty parentTaskId", () => {
    expect(validateDelegationContract(contract({ parentTaskId: "" })).valid).toBe(false);
  });

  it("flags empty workerAgentId", () => {
    expect(
      validateDelegationContract(contract({ workerAgentId: " " })).violations,
    ).toContain("workerAgentId must be non-empty");
  });

  it("flags empty delegationId", () => {
    expect(validateDelegationContract(contract({ delegationId: "" })).valid).toBe(false);
  });

  it("flags missing ownership", () => {
    const subject = contract() as Partial<DelegationContract>;
    delete subject.ownership;
    expect(validateDelegationContract(subject).violations).toContain("ownership is required");
  });

  it("flags missing inherited boundaries", () => {
    const subject = contract() as Partial<DelegationContract>;
    delete subject.inheritedBoundaries;
    expect(validateDelegationContract(subject).violations).toContain(
      "inheritedBoundaries is required",
    );
  });

  it("flags missing report requirement", () => {
    const subject = contract() as Partial<DelegationContract>;
    delete subject.reportRequirement;
    expect(validateDelegationContract(subject).violations).toContain(
      "reportRequirement is required",
    );
  });

  it("flags invalid risk ceiling", () => {
    const result = validateDelegationContract(
      contract({
        inheritedBoundaries: {
          riskCeiling: "R9" as DelegationContract["inheritedBoundaries"]["riskCeiling"],
          policyIds: [],
          sandboxTier: 0,
        },
      }),
    );

    expect(result.violations).toContain("inheritedBoundaries.riskCeiling is invalid");
  });

  it("flags negative sandbox tier", () => {
    const result = validateDelegationContract(
      contract({
        inheritedBoundaries: { riskCeiling: "R1", policyIds: [], sandboxTier: -1 },
      }),
    );

    expect(result.violations).toContain(
      "inheritedBoundaries.sandboxTier must be a non-negative integer",
    );
  });

  it("flags non-integer sandbox tier", () => {
    const result = validateDelegationContract(
      contract({
        inheritedBoundaries: { riskCeiling: "R1", policyIds: [], sandboxTier: 1.5 },
      }),
    );

    expect(result.valid).toBe(false);
  });

  it("flags forbidden files overlapping owned files", () => {
    const result = validateDelegationContract(
      contract({
        ownership: {
          ...contract().ownership,
          forbiddenPaths: ["src/owned.ts"],
        },
      }),
    );

    expect(result.valid).toBe(false);
  });

  it("allows forbidden directories inside owned modules as scoped exclusions", () => {
    const result = validateDelegationContract(
      contract({
        ownership: {
          ...contract().ownership,
          forbiddenPaths: ["src/module/private"],
        },
      }),
    );

    expect(result.valid).toBe(true);
  });

  it("allows blockedActions to document denied behavior", () => {
    expect(contract().blockedActions[0]).toEqual({
      action: "delete-repo",
      reason: "destructive",
    });
  });

  it("allows multiple changed files when each is in scope", () => {
    expect(
      validateClosureReport(
        contract(),
        ["src/owned.ts", "src/module/component.ts"],
        ["receipt"],
      ).valid,
    ).toBe(true);
  });

  it("keeps append-only as advisory in write-scope path validation", () => {
    const result = validateWriteScope(
      "src/owned.ts",
      contract({ ownership: { ...contract().ownership, writeScope: "append-only" } }),
    );

    expect(result.allowed).toBe(true);
  });
});
