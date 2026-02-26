import { CVFRiskLevel } from "../03_contamination_guard/risk.types"
import type { RefusalAction } from "./refusal_policy"

export interface RefusalPolicyVersion {
  version: string
  baselineByRisk: Record<CVFRiskLevel, RefusalAction>
  clarifyOnSignalsAtR2: boolean
  freezeR4Action: RefusalAction
}

const REFUSAL_POLICY_VERSIONS: Record<string, RefusalPolicyVersion> = {
  v1: {
    version: "v1",
    baselineByRisk: {
      R0: "allow",
      R1: "allow",
      R2: "allow",
      R3: "needs_approval",
      R4: "block"
    },
    clarifyOnSignalsAtR2: true,
    freezeR4Action: "needs_approval"
  }
}

export class RefusalPolicyRegistry {
  get(version: string): RefusalPolicyVersion {
    const profile = REFUSAL_POLICY_VERSIONS[version]
    if (!profile) {
      throw new Error(`Unknown refusal policy version: ${version}`)
    }
    return profile
  }

  latestVersion(): string {
    return "v1"
  }
}
