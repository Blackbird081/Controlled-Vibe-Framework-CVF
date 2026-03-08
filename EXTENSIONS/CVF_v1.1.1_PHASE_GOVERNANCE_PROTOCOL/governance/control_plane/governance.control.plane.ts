import { GOVERNANCE_PIPELINE, GovernanceModule } from "../phase_gate/gate.rules";
import { GovernanceTraceMetadata } from "../reports/phase.report.generator";

export type GovernanceTraceField = keyof GovernanceTraceMetadata;

export interface GovernanceControlPlane {
  policyVersion: string;
  auditPhase: string;
  pipeline: readonly GovernanceModule[];
  requiredTraceFields: readonly GovernanceTraceField[];
}

export interface GovernanceControlPlaneOverrides {
  policyVersion?: string;
  auditPhase?: string;
  requiredTraceFields?: readonly GovernanceTraceField[];
}

export const DEFAULT_GOVERNANCE_TRACE_FIELDS = [
  "requestId",
  "traceBatch",
  "traceHash",
  "policyVersion",
] as const satisfies readonly GovernanceTraceField[];

export function createGovernanceControlPlane(
  overrides: GovernanceControlPlaneOverrides = {}
): GovernanceControlPlane {
  return {
    policyVersion: overrides.policyVersion ?? "v1.1.2",
    auditPhase: overrides.auditPhase ?? "PHASE_GATE",
    pipeline: [...GOVERNANCE_PIPELINE],
    requiredTraceFields: overrides.requiredTraceFields ?? DEFAULT_GOVERNANCE_TRACE_FIELDS,
  };
}

export const DEFAULT_GOVERNANCE_CONTROL_PLANE = createGovernanceControlPlane();

export function bindControlPlaneTrace(
  controlPlane: GovernanceControlPlane,
  trace?: GovernanceTraceMetadata
): GovernanceTraceMetadata | undefined {
  if (!trace && controlPlane.requiredTraceFields.length === 0) {
    return undefined;
  }

  const boundTrace: GovernanceTraceMetadata = {
    ...trace,
  };

  if (!boundTrace.policyVersion) {
    boundTrace.policyVersion = controlPlane.policyVersion;
  }

  return Object.keys(boundTrace).length > 0 ? boundTrace : undefined;
}

export function getMissingTraceFields(
  controlPlane: GovernanceControlPlane,
  trace?: GovernanceTraceMetadata
): GovernanceTraceField[] {
  const boundTrace = bindControlPlaneTrace(controlPlane, trace);
  return controlPlane.requiredTraceFields.filter((field) => !boundTrace?.[field]);
}
