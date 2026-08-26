/**
 * P4B-B Concrete Provider Live Proof Runner
 *
 * Runs ONE bounded live proof of an operator-selected available-key provider
 * through the existing governed Model Gateway bridge, then writes a secret-safe
 * receipt/diagnostic artifact.
 *
 * Provider neutrality: the runner tries operator-approved candidates in order
 * and uses whichever available key authenticates. No provider is canonical,
 * preferred, or ranked. A 401 on one candidate is recorded and the runner falls
 * through to the next available-key candidate.
 *
 * EAFR-R12. Direct invocation of this script is not itself authority. Before
 * any candidate is attempted, the runner parses a
 * `CVF_PROVIDER_EXECUTION_GRANT_JSON` environment value into the existing R1E
 * `ProviderExecutionGrant` shape using secret-safe JSON parsing (malformed
 * input yields `undefined`, never a thrown parse error containing raw
 * content). If that parse fails, or the grant is absent, the runner fails
 * closed before any candidate loop begins: no key presence is checked, no
 * endpoint is resolved, and no harness call is made. This mirrors, and does
 * not duplicate, the binding pattern in `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/
 * cvf-web/src/test/provider-execution-guard.ts`.
 *
 * Secret safety: this script never prints, logs, or writes a raw key value. It
 * reports only key presence as a boolean and the alias used. The provider
 * endpoint receives the secret only inside the harness adapter. It never
 * prints, logs, or writes the raw grant JSON.
 *
 * Usage (operator-authorized only):
 *   CVF_PROVIDER_EXECUTION_GRANT_JSON='{...}' npx tsx EXTENSIONS/CVF_MODEL_GATEWAY/scripts/run-p4b-b-live-proof.ts
 *
 * Invocation itself is the operator-authorized act under GC-018
 * CVF_GC018_MODEL_GATEWAY_C02_P4B_B_LIVE_PROOF_T2_AUTHORIZED_2026-06-15.md.
 * Invocation is no longer sufficient on its own: the parsed grant must also
 * pass `evaluateProviderExecutionAuthority` for each candidate attempted.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import {
  evaluateProviderExecutionAuthority,
  type ProviderExecutionGrant,
} from "cvf-control-plane-foundation";
import { runLiveProof } from "../src/p4b-b-live-proof-harness";
import type { CredentialReference } from "../src/credential-boundary";
import type { GatewayExecuteRequest } from "../src/unified-gateway-interface-contract";
import type { ProviderMethodName } from "../src/provider-method-contract";
import {
  ALIBABA_FREE_QUOTA_LEDGER_REFERENCE,
  getAlibabaFreeQuotaStatus,
  resolveAlibabaDashScopeEndpoint,
} from "../src/alibaba-free-quota-model-ledger";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const ENV_LOCAL = resolve(
  REPO_ROOT,
  "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.local",
);
function resolveReceiptPath(env: Record<string, string | undefined>): string {
  return resolve(
    REPO_ROOT,
    env.CVF_MODEL_GATEWAY_LIVE_RECEIPT_PATH?.trim() ||
      "docs/reviews/evidence/p4b-b-live-proof-receipt-2026-06-15.json",
  );
}

export interface ProviderCandidate {
  providerId: string;
  modelId: string;
  method: ProviderMethodName;
  endpoint?: string;
  aliases: readonly string[];
}

// Operator-approved available-key candidates. Order is not a preference ranking;
// it is the order of attempt. None is canonical CVF product scope.
const CANDIDATES: readonly ProviderCandidate[] = [
  {
    providerId: "alibaba",
    modelId: "qwen3.7-plus",
    method: "complete",
    aliases: [
      "DASHSCOPE_API_KEY",
      "ALIBABA_API_KEY",
      "CVF_ALIBABA_API_KEY",
      "CVF_BENCHMARK_ALIBABA_KEY",
    ],
  },
  {
    providerId: "deepseek",
    modelId: "deepseek-chat",
    method: "complete",
    endpoint: "https://api.deepseek.com/chat/completions",
    aliases: ["DEEPSEEK_API_KEY"],
  },
];

function loadEnvLocal(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) {
    return out;
  }
  for (const rawLine of readFileSync(path, "utf-8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function firstPresentAlias(
  env: Record<string, string | undefined>,
  aliases: readonly string[],
): string | undefined {
  return aliases.find((alias) => Boolean(env[alias]?.trim()));
}

/**
 * Secret-safe grant parsing: malformed or absent input yields `undefined`,
 * never a thrown error that could echo raw content. The grant itself carries
 * no secret value; it is identity/authority metadata only.
 */
