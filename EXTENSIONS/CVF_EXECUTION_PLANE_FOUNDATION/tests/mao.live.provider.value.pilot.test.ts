// CVF MAO-LIVE-T1 - Live Provider Adapter Value Pilot Bridge Tests
//
// Deterministic unit/negative tests using ONLY a fake/injected fetch double.
// No real network call, no real credential, no real provider is touched by
// this test file. Covers the rubric scorer, the four-call ceiling ledger,
// direct-lane and MAO-lane happy paths with fake responses, negative
// scenarios (credential absent, malformed output, provider error,
// self-approval, ceiling exceeded, revision-then-pass, revision-then-fail),
// and the terminal verdict decision function.

import { describe, expect, it } from "vitest";
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
} from "../src/mao/live.provider.value.pilot";
import type { LiveProofFetch } from "../../CVF_MODEL_GATEWAY/src/p4b-b-live-proof-harness";
import type { CredentialReference } from "../../CVF_MODEL_GATEWAY/src/credential-boundary";
import { checkSelfApproval } from "../src/mao/reviewer.isolation.contract";

const PROVIDER = "alibaba";
const MODEL = "qwen-turbo";

function credentialRef(): CredentialReference {
  return { providerId: PROVIDER, keyId: "alibaba-live-t1", envNames: ["DASHSCOPE_API_KEY"] };
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
    });
    expect(ledger.spentCount).toBe(2);
    expect(ledger.remaining).toBe(0);
    expect(result.callsSpent).toBe(2);
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
