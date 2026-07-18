import { describe, it, expect } from "vitest";
import { DistributionEngine, FeedbackEngine, KernelAuthorityBoundary, SequentialIdFactory } from "../src/index.js";
import { validateRoutingScope } from "../src/routing/routing-engine.js";
import { validateDose } from "../src/distribution/dose-engine.js";
import { makeRealKernel, issueActiveReferenceId } from "./fixtures.js";

describe("Truth Flow positive path", () => {
  it("routes, doses, creates, delivers, and acknowledges a DistributionPackage backed by a real ACTIVE TruthReference", () => {
    const kernel = makeRealKernel();
    const referenceId = issueActiveReferenceId(kernel);
    const authority = new KernelAuthorityBoundary(kernel);
    const flow = new DistributionEngine(authority, new SequentialIdFactory());

    const scope = validateRoutingScope({ recipient: "agent-1", role: "worker", task: "review", phase: "delivery" });
    expect(scope.valid).toBe(true);

    const dose = validateDose("summary", "2026-08-12T00:00:00Z", "2026-07-12T00:00:01Z");
    expect(dose.valid).toBe(true);

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
    expect(created.distributionPackage!.acknowledgement_state).toBe("PENDING_ACKNOWLEDGEMENT");
    expect(created.distributionPackage!.routing_decision).toContain(referenceId);

    const packageId = created.distributionPackage!.package_id;
    const delivered = flow.deliverOrConsume(packageId, "2026-07-12T00:00:02Z");
    expect(delivered.succeeded).toBe(true);

    const acknowledged = flow.acknowledge(packageId, "2026-07-12T00:00:03Z");
    expect(acknowledged.succeeded).toBe(true);
    expect(acknowledged.distributionPackage!.acknowledgement_state).toBe("ACKNOWLEDGED");
  });

  it("submits, reviews, and accepts a FeedbackProposal without any direct mutation path", () => {
    const kernel = makeRealKernel();
    const referenceId = issueActiveReferenceId(kernel);
    const feedback = new FeedbackEngine(new SequentialIdFactory());

    const submission = feedback.submit({
      observation: "reference scope appears too broad",
      targetReference: referenceId,
      proposedChange: "narrow scope to project-only",
      evidenceRefs: ["EV-000001"],
      proposer: "agent-1",
    });
    expect(submission.submitted).toBe(true);
    expect(submission.proposal!.no_direct_mutation_flag).toBe(true);
    expect(submission.proposal!.review_status).toBe("SUBMITTED");

    const proposalId = submission.proposal!.proposal_id;
    const underReview = feedback.startReview(proposalId);
    expect(underReview.succeeded).toBe(true);
    expect(underReview.proposal!.review_status).toBe("UNDER_REVIEW");

    const accepted = feedback.accept(proposalId);
    expect(accepted.succeeded).toBe(true);
    expect(accepted.proposal!.review_status).toBe("ACCEPTED");
  });

  it("recall/retirement uses the sole PENDING_ACKNOWLEDGEMENT -> WITHDRAWN transition", () => {
    const kernel = makeRealKernel();
    const referenceId = issueActiveReferenceId(kernel);
    const authority = new KernelAuthorityBoundary(kernel);
    const flow = new DistributionEngine(authority, new SequentialIdFactory());

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

    const withdrawn = flow.withdraw(packageId);
    expect(withdrawn.succeeded).toBe(true);
    expect(withdrawn.distributionPackage!.acknowledgement_state).toBe("WITHDRAWN");
  });
});
