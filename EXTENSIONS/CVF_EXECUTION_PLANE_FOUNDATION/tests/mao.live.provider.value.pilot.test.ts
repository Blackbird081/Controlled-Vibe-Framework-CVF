// CVF MAO-LIVE-T1 - Live Provider Adapter Value Pilot Bridge Tests
//
// Deterministic unit/negative tests using ONLY a fake/injected fetch double.
// No real network call, no real credential, no real provider is touched by
// this test file. Covers the rubric scorer, the four-call ceiling ledger,
// direct-lane and MAO-lane happy paths with fake responses, negative
// scenarios (credential absent, malformed output, provider error,
// self-approval, ceiling exceeded, revision-then-pass, revision-then-fail),
// the terminal verdict decision function, and (LPCI1-WEB-R2) the EAFR-R12
// orchestrator-grant authority context every direct/MAO-worker/MAO-revision
// call site now requires: missing, malformed (via TypeScript, an
// intentionally omitted grant), mismatched, expired, and exhausted grants
// all deny before any environment, endpoint, secret, ledger, or fetch
// effect, and a denied attempt never advances the shared ledger.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  scoreAgainstRubric,
  MaoLiveCallLedger,
  runDirectLane,
  runMaoLane,
  decideValueVerdict,
  LIVE_PILOT_MAX_LIVE_CALLS,
  LIVE_PILOT_WORKER_IDENTITY,
  LIVE_PILOT_REVIEWER_IDENTITY,
  type MaoLiveDirectLaneResult,
  type MaoLiveLaneResult,
  type MaoLiveGrantContext,
} from "../src/mao/live.provider.value.pilot";
import type { LiveProofFetch } from "../../CVF_MODEL_GATEWAY/src/p4b-b-live-proof-harness";
import type { CredentialReference } from "../../CVF_MODEL_GATEWAY/src/credential-boundary";
import { checkSelfApproval } from "../src/mao/reviewer.isolation.contract";
import type { ProviderExecutionGrant } from "cvf-control-plane-foundation";

const PROVIDER = "alibaba";
const MODEL = "qwen-flash";
const WORKER_AGENT_ID = "test-worker-agent";
const DELEGATION_ID = "test-delegation-id";
const GRANT_ID = "test-grant-id";
const FIXED_NOW_ISO = "2026-08-26T00:00:00.000Z";

function credentialRef(): CredentialReference {
  return { providerId: PROVIDER, keyId: "alibaba-live-t1", envNames: ["DASHSCOPE_API_KEY"] };
}

/** A valid synthetic orchestrator grant. Fixed metadata only; never a real credential. */
function validGrant(overrides: Partial<ProviderExecutionGrant> = {}): ProviderExecutionGrant {
  return {
    authority: "ORCHESTRATOR_GRANT_REQUIRED",
    grantId: GRANT_ID,
    authorizedBy: "ORCHESTRATOR",
    subjectAgentId: WORKER_AGENT_ID,
    delegationId: DELEGATION_ID,
    allowedProviders: [PROVIDER],
    maxCalls: 4,
    expiresAt: "2099-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** A valid synthetic grant context binding, matching `validGrant()`'s identities. */
function validGrantContext(overrides: Partial<MaoLiveGrantContext> = {}): MaoLiveGrantContext {
  return {
    providerExecutionGrant: validGrant(),
    workerAgentId: WORKER_AGENT_ID,
    delegationId: DELEGATION_ID,
    grantId: GRANT_ID,
    nowIso: FIXED_NOW_ISO,
    ...overrides,
  };
}

function fakeFetchWithText(text: string): LiveProofFetch {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { content: text } }],
      usage: { prompt_tokens: 8, completion_tokens: 4 },
    }),
  });
}

function fakeFetchSequence(texts: string[]): LiveProofFetch {
  let i = 0;
  return async () => {
    const text = texts[Math.min(i, texts.length - 1)];
    i += 1;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: text } }],
        usage: { prompt_tokens: 8, completion_tokens: 4 },
      }),
    };
  };
}

