import { DomainType, InputClass } from "./domain.types"

export interface DomainMapSchema {
  domainType: DomainType
  allowedInputClasses: InputClass[]
  allowedOutputTypes: string[]
  refusalPolicyId: string
}

export const DefaultDomainMap: Record<DomainType, DomainMapSchema> = {
  informational: {
    domainType: "informational",
    allowedInputClasses: ["text", "instruction", "mixed"],
    allowedOutputTypes: ["text"],
    refusalPolicyId: "default",
  },
  analytical: {
    domainType: "analytical",
    allowedInputClasses: ["text", "numeric", "mixed"],
    allowedOutputTypes: ["text", "structured_text"],
    refusalPolicyId: "default",
  },
  creative: {
    domainType: "creative",
    allowedInputClasses: ["text", "instruction"],
    allowedOutputTypes: ["text"],
    refusalPolicyId: "creative",
  },
  procedural: {
    domainType: "procedural",
    allowedInputClasses: ["instruction", "text", "mixed"],
    allowedOutputTypes: ["text", "structured_text"],
    refusalPolicyId: "strict",
  },
  sensitive: {
    domainType: "sensitive",
    allowedInputClasses: ["text", "mixed"],
    allowedOutputTypes: ["text"],
    refusalPolicyId: "strict",
  },
  restricted: {
    domainType: "restricted",
    allowedInputClasses: [],
    allowedOutputTypes: [],
    refusalPolicyId: "block-all",
  },
}
