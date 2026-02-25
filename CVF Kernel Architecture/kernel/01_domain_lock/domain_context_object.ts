// domain_context_object.ts

import { DomainType, InputClass, RiskLevel } from "./domain.types"

export interface DomainContextObject {
  domain_id: string
  domain_type: DomainType
  input_class: InputClass
  allowed_output_types: string[]
  risk_ceiling: RiskLevel
  boundary_conditions: string[]
  refusal_policy_id: string
  creative_allowed: boolean
}