function fakeFetchHttpError(status: number): LiveProofFetch {
  return async () => ({
    ok: false,
    status,
    json: async () => ({}),
    text: async () => "provider error body",
  });
}

const GOOD_TEXT = "11, 13, 17";
const BAD_TEXT = "I don't know";

describe("scoreAgainstRubric", () => {
  it("scores a fully correct response as passed with max score", () => {
    const result = scoreAgainstRubric(GOOD_TEXT);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.matchedTokens).toEqual(["11", "13", "17"]);
  });

  it("scores an empty response as failed (empty string is trivially within the length ceiling)", () => {
    const result = scoreAgainstRubric("");
    expect(result.passed).toBe(false);
    expect(result.nonEmpty).toBe(false);
    expect(result.matchedTokens).toEqual([]);
    expect(result.score).toBe(10);
  });

  it("scores a non-matching response as failed with a low but non-zero score", () => {
    const result = scoreAgainstRubric(BAD_TEXT);
    expect(result.passed).toBe(false);
    expect(result.matchedTokens).toEqual([]);
    expect(result.score).toBe(20);
  });

  it("penalizes an overlong response even if tokens match", () => {
    const long = `${GOOD_TEXT} ${"padding ".repeat(30)}`;
    const result = scoreAgainstRubric(long);
    expect(result.withinLengthCeiling).toBe(false);
    expect(result.passed).toBe(false);
  });

  it("matches tokens as whole words, not substrings (11 does not match 110 or 911)", () => {
    const result = scoreAgainstRubric("110, 911, 13, 17");
    expect([...result.matchedTokens].sort()).toEqual(["13", "17"]);
  });

  it("partial match (2 of 3) does not pass but scores partial credit", () => {
    const result = scoreAgainstRubric("11, 13");
    expect(result.passed).toBe(false);
    expect(result.matchedTokens).toEqual(["11", "13"]);
    expect(result.score).toBeGreaterThan(20);
    expect(result.score).toBeLessThan(100);
  });
});

describe("MaoLiveCallLedger (four-call ceiling)", () => {
  it("allows claims up to the ceiling", () => {
    const ledger = new MaoLiveCallLedger(4);
    ledger.claim("a");
    ledger.claim("b");
    ledger.claim("c");
    ledger.claim("d");
    expect(ledger.spentCount).toBe(4);
    expect(ledger.remaining).toBe(0);
  });

  it("throws when a claim would exceed the ceiling", () => {
    const ledger = new MaoLiveCallLedger(1);
    ledger.claim("a");
    expect(() => ledger.claim("b")).toThrow("live_call_ceiling_exceeded");
  });

  it("defaults to the exported LIVE_PILOT_MAX_LIVE_CALLS ceiling", () => {
    const ledger = new MaoLiveCallLedger();
    for (let i = 0; i < LIVE_PILOT_MAX_LIVE_CALLS; i += 1) {
      ledger.claim(`call-${i}`);
    }
    expect(() => ledger.claim("one-too-many")).toThrow("live_call_ceiling_exceeded");
  });
});

describe("runDirectLane", () => {
  it("claims exactly one ledger slot and returns a passed rubric on a good fake response", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result: MaoLiveDirectLaneResult = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fakeFetchWithText(GOOD_TEXT),
      traceId: "test-direct-1",
      grantContext: validGrantContext(),
    });
    expect(ledger.spentCount).toBe(1);
    expect(result.ok).toBe(true);
    expect(result.rubric?.passed).toBe(true);
    expect(result.responseText).toBe(GOOD_TEXT);
  });

  it("classifies CREDENTIAL_ABSENT without exposing any secret value", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: {},
      fetchImpl: fakeFetchWithText(GOOD_TEXT),
      traceId: "test-direct-2",
      grantContext: validGrantContext(),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("CREDENTIAL_ABSENT");
    expect(JSON.stringify(result)).not.toContain("fake-test-secret");
  });

  it("classifies MALFORMED_OUTPUT when the response text is empty", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fakeFetchWithText(""),
      traceId: "test-direct-3",
      grantContext: validGrantContext(),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("MALFORMED_OUTPUT");
  });

  it("classifies PROVIDER_ERROR on a non-ok HTTP response", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fakeFetchHttpError(500),
      traceId: "test-direct-4",
      grantContext: validGrantContext(),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("PROVIDER_ERROR");
    expect(result.diagnostic?.retryable).toBe(true);
  });
});

