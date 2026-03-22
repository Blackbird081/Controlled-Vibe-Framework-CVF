// W3-T4 — Governance Consensus Slice (CP1–CP2)
export {
  GovernanceConsensusContract,
  createGovernanceConsensusContract,
} from "./governance.consensus.contract";
export type {
  ConsensusVerdict,
  ConsensusDecision,
  GovernanceConsensusContractDependencies,
} from "./governance.consensus.contract";
export {
  GovernanceConsensusSummaryContract,
  createGovernanceConsensusSummaryContract,
} from "./governance.consensus.summary.contract";
export type {
  GovernanceConsensusSummary,
  GovernanceConsensusSummaryContractDependencies,
} from "./governance.consensus.summary.contract";

// W3-T3 — Governance Audit Signal Slice (CP1–CP2)
export {
  GovernanceAuditSignalContract,
  createGovernanceAuditSignalContract,
} from "./governance.audit.signal.contract";
export type {
  AuditTrigger,
  GovernanceAuditSignal,
  GovernanceAuditSignalContractDependencies,
} from "./governance.audit.signal.contract";
export {
  GovernanceAuditLogContract,
  createGovernanceAuditLogContract,
} from "./governance.audit.log.contract";
export type {
  GovernanceAuditLog,
  GovernanceAuditLogContractDependencies,
} from "./governance.audit.log.contract";

// W3-T2 — Governance Watchdog Pulse Slice (CP1–CP2)
export {
  WatchdogPulseContract,
  createWatchdogPulseContract,
} from "./watchdog.pulse.contract";
export type {
  WatchdogObservabilityInput,
  WatchdogExecutionInput,
  WatchdogStatus,
  WatchdogPulse,
  WatchdogPulseContractDependencies,
} from "./watchdog.pulse.contract";
export {
  WatchdogAlertLogContract,
  createWatchdogAlertLogContract,
} from "./watchdog.alert.log.contract";
export type {
  WatchdogAlertLog,
  WatchdogAlertLogContractDependencies,
} from "./watchdog.alert.log.contract";

// =============================================
// CVF Governance Expansion Foundation — W3-T1
// Coordination package for unconsolidated governance modules
// =============================================

// --- Governance CLI (CVF_ECO_v2.2_GOVERNANCE_CLI) ---
export { GovernanceCLI } from "../../CVF_ECO_v2.2_GOVERNANCE_CLI/src/cli";
export { CommandRegistry } from "../../CVF_ECO_v2.2_GOVERNANCE_CLI/src/command.registry";
export { ArgParser } from "../../CVF_ECO_v2.2_GOVERNANCE_CLI/src/arg.parser";
export type {
  CLIConfig,
  CLIOutput,
} from "../../CVF_ECO_v2.2_GOVERNANCE_CLI/src/types";
export { DEFAULT_CLI_CONFIG } from "../../CVF_ECO_v2.2_GOVERNANCE_CLI/src/types";

// --- Graph Governance (CVF_ECO_v2.4_GRAPH_GOVERNANCE) ---
export { GovernanceGraph, resetEdgeCounter } from "../../CVF_ECO_v2.4_GRAPH_GOVERNANCE/src/governance.graph";
export { GraphStore } from "../../CVF_ECO_v2.4_GRAPH_GOVERNANCE/src/graph.store";
export { TrustPropagator } from "../../CVF_ECO_v2.4_GRAPH_GOVERNANCE/src/trust.propagator";
export type {
  GraphNode,
  EdgeType,
  DependencyChain,
  GraphAnalysis,
} from "../../CVF_ECO_v2.4_GRAPH_GOVERNANCE/src/types";

// --- Phase Governance Protocol (CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL) ---
export { GovernanceExecutor } from "../../CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/runtime/governance.executor";
export type {
  ModuleResult,
  ExecutorResult,
  GovernanceExecutionContext,
  GovernanceExecutorOptions,
  GovernanceModulePlugin,
} from "../../CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/runtime/governance.executor";

// --- Skill Governance Engine (CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE) ---
export { GovernanceKernel } from "../../CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/core/governance.kernel";
export type { GovernanceContext } from "../../CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/core/governance.kernel";
export { Constitution } from "../../CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/core/constitution";
export type { GovernanceDecision } from "../../CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/core/constitution";

// --- Local imports for surfaces ---
import { GovernanceCLI } from "../../CVF_ECO_v2.2_GOVERNANCE_CLI/src/cli";
import { GovernanceGraph } from "../../CVF_ECO_v2.4_GRAPH_GOVERNANCE/src/governance.graph";
import { GovernanceKernel } from "../../CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/core/governance.kernel";
import { Constitution } from "../../CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/core/constitution";

