/**
 * MAO-LIVE-T1 Provider Adapter Value Pilot Runner
 *
 * Runs ONE bounded same-task comparison between a direct Model Gateway live
 * call and a governed MAO worker-reviewer-revision-closer chain, through the
 * existing `runLiveProof` harness only. Enforces a hard four-live-call
 * ceiling via `MaoLiveCallLedger` and writes a secret-safe comparative
 * evidence artifact.
 *
 * EAFR-R12 / LPCI1-WEB-R2. Direct invocation of this script is not itself
 * authority. Before `loadEnvLocal` (or any key-bearing local environment
 * load), endpoint resolution, or harness call, the runner parses a
 * `CVF_PROVIDER_EXECUTION_GRANT_JSON` environment value into the existing
 * R1E `ProviderExecutionGrant` shape using secret-safe JSON parsing
 * (malformed input yields `undefined`, never a thrown parse error
 * containing raw content) and requires the exact bounded evaluator to
 * accept the one Alibaba/DashScope candidate this runner uses. If parsing
 * fails, the grant is absent, or the grant does not authorize this
 * provider, the runner fails closed before any environment is loaded, no
 * key presence is checked, and no endpoint is resolved. This mirrors, and
 * does not duplicate, the identical pattern in
 * `EXTENSIONS/CVF_MODEL_GATEWAY/scripts/run-p4b-b-live-proof.ts`.
 *
 * Secret safety: this script never prints, logs, or writes a raw key value.
 * It reports only key-alias presence as a boolean. The provider endpoint
 * receives the secret only inside the existing Model Gateway harness
 * adapter, exactly as in the prior P4B-B live proof runner. It never
 * prints, logs, or writes the raw grant JSON.
 *
 * Provider neutrality: one operator-available-key provider lane
 * (Alibaba/DashScope) is used; this is not a canonical provider choice or a
 * provider-parity claim.
 *
 * Usage (operator-authorized only, under
 * docs/baselines/CVF_GC018_MAO_LIVE_T1_PROVIDER_ADAPTER_VALUE_PILOT_2026-07-12.md):
 *   CVF_PROVIDER_EXECUTION_GRANT_JSON='{...}' npx tsx EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/scripts/run-mao-live-provider-value-pilot.ts
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import {
  MaoLiveCallLedger,
  runDirectLane,
  runMaoLane,
  decideValueVerdict,
  LIVE_PILOT_TASK_PROMPT,
  type MaoLiveGrantContext,
} from "../src/mao/live.provider.value.pilot";
import type { CredentialReference } from "../../CVF_MODEL_GATEWAY/src/credential-boundary";
import {
  ALIBABA_FREE_QUOTA_LEDGER_REFERENCE,
  getAlibabaFreeQuotaStatus,
  resolveAlibabaDashScopeEndpoint,
} from "../../CVF_MODEL_GATEWAY/src/alibaba-free-quota-model-ledger";
import {
  evaluateProviderExecutionAuthority,
  type ProviderExecutionGrant,
} from "cvf-control-plane-foundation";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const ENV_LOCAL = resolve(
  REPO_ROOT,
  "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.local",
);
const PROVIDER_ID = "alibaba";
const MODEL_ID = "qwen3.7-plus";
const KEY_ALIASES = [
  "DASHSCOPE_API_KEY",
  "ALIBABA_API_KEY",
  "CVF_ALIBABA_API_KEY",
  "CVF_BENCHMARK_ALIBABA_KEY",
] as const;

function resultPath(env: Record<string, string | undefined>): string {
  return resolve(
    REPO_ROOT,
    env.CVF_MAO_LIVE_T1_RESULT_PATH?.trim() ||
      "docs/reviews/evidence/mao-live-t1-comparative-receipt-2026-07-12.json",
  );
}

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

function writeArtifact(payload: Record<string, unknown>, path: string): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
}

/**
 * Secret-safe grant parsing: malformed or absent input yields `undefined`,
 * never a thrown error that could echo raw content. The grant itself
 * carries no secret value; it is identity/authority metadata only. Mirrors
 * `parseProviderExecutionGrant` in
 * `EXTENSIONS/CVF_MODEL_GATEWAY/scripts/run-p4b-b-live-proof.ts`.
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

async function main(): Promise<number> {
  const startedAt = new Date().toISOString();
  const authorityEnv = process.env as Record<string, string | undefined>;
  const outputPath = resultPath(authorityEnv);

  // EAFR-R12 / LPCI1-WEB-R2. Fail closed before any key-bearing local
  // environment is loaded: direct invocation of this script is not itself
  // authority. A malformed or absent grant, or a grant that does not
  // authorize this runner's one provider candidate, stops the run here,
  // before `loadEnvLocal`, before any key presence check, and before any
  // endpoint resolution.
  const providerExecutionGrant = parseProviderExecutionGrant(
    authorityEnv.CVF_PROVIDER_EXECUTION_GRANT_JSON,
  );
  const workerAgentId = authorityEnv.CVF_AGENT_ID ?? "";
  const delegationId = authorityEnv.CVF_DELEGATION_ID ?? "";
  const grantId = authorityEnv.CVF_PROVIDER_EXECUTION_GRANT_ID ?? "";
  const grantContext: MaoLiveGrantContext = {
    providerExecutionGrant,
    workerAgentId,
    delegationId,
    grantId,
  };

  if (!providerExecutionGrant) {
    writeArtifact(
      {
        pilot: "mao-live-t1-provider-adapter-value-pilot",
        startedAt,
        finishedAt: new Date().toISOString(),
        verdict: "BLOCKED_LIVE_PROVIDER",
        reason: "missing or malformed CVF_PROVIDER_EXECUTION_GRANT_JSON: no orchestrator provider execution grant was parsed",
        totalCallsSpent: 0,
      },
      outputPath,
    );
    console.log(
      "MAO-LIVE-T1: BLOCKED_LIVE_PROVIDER (no orchestrator provider execution grant parsed; no environment loaded, no candidate attempted)",
    );
    return 1;
  }

  const preflightNowIso = new Date().toISOString();
  const authorityResult = evaluateProviderExecutionAuthority(providerExecutionGrant, {
    workerAgentId,
    delegationId,
    grantId,
    provider: PROVIDER_ID,
    consumedCalls: 0,
    nowIso: preflightNowIso,
  });
  if (!authorityResult.allowed) {
    writeArtifact(
      {
        pilot: "mao-live-t1-provider-adapter-value-pilot",
        startedAt,
        finishedAt: new Date().toISOString(),
        verdict: "BLOCKED_LIVE_PROVIDER",
        reason: `provider execution grant did not authorize ${PROVIDER_ID}: ${authorityResult.reason}`,
        totalCallsSpent: 0,
      },
      outputPath,
    );
    console.log(
      `MAO-LIVE-T1: BLOCKED_LIVE_PROVIDER (grant denied for ${PROVIDER_ID}; no key-bearing environment loaded, no candidate attempted)`,
    );
    return 1;
  }

  const env: Record<string, string | undefined> = {
    ...loadEnvLocal(ENV_LOCAL),
    ...authorityEnv,
  };

  const keyAlias = firstPresentAlias(env, KEY_ALIASES);
  if (!keyAlias) {
    writeArtifact(
      {
        pilot: "mao-live-t1-provider-adapter-value-pilot",
        startedAt,
        finishedAt: new Date().toISOString(),
        verdict: "BLOCKED_LIVE_PROVIDER",
        reason: "no approved key alias present in env",
        keyAliasesChecked: KEY_ALIASES,
        totalCallsSpent: 0,
      },
      outputPath,
    );
    console.log("MAO-LIVE-T1: BLOCKED_LIVE_PROVIDER (no key alias present)");
    return 1;
  }

  const freeQuotaStatus = getAlibabaFreeQuotaStatus(MODEL_ID);
  if (freeQuotaStatus === "expired" || freeQuotaStatus === "unknown") {
    writeArtifact(
      {
        pilot: "mao-live-t1-provider-adapter-value-pilot",
        startedAt,
        finishedAt: new Date().toISOString(),
        verdict: "BLOCKED_LIVE_PROVIDER",
        reason: `free_quota_${freeQuotaStatus}`,
        modelId: MODEL_ID,
        freeQuotaLedgerRef: ALIBABA_FREE_QUOTA_LEDGER_REFERENCE,
        totalCallsSpent: 0,
      },
      outputPath,
    );
    console.log(`MAO-LIVE-T1: BLOCKED_LIVE_PROVIDER (free_quota_${freeQuotaStatus})`);
    return 1;
  }

  const credentialReference: CredentialReference = {
    providerId: PROVIDER_ID,
    keyId: `${PROVIDER_ID}-mao-live-t1`,
    envNames: [keyAlias],
  };
  const endpoint = resolveAlibabaDashScopeEndpoint(env);
  const ledger = new MaoLiveCallLedger(4);
  const recordedAt = new Date().toISOString();

  const direct = await runDirectLane({
    ledger,
    providerId: PROVIDER_ID,
    modelId: MODEL_ID,
    endpoint,
    credentialReference,
    env,
    traceId: `mao-live-t1-direct-${Date.now()}`,
    grantContext,
  });

  let mao;
  if (!direct.ok) {
    // Diagnose the direct-lane failure before spending any further call;
    // do not proceed to the MAO lane on an already-failed provider path.
    mao = {
      ok: false,
      totalLatencyMs: 0,
      callsSpent: 0,
      revisionUsed: false,
      finalResponseText: null,
      finalRubric: null,
      reviews: [],
      integrationReceipt: null,
      diagnostic: {
        stage: "live_call" as const,
        class: "TRANSPORT_ERROR" as const,
        retryable: false,
        userAction: "direct lane failed first; MAO lane skipped to stay within diagnose-before-retry discipline",
        message: "skipped_after_direct_lane_failure",
      },
    };
  } else {
    mao = await runMaoLane({
      ledger,
      providerId: PROVIDER_ID,
      modelId: MODEL_ID,
      endpoint,
      credentialReference,
      env,
      traceId: `mao-live-t1-mao-${Date.now()}`,
      recordedAt,
      grantContext,
    });
  }

  const comparative = decideValueVerdict(direct, mao, ledger);

  writeArtifact(
    {
      pilot: "mao-live-t1-provider-adapter-value-pilot",
      startedAt,
      finishedAt: new Date().toISOString(),
      providerId: PROVIDER_ID,
      modelId: MODEL_ID,
      endpointHost: new URL(endpoint).host,
      keyAliasUsed: keyAlias,
      taskPrompt: LIVE_PILOT_TASK_PROMPT,
      totalCallsSpent: comparative.totalCallsSpent,
      verdict: comparative.verdict,
      reason: comparative.reason,
      direct: {
        ok: direct.ok,
        latencyMs: direct.latencyMs,
        usage: direct.usage,
        rubric: direct.rubric,
        diagnostic: direct.diagnostic,
        responseTextLength: direct.responseText?.length ?? null,
        responseTextPreview: direct.responseText?.slice(0, 60) ?? null,
      },
      mao: {
        ok: mao.ok,
        totalLatencyMs: mao.totalLatencyMs,
        callsSpent: mao.callsSpent,
        revisionUsed: mao.revisionUsed,
        usage: mao.usage ?? null,
        finalRubric: mao.finalRubric,
        diagnostic: mao.diagnostic,
        reviewCount: mao.reviews.length,
        reviewDecisions: mao.reviews.map((r) => r.decision),
        integrationDecision: mao.integrationReceipt?.decision ?? null,
        finalResponseTextLength: mao.finalResponseText?.length ?? null,
        finalResponseTextPreview: mao.finalResponseText?.slice(0, 60) ?? null,
      },
    },
    outputPath,
  );

  console.log(
    `MAO-LIVE-T1 direct lane: ok=${direct.ok} score=${direct.rubric?.score ?? "n/a"} latencyMs=${direct.latencyMs}`,
  );
  console.log(
    `MAO-LIVE-T1 MAO lane: ok=${mao.ok} score=${mao.finalRubric?.score ?? "n/a"} callsSpent=${mao.callsSpent} revisionUsed=${mao.revisionUsed} totalLatencyMs=${mao.totalLatencyMs}`,
  );
  console.log(`MAO-LIVE-T1 total live calls spent: ${comparative.totalCallsSpent}/4`);
  console.log(`MAO-LIVE-T1 verdict: ${comparative.verdict} (${comparative.reason})`);

  return comparative.verdict === "VALUE_PROVEN" || comparative.verdict === "VALUE_NOT_PROVEN" ? 0 : 1;
}

function safeMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.split(":")[0] ?? "mao_live_t1_error";
  }
  return "mao_live_t1_unknown_error";
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.log(`MAO-LIVE-T1 runner error: ${safeMessage(error)}`);
    process.exit(1);
  });
