export {
  AgentGuard,
  resetSessionCounter,
  resetAuditCounter,
} from "../../CVF_ECO_v2.0_AGENT_GUARD_SDK/src/agent.guard";

export { GuardModule } from "../../CVF_ECO_v2.0_AGENT_GUARD_SDK/src/guard.module";
export { RiskModule } from "../../CVF_ECO_v2.0_AGENT_GUARD_SDK/src/risk.module";
export { SessionManager } from "../../CVF_ECO_v2.0_AGENT_GUARD_SDK/src/session.manager";

export type {
  GovernanceDomain,
  ActionVerdict,
  RiskLevel,
  AgentAction,
  GovernanceDecision,
  ViolationDetail,
  AgentSession,
  SDKConfig,
  AuditEntry,
} from "../../CVF_ECO_v2.0_AGENT_GUARD_SDK/src/types";

export const TRUST_SANDBOX_COORDINATION = {
  executionClass: "coordination package",
  fullRuntime: "EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME",
  lightweightSdk: "EXTENSIONS/CVF_ECO_v2.0_AGENT_GUARD_SDK",
  fullRuntimeEntrypoints: [
    "core/bootstrap.ts",
    "policy/risk.engine.ts",
    "simulation/simulation.engine.ts",
  ],
  lightweightSdkEntrypoints: [
    "src/agent.guard.ts",
    "src/guard.module.ts",
    "src/risk.module.ts",
  ],
} as const;
