import { DomainContextObject } from "../01_domain_lock/domain_context_object"
import { CVFRiskLevel } from "../03_contamination_guard/risk.types"
import { CreativePermissionPolicy } from "./creative_permission.policy"
import { CreativeProvenanceTagger } from "./creative_provenance.tagger"

export class CreativeController {

  private enabled = false
  private permission = new CreativePermissionPolicy()
  private provenance = new CreativeProvenanceTagger()

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }

  adjust(
    output: string,
    context: DomainContextObject,
    riskLevel: CVFRiskLevel
  ): string {

    if (!this.enabled) {
      return output
    }

    if (!this.permission.allow(context, riskLevel)) {
      return output
    }

    const expanded = `${output}\n\n(creative variation enabled)`
    return this.provenance.tag(expanded)
  }
}