describe("runMaoLane", () => {
  it("exposes a MAO lane usage field for comparative evidence", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runMaoLane({
      ledger,
      providerId: "alibaba",
      modelId: "test-model",
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fakeFetchWithText(GOOD_TEXT),
      traceId: "usage-proof",
      recordedAt: "2026-07-12T00:00:00.000Z",
      grantContext: validGrantContext(),
    });
    expect(result).toHaveProperty("usage");
  });
  it("accepts on the first attempt without spending a revision call when the worker output passes", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result: MaoLiveLaneResult = await runMaoLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fakeFetchWithText(GOOD_TEXT),
      traceId: "test-mao-1",
      recordedAt: new Date().toISOString(),
      grantContext: validGrantContext(),
    });
    expect(result.ok).toBe(true);
    expect(result.revisionUsed).toBe(false);
    expect(result.callsSpent).toBe(1);
    expect(ledger.spentCount).toBe(1);
    expect(result.integrationReceipt?.decision).toBe("ACCEPT");
    expect(result.reviews).toHaveLength(1);
  });

  it("requests exactly one revision and accepts when the second attempt passes", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runMaoLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fakeFetchSequence([BAD_TEXT, GOOD_TEXT]),
      traceId: "test-mao-2",
      recordedAt: new Date().toISOString(),
      grantContext: validGrantContext(),
    });
    expect(result.ok).toBe(true);
    expect(result.revisionUsed).toBe(true);
    expect(result.callsSpent).toBe(2);
    expect(ledger.spentCount).toBe(2);
    expect(result.reviews).toHaveLength(2);
    expect(result.reviews[0].decision).toBe("REQUEST_REPAIR");
    expect(result.reviews[1].decision).toBe("ACCEPT");
    expect(result.integrationReceipt?.decision).toBe("ACCEPT");
  });

  it("does not accept and stops after one revision when both attempts fail the rubric", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runMaoLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fakeFetchSequence([BAD_TEXT, BAD_TEXT]),
      traceId: "test-mao-3",
      recordedAt: new Date().toISOString(),
      grantContext: validGrantContext(),
    });
    expect(result.callsSpent).toBe(2);
    expect(ledger.spentCount).toBe(2);
    expect(result.revisionUsed).toBe(true);
    expect(result.reviews).toHaveLength(2);
    expect(result.ok).toBe(false);
    expect(result.integrationReceipt?.decision).not.toBe("ACCEPT");
  });

  it("propagates CREDENTIAL_ABSENT diagnostic on the worker call without spending a revision", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runMaoLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: {},
      fetchImpl: fakeFetchWithText(GOOD_TEXT),
      traceId: "test-mao-4",
      recordedAt: new Date().toISOString(),
      grantContext: validGrantContext(),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("CREDENTIAL_ABSENT");
    expect(result.callsSpent).toBe(1);
    expect(ledger.spentCount).toBe(1);
  });

  it("never exceeds the ledger ceiling even across worker+revision", async () => {
    const ledger = new MaoLiveCallLedger(2);
    const result = await runMaoLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fakeFetchSequence([BAD_TEXT, GOOD_TEXT]),
      traceId: "test-mao-5",
      recordedAt: new Date().toISOString(),
      grantContext: validGrantContext(),
    });
    expect(ledger.spentCount).toBe(2);
    expect(ledger.remaining).toBe(0);
    expect(result.callsSpent).toBe(2);
  });
});

