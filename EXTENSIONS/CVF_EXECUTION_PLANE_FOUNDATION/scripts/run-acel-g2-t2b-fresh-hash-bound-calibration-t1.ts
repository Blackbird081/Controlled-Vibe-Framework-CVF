/**
 * ACEL G2-T2B fresh hash-bound calibration T1.
 *
 * Operator authority (2026-09-16): exactly one qwen3.7-flash call, zero
 * retries, bound to the frozen T2A contract and test hashes. This is a direct
 * Model Gateway calibration only. It does not open MAO runtime, T6B, a
 * comparison lane, production binding, public sync, or deployment.
 */
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import {
  DISCRIMINATING_TASK_ID,
  DISCRIMINATING_TASK_PROMPT,
  evaluateDiscriminatingTask,
  parseDiscriminatingTaskResponse,
} from "../src/mao/g2.t2.discriminating.task.contract";
import type { CredentialReference } from "../../CVF_MODEL_GATEWAY/src/credential-boundary";
import type { ProviderExecutionGrant } from "../../CVF_CONTROL_PLANE_FOUNDATION/src/delegation.contract";
import {
  runLiveProof,
  type HarnessRunResult,
} from "../../CVF_MODEL_GATEWAY/src/p4b-b-live-proof-harness";
import {
  getAlibabaFreeQuotaStatus,
  resolveAlibabaDashScopeEndpoint,
} from "../../CVF_MODEL_GATEWAY/src/alibaba-free-quota-model-ledger";
import type { GatewayExecuteRequest } from "../../CVF_MODEL_GATEWAY/src/unified-gateway-interface-contract";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const ENV_LOCAL = resolve(REPO_ROOT, "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.local");
const CONTRACT_PATH = resolve(
  REPO_ROOT,
  "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/g2.t2.discriminating.task.contract.ts",
);
const TEST_PATH = resolve(
  REPO_ROOT,
  "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/g2.t2.discriminating.task.contract.test.ts",
);
const RESULT_PATH = resolve(
  REPO_ROOT,
  "docs/reviews/evidence/acel-g2-t2b-fresh-hash-bound-calibration-t1-live-2026-09-16.json",
);
const EXPECTED_CONTRACT_SHA256 = "30a626eed0a411571ec854fe0f1f0bf3b20ee7cad343d76e32721e6a1a681bf4";
const EXPECTED_TEST_SHA256 = "4f6c9ccb6369cbb76cc2954cbbbd3601ea695fec0cb3ba60b1b6e0129df3f0d5";
const PROVIDER_ID = "alibaba";
const MODEL_ID = "qwen3.7-flash";
const GRANT_ID = "acel-g2-t2b-fresh-hash-bound-calibration-t1-2026-09-16";
const SUBJECT_ID = "ACEL-G2-T2B-FRESH-HASH-BOUND-CALIBRATION-T1";
const KEY_ALIASES = [
  "DASHSCOPE_API_KEY",
  "ALIBABA_API_KEY",
  "CVF_ALIBABA_API_KEY",
  "CVF_BENCHMARK_ALIBABA_KEY",
] as const;

const providerExecutionGrant: ProviderExecutionGrant = {
  authority: "ORCHESTRATOR_GRANT_REQUIRED",
  grantId: GRANT_ID,
  authorizedBy: "ORCHESTRATOR",
  subjectAgentId: SUBJECT_ID,
  delegationId: SUBJECT_ID,
  allowedProviders: [PROVIDER_ID],
  maxCalls: 1,
  expiresAt: "2026-09-17T23:59:59+07:00",
};

