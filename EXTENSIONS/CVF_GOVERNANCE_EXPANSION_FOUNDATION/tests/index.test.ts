import { describe, expect, it } from "vitest";
import {
  GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION,
  GovernanceCLI,
  GovernanceGraph,
  GovernanceKernel,
  Constitution,
  createGovernanceExpansionFoundationSurface,
  describeGovernanceExpansionFoundation,
} from "../src/index";

describe("CVF_GOVERNANCE_EXPANSION_FOUNDATION", () => {
  it("creates a governance expansion foundation surface with all 4 modules", () => {
    const surface = createGovernanceExpansionFoundationSurface();

    expect(surface.coordination.executionClass).toBe("coordination package");
    expect(surface.coordination.trancheId).toBe("W3-T1");
    expect(surface.coordination.preservesLineage).toBe(true);
    expect(surface.cli.available).toBe(true);
    expect(surface.cli.instance).toBeInstanceOf(GovernanceCLI);
    expect(surface.graph.available).toBe(true);
    expect(surface.graph.instance).toBeInstanceOf(GovernanceGraph);
    expect(surface.kernel.evaluator).toBe(GovernanceKernel);
    expect(surface.kernel.constitution).toBe(Constitution);
  });

  it("describes the foundation as a CP1 review surface", () => {
    const summary = describeGovernanceExpansionFoundation();

    expect(summary.trancheId).toBe("W3-T1");
    expect(summary.controlPointId).toBe("CP1");
    expect(summary.cliAvailable).toBe(true);
    expect(summary.graphAvailable).toBe(true);
    expect(summary.kernelAvailable).toBe(true);
    expect(summary.textSurface).toContain("CVF W3-T1 CP1 Governance Expansion Foundation Shell");
    expect(summary.markdownSurface).toContain("## Source Modules");
    expect(summary.markdownSurface).toContain("## Already Consolidated");
    expect(summary.markdownSurface).toContain("## Deferred Targets");
  });

  it("records already-consolidated and deferred governance targets", () => {
    expect(GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.alreadyConsolidated).toHaveLength(2);
    expect(GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.deferredTargets).toHaveLength(2);
    expect(GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.deferredTargets[0]).toContain("Watchdog");
    expect(GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.deferredTargets[1]).toContain("Consensus");
  });

  it("validates governance kernel evaluation", () => {
    const result = GovernanceKernel.evaluate({
      riskScore: 30,
      skillVerified: true,
      integrityPassed: true,
    });
    expect(result).toBe("APPROVED");

    const rejected = GovernanceKernel.evaluate({
      riskScore: 80,
      skillVerified: true,
      integrityPassed: true,
    });
    expect(rejected).toBe("REJECTED");
  });

  it("validates governance CLI instantiation", () => {
    const cli = new GovernanceCLI();
    expect(cli.getRegistry()).toBeTruthy();
    expect(cli.getParser()).toBeTruthy();
  });

  it("validates governance graph operations", () => {
    const graph = new GovernanceGraph();
    graph.addAgent("a1", "Agent 1");
    graph.addPolicy("p1", "Policy 1");
    graph.connect("a1", "p1", "depends_on");

    const analysis = graph.analyze();
    expect(analysis.nodeCount).toBe(2);
    expect(analysis.edgeCount).toBe(1);
  });
});
