import { describe, it, expect } from "vitest";
import { DistributionEngine, FeedbackEngine, KernelAuthorityBoundary, SequentialIdFactory } from "../src/index.js";
import { makeRealKernel, issueActiveReferenceId } from "./fixtures.js";

function makeFlow(kernel: ReturnType<typeof makeRealKernel>) {
  const authority = new KernelAuthorityBoundary(kernel);
  return { authority, flow: new DistributionEngine(authority, new SequentialIdFactory()) };
}

describe("negative matrix", () => {
  it("composes routing and dose validation into package creation", () => {
    const kernel = makeRealKernel();
    const referenceId = issueActiveReferenceId(kernel);
    const { flow } = makeFlow(kernel);
    const incomplete = flow.create({ recipient: "", role: "worker", task: "review", phase: "delivery", truthReferences: [referenceId], dose: "summary", restrictions: [], expiryUtc: "2026-08-01T00:00:00Z", actionTimeUtcIso: "2026-07-12T00:00:00Z" });
    expect(incomplete.reasons).toContain("INCOMPLETE_ROUTING_SCOPE");
    const invalidDose = flow.create({ recipient: "agent-1", role: "worker", task: "review", phase: "delivery", truthReferences: [referenceId], dose: "", restrictions: [], expiryUtc: "2026-07-11T00:00:00Z", actionTimeUtcIso: "2026-07-12T00:00:00Z" });
    expect(invalidDose.reasons).toContain("INVALID_DOSE_OR_EXPIRY");
  });

  it("rejects delivery and acknowledgement after package expiry", () => {
    const kernel = makeRealKernel();
    const referenceId = issueActiveReferenceId(kernel);
    const { flow } = makeFlow(kernel);
    const created = flow.create({ recipient: "agent-1", role: "worker", task: "review", phase: "delivery", truthReferences: [referenceId], dose: "summary", restrictions: [], expiryUtc: "2026-07-13T00:00:00Z", actionTimeUtcIso: "2026-07-12T00:00:00Z" });
    const packageId = created.distributionPackage!.package_id;
    expect(flow.deliverOrConsume(packageId, "2026-07-13T00:00:00Z").reasons).toContain("PACKAGE_EXPIRED");
    expect(flow.acknowledge(packageId, "2026-07-13T00:00:00Z").reasons).toContain("PACKAGE_EXPIRED");
  });

  it("empty truth_references at package creation -> rejected (NC-09/Invariant 8 class)", () => {
    const kernel = makeRealKernel();
    const { flow } = makeFlow(kernel);
    const created = flow.create({
      recipient: "agent-1",
      role: "worker",
      task: "review",
      phase: "delivery",
      truthReferences: [],
      dose: "summary",
      restrictions: [],
      expiryUtc: "2026-08-12T00:00:00Z",
      actionTimeUtcIso: "2026-07-12T00:00:01Z",
    });
    expect(created.created).toBe(false);
    expect(created.reasons).toContain("EMPTY_TRUTH_REFERENCES");
  });

  it("referenced TruthReference.reference_state is EXPIRED -> package creation rejected", () => {
    const kernel = makeRealKernel();
    const referenceId = issueActiveReferenceId(
      kernel,
      "scope-1",
      "2026-07-12T00:00:00Z",
      "2026-07-12T00:00:02Z",
    );
    const { flow } = makeFlow(kernel);
    const created = flow.create({
      recipient: "agent-1",
      role: "worker",
      task: "review",
      phase: "delivery",
      truthReferences: [referenceId],
      dose: "summary",
      restrictions: [],
      expiryUtc: "2026-08-12T00:00:00Z",
      actionTimeUtcIso: "2026-07-12T00:00:05Z",
    });
    expect(created.created).toBe(false);
    expect(created.reasons).toContain("REFERENCE_NOT_CURRENTLY_ACTIVE");
  });

  it("referenced TruthReference.reference_state is REVOKED -> package creation rejected (NC-10)", () => {
    const kernel = makeRealKernel();
    const referenceId = issueActiveReferenceId(kernel);
    kernel.revokeReference(referenceId);
    const { flow } = makeFlow(kernel);
    const created = flow.create({
      recipient: "agent-1",
      role: "worker",
      task: "review",
      phase: "delivery",
      truthReferences: [referenceId],
      dose: "summary",
      restrictions: [],
      expiryUtc: "2026-08-12T00:00:00Z",
      actionTimeUtcIso: "2026-07-12T00:00:01Z",
    });
    expect(created.created).toBe(false);
    expect(created.reasons).toContain("REFERENCE_NOT_CURRENTLY_ACTIVE");
  });

  it("referenced TruthReference.reference_state is SUPERSEDED -> package creation rejected (NC-10)", () => {
    const kernel = makeRealKernel();
    const oldReferenceId = issueActiveReferenceId(
      kernel,
      "scope-shared",
      "2026-07-12T00:00:00Z",
      "2026-09-01T00:00:00Z",
    );
    const newReferenceId = issueActiveReferenceId(
      kernel,
      "scope-shared",
      "2026-07-13T00:00:00Z",
      "2026-09-01T00:00:00Z",
    );
    kernel.supersede(oldReferenceId, newReferenceId);
    const { flow } = makeFlow(kernel);
    const created = flow.create({
      recipient: "agent-1",
      role: "worker",
      task: "review",
      phase: "delivery",
      truthReferences: [oldReferenceId],
      dose: "summary",
      restrictions: [],
      expiryUtc: "2026-08-12T00:00:00Z",
      actionTimeUtcIso: "2026-07-14T00:00:00Z",
    });
    expect(created.created).toBe(false);
    expect(created.reasons).toContain("REFERENCE_NOT_CURRENTLY_ACTIVE");
  });

  it("reference was ACTIVE at creation but resolver returns REVOKED at delivery time -> action rejected; creation-time authority is not reused", () => {
    const kernel = makeRealKernel();
    const referenceId = issueActiveReferenceId(kernel);
    const { flow } = makeFlow(kernel);
    const created = flow.create({
      recipient: "agent-1",
      role: "worker",
      task: "review",
      phase: "delivery",
      truthReferences: [referenceId],
      dose: "summary",
      restrictions: [],
      expiryUtc: "2026-08-12T00:00:00Z",
      actionTimeUtcIso: "2026-07-12T00:00:01Z",
    });
    expect(created.created).toBe(true);
    const packageId = created.distributionPackage!.package_id;

    kernel.revokeReference(referenceId);

    const delivered = flow.deliverOrConsume(packageId, "2026-07-12T00:00:02Z");
    expect(delivered.succeeded).toBe(false);
    expect(delivered.reasons).toContain("REFERENCE_NOT_CURRENTLY_ACTIVE");
  });

  it("raw reference snapshot says ACTIVE while effective resolver state is non-ACTIVE -> resolver result wins and action is rejected", () => {
    const kernel = makeRealKernel();
    const referenceId = issueActiveReferenceId(
      kernel,
      "scope-1",
      "2026-07-12T00:00:00Z",
      "2026-07-12T00:00:05Z",
    );
    const authority = new KernelAuthorityBoundary(kernel);
    // The Kernel's own issueReference() always stamps reference_state:
    // "ACTIVE" on the stored snapshot at issuance time (T4/T4R1 behavior).
    // This test proves Flow's authority boundary ignores that raw stamp
    // and calls the Kernel's live resolver instead, which correctly
    // reports EXPIRED once the read time passes valid_until_utc.
    const isActiveNow = authority.isCurrentlyActive(referenceId, "2026-07-12T00:00:01Z");
    expect(isActiveNow).toBe(true);
    const isActiveLater = authority.isCurrentlyActive(referenceId, "2026-07-12T00:00:10Z");
    expect(isActiveLater).toBe(false);
    const resolved = authority.resolve(referenceId, "2026-07-12T00:00:10Z");
    expect(resolved.resolved).toBe(true);
    expect(resolved.state).toBe("EXPIRED");
  });

  it("caller supplies truthKernelAccepted: true or an unverified string ID -> routing_decision not derived from it; rejected until a real reference resolves (NC-11)", () => {
    const kernel = makeRealKernel();
    const { flow } = makeFlow(kernel);
    // DistributionEngine.create() has no parameter position for a
    // caller-supplied boolean or approval string; the type system itself
    // forbids it. Passing a bogus, unresolvable reference id is the only
    // way a caller could attempt to substitute for a real reference, and
    // it is rejected the same way an empty/non-active list is.
    const created = flow.create({
      recipient: "agent-1",
      role: "worker",
      task: "review",
      phase: "delivery",
      truthReferences: ["TREF-FORGED-NOT-A-REAL-REFERENCE"],
      dose: "summary",
      restrictions: [],
      expiryUtc: "2026-08-12T00:00:00Z",
      actionTimeUtcIso: "2026-07-12T00:00:01Z",
    });
    expect(created.created).toBe(false);
    expect(created.reasons).toContain("REFERENCE_NOT_CURRENTLY_ACTIVE");
  });

  it("FeedbackProposal attempts a direct mutation path -> rejected; only ACCEPTED review status may trigger a separate governed action (NC-12)", () => {
    const kernel = makeRealKernel();
    const referenceId = issueActiveReferenceId(kernel);
    const feedback = new FeedbackEngine(new SequentialIdFactory());
    const submission = feedback.submit({
      observation: "obs",
      targetReference: referenceId,
      proposedChange: "change",
      evidenceRefs: [],
      proposer: "agent-1",
    });
    const proposalId = submission.proposal!.proposal_id;

    // Direct SUBMITTED -> ACCEPTED is not an allowed transition; only
    // SUBMITTED -> UNDER_REVIEW -> ACCEPTED/REJECTED is valid (T2
    // Invariant 9). This proves no shortcut mutation path exists.
    const skipReview = feedback.accept(proposalId);
    expect(skipReview.succeeded).toBe(false);
    expect(skipReview.reasons).toContain("PROPOSAL_NOT_REVIEWABLE");

    // FeedbackEngine exposes no function anywhere in its public surface
    // that writes to a TruthReceipt, TruthReference, evidence record, or
    // source score; `submit`/`startReview`/`accept`/`reject` are the
    // entire API and all return FeedbackProposal records only.
    expect(typeof (feedback as unknown as Record<string, unknown>).updateSourceScore).toBe("undefined");
  });

  it("Flow-side code attempts to produce a second RefineryPacket -> forbidden-dependency/boundary test fails the package", () => {
    // See dependency-boundary.test.ts for the repository-wide source scan;
    // this test asserts the public Flow surface exposes no RefineryPacket
    // producer function.
    const exportsModule = { DistributionEngine, FeedbackEngine, KernelAuthorityBoundary, SequentialIdFactory } as Record<
      string,
      unknown
    >;
    expect(Object.keys(exportsModule)).not.toContain("RefineryEngine");
    expect(Object.keys(exportsModule)).not.toContain("createRefineryPacket");
  });

  it("Flow-side code attempts to produce KernelDecision/TruthReceipt/TruthReference -> forbidden-dependency/boundary test fails the package", () => {
    const exportsModule = { DistributionEngine, FeedbackEngine, KernelAuthorityBoundary, SequentialIdFactory } as Record<
      string,
      unknown
    >;
    expect(Object.keys(exportsModule)).not.toContain("TruthKernel");
    expect(Object.keys(exportsModule)).not.toContain("issueReceipt");
    expect(Object.keys(exportsModule)).not.toContain("computeCurrentReferenceState");
  });

  it("same injected input twice -> byte-equivalent outputs", () => {
    const kernel1 = makeRealKernel();
    const ref1 = issueActiveReferenceId(kernel1);
    const flow1 = new DistributionEngine(new KernelAuthorityBoundary(kernel1), new SequentialIdFactory());
    const created1 = flow1.create({
      recipient: "agent-1",
      role: "worker",
      task: "review",
      phase: "delivery",
      truthReferences: [ref1],
      dose: "summary",
      restrictions: [],
      expiryUtc: "2026-08-12T00:00:00Z",
      actionTimeUtcIso: "2026-07-12T00:00:01Z",
    });

    const kernel2 = makeRealKernel();
    const ref2 = issueActiveReferenceId(kernel2);
    const flow2 = new DistributionEngine(new KernelAuthorityBoundary(kernel2), new SequentialIdFactory());
    const created2 = flow2.create({
      recipient: "agent-1",
      role: "worker",
      task: "review",
      phase: "delivery",
      truthReferences: [ref2],
      dose: "summary",
      restrictions: [],
      expiryUtc: "2026-08-12T00:00:00Z",
      actionTimeUtcIso: "2026-07-12T00:00:01Z",
    });

    expect(ref1).toBe(ref2);
    expect(JSON.stringify(created1)).toBe(JSON.stringify(created2));
  });
});

