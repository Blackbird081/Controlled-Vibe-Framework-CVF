import { GateResult } from "../phase_gate/gate.result"
import { DriftReport } from "../structural_diff/drift.detector"
import { ExecutionTrace } from "../scenario_simulator/execution.trace"

export interface PhaseReport {
  phase: string
  gate: GateResult
  drift?: DriftReport
  traces?: ExecutionTrace[]
  timestamp: number
}

export function generatePhaseReport(
  phase: string,
  gate: GateResult,
  drift?: DriftReport,
  traces?: ExecutionTrace[]
): PhaseReport {

  return {
    phase,
    gate,
    drift,
    traces,
    timestamp: Date.now()
  }

}