function parseProviderExecutionGrant(
  raw: string | undefined,
): ProviderExecutionGrant | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as ProviderExecutionGrant;
  } catch {
    return undefined;
  }
}

function safeMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.split(":")[0] ?? "live_proof_error";
  }
  return "live_proof_unknown_error";
}

export interface AttemptOutcome {
  providerId: string;
  modelId: string;
  endpointHost: string | null;
  keyAliasUsed: string | null;
  keyPresent: boolean;
  freeQuotaStatus: "usable" | "expired" | "unknown" | "not_applicable";
  outcome:
    | "PASS"
    | "PARTIAL"
    | "FAIL"
    | "SKIPPED_NO_KEY"
    | "SKIPPED_FREE_QUOTA_EXPIRED"
    | "SKIPPED_FREE_QUOTA_UNKNOWN";
  latencyMs: number | null;
  admissionStatus: string | null;
  bridgeErrorClass: string | null;
  detail: Record<string, unknown> | null;
}

export interface RunnerGrantContext {
  providerExecutionGrant: ProviderExecutionGrant | undefined;
  workerAgentId: string;
  delegationId: string;
  grantId: string;
  consumedCalls: number;
  nowIso?: string;
}

export function consumesProviderCall(outcome: AttemptOutcome): boolean {
  if (outcome.latencyMs === null) return false;
  const diagnostic = outcome.detail?.diagnostic;
  return !(
    typeof diagnostic === "object" &&
    diagnostic !== null &&
    "stage" in diagnostic &&
    diagnostic.stage === "grant_evaluation"
  );
}