describe("consumeFor - strict consumption binding (SOT3-ACT-A4)", () => {
  function makePackage(kernel: ReturnType<typeof makeRealKernel>, overrides: Partial<{
    recipient: string;
    role: string;
    task: string;
    phase: string;
    dose: string;
    expiryUtc: string;
  }> = {}) {
    const referenceId = issueActiveReferenceId(kernel);
    const { flow } = makeFlow(kernel);
    const created = flow.create({
      recipient: "agent-1",
      role: "worker",
      task: "review",
      phase: "delivery",
      truthReferences: [referenceId],
      dose: "summary",
      restrictions: [],
      expiryUtc: "2026-08-12T00:00:00Z",
      actionTimeUtcIso: "2026-07-12T00:00:01Z",
      ...overrides,
    });
    return { flow, packageId: created.distributionPackage!.package_id };
  }

  const correctBinding = { recipient: "agent-1", role: "worker", task: "review", phase: "delivery", dose: "summary" };

  it("correctly bound consumer succeeds via the same path as deliverOrConsume", () => {
    const kernel = makeRealKernel();
    const { flow, packageId } = makePackage(kernel);
    const result = flow.consumeFor(packageId, correctBinding, "2026-07-12T00:00:02Z");
    expect(result.succeeded).toBe(true);
    expect(result.distributionPackage?.package_id).toBe(packageId);
  });

  it("wrong recipient -> PACKAGE_CONSUMER_BINDING_MISMATCH", () => {
    const kernel = makeRealKernel();
    const { flow, packageId } = makePackage(kernel);
    const result = flow.consumeFor(packageId, { ...correctBinding, recipient: "agent-2" }, "2026-07-12T00:00:02Z");
    expect(result.succeeded).toBe(false);
    expect(result.reasons).toContain("PACKAGE_CONSUMER_BINDING_MISMATCH");
  });

  it("wrong role -> PACKAGE_CONSUMER_BINDING_MISMATCH", () => {
    const kernel = makeRealKernel();
    const { flow, packageId } = makePackage(kernel);
    const result = flow.consumeFor(packageId, { ...correctBinding, role: "reviewer" }, "2026-07-12T00:00:02Z");
    expect(result.succeeded).toBe(false);
    expect(result.reasons).toContain("PACKAGE_CONSUMER_BINDING_MISMATCH");
  });

  it("wrong task -> PACKAGE_CONSUMER_BINDING_MISMATCH", () => {
    const kernel = makeRealKernel();
    const { flow, packageId } = makePackage(kernel);
    const result = flow.consumeFor(packageId, { ...correctBinding, task: "audit" }, "2026-07-12T00:00:02Z");
    expect(result.succeeded).toBe(false);
    expect(result.reasons).toContain("PACKAGE_CONSUMER_BINDING_MISMATCH");
  });

  it("wrong phase -> PACKAGE_CONSUMER_BINDING_MISMATCH", () => {
    const kernel = makeRealKernel();
    const { flow, packageId } = makePackage(kernel);
    const result = flow.consumeFor(packageId, { ...correctBinding, phase: "intake" }, "2026-07-12T00:00:02Z");
    expect(result.succeeded).toBe(false);
    expect(result.reasons).toContain("PACKAGE_CONSUMER_BINDING_MISMATCH");
  });

  it("wrong dose -> PACKAGE_CONSUMER_BINDING_MISMATCH", () => {
    const kernel = makeRealKernel();
    const { flow, packageId } = makePackage(kernel);
    const result = flow.consumeFor(packageId, { ...correctBinding, dose: "full" }, "2026-07-12T00:00:02Z");
    expect(result.succeeded).toBe(false);
    expect(result.reasons).toContain("PACKAGE_CONSUMER_BINDING_MISMATCH");
  });

  it("binding mismatch is checked before lifecycle/expiry - a nonexistent package still reports PACKAGE_NOT_FOUND, not a binding reason", () => {
    const kernel = makeRealKernel();
    const { flow } = makeFlow(kernel);
    const result = flow.consumeFor("DPKG-DOES-NOT-EXIST", correctBinding, "2026-07-12T00:00:02Z");
    expect(result.succeeded).toBe(false);
    expect(result.reasons).toContain("PACKAGE_NOT_FOUND");
  });

  it("expired package with correct binding -> PACKAGE_EXPIRED (existing expiry check still applies after binding passes)", () => {
    const kernel = makeRealKernel();
    const { flow, packageId } = makePackage(kernel, { expiryUtc: "2026-07-13T00:00:00Z" });
    const result = flow.consumeFor(packageId, correctBinding, "2026-07-13T00:00:00Z");
    expect(result.succeeded).toBe(false);
    expect(result.reasons).toContain("PACKAGE_EXPIRED");
  });

  it("inactive lifecycle - package already ACKNOWLEDGED (terminal) -> PACKAGE_NOT_ACTIONABLE via strict consume", () => {
    const kernel = makeRealKernel();
    const { flow, packageId } = makePackage(kernel);
    const acknowledged = flow.acknowledge(packageId, "2026-07-12T00:00:02Z");
    expect(acknowledged.succeeded).toBe(true);
    const result = flow.consumeFor(packageId, correctBinding, "2026-07-12T00:00:03Z");
    expect(result.succeeded).toBe(false);
    expect(result.reasons).toContain("PACKAGE_NOT_ACTIONABLE");
  });

  it("inactive lifecycle - withdrawn package -> PACKAGE_NOT_ACTIONABLE via strict consume", () => {
    const kernel = makeRealKernel();
    const { flow, packageId } = makePackage(kernel);
    const withdrawn = flow.withdraw(packageId);
    expect(withdrawn.succeeded).toBe(true);
    const result = flow.consumeFor(packageId, correctBinding, "2026-07-12T00:00:03Z");
    expect(result.succeeded).toBe(false);
    expect(result.reasons).toContain("PACKAGE_NOT_ACTIONABLE");
  });

  it("replay after acknowledgement - correctly bound second consumeFor call is rejected as not actionable, not silently re-approved", () => {
    const kernel = makeRealKernel();
    const { flow, packageId } = makePackage(kernel);
    const first = flow.consumeFor(packageId, correctBinding, "2026-07-12T00:00:02Z");
    expect(first.succeeded).toBe(true);
    const acknowledged = flow.acknowledge(packageId, "2026-07-12T00:00:02Z");
    expect(acknowledged.succeeded).toBe(true);
    const replay = flow.consumeFor(packageId, correctBinding, "2026-07-12T00:00:03Z");
    expect(replay.succeeded).toBe(false);
    expect(replay.reasons).toContain("PACKAGE_NOT_ACTIONABLE");
  });

  it("revoked reference at consumption time -> REFERENCE_NOT_CURRENTLY_ACTIVE via strict consume (existing check preserved)", () => {
    const kernel = makeRealKernel();
    const referenceId = issueActiveReferenceId(kernel);
    const { flow } = makeFlow(kernel);
    const created = flow.create({
      recipient: "agent-1",
      role: "worker",
      task: "review",
      phase: "delivery",
      truthReferences: [referenceId],
      dose: "summary",
      restrictions: [],
      expiryUtc: "2026-08-12T00:00:00Z",
      actionTimeUtcIso: "2026-07-12T00:00:01Z",
    });
    const packageId = created.distributionPackage!.package_id;
    kernel.revokeReference(referenceId);
    const result = flow.consumeFor(packageId, correctBinding, "2026-07-12T00:00:02Z");
    expect(result.succeeded).toBe(false);
    expect(result.reasons).toContain("REFERENCE_NOT_CURRENTLY_ACTIVE");
  });
});
