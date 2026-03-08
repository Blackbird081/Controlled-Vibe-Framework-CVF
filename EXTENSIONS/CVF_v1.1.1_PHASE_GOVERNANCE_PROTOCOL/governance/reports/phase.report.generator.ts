import { GateResult } from "../phase_gate/gate.result"
import { DriftReport } from "../structural_diff/drift.detector"
import { ExecutionTrace } from "../scenario_simulator/execution.trace"

export interface GovernanceTraceMetadata {
  requestId?: string
  traceBatch?: string
  traceHash?: string
  remediationBatch?: string
  policyVersion?: string
}

export interface PhaseReport {
  phase: string
  gate: GateResult
  drift?: DriftReport
  traces?: ExecutionTrace[]
  trace?: GovernanceTraceMetadata
  timestamp: number
}

export function generatePhaseReport(
  phase: string,
  gate: GateResult,
  drift?: DriftReport,
  traces?: ExecutionTrace[],
  trace?: GovernanceTraceMetadata
): PhaseReport {

  return {
    phase,
    gate,
    drift,
    traces,
    trace,
    timestamp: Date.now()
  }

}
