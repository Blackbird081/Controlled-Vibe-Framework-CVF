// domain_lock_engine.ts

import { DomainClassifier } from "./domain_classifier"
import { ScopeResolver } from "./scope_resolver"
import { BoundaryRules } from "./boundary_rules"
import { DomainContextObject } from "./domain_context_object"

export class DomainLockEngine {
  private classifier = new DomainClassifier()
  private resolver = new ScopeResolver()
  private boundary = new BoundaryRules()

  lock(input: string): DomainContextObject {
    const domainType = this.classifier.classify(input)

    let context: DomainContextObject = {
      domain_id: crypto.randomUUID(),
      domain_type: domainType,
      input_class: "text",
      allowed_output_types: ["text"],
      risk_ceiling: "low",
      boundary_conditions: [],
      refusal_policy_id: "default",
      creative_allowed: false
    }

    context = this.resolver.resolve(context)

    if (!this.boundary.validateInput(input, context)) {
      throw new Error("Domain Lock: Invalid or restricted input.")
    }

    return context
  }
}