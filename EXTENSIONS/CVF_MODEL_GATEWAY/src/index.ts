export type PolicyDecision = "allow" | "deny" | "review" | "sandbox" | "pending";

export interface LLMRequest {
  prompt: string;
  model?: string;
  traceId?: string;
}

export interface LLMUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface LLMResponse {
  text: string;
  usage?: LLMUsage;
  providerId?: string;
  modelId?: string;
}

export interface LLMAdapter {
  readonly providerId: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
}

export interface RuntimeCapability {
  id: string;
  description?: string;
  riskClass?: "low" | "medium" | "high" | "critical";
}

export interface RuntimeContext {
  traceId: string;
  operatorId?: string;
  workspaceId?: string;
}

export interface RuntimeRequest {
  context: RuntimeContext;
  capabilityId: string;
  payload?: unknown;
}

export interface RuntimeResult {
  status: "ok" | "blocked" | "error";
  output?: unknown;
  reason?: string;
}

export interface RuntimeAdapter {
  readonly adapterId: string;
  run(request: RuntimeRequest): Promise<RuntimeResult>;
}

export interface ToolExecutionContext extends RuntimeContext {
  sandboxId?: string;
}

export interface ToolRequest {
  toolId: string;
  input?: unknown;
  context: ToolExecutionContext;
}

export interface ToolResult {
  status: "success" | "failed" | "blocked";
  output?: unknown;
  reason?: string;
}

export interface ToolAdapter {
  readonly toolId: string;
  invoke(request: ToolRequest): Promise<ToolResult>;
}

export interface MemoryContext extends RuntimeContext {
  namespace: string;
}

export interface MemorySetRequest {
  context: MemoryContext;
  key: string;
  value: unknown;
}

export interface MemoryGetRequest {
  context: MemoryContext;
  key: string;
}

export interface MemoryDeleteRequest {
  context: MemoryContext;
  key: string;
}

export interface MemoryListRequest {
  context: MemoryContext;
}

export interface MemoryAdapter {
  set(request: MemorySetRequest): Promise<void>;
  get(request: MemoryGetRequest): Promise<unknown>;
  delete(request: MemoryDeleteRequest): Promise<void>;
  list(request: MemoryListRequest): Promise<string[]>;
}

export interface PolicyContext {
  traceId: string;
  riskClass?: "low" | "medium" | "high" | "critical";
  dataClassification?: "public" | "internal" | "confidential" | "restricted";
}

export interface PolicyEvaluationRequest {
  context: PolicyContext;
  requestedProviderId?: string;
  requestedModelId?: string;
}

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  reason: string;
}

export interface PolicyContract {
  evaluate(request: PolicyEvaluationRequest): PolicyEvaluationResult;
}

export interface ParsedPolicyRule {
  decision: "allow" | "deny" | "review";
  subject: string;
  raw: string;
}

export class NaturalPolicyParser {
  parse(text: string): ParsedPolicyRule[] {
    const normalized = text.toLowerCase();
    const decision = normalized.includes("deny")
      ? "deny"
      : normalized.includes("review")
        ? "review"
        : "allow";
    return [{ decision, subject: normalized.replace(/^(allow|deny|review)\s+/, ""), raw: text }];
  }
}

export class OpenClawAdapter {}
export class PicoClawAdapter {}
export class ZeroClawAdapter {}
export class NanoAdapter {}

export async function executeFilesystemAction(): Promise<ToolResult> {
  return { status: "blocked", reason: "public_model_gateway_requires_explicit_tool_adapter" };
}

export async function executeHttpAction(): Promise<ToolResult> {
  return { status: "blocked", reason: "public_model_gateway_requires_explicit_tool_adapter" };
}

export type RawContentFormat = "markdown" | "text" | "json" | "yaml";

export interface ExternalSkillRaw {
  source: string;
  format: RawContentFormat;
  raw_content: string;
  raw_content_hash: string;
  external_metadata?: {
    title?: string;
    description?: string;
  };
  ingested_at: string;
  ingested_by: string;
  ingestion_pipeline_version: string;
}

export interface CVFSkillDraft {
  skill_id: string;
  slug: string;
  created_at: string;
  updated_at: string;
  source: string;
  original_format: RawContentFormat;
  raw_content_hash: string;
  title: string;
  description: string;
  logic: {
    procedural_steps?: string;
  };
  governance: Record<string, unknown>;
  status: "draft" | "validated" | "certified";
}