export async function attemptCandidate(
  candidate: ProviderCandidate,
  env: Record<string, string | undefined>,
  grantContext: RunnerGrantContext,
): Promise<AttemptOutcome> {
  // Reviewer repair: the runner owns a pre-environment authority gate too.
  // Do not inspect candidate aliases or resolve endpoints until the existing
  // R1E evaluator accepts this exact provider/request binding.
  const authorityResult = evaluateProviderExecutionAuthority(
    grantContext.providerExecutionGrant,
    {
      workerAgentId: grantContext.workerAgentId,
      delegationId: grantContext.delegationId,
      grantId: grantContext.grantId,
      provider: candidate.providerId,
      consumedCalls: grantContext.consumedCalls,
      nowIso: grantContext.nowIso ?? new Date().toISOString(),
    },
  );
  if (!authorityResult.allowed) {
    return {
      providerId: candidate.providerId,
      modelId: candidate.modelId,
      endpointHost: null,
      keyAliasUsed: null,
      keyPresent: false,
      freeQuotaStatus: "not_applicable",
      outcome: "FAIL",
      latencyMs: null,
      admissionStatus: null,
      bridgeErrorClass: null,
      detail: {
        diagnostic: {
          stage: "grant_evaluation",
          class: "live_proof_grant_denied",
          retryable: false,
          userAction: "obtain a valid orchestrator provider execution grant before retrying",
          provider: candidate.providerId,
          model: candidate.modelId,
          message: authorityResult.reason,
        },
      },
    };
  }

  const aliasUsed = firstPresentAlias(env, candidate.aliases);
  const endpoint =
    candidate.endpoint ??
    (candidate.providerId === "alibaba"
      ? resolveAlibabaDashScopeEndpoint(env)
      : "");
  const freeQuotaStatus =
    candidate.providerId === "alibaba"
      ? getAlibabaFreeQuotaStatus(candidate.modelId)
      : "not_applicable";
  const base: AttemptOutcome = {
    providerId: candidate.providerId,
    modelId: candidate.modelId,
    endpointHost: endpoint ? new URL(endpoint).host : null,
    keyAliasUsed: aliasUsed ?? null,
    keyPresent: Boolean(aliasUsed),
    freeQuotaStatus,
    outcome: "SKIPPED_NO_KEY",
    latencyMs: null,
    admissionStatus: null,
    bridgeErrorClass: null,
    detail: null,
  };
  if (!aliasUsed) {
    return base;
  }
  if (freeQuotaStatus === "expired" || freeQuotaStatus === "unknown") {
    return {
      ...base,
      outcome:
        freeQuotaStatus === "expired"
          ? "SKIPPED_FREE_QUOTA_EXPIRED"
          : "SKIPPED_FREE_QUOTA_UNKNOWN",
      detail: {
        diagnostic: {
          stage: "free_quota_preflight",
          class:
            freeQuotaStatus === "expired"
              ? "model_free_quota_expired"
              : "model_free_quota_not_verified",
          retryable: false,
          userAction:
            "refresh Alibaba free-quota ledger before live Model Gateway proof",
          provider: candidate.providerId,
          model: candidate.modelId,
          ledgerRef: ALIBABA_FREE_QUOTA_LEDGER_REFERENCE,
        },
      },
    };
  }

  const traceId = `p4b-b-live-${candidate.providerId}-${Date.now()}`;
  const credentialReference: CredentialReference = {
    providerId: candidate.providerId,
    keyId: `${candidate.providerId}-live-proof`,
    envNames: [aliasUsed],
  };
  const request: GatewayExecuteRequest = {
    traceId,
    prompt: "Reply with the single word: pong",
    policy: {
      traceId,
      policyResult: "allow",
      reason: "p4b_b_live_proof_allow",
      allowedProviderIds: [candidate.providerId],
    },
    routing: {
      traceId,
      preferredProviderId: candidate.providerId,
      requestedModelId: candidate.modelId,
      estimatedTokens: 32,
    },
  };

  const callStart = Date.now();
  try {
    const result = await runLiveProof(
      {
        providerId: candidate.providerId,
        modelId: candidate.modelId,
        method: candidate.method,
        credentialReference,
        env,
        endpoint,
        liveAuthorized: true,
        providerExecutionGrant: grantContext.providerExecutionGrant,
        workerAgentId: grantContext.workerAgentId,
        delegationId: grantContext.delegationId,
        grantId: grantContext.grantId,
        consumedCalls: grantContext.consumedCalls,
        nowIso: grantContext.nowIso,
      },
      request,
    );
    const latencyMs = Date.now() - callStart;
    if (
      !result.authorized &&
      "diagnostic" in result &&
      result.diagnostic === "live_proof_grant_denied"
    ) {
      return {
        ...base,
        outcome: "FAIL",
        latencyMs,
        detail: {
          diagnostic: {
            stage: "grant_evaluation",
            class: "live_proof_grant_denied",
            retryable: false,
            userAction: "obtain a valid orchestrator provider execution grant before retrying",
            provider: candidate.providerId,
            model: candidate.modelId,
            traceId,
            message: result.reason,
          },
        },
      };
    }
    if (result.authorized && result.bridgeResult.response) {
      const r = result.bridgeResult;
      return {
        ...base,
        outcome: "PASS",
        latencyMs,
        admissionStatus: result.admissionStatus,
        detail: {
          receipt: {
            receiptId: r.receipt.receiptId,
            traceId: r.receipt.traceId,
            providerId: r.receipt.providerId,
            selectedModelId: r.receipt.selectedModelId,
            decision: r.receipt.decision,
          },
          response: {
            model: r.response!.model,
            textLength: r.response!.text.length,
            textPreview: r.response!.text.slice(0, 40),
            usage: r.response!.usage ?? null,
          },
        },
      };
    }
    const err = result.authorized ? result.bridgeResult.error : undefined;
    return {
      ...base,
      outcome: "PARTIAL",
      latencyMs,
      admissionStatus: result.authorized ? result.admissionStatus : null,
      bridgeErrorClass: err?.errorClass ?? "no_response",
      detail: {
        diagnostic: {
          stage: "bridge_execute",
          class: err?.errorClass ?? "no_response",
          retryable: err?.retryable ?? false,
          userAction: "inspect governed bridge error class",
          provider: candidate.providerId,
          model: candidate.modelId,
          traceId,
          message: err?.message ?? "bridge returned no response",
        },
      },
    };
  } catch (error: unknown) {
    const latencyMs = Date.now() - callStart;
    return {
      ...base,
      outcome: "FAIL",
      latencyMs,
      detail: {
        diagnostic: {
          stage: "live_call",
          class: safeMessage(error),
          retryable: true,
          userAction: "classify failure before any rerun",
          provider: candidate.providerId,
          model: candidate.modelId,
          traceId,
          message: safeMessage(error),
        },
      },
    };
  }
}

