export { PolicyCompiler, resetCompilerCounters } from "../../CVF_ECO_v1.1_NL_POLICY/src/policy.compiler";
export { TemplateEngine, resetTemplateCounters } from "../../CVF_ECO_v1.1_NL_POLICY/src/template.engine";
export { PolicyStore } from "../../CVF_ECO_v1.1_NL_POLICY/src/policy.store";
export { PolicySerializer } from "../../CVF_ECO_v1.1_NL_POLICY/src/policy.serializer";
export type {
  PolicyDocument,
  PolicyRule,
  PolicyConflict,
  PolicyDomain,
  EnforcementLevel,
  PolicyTemplate,
} from "../../CVF_ECO_v1.1_NL_POLICY/src/types";

export const POLICY_ENGINE_COORDINATION = {
  executionClass: "coordination package",
  pythonGovernanceEngine: "EXTENSIONS/CVF_v1.6.1_GOVERNANCE_ENGINE/ai_governance_core",
  tsPolicyCompiler: "EXTENSIONS/CVF_ECO_v1.1_NL_POLICY",
  rationale: "Cross-language conceptual overlap with zero safe current-cycle implementation overlap",
} as const;
