/**
 * P4B-B Concrete Provider Live Proof Harness
 *
 * Builds the existing governed Model Gateway chain (routing, credential
 * boundary, health, quota, receipt, P5-A admission, P5-C bridge admission,
 * ProviderExecutionBridge.execute) around a thin bridge-compatible adapter for
 * an operator-selected available-key provider.
 *
 * This harness is live-proof-only. It does NOT introduce a new canonical
 * provider, a new provider-execution semantic, or a new marketplace. The wrapper
 * adapter exists solely so a real provider response can flow through the
 * existing bridge for one bounded proof.
 *
 * EAFR-R12. `liveAuthorized` is a live-selection gate only, never sufficient
 * authority on its own. Before any secret is resolved or the bridge is built,
 * the harness requires the existing R1E `ProviderExecutionGrant` to pass
 * `evaluateProviderExecutionAuthority` from `cvf-control-plane-foundation`,
 * exactly as `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/test/
 * provider-execution-guard.ts` already binds it for the fetch-level guard.
 * This harness does not duplicate that evaluator or define a parallel grant
 * type; it imports the same exported symbols through the package's public
 * barrel.
 *
 * Secret safety: the harness never returns, logs, or embeds a raw key value. It
 * resolves the secret only through CredentialBoundary.resolveSecretForRuntime,
 * and only after both liveAuthorized === true and the orchestrator grant is
 * evaluated as allowed. When either condition fails, it makes no network call
 * and reads no secret.
 *
 * Contract version: cvf.p4bBLiveProofHarness.t3.v1
 */
import {
  evaluateProviderExecutionAuthority,
  type ProviderExecutionGrant,
} from "cvf-control-plane-foundation";
import type {
  ProviderExecutionAdapter,
  ProviderExecutionBridgeResult,
} from "./provider-execution-bridge";
import { ProviderExecutionBridge } from "./provider-execution-bridge";
import type { GatewayExecuteRequest } from "./unified-gateway-interface-contract";
import type { CredentialReference } from "./credential-boundary";
import { CredentialBoundary } from "./credential-boundary";
import { RoutingPolicyEngine } from "./routing-policy";
import { ProviderHealthMonitor } from "./provider-health";
import { QuotaLedger } from "./quota-ledger";
import { ProviderRegistry } from "./provider-registry";
import { GatewayReceiptBuilder } from "./gateway-receipt";
import { evaluateProviderAdapterConformance } from "./provider-adapter-conformance";
import { admitProviderAdapter } from "./provider-adapter-admission";
import type { AdapterAdmissionRecord } from "./provider-adapter-admission";
import { PROVIDER_CAPABILITY_REGISTRY } from "./provider-capability-registry";
import type { ProviderMethodName } from "./provider-method-contract";
import { resolveAlibabaDashScopeEndpoint } from "./alibaba-free-quota-model-ledger";
import {
  createOpenAiCompatibleExecuteAdapter,
  type OpenAiCompatibleFetch,
} from "./openai-compatible-execute-adapter";

export { createOpenAiCompatibleExecuteAdapter } from "./openai-compatible-execute-adapter";

export const P4B_B_LIVE_PROOF_HARNESS_VERSION =
  "cvf.p4bBLiveProofHarness.t3.v1" as const;

/**
 * Minimal POST shape mirroring the existing sample adapters' FetchLike so the
 * harness can be tested with an injected fetch double and never depends on a
 * real network in unit tests.
 */
export type LiveProofFetch = OpenAiCompatibleFetch;

export interface LiveProofHarnessOptions {
  /** Operator-selected provider id (e.g. "alibaba"). Not canonical scope. */
  providerId: string;
  /** Operator-selected model id (e.g. "qwen-flash"). */
  modelId: string;
  /** Method exercised through the bridge; must be supported in the registry. */
  method: ProviderMethodName;
  /** Credential reference whose envNames alias an operator-approved key. */
  credentialReference: CredentialReference;
  /** Environment source for the credential boundary (default process.env). */
  env?: Record<string, string | undefined>;
  /** DashScope OpenAI-compatible completion endpoint. */
  endpoint?: string;
  /** Injected fetch for tests; real fetch used only when liveAuthorized. */
  fetchImpl?: LiveProofFetch;
  /**
   * Live-selection gate only, from EAFR-R12. When false, the harness performs
   * NO network call and reads NO secret; it returns a classified dry-run
   * diagnostic instead. When true it is necessary but NOT sufficient: the
   * orchestrator grant below must still evaluate as allowed before any
   * secret is resolved.
   */
  liveAuthorized: boolean;
  /**
   * The existing R1E orchestrator-issued grant. Absent, malformed, or
   * evaluated as not-allowed denies before secret resolution, regardless of
   * `liveAuthorized`.
   */
  providerExecutionGrant?: ProviderExecutionGrant;
  /** Requesting worker/agent identity bound against the grant subject. */
  workerAgentId: string;
  /** Requesting delegation identity bound against the grant delegation. */
  delegationId: string;
  /** Grant id presented by the caller, matched against the grant's own id. */
  grantId: string;
  /** Calls already consumed under this grant before this request. */
  consumedCalls: number;
  /** Current time as ISO-8601, injectable for deterministic tests. */
  nowIso?: string;
}

