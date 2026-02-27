// scope_resolver.ts

import { DomainContextObject } from "./domain_context_object"
import { RiskLevel } from "./domain.types"

export class ScopeResolver {
  resolve(domain: DomainContextObject): DomainContextObject {
    let risk: RiskLevel = "low"
    let creativeAllowed = false

    if (domain.domain_type === "creative") {
      risk = "medium"
      creativeAllowed = true
    }

    if (domain.domain_type === "sensitive") {
      risk = "high"
      creativeAllowed = false
    }

    return {
      ...domain,
      risk_ceiling: risk,
      creative_allowed: creativeAllowed,
    }
  }
}