// =============================================
// CP1 — Foundation Shell
// =============================================

export const GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION = {
  executionClass: "coordination package" as const,
  trancheId: "W3-T1" as const,
  governanceCli: "EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI" as const,
  graphGovernance: "EXTENSIONS/CVF_ECO_v2.4_GRAPH_GOVERNANCE" as const,
  phaseGovernanceProtocol: "EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL" as const,
  skillGovernanceEngine: "EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE" as const,
  alreadyConsolidated: [
    "CVF_v1.6.1_GOVERNANCE_ENGINE → B* CVF_POLICY_ENGINE",
    "CVF_ECO_v2.1_GOVERNANCE_CANVAS → W1-T1 CVF_CONTROL_PLANE_FOUNDATION",
  ] as const,
  deferredTargets: [
    "Watchdog — concept-only, no operational source exists",
    "Consensus — concept-only, no operational source exists",
  ] as const,
  preservesLineage: true as const,
} as const;

export interface GovernanceExpansionFoundationSurface {
  coordination: typeof GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION;
  cli: {
    available: boolean;
    instance: GovernanceCLI;
  };
  graph: {
    available: boolean;
    instance: GovernanceGraph;
  };
  kernel: {
    evaluator: typeof GovernanceKernel;
    constitution: typeof Constitution;
  };
}

export interface GovernanceExpansionFoundationSummary {
  trancheId: "W3-T1";
  controlPointId: "CP1";
  generatedAt: string;
  coordination: typeof GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION;
  cliAvailable: boolean;
  graphAvailable: boolean;
  kernelAvailable: boolean;
  textSurface: string;
  markdownSurface: string;
}

export function createGovernanceExpansionFoundationSurface(): GovernanceExpansionFoundationSurface {
  return {
    coordination: GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION,
    cli: {
      available: true,
      instance: new GovernanceCLI(),
    },
    graph: {
      available: true,
      instance: new GovernanceGraph(),
    },
    kernel: {
      evaluator: GovernanceKernel,
      constitution: Constitution,
    },
  };
}

export function describeGovernanceExpansionFoundation(): GovernanceExpansionFoundationSummary {
  const surface = createGovernanceExpansionFoundationSurface();
  const generatedAt = new Date().toISOString();

  return {
    trancheId: "W3-T1",
    controlPointId: "CP1",
    generatedAt,
    coordination: GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION,
    cliAvailable: surface.cli.available,
    graphAvailable: surface.graph.available,
    kernelAvailable: true,
    textSurface: buildGovernanceExpansionTextSurface(generatedAt),
    markdownSurface: buildGovernanceExpansionMarkdownSurface(generatedAt),
  };
}

function buildGovernanceExpansionTextSurface(generatedAt: string): string {
  return [
    "=".repeat(72),
    "  CVF W3-T1 CP1 Governance Expansion Foundation Shell",
    "=".repeat(72),
    "Tranche: W3-T1",
    "Control Point: CP1",
    `Execution Class: ${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.executionClass}`,
    `Generated At: ${generatedAt}`,
    `Source Modules: ${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.governanceCli}, ${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.graphGovernance}, ${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.phaseGovernanceProtocol}, ${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.skillGovernanceEngine}`,
    `Already Consolidated: ${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.alreadyConsolidated.join("; ")}`,
    `Deferred Targets: ${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.deferredTargets.join("; ")}`,
  ].join("\n");
}

function buildGovernanceExpansionMarkdownSurface(generatedAt: string): string {
  return [
    "# CVF W3-T1 CP1 Governance Expansion Foundation Shell",
    "",
    `> Tranche: \`W3-T1\``,
    `> Control Point: \`CP1\``,
    `> Execution Class: \`${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.executionClass}\``,
    `> Generated At: \`${generatedAt}\``,
    "",
    "## Source Modules",
    "",
    `- \`${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.governanceCli}\``,
    `- \`${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.graphGovernance}\``,
    `- \`${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.phaseGovernanceProtocol}\``,
    `- \`${GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.skillGovernanceEngine}\``,
    "",
    "## Already Consolidated (not in this package)",
    "",
    ...GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.alreadyConsolidated.map(
      (item) => `- ${item}`,
    ),
    "",
    "## Deferred Targets",
    "",
    ...GOVERNANCE_EXPANSION_FOUNDATION_COORDINATION.deferredTargets.map(
      (item) => `- ${item}`,
    ),
  ].join("\n");
}
