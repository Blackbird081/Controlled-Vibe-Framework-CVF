/**
 * MAO-OA-T6A Harder Candidate Direct Baseline Calibration Runner
 *
 * Runs exactly ONE direct Model Gateway live call (through the existing
 * `runLiveProof` harness only) against the fixed harder-candidate task, then
 * scores the response with `evaluateHarderCandidate`. Zero retries. No MAO
 * worker/reviewer/revision/closer lane and no comparison verdict - this
 * script establishes one baseline calibration point only.
 *
 * Secret safety: this script never prints, logs, or writes a raw key value.
 * It reports only key-alias presence as a boolean. The provider endpoint
 * receives the secret only inside the existing Model Gateway harness
 * adapter, exactly as in the prior P4B-B live proof runner and the
 * MAO-LIVE-T1 pilot runner.
 *
 * Provider neutrality: one operator-available-key provider lane
 * (Alibaba/DashScope) is used; this is not a canonical provider choice or a
 * provider-parity claim.
 *
 * Usage (operator-authorized only, under
 * docs/baselines/CVF_GC018_MAO_OA_T6A_HARDER_CANDIDATE_DIRECT_BASELINE_CALIBRATION_2026-07-17.md):
 *   npx tsx EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/scripts/run-mao-oa-t6a-candidate-calibration.ts
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";

import {
  HARDER_CANDIDATE_TASK_ID,
  HARDER_CANDIDATE_TASK_PROMPT,
  evaluateHarderCandidate,
  parseHarderCandidateResponse,
} from "../src/mao/harder.value.candidate.contract";
import type { CredentialReference } from "../../CVF_MODEL_GATEWAY/src/credential-boundary";
import { runLiveProof } from "../../CVF_MODEL_GATEWAY/src/p4b-b-live-proof-harness";
import type { HarnessRunResult } from "../../CVF_MODEL_GATEWAY/src/p4b-b-live-proof-harness";
import { resolveAlibabaDashScopeEndpoint, getAlibabaFreeQuotaStatus } from "../../CVF_MODEL_GATEWAY/src/alibaba-free-quota-model-ledger";
import type { GatewayExecuteRequest } from "../../CVF_MODEL_GATEWAY/src/unified-gateway-interface-contract";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const ENV_LOCAL = resolve(REPO_ROOT, "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.local");
const PROVIDER_ID = "alibaba";
// Same free-quota-ledger-verified model MAO-LIVE-T1 used (docs/reference/model_gateway/CVF_ALIBABA_FREE_QUOTA_MODEL_LEDGER.json),
// not a new provider/model-lane choice.
const MODEL_ID = "qwen3.7-plus";
const KEY_ALIASES = [
  "DASHSCOPE_API_KEY",
  "ALIBABA_API_KEY",
  "CVF_ALIBABA_API_KEY",
  "CVF_BENCHMARK_ALIBABA_KEY",
] as const;
const RESULT_PATH = resolve(
  REPO_ROOT,
  "docs/reviews/evidence/mao-oa-t6a-direct-candidate-calibration-2026-07-17.json",
);

type MaoOaT6aDiagnosticClass =
  | "CREDENTIAL_ABSENT"
  | "ENDPOINT_ABSENT"
  | "PROVIDER_ERROR"
  | "MALFORMED_OUTPUT"
  | "TRANSPORT_ERROR"
  | "DRY_RUN_NOT_AUTHORIZED";

interface MaoOaT6aDiagnostic {
  stage: "live_call";
  class: MaoOaT6aDiagnosticClass;
  retryable: boolean;
  userAction: string;
  provider: string;
  model: string;
  httpStatus: number | null;
  latencyMs: number | null;
  safeMessage: string;
}

function loadEnvLocal(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(path)) return out;
  for (const rawLine of readFileSync(path, "utf-8").split(/\r?\n/)) {
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

function firstPresentAlias(env: Record<string, string | undefined>, aliases: readonly string[]): string | undefined {
  return aliases.find((alias) => Boolean(env[alias]?.trim()));
}

function writeArtifact(payload: Record<string, unknown>, path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

function classifyError(error: unknown, latencyMs: number): MaoOaT6aDiagnostic {
  const rawMessage = error instanceof Error ? error.message : "mao_oa_t6a_unknown_error";
  const messageClass = rawMessage.split(":")[0] ?? "mao_oa_t6a_unknown_error";
  let diagnosticClass: MaoOaT6aDiagnosticClass = "TRANSPORT_ERROR";
  let retryable = true;
  let userAction = "diagnose transport failure before any retry";
  if (messageClass.includes("live_proof_credential_absent")) {
    diagnosticClass = "CREDENTIAL_ABSENT";
    retryable = false;
    userAction = "confirm an approved key alias is present before retrying";
  } else if (messageClass.includes("live_proof_endpoint_absent")) {
    diagnosticClass = "ENDPOINT_ABSENT";
    retryable = false;
    userAction = "supply an endpoint or a supported providerId before retrying";
  } else if (messageClass.includes("live_proof_provider_error")) {
    diagnosticClass = "PROVIDER_ERROR";
    retryable = true;
    userAction = "inspect provider status code before any retry";
  }
  return {
    stage: "live_call",
    class: diagnosticClass,
    retryable,
    userAction,
    provider: PROVIDER_ID,
    model: MODEL_ID,
    httpStatus: null,
    latencyMs,
    safeMessage: messageClass,
  };
}

async function main(): Promise<number> {
  const startedAt = new Date().toISOString();
  const env: Record<string, string | undefined> = {
    ...loadEnvLocal(ENV_LOCAL),
    ...process.env,
  };

  const keyAlias = firstPresentAlias(env, KEY_ALIASES);
  if (!keyAlias) {
    writeArtifact(
      {
        run: "mao-oa-t6a-harder-candidate-direct-baseline-calibration",
        taskId: HARDER_CANDIDATE_TASK_ID,
        startedAt,
        finishedAt: new Date().toISOString(),
        callAttempted: false,
        callCount: 0,
        retryCount: 0,
        verdict: "BLOCKED_NO_KEY",
        reason: "no approved key alias present in env",
        keyAliasesChecked: KEY_ALIASES,
      },
      RESULT_PATH,
    );
    console.log("MAO-OA-T6A: BLOCKED_NO_KEY (no approved key alias present)");
    return 1;
  }

  const freeQuotaStatus = getAlibabaFreeQuotaStatus(MODEL_ID);
  if (freeQuotaStatus === "expired" || freeQuotaStatus === "unknown") {
    writeArtifact(
      {
        run: "mao-oa-t6a-harder-candidate-direct-baseline-calibration",
        taskId: HARDER_CANDIDATE_TASK_ID,
        startedAt,
        finishedAt: new Date().toISOString(),
        modelId: MODEL_ID,
        callAttempted: false,
        callCount: 0,
        retryCount: 0,
        verdict: "BLOCKED_LIVE_PROVIDER",
        reason: `free_quota_${freeQuotaStatus}`,
      },
      RESULT_PATH,
    );
    console.log(`MAO-OA-T6A: BLOCKED_LIVE_PROVIDER (free_quota_${freeQuotaStatus})`);
    return 1;
  }

  const credentialReference: CredentialReference = {
    providerId: PROVIDER_ID,
    keyId: `${PROVIDER_ID}-mao-oa-t6a`,
    envNames: [keyAlias],
  };
  const endpoint = resolveAlibabaDashScopeEndpoint(env);
  const traceId = `mao-oa-t6a-direct-${Date.now()}`;

  const request: GatewayExecuteRequest = {
    traceId,
    prompt: HARDER_CANDIDATE_TASK_PROMPT,
    policy: {
      traceId,
      policyResult: "allow",
      reason: "mao_oa_t6a_direct_baseline_calibration_allow",
      allowedProviderIds: [PROVIDER_ID],
    },
    routing: {
      traceId,
      preferredProviderId: PROVIDER_ID,
      requestedModelId: MODEL_ID,
      estimatedTokens: 400,
    },
  };

  // Exactly one attempted call; no retry under any failure branch below.
  const callStartedAt = Date.now();
  let harnessResult: HarnessRunResult | null = null;
  let diagnostic: MaoOaT6aDiagnostic | null = null;
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
      },
      request,
    );
  } catch (error) {
    diagnostic = classifyError(error, Date.now() - callStartedAt);
  }
  const latencyMs = Date.now() - callStartedAt;

  let rawResponseText: string | null = null;
  let usage: { inputTokens: number; outputTokens: number } | null = null;

  if (harnessResult && !harnessResult.authorized) {
    diagnostic = {
      stage: "live_call",
      class: "DRY_RUN_NOT_AUTHORIZED",
      retryable: false,
      userAction: "set liveAuthorized=true before running this calibration",
      provider: PROVIDER_ID,
      model: MODEL_ID,
      httpStatus: null,
      latencyMs,
      safeMessage: harnessResult.diagnostic,
    };
  } else if (harnessResult && harnessResult.authorized) {
    const text = harnessResult.bridgeResult.response?.text;
    usage = harnessResult.bridgeResult.response?.usage ?? null;
    if (typeof text === "string" && text.length > 0) {
      rawResponseText = text;
    } else {
      const bridgeError = harnessResult.bridgeResult.error;
      diagnostic = {
        stage: "live_call",
        class: bridgeError ? "PROVIDER_ERROR" : "MALFORMED_OUTPUT",
        retryable: bridgeError ? bridgeError.retryable : true,
        userAction: "inspect governed bridge error class before any retry",
        provider: PROVIDER_ID,
        model: MODEL_ID,
        httpStatus: null,
        latencyMs,
        safeMessage: bridgeError ? bridgeError.errorClass : "empty_response_text",
      };
    }
  }

  // Sanitize before persisting: hash the raw response in memory, persist
  // only the hash, the parsed/scored evidence, and never the raw text.
  const rawResponseHash = rawResponseText ? createHash("sha256").update(rawResponseText, "utf8").digest("hex") : null;
  const evaluation = rawResponseText ? evaluateHarderCandidate(rawResponseText) : null;
  const parsedCandidate = rawResponseText ? parseHarderCandidateResponse(rawResponseText) : null;

  const artifact: Record<string, unknown> = {
    run: "mao-oa-t6a-harder-candidate-direct-baseline-calibration",
    taskId: HARDER_CANDIDATE_TASK_ID,
    startedAt,
    finishedAt: new Date().toISOString(),
    providerId: PROVIDER_ID,
    modelId: MODEL_ID,
    endpointHost: new URL(endpoint).host,
    keyAliasUsed: keyAlias,
    traceId,
    callAttempted: true,
    callCount: 1,
    retryCount: 0,
    latencyMs,
    usage,
    rawResponseHash,
    rawResponseLength: rawResponseText ? rawResponseText.length : null,
    sanitizedCandidate: parsedCandidate?.ok ? parsedCandidate.raw : null,
    rubric: evaluation ? evaluation.rubric : null,
    defects: evaluation ? evaluation.defects : null,
    materialDefectFound: evaluation ? evaluation.materialDefectFound : null,
    releaseCandidateAsWorkerEvidence: evaluation ? evaluation.releaseCandidate : null,
    releaseDecisionOwner: "reviewer_only",
    diagnostic,
    ok: rawResponseText !== null && evaluation !== null,
  };

  writeArtifact(artifact, RESULT_PATH);

  console.log(
    `MAO-OA-T6A: ok=${artifact.ok} callCount=1 retryCount=0 latencyMs=${latencyMs} ` +
      `score=${evaluation ? evaluation.rubric.score : "n/a"} materialDefectFound=${
        evaluation ? evaluation.materialDefectFound : "n/a"
      } releaseCandidateAsWorkerEvidence=${evaluation ? evaluation.releaseCandidate : "n/a"}`,
  );
  if (diagnostic) {
    console.log(`MAO-OA-T6A diagnostic: class=${diagnostic.class} retryable=${diagnostic.retryable}`);
  }

  return artifact.ok ? 0 : 1;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error("MAO-OA-T6A: unhandled error", error instanceof Error ? error.message : error);
    process.exit(1);
  });