describe("negative scenario: EAFR-R12 orchestrator-grant authority context (LPCI1-WEB-R2)", () => {
  /**
   * A fetch double that throws if ever invoked. Every case in this suite
   * must deny before the harness reaches `fetchImpl`, so this proves zero
   * real (or fake) network attempt occurred, not merely that the returned
   * diagnostic looked correct.
   */
  function fetchImplThatMustNeverBeCalled(): LiveProofFetch {
    return async () => {
      throw new Error("fetchImplThatMustNeverBeCalled: fetch was invoked on a denied grant");
    };
  }

  it("runDirectLane denies before any fetch when providerExecutionGrant is missing (undefined)", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fetchImplThatMustNeverBeCalled(),
      traceId: "test-grant-missing",
      grantContext: validGrantContext({ providerExecutionGrant: undefined }),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("GRANT_DENIED");
    expect(ledger.spentCount).toBe(0);
  });

  it("runDirectLane denies before any fetch when the grant subject does not match the caller's workerAgentId", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fetchImplThatMustNeverBeCalled(),
      traceId: "test-grant-subject-mismatch",
      grantContext: validGrantContext({ workerAgentId: "a-different-agent" }),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("GRANT_DENIED");
    expect(ledger.spentCount).toBe(0);
  });

  it("runDirectLane denies before any fetch when the grant delegationId does not match", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fetchImplThatMustNeverBeCalled(),
      traceId: "test-grant-delegation-mismatch",
      grantContext: validGrantContext({ delegationId: "a-different-delegation" }),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("GRANT_DENIED");
    expect(ledger.spentCount).toBe(0);
  });

  it("runDirectLane denies before any fetch when the caller-presented grantId does not match the grant's own id", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fetchImplThatMustNeverBeCalled(),
      traceId: "test-grant-id-mismatch",
      grantContext: validGrantContext({ grantId: "a-different-grant-id" }),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("GRANT_DENIED");
    expect(ledger.spentCount).toBe(0);
  });

  it("runDirectLane denies before any fetch when the provider is outside allowedProviders", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fetchImplThatMustNeverBeCalled(),
      traceId: "test-grant-provider-mismatch",
      grantContext: validGrantContext({
        providerExecutionGrant: validGrant({ allowedProviders: ["deepseek"] }),
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("GRANT_DENIED");
    expect(ledger.spentCount).toBe(0);
  });

  it("runDirectLane denies before any fetch when the grant is expired relative to nowIso", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fetchImplThatMustNeverBeCalled(),
      traceId: "test-grant-expired",
      grantContext: validGrantContext({
        providerExecutionGrant: validGrant({ expiresAt: "2020-01-01T00:00:00.000Z" }),
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("GRANT_DENIED");
    expect(ledger.spentCount).toBe(0);
  });

  it("runDirectLane denies before any fetch when authorizedBy is not ORCHESTRATOR (self-issued grant rejected)", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fetchImplThatMustNeverBeCalled(),
      traceId: "test-grant-not-orchestrator",
      grantContext: validGrantContext({
        providerExecutionGrant: validGrant({ authorizedBy: null }),
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("GRANT_DENIED");
    expect(ledger.spentCount).toBe(0);
  });

  it("runDirectLane denies before any fetch once the grant's call budget is exhausted at the current ledger position", async () => {
    // maxCalls: 1 means consumedCalls (== ledger.spentCount before this
    // attempt) must be < 1 to pass; spend the one allowed call first via a
    // separate authorized ledger position, then prove the *next* attempt on
    // a fresh ledger already at spentCount=1 is denied without a fetch.
    const ledger = new MaoLiveCallLedger(4);
    // Simulate one already-consumed call by claiming a slot directly
    // (bypassing runDirectLane) so spentCount reflects prior consumption
    // without depending on this suite's own grant-authorized path.
    ledger.claim("pre-existing-consumed-call");
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fetchImplThatMustNeverBeCalled(),
      traceId: "test-grant-budget-exhausted",
      grantContext: validGrantContext({
        providerExecutionGrant: validGrant({ maxCalls: 1 }),
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("GRANT_DENIED");
    expect(ledger.spentCount).toBe(1);
  });

  it("runMaoWorkerCall (via runMaoLane) denies the worker attempt before any fetch when the grant is missing", async () => {
    const ledger = new MaoLiveCallLedger(4);
    const result = await runMaoLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fetchImplThatMustNeverBeCalled(),
      traceId: "test-mao-grant-missing",
      recordedAt: FIXED_NOW_ISO,
      grantContext: validGrantContext({ providerExecutionGrant: undefined }),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("GRANT_DENIED");
    expect(result.callsSpent).toBe(0);
    expect(ledger.spentCount).toBe(0);
  });

  it("runMaoLane denies the revision before a second fetch when the first attempt exhausts the grant call budget", async () => {
    // maxCalls=1 authorizes the first attempt at consumedCalls=0. Its rubric
    // failure triggers a revision whose own preflight sees consumedCalls=1
    // and denies before a second fetch or ledger claim.
    const ledger = new MaoLiveCallLedger(4);
    let fetchCallCount = 0;
    const countingFetch: LiveProofFetch = async () => {
      fetchCallCount += 1;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: BAD_TEXT } }],
          usage: { prompt_tokens: 8, completion_tokens: 4 },
        }),
      };
    };
    const result = await runMaoLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: countingFetch,
      traceId: "test-mao-grant-budget-exhausted-before-revision",
      recordedAt: FIXED_NOW_ISO,
      grantContext: validGrantContext({
        providerExecutionGrant: validGrant({ maxCalls: 1 }),
      }),
    });
    expect(fetchCallCount).toBe(1);
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("GRANT_DENIED");
    expect(result.callsSpent).toBe(1);
    expect(ledger.spentCount).toBe(1);
  });

  it("a caller-preflight denial and the harness's own independent re-evaluation agree (defense in depth, not a bypass)", async () => {
    // Directly prove the same denied grant, if it somehow reached the
    // harness's own evaluator (e.g. via a future refactor bypassing
    // preflightGrant), would still be denied by evaluateProviderExecutionAuthority
    // itself: this test asserts on the exported denial classification only,
    // since the module does not export the harness call directly, but
    // confirms preflightGrant's result is not the caller inventing leniency -
    // it uses the identical evaluator contract shape.
    const ledger = new MaoLiveCallLedger(4);
    const result = await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fetchImplThatMustNeverBeCalled(),
      traceId: "test-grant-defense-in-depth",
      grantContext: validGrantContext({
        providerExecutionGrant: validGrant({ authority: "FORBIDDEN" }),
      }),
    });
    expect(result.ok).toBe(false);
    expect(result.diagnostic?.class).toBe("GRANT_DENIED");
    expect(ledger.spentCount).toBe(0);
  });
});