export interface CVFSkillCertified extends CVFSkillDraft {
  status: "certified";
  certification: {
    certified_at: string;
    evidence: string[];
  };
}

export class SkillAdapter {
  static async transform(raw: ExternalSkillRaw): Promise<CVFSkillDraft> {
    const title = raw.external_metadata?.title ?? "Imported Skill";
    return {
      skill_id: `skill_${raw.raw_content_hash.replace(/[^a-zA-Z0-9]/g, "_")}`,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      created_at: raw.ingested_at,
      updated_at: raw.ingested_at,
      source: raw.source,
      original_format: raw.format,
      raw_content_hash: raw.raw_content_hash,
      title,
      description: raw.external_metadata?.description ?? raw.raw_content.slice(0, 80),
      logic: {
        procedural_steps: raw.raw_content,
      },
      governance: {
        inferred_risk_level: raw.raw_content.toLowerCase().includes("deploy") ? "medium" : "low",
      },
      status: "draft",
    };
  }
}

export class SkillValidator {
  static async validate(draft: CVFSkillDraft): Promise<CVFSkillDraft> {
    return {
      ...draft,
      governance: {
        ...draft.governance,
        inferred_risk_level: draft.governance.inferred_risk_level ?? "low",
        validation_boundary: "public_model_gateway_deterministic_contract",
      },
      status: "validated",
      updated_at: new Date().toISOString(),
    };
  }
}

export class SkillCertifier {
  static async certify(draft: CVFSkillDraft): Promise<CVFSkillCertified> {
    return {
      ...draft,
      status: "certified",
      certification: {
        certified_at: new Date().toISOString(),
        evidence: ["deterministic_public_contract"],
      },
    };
  }
}

export class ReleaseEvidenceAdapter {
  createReceipt(input: Record<string, unknown>): Record<string, unknown> {
    return {
      ...input,
      adapter: "ReleaseEvidenceAdapter",
      evidenceClass: "deterministic_public_contract",
    };
  }
}

export type {
  GatewayPolicyContext,
  GatewayPolicyResult,
} from "./gateway-policy";
export { isPolicyAllowed } from "./gateway-policy";

export type {
  GatewayRiskClass,
  ProviderModel,
  ProviderRecord,
  ProviderSelectionOptions,
  ProviderStatus,
} from "./provider-registry";
export { ProviderRegistry } from "./provider-registry";

export type {
  ProviderHealthRecord,
  ProviderHealthState,
} from "./provider-health";
export { ProviderHealthMonitor } from "./provider-health";

export type {
  QuotaDecision,
  QuotaLimit,
  QuotaRequest,
  QuotaUsage,
} from "./quota-ledger";
export { QuotaLedger } from "./quota-ledger";

export type {
  GatewayReceipt,
  GatewayReceiptInput,
} from "./gateway-receipt";
export {
  GatewayReceiptBuilder,
  sanitizeReceiptMetadata,
} from "./gateway-receipt";

export type {
  CredentialMetadata,
  CredentialReference,
} from "./credential-boundary";
export {
  CredentialBoundary,
  fingerprintSecret,
  redactSecret,
} from "./credential-boundary";

export type {
  FallbackAttempt,
  FallbackDecision,
  FallbackPolicyConfig,
} from "./fallback-policy";
export { FallbackPolicy } from "./fallback-policy";

export type {
  StickySessionLookupOptions,
  StickySessionRecord,
} from "./sticky-session";
export { StickySessionStore } from "./sticky-session";

export type {
  RoutingDecision,
  RoutingRequest,
} from "./routing-policy";
export { RoutingPolicyEngine } from "./routing-policy";

export const MODEL_GATEWAY_WRAPPER = {
  executionClass: "implementation-owner upgrade",
  runtimeOwnership: "implementation-owner upgrade",
  runtimeAdapterHub: "public self-contained gateway contract surface",
  externalIntegration: "public deterministic skill intake compatibility surface",
  freellmapiSourceLineage: "private provenance CVF 16.5 freellmapi intake",
  preservesRiskModelAssets: true,
  preservesReleaseEvidencePaths: true,
  enforcesGuardContractBeforeRouting: true,
} as const;
