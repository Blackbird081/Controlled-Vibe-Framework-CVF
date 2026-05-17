export { IdentityManager, resetAgentCounter, resetCredCounter } from "../../CVF_ECO_v2.3_AGENT_IDENTITY/src/identity.manager";
export { AgentRegistry } from "../../CVF_ECO_v2.3_AGENT_IDENTITY/src/agent.registry";
export { CredentialStore } from "../../CVF_ECO_v2.3_AGENT_IDENTITY/src/credential.store";
export type {
  AgentIdentity,
  AgentRole,
  TrustLevel,
  PermissionGrant,
  IdentityVerification,
  AgentCredential,
  CredentialType,
} from "../../CVF_ECO_v2.3_AGENT_IDENTITY/src/types";

export const AGENT_DEFINITION_COORDINATION = {
  executionClass: "coordination package",
  runtimeIdentityModule: "EXTENSIONS/CVF_ECO_v2.3_AGENT_IDENTITY",
  capabilityBaselineModule: "EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION",
  linkedCapabilityDocs: [
    "CAPABILITY_RISK_MODEL.md",
    "SKILL_REGISTRY_MODEL.md",
    "SKILL_CONTRACT_SPEC.md",
    "AGENT_ADAPTER_BOUNDARY.md",
  ],
} as const;