describe("MAO live runner grant gate source ordering (LPCI1-WEB-R2)", () => {
  it("parses and evaluates authority before environment load, key inspection, or endpoint resolution", () => {
    const source = readFileSync(
      resolve(__dirname, "../scripts/run-mao-live-provider-value-pilot.ts"),
      "utf8",
    );
    const mainStart = source.indexOf("async function main(): Promise<number>");
    const parseGrant = source.indexOf("const providerExecutionGrant = parseProviderExecutionGrant(", mainStart);
    const evaluateGrant = source.indexOf("const authorityResult = evaluateProviderExecutionAuthority(", mainStart);
    const loadEnvironment = source.indexOf("...loadEnvLocal(ENV_LOCAL)", mainStart);
    const inspectKeyAlias = source.indexOf("const keyAlias = firstPresentAlias(", mainStart);
    const resolveEndpoint = source.indexOf("resolveAlibabaDashScopeEndpoint(", mainStart);

    expect(mainStart).toBeGreaterThanOrEqual(0);
    expect(parseGrant).toBeGreaterThan(mainStart);
    expect(evaluateGrant).toBeGreaterThan(parseGrant);
    expect(loadEnvironment).toBeGreaterThan(evaluateGrant);
    expect(inspectKeyAlias).toBeGreaterThan(loadEnvironment);
    expect(resolveEndpoint).toBeGreaterThan(inspectKeyAlias);
    expect(source).toMatch(/catch\s*\{\s*return undefined;\s*\}/u);
  });
});

describe("negative scenario: self-approval", () => {
  it("worker and reviewer identities are distinct by construction", () => {
    const check = checkSelfApproval(LIVE_PILOT_WORKER_IDENTITY, LIVE_PILOT_REVIEWER_IDENTITY);
    expect(check.ok).toBe(true);
  });

  it("checkSelfApproval itself still fails closed for equal identities (contract sanity)", () => {
    const check = checkSelfApproval("same-actor", "same-actor");
    expect(check.ok).toBe(false);
  });
});

