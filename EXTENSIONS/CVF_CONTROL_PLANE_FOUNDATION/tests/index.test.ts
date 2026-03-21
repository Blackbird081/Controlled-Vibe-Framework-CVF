import { describe, expect, it } from "vitest";
import {
  CONTROL_PLANE_FOUNDATION_COORDINATION,
  createControlPlaneEvidenceSurface,
  createControlPlaneFoundationShell,
  resetDocCounter,
} from "../src/index";

describe("CVF_CONTROL_PLANE_FOUNDATION", () => {
  it("re-exports intent validation through the control-plane shell", () => {
    const shell = createControlPlaneFoundationShell();
    const result = shell.intent.validate(
      "Approve finance spend only after manager review and keep the limit below 500 dollars."
    );

    expect(result.intent.domain).toBe("finance");
    expect(result.rules.length).toBeGreaterThan(0);
    expect(result.constraints.length).toBeGreaterThan(0);
  });

  it("composes knowledge, reporting, and deterministic context services", () => {
    resetDocCounter();

    const shell = createControlPlaneFoundationShell();
    const store = shell.knowledge.getStore();

    store.add({
      title: "Finance Approval Policy",
      content: "Finance spend over 500 requires manager approval.",
      tier: "T2_POLICY",
      documentType: "policy",
      domain: "finance",
      tags: ["finance", "approval"],
      metadata: { source: "test" },
    });

    const result = shell.knowledge.querySimple("manager approval", "finance", 3);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0]?.title).toBe("Finance Approval Policy");

    const freezeHash = shell.context.freeze(
      "cp1-test",
      { "docs/policy.md": "abc123" },
      "policy-v1",
      { env: "test" }
    );
    expect(freezeHash).toHaveLength(16);

    shell.reporting.addSession({
      sessionId: "session-1",
      agentId: "agent-control",
      actionCount: 3,
      cumulativeRisk: 1.5,
      highestRisk: "R1",
      verdictCounts: {
        ALLOW: 2,
        WARN: 1,
        ESCALATE: 0,
        BLOCK: 0,
      },
      domainBreakdown: {
        finance: 3,
      },
      startedAt: Date.now() - 1000,
      endedAt: Date.now(),
    });

    const report = shell.reporting.generateReport();
    expect(report.metrics.totalSessions).toBe(1);
    expect(report.metrics.domainActivity.finance).toBe(3);
    expect(report.textReport).toContain("CVF Governance Canvas");

    shell.context._clearAll();
  });

  it("publishes lineage metadata and keeps controlled-intelligence out of scope", () => {
    expect(CONTROL_PLANE_FOUNDATION_COORDINATION.executionClass).toBe(
      "coordination package"
    );
    expect(CONTROL_PLANE_FOUNDATION_COORDINATION.intentValidation).toContain(
      "CVF_ECO_v1.0_INTENT_VALIDATION"
    );
    expect(
      CONTROL_PLANE_FOUNDATION_COORDINATION.selectedControlledIntelligenceReferences
    ).toContain("EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE");
    expect(
      CONTROL_PLANE_FOUNDATION_COORDINATION.initialPhysicalMoveExcluded
    ).toContain("EXTENSIONS/CVF_v1.7_CONTROLLED_INTELLIGENCE");
  });

  it("exports a reviewable governance-canvas evidence surface for the tranche", () => {
    const evidence = createControlPlaneEvidenceSurface(
      [
        {
          sessionId: "cp3-session-1",
          agentId: "agent-control",
          actionCount: 4,
          cumulativeRisk: 2.5,
          highestRisk: "R2",
          verdictCounts: {
            ALLOW: 2,
            WARN: 1,
            ESCALATE: 1,
            BLOCK: 0,
          },
          domainBreakdown: {
            finance: 2,
            governance: 2,
          },
          startedAt: Date.now() - 5000,
          endedAt: Date.now(),
        },
      ],
      {
        knowledgeSources: ["EXTENSIONS/CVF_ECO_v1.4_RAG_PIPELINE"],
        frozenContextHashes: ["freeze-abc123"],
        notes: ["CP3 keeps governance-core semantics unchanged."],
      }
    );

    expect(evidence.trancheId).toBe("W1-T1");
    expect(evidence.controlPointId).toBe("CP3");
    expect(evidence.report.metrics.totalSessions).toBe(1);
    expect(evidence.textSurface).toContain("CVF W1-T1 CP3 Control-Plane Review Surface");
    expect(evidence.textSurface).toContain("EXTENSIONS/CVF_ECO_v2.1_GOVERNANCE_CANVAS");
    expect(evidence.markdownSurface).toContain("## Governance Canvas Report");
    expect(evidence.markdownSurface).toContain("`freeze-abc123`");
    expect(evidence.markdownSurface).toContain("CP3 keeps governance-core semantics unchanged.");
  });
});
