// boundary_rules.ts

import { DomainContextObject } from "./domain_context_object"

export class BoundaryRules {
  validateInput(input: string, context: DomainContextObject): boolean {
    if (context.domain_type === "restricted") return false
    if (!input || input.trim().length === 0) return false
    return true
  }
}
