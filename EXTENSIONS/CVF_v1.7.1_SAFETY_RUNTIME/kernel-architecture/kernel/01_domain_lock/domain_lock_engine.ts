// domain_lock_engine.ts

import { DomainClassifier } from "./domain_classifier"
import { ScopeResolver } from "./scope_resolver"
import { BoundaryRules } from "./boundary_rules"
import { DomainContextObject } from "./domain_context_object"
import { DomainType, InputClass } from "./domain.types"
import { DefaultDomainMap } from "./domain_map.schema"

export interface DomainPreflightInput {
  message: string
  declaredDomain: string
  inputClass?: InputClass
}

export class DomainLockEngine {
  private classifier = new DomainClassifier()
  private resolver = new ScopeResolver()
  private boundary = new BoundaryRules()

  lock(input: DomainPreflightInput): DomainContextObject {
    const declaredDomain = input.declaredDomain as DomainType
    const map = DefaultDomainMap[declaredDomain]

    if (!map) {
      throw new Error(`Domain Lock: Unknown declared domain '${input.declaredDomain}'.`)
    }

    const classifiedDomain = this.classifier.classify(input.message)
    if (classifiedDomain !== declaredDomain) {
      throw new Error(
        `Domain Lock: Declared domain '${declaredDomain}' mismatches classified domain '${classifiedDomain}'.`
      )
    }

    const inputClass = input.inputClass || "text"
    if (!map.allowedInputClasses.includes(inputClass)) {
      throw new Error(
        `Domain Lock: Input class '${inputClass}' not allowed in domain '${declaredDomain}'.`
      )
    }

    let context: DomainContextObject = {
      domain_id: crypto.randomUUID(),
      domain_type: declaredDomain,
      input_class: inputClass,
      allowed_output_types: map.allowedOutputTypes,
      risk_ceiling: "low",
      boundary_conditions: [],
      refusal_policy_id: map.refusalPolicyId,
      creative_allowed: false
    }

    context = this.resolver.resolve(context)

    if (!this.boundary.validateInput(input.message, context)) {
      throw new Error("Domain Lock: Invalid or restricted input.")
    }

    return context
  }
}