interface SafeDiagnostic {
  stage: "request_validation" | "auth" | "provider" | "output_validation" | "network";
  class: string;
  retryable: false;
  userAction: "do_not_retry_without_new_evidence";
  provider: string;
  model: string;
  httpStatus: number | null;
  latencyMs: number | null;
  receiptId: string;
  traceId: string | null;
  safeMessage: string;
}

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function loadEnvLocal(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function firstPresentAlias(env: Record<string, string | undefined>): string | undefined {
  return KEY_ALIASES.find((alias) => Boolean(env[alias]?.trim()));
}

function writeArtifact(payload: Record<string, unknown>): void {
  mkdirSync(dirname(RESULT_PATH), { recursive: true });
  writeFileSync(RESULT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function diagnostic(
  stage: SafeDiagnostic["stage"],
  errorClass: string,
  safeMessage: string,
  latencyMs: number | null,
  traceId: string | null,
): SafeDiagnostic {
  return {
    stage,
    class: errorClass,
    retryable: false,
    userAction: "do_not_retry_without_new_evidence",
    provider: PROVIDER_ID,
    model: MODEL_ID,
    httpStatus: null,
    latencyMs,
    receiptId: GRANT_ID,
    traceId,
    safeMessage,
  };
}

async function main(): Promise<number> {
  if (existsSync(RESULT_PATH)) {
    console.log("ACEL-G2-T2B: BLOCKED_EXISTING_RECEIPT; callCount=0 retryCount=0");
    return 1;
  }

  const startedAt = new Date().toISOString();
  const contractSha256 = sha256File(CONTRACT_PATH);
  const testSha256 = sha256File(TEST_PATH);
  if (contractSha256 !== EXPECTED_CONTRACT_SHA256 || testSha256 !== EXPECTED_TEST_SHA256) {
    writeArtifact({
      run: SUBJECT_ID,
      startedAt,
      finishedAt: new Date().toISOString(),
      callAttempted: false,
      callCount: 0,
      retryCount: 0,
      expectedHashes: { contractSha256: EXPECTED_CONTRACT_SHA256, testSha256: EXPECTED_TEST_SHA256 },
      observedHashes: { contractSha256, testSha256 },
      verdict: "BLOCKED_HASH_MISMATCH",
      diagnostic: diagnostic("request_validation", "hash_mismatch", "Frozen T2A hashes do not match.", null, null),
    });
    console.log("ACEL-G2-T2B: BLOCKED_HASH_MISMATCH; callCount=0 retryCount=0");
    return 1;
  }

  const env: Record<string, string | undefined> = { ...loadEnvLocal(ENV_LOCAL), ...process.env };
  const keyAlias = firstPresentAlias(env);
  const freeQuotaStatus = getAlibabaFreeQuotaStatus(MODEL_ID);
  if (!keyAlias || freeQuotaStatus !== "usable") {
    const reason = !keyAlias ? "missing_api_key" : `free_quota_${freeQuotaStatus}`;
    writeArtifact({
      run: SUBJECT_ID,
      startedAt,
      finishedAt: new Date().toISOString(),
      modelId: MODEL_ID,
      callAttempted: false,
      callCount: 0,
      retryCount: 0,
      boundHashes: { contractSha256, testSha256 },
      verdict: "BLOCKED_PREFLIGHT",
      diagnostic: diagnostic("auth", reason, "Credential alias or ledger eligibility preflight failed.", null, null),
    });
    console.log(`ACEL-G2-T2B: BLOCKED_PREFLIGHT class=${reason}; callCount=0 retryCount=0`);
    return 1;
  }

  const endpoint = resolveAlibabaDashScopeEndpoint(env);
  const traceId = `acel-g2-t2b-${Date.now()}`;
  const credentialReference: CredentialReference = {
    providerId: PROVIDER_ID,
    keyId: `${PROVIDER_ID}-acel-g2-t2b`,
    envNames: [keyAlias],
  };
  const request: GatewayExecuteRequest = {
    traceId,
    prompt: DISCRIMINATING_TASK_PROMPT,
    policy: {
      traceId,
      policyResult: "allow",
      reason: "operator_approved_one_call_hash_bound_calibration",
      allowedProviderIds: [PROVIDER_ID],
    },
    routing: {
      traceId,
      preferredProviderId: PROVIDER_ID,
      requestedModelId: MODEL_ID,
      estimatedTokens: 500,
    },
  };

  const callStartedAt = Date.now();
  let harnessResult: HarnessRunResult | null = null;
  let safeDiagnostic: SafeDiagnostic | null = null;
  try {
    harnessResult = await runLiveProof(
      {
        providerId: PROVIDER_ID,
        modelId: MODEL_ID,
        method: "complete",
        credentialReference,
        env,
        endpoint,
        liveAuthorized: true,
        providerExecutionGrant,
        workerAgentId: SUBJECT_ID,
        delegationId: SUBJECT_ID,
        grantId: GRANT_ID,
        consumedCalls: 0,
      },
      request,
    );
  } catch (error) {
    const safeClass = error instanceof Error ? error.message.split(":")[0] : "unknown_error";
    safeDiagnostic = diagnostic("network", safeClass, safeClass, Date.now() - callStartedAt, traceId);
  }
  const latencyMs = Date.now() - callStartedAt;

  let rawResponseText: string | null = null;
  let usage: { inputTokens: number; outputTokens: number } | null = null;
  if (harnessResult?.authorized) {
    rawResponseText = harnessResult.bridgeResult.response?.text ?? null;
    usage = harnessResult.bridgeResult.response?.usage ?? null;
    if (!rawResponseText) {
      const errorClass = harnessResult.bridgeResult.error?.errorClass ?? "provider_empty_output";
      safeDiagnostic = diagnostic("provider", errorClass, errorClass, latencyMs, traceId);
    }
  } else if (harnessResult && !harnessResult.authorized) {
    safeDiagnostic = diagnostic(
      "auth",
      harnessResult.diagnostic,
      harnessResult.diagnostic,
      latencyMs,
      traceId,
    );
  }

  const parsed = rawResponseText ? parseDiscriminatingTaskResponse(rawResponseText) : null;
  const evaluation = rawResponseText ? evaluateDiscriminatingTask(rawResponseText) : null;
  if (rawResponseText && parsed && !parsed.ok) {
    safeDiagnostic = diagnostic("output_validation", parsed.reason, parsed.reason, latencyMs, traceId);
  }

  const ok = Boolean(rawResponseText && evaluation);
  writeArtifact({
    run: SUBJECT_ID,
    taskId: DISCRIMINATING_TASK_ID,
    startedAt,
    finishedAt: new Date().toISOString(),
    providerId: PROVIDER_ID,
    modelId: MODEL_ID,
    endpointHost: new URL(endpoint).host,
    keyAliasUsed: keyAlias,
    traceId,
    grant: { grantId: GRANT_ID, maxCalls: 1, authorizedBy: "ORCHESTRATOR" },
    operatorApproval: "one qwen3.7-flash call; no retry; exact two hashes; fail-closed; no runtime/T6B",
    boundHashes: { contractSha256, testSha256 },
    callAttempted: true,
    callCount: 1,
    retryCount: 0,
    latencyMs,
    usage,
    rawResponseSha256: rawResponseText ? createHash("sha256").update(rawResponseText, "utf8").digest("hex") : null,
    rawResponseLength: rawResponseText?.length ?? null,
    sanitizedCandidate: parsed?.ok ? parsed.raw : null,
    rubric: evaluation?.rubric ?? null,
    defects: evaluation?.defects ?? null,
    materialDefectFound: evaluation?.materialDefectFound ?? null,
    releaseCandidateAsCalibrationEvidence: evaluation?.releaseCandidate ?? null,
    decisionOwner: "local_reviewer",
    diagnostic: safeDiagnostic,
    ok,
    claimBoundary: "One direct calibration point only; no runtime, T6B, comparison, production, public, or deployment authority.",
  });

  console.log(
    `ACEL-G2-T2B: ok=${ok} callCount=1 retryCount=0 score=${evaluation?.rubric.score ?? "n/a"} ` +
      `materialDefectFound=${evaluation?.materialDefectFound ?? "n/a"} ` +
      `releaseCandidate=${evaluation?.releaseCandidate ?? "n/a"}`,
  );
  if (safeDiagnostic) console.log(`ACEL-G2-T2B diagnostic: class=${safeDiagnostic.class} retryable=false`);
  return ok ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    const safeClass = error instanceof Error ? error.message.split(":")[0] : "unknown_error";
    console.error(`ACEL-G2-T2B: unhandled class=${safeClass}; no retry`);
    process.exit(1);
  });