export interface LiveProofDryRunResult {
  authorized: false;
  diagnostic: "live_proof_not_authorized";
  message: string;
  providerId: string;
  modelId: string;
}

export interface LiveProofGrantDeniedResult {
  authorized: false;
  diagnostic: "live_proof_grant_denied";
  message: string;
  reason: string;
  providerId: string;
  modelId: string;
}

export interface LiveProofResult {
  authorized: true;
  admissionStatus: AdapterAdmissionRecord["status"];
  bridgeResult: ProviderExecutionBridgeResult;
}

export type HarnessRunResult =
  | LiveProofDryRunResult
  | LiveProofGrantDeniedResult
  | LiveProofResult;

/**
 * Run one bounded live proof through the governed bridge.
 *
 * When liveAuthorized === false: returns a dry-run diagnostic without reading a
 * secret or making a network call.
 *
 * When liveAuthorized === true: resolves the operator-approved secret, builds an
 * admitted bridge, and runs one prompt through ProviderExecutionBridge.execute.
 */
export async function runLiveProof(
  options: LiveProofHarnessOptions,
  request: GatewayExecuteRequest,
): Promise<HarnessRunResult> {
  if (!options.liveAuthorized) {
    return {
      authorized: false,
      diagnostic: "live_proof_not_authorized",
      message:
        "liveAuthorized is false: no network call and no secret read were performed.",
      providerId: options.providerId,
      modelId: options.modelId,
    };
  }

  // EAFR-R12. liveAuthorized alone is a selection signal, never authority.
  // Every live-selected request must still pass the existing R1E evaluator
  // before any secret is resolved or the bridge is built.
  const authorityResult = evaluateProviderExecutionAuthority(
    options.providerExecutionGrant,
    {
      workerAgentId: options.workerAgentId,
      delegationId: options.delegationId,
      grantId: options.grantId,
      provider: options.providerId,
      consumedCalls: options.consumedCalls,
      nowIso: options.nowIso ?? new Date().toISOString(),
    },
  );
  if (!authorityResult.allowed) {
    return {
      authorized: false,
      diagnostic: "live_proof_grant_denied",
      message:
        "provider execution grant denied: no network call and no secret read were performed.",
      reason: authorityResult.reason,
      providerId: options.providerId,
      modelId: options.modelId,
    };
  }

  const env = options.env ?? (process.env as Record<string, string | undefined>);
  const credential = new CredentialBoundary(env);
  const secret = credential.resolveSecretForRuntime(options.credentialReference);
  if (!secret) {
    // Secret-safe: report absence as a classified diagnostic, never a value.
    throw new Error(
      `live_proof_credential_absent: no value present for provider=${options.providerId} via approved alias(es)`,
    );
  }

  const endpoint =
    options.endpoint ??
    (options.providerId === "alibaba"
      ? resolveAlibabaDashScopeEndpoint(env)
      : undefined);
  if (!endpoint) {
    throw new Error(
      `live_proof_endpoint_absent: no endpoint supplied for provider=${options.providerId}`,
    );
  }
  const fetchImpl =
    options.fetchImpl ?? (globalThis.fetch as unknown as LiveProofFetch);

  const adapter = createOpenAiCompatibleExecuteAdapter({
    providerId: options.providerId,
    modelId: options.modelId,
    endpoint,
    secret,
    fetchImpl,
  });

  // Governed admission chain: P4C conformance -> P5-A admission record.
  const conformanceReport = evaluateProviderAdapterConformance({
    providerId: options.providerId,
    modelId: options.modelId,
    method: options.method,
    adapter,
    capabilityRegistry: PROVIDER_CAPABILITY_REGISTRY,
    credentialMetadataAvailable: true,
  });
  const admissionRecord = admitProviderAdapter(
    conformanceReport,
    PROVIDER_CAPABILITY_REGISTRY,
    { requireCredentialMetadata: false },
  );

  // Governed bridge: existing routing/health/quota/receipt owners.
  const registry = new ProviderRegistry();
  registry.register({
    id: options.providerId,
    displayName: options.providerId,
    status: "enabled",
    riskClass: "low",
    models: [{ id: options.modelId, riskClass: "low" }],
  });
  const health = new ProviderHealthMonitor();
  const quota = new QuotaLedger();
  const receipt = new GatewayReceiptBuilder();
  const routing = new RoutingPolicyEngine(registry, health, quota);

  const credentialRefs = new Map<string, CredentialReference>();
  credentialRefs.set(options.providerId, options.credentialReference);
  const adapters = new Map<string, ProviderExecutionAdapter>();
  adapters.set(options.providerId, adapter);
  const admissionRecords = new Map<string, AdapterAdmissionRecord>();
  admissionRecords.set(options.providerId, admissionRecord);

  const bridge = new ProviderExecutionBridge({
    routing,
    credential,
    health,
    quota,
    receipt,
    credentialRefs,
    adapters,
    admissionRecords,
  });

  const bridgeResult = await bridge.execute(request);
  return {
    authorized: true,
    admissionStatus: admissionRecord.status,
    bridgeResult,
  };
}