async function main(): Promise<number> {
  const startedAt = new Date().toISOString();
  const authorityEnv = process.env as Record<string, string | undefined>;
  const receiptPath = resolveReceiptPath(authorityEnv);

  // EAFR-R12. Fail closed before any candidate is attempted: direct
  // invocation of this script is not itself authority. A malformed or absent
  // grant stops the run here, with no key presence check, no endpoint
  // resolution, and no harness call for any candidate.
  const providerExecutionGrant = parseProviderExecutionGrant(
    authorityEnv.CVF_PROVIDER_EXECUTION_GRANT_JSON,
  );
  const workerAgentId = authorityEnv.CVF_AGENT_ID ?? "";
  const delegationId = authorityEnv.CVF_DELEGATION_ID ?? "";
  const grantId = authorityEnv.CVF_PROVIDER_EXECUTION_GRANT_ID ?? "";

  if (!providerExecutionGrant) {
    writeArtifact({
      proof: "model-gateway-c02-p4b-b-live-proof",
      contractVersion: "cvf.p4bBLiveProofHarness.t3.v1",
      startedAt,
      finishedAt: new Date().toISOString(),
      overall: "BLOCKED_OR_PARTIAL",
      governedChain: ["grant_parsing"],
      providerNeutralityNote:
        "no candidate was attempted; no key presence was checked and no endpoint was resolved",
      selectedProof: null,
      attempts: [],
      blockedReason:
        "missing or malformed CVF_PROVIDER_EXECUTION_GRANT_JSON: no orchestrator provider execution grant was parsed",
    }, receiptPath);
    console.log(
      "P4B-B live proof overall: BLOCKED_OR_PARTIAL (no orchestrator provider execution grant parsed; no candidate attempted)",
    );
    return 1;
  }

  // A parseable grant is not enough. Require at least one candidate-specific
  // evaluator acceptance before loading the key-bearing local environment.
  // Each candidate is evaluated again inside attemptCandidate before its own
  // aliases or endpoint are inspected.
  const preflightNowIso = new Date().toISOString();
  const hasAuthorizedCandidate = CANDIDATES.some((candidate) =>
    evaluateProviderExecutionAuthority(providerExecutionGrant, {
      workerAgentId,
      delegationId,
      grantId,
      provider: candidate.providerId,
      consumedCalls: 0,
      nowIso: preflightNowIso,
    }).allowed,
  );
  if (!hasAuthorizedCandidate) {
    writeArtifact({
      proof: "model-gateway-c02-p4b-b-live-proof",
      contractVersion: "cvf.p4bBLiveProofHarness.t3.v1",
      startedAt,
      finishedAt: new Date().toISOString(),
      overall: "BLOCKED_OR_PARTIAL",
      governedChain: ["grant_evaluation"],
      providerNeutralityNote:
        "no candidate was authorized; no key-bearing local environment was loaded and no endpoint was resolved",
      selectedProof: null,
      attempts: [],
      blockedReason:
        "provider execution grant did not authorize any configured candidate",
    }, receiptPath);
    console.log(
      "P4B-B live proof overall: BLOCKED_OR_PARTIAL (grant authorized no configured candidate; no key-bearing environment loaded)",
    );
    return 1;
  }

  const env: Record<string, string | undefined> = {
    ...loadEnvLocal(ENV_LOCAL),
    ...authorityEnv,
  };

  const attempts: AttemptOutcome[] = [];
  let proof: AttemptOutcome | null = null;
  let consumedCalls = 0;
  for (const candidate of CANDIDATES) {
    const outcome = await attemptCandidate(candidate, env, {
      providerExecutionGrant,
      workerAgentId,
      delegationId,
      grantId,
      consumedCalls,
      nowIso: new Date().toISOString(),
    });
    attempts.push(outcome);
    if (consumesProviderCall(outcome)) {
      consumedCalls += 1;
    }
    if (outcome.outcome === "PASS") {
      proof = outcome;
      break;
    }
  }

  const overall = proof ? "PASS" : "BLOCKED_OR_PARTIAL";
  writeArtifact({
    proof: "model-gateway-c02-p4b-b-live-proof",
    contractVersion: "cvf.p4bBLiveProofHarness.t3.v1",
    startedAt,
    finishedAt: new Date().toISOString(),
    overall,
    governedChain: [
      "RoutingPolicyEngine",
      "CredentialBoundary",
      "ProviderHealthMonitor",
      "QuotaLedger",
      "admitProviderAdapter(P5-A)",
      "checkBridgeAdmission(P5-C)",
      "ProviderExecutionBridge.execute",
    ],
    providerNeutralityNote:
      "candidates are operator-available-key live-test adapters only; none is canonical CVF product scope, preferred, or ranked",
    alibabaEndpointHandling: {
      // Reuse the already-authorized candidate result. Do not perform a fresh
      // Alibaba endpoint resolution while writing a receipt when the grant
      // authorized only another provider.
      defaultEndpointHost:
        attempts.find((attempt) => attempt.providerId === "alibaba")
          ?.endpointHost ?? null,
      overrideEnvNames: [
        "DASHSCOPE_COMPAT_ENDPOINT",
        "ALIBABA_DASHSCOPE_ENDPOINT",
        "CVF_ALIBABA_DASHSCOPE_ENDPOINT",
      ],
      freeQuotaLedgerRef: ALIBABA_FREE_QUOTA_LEDGER_REFERENCE,
    },
    selectedProof: proof,
    attempts,
  }, receiptPath);

  for (const a of attempts) {
    console.log(
      `P4B-B candidate ${a.providerId}/${a.modelId}: ${a.outcome}` +
        (a.endpointHost ? ` endpointHost=${a.endpointHost}` : "") +
        ` freeQuotaStatus=${a.freeQuotaStatus}` +
        (a.latencyMs !== null ? ` latencyMs=${a.latencyMs}` : "") +
        (a.bridgeErrorClass ? ` errorClass=${a.bridgeErrorClass}` : ""),
    );
  }
  console.log(`P4B-B live proof overall: ${overall}`);
  return proof ? 0 : 1;
}

function writeArtifact(payload: Record<string, unknown>, receiptPath: string): void {
  const dir = dirname(receiptPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(receiptPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((error: unknown) => {
      console.log(`P4B-B live proof harness error: ${safeMessage(error)}`);
      process.exit(1);
    });
}