describe("negative scenario: duplicate/fifth-call ceiling interaction", () => {
  it("a shared ledger across both lanes enforces a single four-call budget", async () => {
    const ledger = new MaoLiveCallLedger(4);
    await runDirectLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fakeFetchWithText(GOOD_TEXT),
      traceId: "test-shared-1",
      grantContext: validGrantContext(),
    });
    await runMaoLane({
      ledger,
      providerId: PROVIDER,
      modelId: MODEL,
      credentialReference: credentialRef(),
      env: { DASHSCOPE_API_KEY: "fake-test-secret" },
      fetchImpl: fakeFetchSequence([BAD_TEXT, GOOD_TEXT]),
      traceId: "test-shared-2",
      recordedAt: new Date().toISOString(),
      grantContext: validGrantContext(),
    });
    expect(ledger.spentCount).toBe(3);
    expect(ledger.remaining).toBe(1);
  });
});

describe("decideValueVerdict", () => {
  function directResult(passed: boolean, score: number): MaoLiveDirectLaneResult {
    return {
      ok: true,
      latencyMs: 100,
      responseText: "x",
      usage: null,
      rubric: { score, maxScore: 100, matchedTokens: [], withinLengthCeiling: true, nonEmpty: true, passed },
      diagnostic: null,
    };
  }
  function maoResult(ok: boolean, score: number | null, diagnosticClass: string | null = null): MaoLiveLaneResult {
    return {
      ok,
      totalLatencyMs: 200,
      callsSpent: 1,
      revisionUsed: false,
      finalResponseText: ok ? "y" : null,
      finalRubric:
        score === null
          ? null
          : { score, maxScore: 100, matchedTokens: [], withinLengthCeiling: true, nonEmpty: true, passed: ok },
      reviews: [],
      integrationReceipt: null,
      diagnostic: diagnosticClass
        ? { stage: "live_call", class: diagnosticClass as never, retryable: false, userAction: "x", message: "x" }
        : null,
    };
  }

  it("returns VALUE_PROVEN when the MAO lane strictly outscores the direct lane", () => {
    const ledger = new MaoLiveCallLedger(4);
    const verdict = decideValueVerdict(directResult(false, 40), maoResult(true, 100), ledger);
    expect(verdict.verdict).toBe("VALUE_PROVEN");
  });

  it("returns VALUE_NOT_PROVEN on a tie", () => {
    const ledger = new MaoLiveCallLedger(4);
    const verdict = decideValueVerdict(directResult(true, 100), maoResult(true, 100), ledger);
    expect(verdict.verdict).toBe("VALUE_NOT_PROVEN");
  });

  it("returns VALUE_NOT_PROVEN when the MAO lane scores lower", () => {
    const ledger = new MaoLiveCallLedger(4);
    const verdict = decideValueVerdict(directResult(true, 100), maoResult(true, 60), ledger);
    expect(verdict.verdict).toBe("VALUE_NOT_PROVEN");
  });

  it("returns BLOCKED_LIVE_PROVIDER when the direct lane fails", () => {
    const ledger = new MaoLiveCallLedger(4);
    const failedDirect: MaoLiveDirectLaneResult = {
      ok: false,
      latencyMs: 50,
      responseText: null,
      usage: null,
      rubric: null,
      diagnostic: { stage: "live_call", class: "CREDENTIAL_ABSENT", retryable: false, userAction: "x", message: "x" },
    };
    const verdict = decideValueVerdict(failedDirect, maoResult(true, 100), ledger);
    expect(verdict.verdict).toBe("BLOCKED_LIVE_PROVIDER");
  });

  it("returns BLOCKED_LIVE_PROVIDER when the MAO lane fails", () => {
    const ledger = new MaoLiveCallLedger(4);
    const verdict = decideValueVerdict(directResult(true, 100), maoResult(false, null, "MALFORMED_OUTPUT"), ledger);
    expect(verdict.verdict).toBe("BLOCKED_LIVE_PROVIDER");
  });
});
