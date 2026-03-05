import { ArchitectureDiff } from "./architecture.diff"
import { StateCodeDiff } from "./state_vs_code.diff"

export interface DriftReport {
  architectureDrift: boolean
  stateDrift: boolean
  details: any
}

export function detectDrift(
  architectureDiff: ArchitectureDiff,
  stateDiff: StateCodeDiff
): DriftReport {

  const architectureDrift =
    architectureDiff.missingNodes.length > 0 ||
    architectureDiff.extraNodes.length > 0 ||
    architectureDiff.missingEdges.length > 0 ||
    architectureDiff.extraEdges.length > 0

  const stateDrift =
    stateDiff.missingStates.length > 0 ||
    stateDiff.extraStates.length > 0

  return {
    architectureDrift,
    stateDrift,
    details: {
      architectureDiff,
      stateDiff
    }
  }

}