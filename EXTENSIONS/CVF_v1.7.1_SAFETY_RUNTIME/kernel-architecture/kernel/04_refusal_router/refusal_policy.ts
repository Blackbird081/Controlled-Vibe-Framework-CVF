import { CVFRiskLevel } from "../03_contamination_guard/risk.types"
import { RefusalPolicyRegistry } from "./refusal_policy_registry"

export type RefusalAction = "allow" | "clarify" | "needs_approval" | "block"

export interface RefusalPolicyContext {
  driftDetected?: boolean
  needsClarification?: boolean
  phase?: string
}

export class RefusalPolicy {
  private registry = new RefusalPolicyRegistry()
  private policyVersion: string

  constructor(policyVersion?: string) {
    this.policyVersion = policyVersion || this.registry.latestVersion()
  }

  getVersion(): string {
    return this.policyVersion
  }

  decide(cvfRiskLevel: CVFRiskLevel, context?: RefusalPolicyContext): RefusalAction {
    const profile = this.registry.get(this.policyVersion)

    if (cvfRiskLevel === "R4") {
      if (context?.phase === "FREEZE") {
        return profile.freezeR4Action
      }
      return profile.baselineByRisk.R4
    }

    if (cvfRiskLevel === "R2" && profile.clarifyOnSignalsAtR2) {
      if (context?.driftDetected || context?.needsClarification) {
        return "clarify"
      }
    }

    return profile.baselineByRisk[cvfRiskLevel]
  }
}
