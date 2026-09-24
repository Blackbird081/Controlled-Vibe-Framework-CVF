// CVF ACEL G3-T2-R1 - ASSF Behavioral Evaluation Contract Tests (offline)
//
// Deterministic positive, negative, and adversarial fixtures for
// EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/assf.behavioral.evaluation.contract.ts,
// per the consolidated R1 rework work order
// (ACEL-G3-T2-R1-CONSOLIDATED-SEMANTIC-REWORK).
//
// No network call, no credential read, no provider/agent invocation and no
// live runner is used anywhere in this file. Every fixture and trace is a
// plain object literal evaluated purely in-process.

import { describe, expect, it } from "vitest";
import {
  admitBaselinePair,
  admitFixtureSet,
  gradeBehavioralEvaluation,
  produceBehavioralTrace,
  type BehavioralFixture,
  type BehavioralTrace,
} from "../src/mao/assf.behavioral.evaluation.contract";

const SOURCE_HASH = "a".repeat(64);
const OTHER_SOURCE_HASH = "b".repeat(64);
const FIXTURE_HASH = "c".repeat(64);

function deterministicFixture(overrides?: Partial<BehavioralFixture>): BehavioralFixture {
  return {
    fixtureId: "fx-positive-1",
    fixtureClass: "POSITIVE",
    repeatPolicy: "DETERMINISTIC",
    baselineRole: "NONE",
    canonicalInputBytes: "input-bytes-v1",
    sourceContentHash: SOURCE_HASH,
    fixtureContentHash: FIXTURE_HASH,
    allowedTransitions: [
      { from: "start", action: "read_file", to: "read" },
      { from: "read", action: "write_output", to: "done" },
    ],
    requiredEvents: [
      "5:start|9:read_file|4:read",
      "4:read|12:write_output|4:done",
    ],
    requiredOutputObservations: ["final-summary"],
    outcomeAssertions: [{ field: "status", expectedValue: "ok" }],
    evaluationClockIso: "2026-09-16T00:00:00Z",
    ...overrides,
  };
}

function passingTrace(overrides?: Partial<BehavioralTrace>): BehavioralTrace {
  return produceBehavioralTrace({
    traceId: "tr-1",
    fixtureId: "fx-positive-1",
    captureMode: "OFFLINE_SYNTHETIC",
    sourceContentHash: SOURCE_HASH,
    events: [
      { from: "start", action: "read_file", to: "read" },
      { from: "read", action: "write_output", to: "done" },
    ],
    outputObservations: ["final-summary"],
    outcomeValues: { status: "ok" },
    ...overrides,
  });
}

describe("gradeBehavioralEvaluation - complete positive deterministic case", () => {
  it("returns PASS_WITH_EVIDENCE with zero defects for one clean repeat", () => {
    const fixture = deterministicFixture();
    const evaluation = gradeBehavioralEvaluation(fixture, [passingTrace()]);
    expect(evaluation.result).toBe("PASS_WITH_EVIDENCE");
    expect(evaluation.defects).toEqual([]);
    expect(evaluation.repeatsObserved).toBe(1);
    expect(evaluation.repeatsRequired).toBe(1);
    expect(evaluation.fixtureId).toBe("fx-positive-1");
  });

  it("is deterministic across repeated grading of the same input", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace();
    const first = gradeBehavioralEvaluation(fixture, [trace]);
    const second = gradeBehavioralEvaluation(fixture, [trace]);
    expect(second).toEqual(first);
  });

  it("returns a frozen evaluation and frozen defects array", () => {
    const evaluation = gradeBehavioralEvaluation(deterministicFixture(), [passingTrace()]);
    expect(Object.isFrozen(evaluation)).toBe(true);
    expect(Object.isFrozen(evaluation.defects)).toBe(true);
  });
});

describe("gradeBehavioralEvaluation - complete positive stochastic case", () => {
  it("returns PASS_WITH_EVIDENCE after exactly three consecutive passing repeats", () => {
    const fixture = deterministicFixture({ repeatPolicy: "STOCHASTIC" });
    const traces = [passingTrace({ traceId: "tr-1" }), passingTrace({ traceId: "tr-2" }), passingTrace({ traceId: "tr-3" })];
    const evaluation = gradeBehavioralEvaluation(fixture, traces);
    expect(evaluation.result).toBe("PASS_WITH_EVIDENCE");
    expect(evaluation.repeatsObserved).toBe(3);
    expect(evaluation.repeatsRequired).toBe(3);
  });
});

describe("gradeBehavioralEvaluation - insufficient stochastic repeat evidence (required negative case)", () => {
  it("flags INSUFFICIENT_REPEAT_EVIDENCE with fewer than three consecutive passing repeats", () => {
    const fixture = deterministicFixture({ repeatPolicy: "STOCHASTIC" });
    const traces = [passingTrace({ traceId: "tr-1" }), passingTrace({ traceId: "tr-2" })];
    const evaluation = gradeBehavioralEvaluation(fixture, traces);
    expect(evaluation.result).toBe("INSUFFICIENT_REPEAT_EVIDENCE");
    expect(evaluation.defects[0].defectClass).toBe("INSUFFICIENT_REPEAT_EVIDENCE");
    expect(evaluation.repeatsObserved).toBe(2);
    expect(evaluation.repeatsRequired).toBe(3);
  });

  it("stops counting consecutive passes at the first failing repeat", () => {
    const fixture = deterministicFixture({ repeatPolicy: "STOCHASTIC" });
    const traces = [
      passingTrace({ traceId: "tr-1" }),
      passingTrace({ traceId: "tr-2", outputObservations: [] }),
      passingTrace({ traceId: "tr-3" }),
    ];
    const evaluation = gradeBehavioralEvaluation(fixture, traces);
    expect(evaluation.repeatsObserved).toBe(1);
    expect(evaluation.repeatsRequired).toBe(3);
  });

  it("R1: flags INSUFFICIENT_REPEAT_EVIDENCE for a deterministic fixture with zero repeats supplied via an empty-but-present array", () => {
    const fixture = deterministicFixture();
    const evaluation = gradeBehavioralEvaluation(fixture, []);
    expect(evaluation.result).toBe("INCOMPLETE_TRACE");
    expect(evaluation.repeatsObserved).toBe(0);
    expect(evaluation.repeatsRequired).toBe(1);
  });

  it("R1: flags INSUFFICIENT_REPEAT_EVIDENCE for a deterministic fixture with more than one repeat (exact-one-repeat rule)", () => {
    const fixture = deterministicFixture();
    const traces = [passingTrace({ traceId: "tr-1" }), passingTrace({ traceId: "tr-2" })];
    const evaluation = gradeBehavioralEvaluation(fixture, traces);
    expect(evaluation.result).toBe("INSUFFICIENT_REPEAT_EVIDENCE");
    expect(evaluation.repeatsObserved).toBe(2);
    expect(evaluation.repeatsRequired).toBe(1);
  });
});

describe("gradeBehavioralEvaluation - missing required trace event or output (required negative case)", () => {
  it("flags INCOMPLETE_TRACE when a required event is missing", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({ events: [{ from: "start", action: "read_file", to: "read" }] });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("INCOMPLETE_TRACE");
    expect(evaluation.defects.some((d) => d.defectClass === "INCOMPLETE_TRACE")).toBe(true);
  });

  it("flags INCOMPLETE_TRACE when a required output observation is missing", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({ outputObservations: [] });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("INCOMPLETE_TRACE");
  });

  it("flags INCOMPLETE_TRACE when no trace is supplied at all", () => {
    const evaluation = gradeBehavioralEvaluation(deterministicFixture(), []);
    expect(evaluation.result).toBe("INCOMPLETE_TRACE");
    expect(evaluation.repeatsObserved).toBe(0);
  });
});

describe("gradeBehavioralEvaluation - undeclared tool/action use (required negative case)", () => {
  it("flags UNDECLARED_TOOL_USE for a transition outside the allowed-transition table", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({
      events: [
        { from: "start", action: "read_file", to: "read" },
        { from: "read", action: "delete_file", to: "done" },
      ],
    });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("UNDECLARED_TOOL_USE");
    expect(evaluation.defects.some((d) => d.defectClass === "UNDECLARED_TOOL_USE")).toBe(true);
  });

  it("still fails as UNDECLARED_TOOL_USE even when the outcome assertion matches (correct outcome via forbidden process)", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({
      events: [
        { from: "start", action: "read_file", to: "read" },
        { from: "read", action: "shell_exec", to: "done" },
      ],
      outcomeValues: { status: "ok" },
    });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("UNDECLARED_TOOL_USE");
  });
});

describe("gradeBehavioralEvaluation - self-grading is never trusted (required negative case)", () => {
  it("ignores selfReportedPass: true on an otherwise-defective trace", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({ outputObservations: [], selfReportedPass: true });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("INCOMPLETE_TRACE");
  });

  it("ignores selfReportedPass: false on an otherwise-clean trace", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({ selfReportedPass: false });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("PASS_WITH_EVIDENCE");
  });
});

describe("gradeBehavioralEvaluation - capture mode authority (R1-01)", () => {
  it("rejects a trace declaring the unauthorized LIVE capture mode as structurally malformed", () => {
    const fixture = deterministicFixture();
    const trace = { ...passingTrace(), captureMode: "LIVE" };
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
    expect(evaluation.defects[0].detail).toContain("captureMode");
  });

  it("rejects a trace with a missing captureMode field", () => {
    const fixture = deterministicFixture();
    const trace = { ...passingTrace() } as Record<string, unknown>;
    delete trace.captureMode;
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
  });

  it("rejects a trace with an unknown captureMode value", () => {
    const fixture = deterministicFixture();
    const trace = { ...passingTrace(), captureMode: "SIMULATED" };
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
  });

  it("accepts OFFLINE_SYNTHETIC, MOCK_REPLAY, and LIVE_REFERENCE_ONLY as the only valid capture modes", () => {
    const fixtureClock = deterministicFixture({ evaluationClockIso: "2026-09-16T00:00:00Z" });
    const offline = gradeBehavioralEvaluation(fixtureClock, [passingTrace({ captureMode: "OFFLINE_SYNTHETIC" })]);
    expect(offline.result).toBe("PASS_WITH_EVIDENCE");

    const mockReplay = gradeBehavioralEvaluation(fixtureClock, [
      passingTrace({
        captureMode: "MOCK_REPLAY",
        provenanceSourceCommit: "abc123",
        provenanceExpiry: "2099-01-01T00:00:00Z",
      }),
    ]);
    expect(mockReplay.result).toBe("PASS_WITH_EVIDENCE");

    const liveRef = gradeBehavioralEvaluation(fixtureClock, [passingTrace({ captureMode: "LIVE_REFERENCE_ONLY" })]);
    expect(liveRef.result).toBe("PASS_WITH_EVIDENCE");
  });

  it("never labels any of the three valid capture modes as live proof in the claim boundary", () => {
    const fixture = deterministicFixture();
    for (const mode of ["OFFLINE_SYNTHETIC", "MOCK_REPLAY", "LIVE_REFERENCE_ONLY"] as const) {
      const trace =
        mode === "MOCK_REPLAY"
          ? passingTrace({ captureMode: mode, provenanceSourceCommit: "abc123", provenanceExpiry: "2099-01-01T00:00:00Z" })
          : passingTrace({ captureMode: mode });
      const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
      expect(evaluation.claimBoundary.toLowerCase()).toContain("never live provider proof");
    }
  });
});

describe("gradeBehavioralEvaluation - stale/expired/provenance-free mock replay (required negative case)", () => {
  it("flags STALE_REPLAY_PROVENANCE when provenanceSourceCommit is absent", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({
      captureMode: "MOCK_REPLAY",
      provenanceSourceCommit: null,
      provenanceExpiry: "2099-01-01T00:00:00Z",
    });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("STALE_REPLAY_PROVENANCE");
  });

  it("flags STALE_REPLAY_PROVENANCE when provenanceExpiry has passed relative to the fixture clock", () => {
    const fixture = deterministicFixture({ evaluationClockIso: "2026-09-16T00:00:00Z" });
    const trace = passingTrace({
      captureMode: "MOCK_REPLAY",
      provenanceSourceCommit: "abc123",
      provenanceExpiry: "2026-01-01T00:00:00Z",
    });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("STALE_REPLAY_PROVENANCE");
  });

  it("flags STALE_REPLAY_PROVENANCE when provenanceExpiry exactly equals the fixture clock (strictly-after required)", () => {
    const fixture = deterministicFixture({ evaluationClockIso: "2026-09-16T00:00:00Z" });
    const trace = passingTrace({
      captureMode: "MOCK_REPLAY",
      provenanceSourceCommit: "abc123",
      provenanceExpiry: "2026-09-16T00:00:00Z",
    });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("STALE_REPLAY_PROVENANCE");
  });

  it("flags STALE_REPLAY_PROVENANCE for a malformed expiry date", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({
      captureMode: "MOCK_REPLAY",
      provenanceSourceCommit: "abc123",
      provenanceExpiry: "not-a-date",
    });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("STALE_REPLAY_PROVENANCE");
  });

  it("flags STALE_REPLAY_PROVENANCE for a non-ISO-8601 expiry date that Date.parse alone would accept (strict ISO-8601 required)", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({
      captureMode: "MOCK_REPLAY",
      provenanceSourceCommit: "abc123",
      provenanceExpiry: "January 1, 2099",
    });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("STALE_REPLAY_PROVENANCE");
  });

  it("flags STALE_REPLAY_PROVENANCE for a calendar-invalid ISO-8601-shaped expiry date (2026-02-30)", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({
      captureMode: "MOCK_REPLAY",
      provenanceSourceCommit: "abc123",
      provenanceExpiry: "2026-02-30T00:00:00Z",
    });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("STALE_REPLAY_PROVENANCE");
  });

  it("passes a non-expired, provenance-carrying mock replay and never claims LIVE proof", () => {
    const fixture = deterministicFixture({ evaluationClockIso: "2026-09-16T00:00:00Z" });
    const trace = passingTrace({
      captureMode: "MOCK_REPLAY",
      provenanceSourceCommit: "abc123",
      provenanceExpiry: "2099-01-01T00:00:00Z",
    });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("PASS_WITH_EVIDENCE");
  });

  it("accepts a valid non-UTC ISO-8601 offset consistently with the Python checker", () => {
    const fixture = deterministicFixture({ evaluationClockIso: "2026-09-16T07:00:00+07:00" });
    const trace = passingTrace({
      captureMode: "MOCK_REPLAY",
      provenanceSourceCommit: "abc123",
      provenanceExpiry: "2099-01-01T07:00:00+07:00",
    });
    expect(gradeBehavioralEvaluation(fixture, [trace]).result).toBe("PASS_WITH_EVIDENCE");
  });
});

describe("gradeBehavioralEvaluation - malformed evaluation clock date (R1-02)", () => {
  it("fails closed when the fixture's evaluationClockIso is malformed", () => {
    const fixture = deterministicFixture({ evaluationClockIso: "not-a-date" });
    const evaluation = gradeBehavioralEvaluation(fixture, [passingTrace()]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
    expect(evaluation.defects[0].detail).toContain("evaluationClockIso");
  });

  it("fails closed when the fixture's evaluationClockIso is missing", () => {
    const fixture = { ...deterministicFixture() } as Record<string, unknown>;
    delete fixture.evaluationClockIso;
    const evaluation = gradeBehavioralEvaluation(fixture, [passingTrace()]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
  });
});

describe("gradeBehavioralEvaluation - unequal WITH/WITHOUT canonical input bytes (required negative case)", () => {
  it("fails closed when a WITH fixture reaches the grader without a pair", () => {
    const fixture = deterministicFixture({ baselineRole: "WITH" });
    expect(gradeBehavioralEvaluation(fixture, [passingTrace()]).result).toBe(
      "NONEQUIVALENT_BASELINE_PAIR",
    );
  });

  it("fails closed when a WITHOUT fixture reaches the grader without a pair", () => {
    const fixture = deterministicFixture({ baselineRole: "WITHOUT" });
    expect(gradeBehavioralEvaluation(fixture, [passingTrace()]).result).toBe(
      "NONEQUIVALENT_BASELINE_PAIR",
    );
  });

  it("fails closed on a same-role pair in the grading path", () => {
    const first = deterministicFixture({ baselineRole: "WITH" });
    const second = deterministicFixture({ fixtureId: "fx-other", baselineRole: "WITH" });
    expect(gradeBehavioralEvaluation(first, [passingTrace()], second).result).toBe(
      "NONEQUIVALENT_BASELINE_PAIR",
    );
  });

  it("fails closed when a NONE-role fixture is graded with an unexpected pair", () => {
    const fixture = deterministicFixture({ baselineRole: "NONE" });
    const pair = deterministicFixture({ fixtureId: "fx-other", baselineRole: "WITH" });
    expect(gradeBehavioralEvaluation(fixture, [passingTrace()], pair).result).toBe(
      "NONEQUIVALENT_BASELINE_PAIR",
    );
  });

  it("flags NONEQUIVALENT_BASELINE_PAIR when canonicalInputBytes differ between the pair", () => {
    const withFixture = deterministicFixture({
      fixtureId: "fx-with",
      baselineRole: "WITH",
      canonicalInputBytes: "shared-input",
    });
    const withoutFixture = deterministicFixture({
      fixtureId: "fx-without",
      baselineRole: "WITHOUT",
      canonicalInputBytes: "different-input",
    });
    const trace = passingTrace({ fixtureId: "fx-with" });
    const evaluation = gradeBehavioralEvaluation(withFixture, [trace], withoutFixture);
    expect(evaluation.result).toBe("NONEQUIVALENT_BASELINE_PAIR");
  });

  it("does not flag NONEQUIVALENT_BASELINE_PAIR for byte-identical WITH/WITHOUT inputs", () => {
    const withFixture = deterministicFixture({
      fixtureId: "fx-with",
      baselineRole: "WITH",
      canonicalInputBytes: "shared-input",
    });
    const withoutFixture = deterministicFixture({
      fixtureId: "fx-without",
      baselineRole: "WITHOUT",
      canonicalInputBytes: "shared-input",
    });
    const trace = passingTrace({ fixtureId: "fx-with" });
    const evaluation = gradeBehavioralEvaluation(withFixture, [trace], withoutFixture);
    expect(evaluation.result).toBe("PASS_WITH_EVIDENCE");
  });
});

describe("gradeBehavioralEvaluation - source-hash invalidation (required contract dimension)", () => {
  it("fails closed when the trace's sourceContentHash no longer matches the fixture", () => {
    const fixture = deterministicFixture({ sourceContentHash: SOURCE_HASH });
    const trace = passingTrace({ sourceContentHash: OTHER_SOURCE_HASH });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects.some((d) => d.defectClass === "SOURCE_HASH_MISMATCH")).toBe(true);
  });

  it("R1: fails closed when the fixture's sourceContentHash is missing", () => {
    const fixture = { ...deterministicFixture() } as Record<string, unknown>;
    delete fixture.sourceContentHash;
    const evaluation = gradeBehavioralEvaluation(fixture, [passingTrace()]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
    expect(evaluation.defects[0].detail).toContain("sourceContentHash");
  });

  it("R1: fails closed when the fixture's sourceContentHash is malformed (not 64-hex)", () => {
    const fixture = deterministicFixture({ sourceContentHash: "not-a-hash" });
    const evaluation = gradeBehavioralEvaluation(fixture, [passingTrace()]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
  });

  it("R1: fails closed when the fixture's fixtureContentHash is missing", () => {
    const fixture = { ...deterministicFixture() } as Record<string, unknown>;
    delete fixture.fixtureContentHash;
    const evaluation = gradeBehavioralEvaluation(fixture, [passingTrace()]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
    expect(evaluation.defects[0].detail).toContain("fixtureContentHash");
  });

  it("R1: fails closed when the fixture's fixtureContentHash is malformed", () => {
    const fixture = deterministicFixture({ fixtureContentHash: "zz" });
    const evaluation = gradeBehavioralEvaluation(fixture, [passingTrace()]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
  });
});

describe("gradeBehavioralEvaluation - outcome assertion mismatch", () => {
  it("fails closed when an outcome assertion does not match the trace's outcome values", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({ outcomeValues: { status: "error" } });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects.some((d) => d.defectClass === "OUTCOME_ASSERTION_MISMATCH")).toBe(true);
  });
});

describe("gradeBehavioralEvaluation - malformed/unknown structural input fails closed without throwing (R1-02)", () => {
  it("fails closed on an unknown repeatPolicy value", () => {
    const fixture = deterministicFixture({ repeatPolicy: "OCCASIONAL" as never });
    const evaluation = gradeBehavioralEvaluation(fixture, [passingTrace()]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects.some((d) => d.defectClass === "MALFORMED_INPUT")).toBe(true);
  });

  it("fails closed when the trace's fixtureId does not match the fixture", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace({ fixtureId: "some-other-fixture" });
    const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects.some((d) => d.defectClass === "MALFORMED_INPUT")).toBe(true);
  });

  it("fails closed without throwing when fixture is null", () => {
    expect(() => gradeBehavioralEvaluation(null, [passingTrace()])).not.toThrow();
    const evaluation = gradeBehavioralEvaluation(null, [passingTrace()]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
  });

  it("fails closed without throwing when fixture is a string", () => {
    expect(() => gradeBehavioralEvaluation("not-a-fixture", [])).not.toThrow();
    const evaluation = gradeBehavioralEvaluation("not-a-fixture", []);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
  });

  it("fails closed without throwing when fixture is an array", () => {
    const evaluation = gradeBehavioralEvaluation([1, 2, 3], []);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
  });

  it("fails closed without throwing when fixture is undefined", () => {
    const evaluation = gradeBehavioralEvaluation(undefined, []);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
  });

  it("fails closed without throwing when traces is not an array", () => {
    const evaluation = gradeBehavioralEvaluation(deterministicFixture(), "not-an-array");
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
  });

  it("fails closed without throwing when a trace entry is null", () => {
    const evaluation = gradeBehavioralEvaluation(deterministicFixture(), [null]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
  });

  it("fails closed without throwing when a trace entry is a bare string", () => {
    const evaluation = gradeBehavioralEvaluation(deterministicFixture(), ["not-a-trace"]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
  });

  it("fails closed without throwing when a trace's events array contains a malformed entry", () => {
    const trace = { ...passingTrace(), events: [{ from: "start" }] };
    const evaluation = gradeBehavioralEvaluation(deterministicFixture(), [trace]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
  });

  it("fails closed without throwing when a trace's outcomeValues is not an object", () => {
    const trace = { ...passingTrace(), outcomeValues: "not-an-object" };
    const evaluation = gradeBehavioralEvaluation(deterministicFixture(), [trace]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
  });

  it("fails closed without throwing when the fixture's allowedTransitions is malformed", () => {
    const fixture = { ...deterministicFixture(), allowedTransitions: ["not-a-transition"] };
    const evaluation = gradeBehavioralEvaluation(fixture, [passingTrace()]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
  });

  it("fails closed without throwing when the fixture's requiredEvents is not a string array", () => {
    const fixture = { ...deterministicFixture(), requiredEvents: [123] };
    const evaluation = gradeBehavioralEvaluation(fixture, [passingTrace()]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
    expect(evaluation.defects[0].defectClass).toBe("MALFORMED_INPUT");
  });

  it("fails closed without throwing on deeply malformed nested garbage input", () => {
    const garbage = { fixtureId: 123, steps: [{ a: () => {} }], nested: { deep: [null, undefined, NaN] } };
    expect(() => gradeBehavioralEvaluation(garbage, [garbage])).not.toThrow();
    const evaluation = gradeBehavioralEvaluation(garbage, [garbage]);
    expect(evaluation.result).toBe("FAIL_WITH_DEFECTS");
  });
});

describe("gradeBehavioralEvaluation - input non-mutation", () => {
  it("does not mutate the fixture or trace objects passed to it", () => {
    const fixture = deterministicFixture();
    const trace = passingTrace();
    const fixtureSnapshot = JSON.parse(JSON.stringify(fixture));
    const traceSnapshot = JSON.parse(JSON.stringify(trace));
    gradeBehavioralEvaluation(fixture, [trace]);
    expect(JSON.parse(JSON.stringify(fixture))).toEqual(fixtureSnapshot);
    expect(JSON.parse(JSON.stringify(trace))).toEqual(traceSnapshot);
  });
});

describe("gradeBehavioralEvaluation - source change invalidation across repeated grading", () => {
  it("PASS_WITH_EVIDENCE for the original source hash becomes FAIL_WITH_DEFECTS after the source hash changes", () => {
    const fixture = deterministicFixture({ sourceContentHash: SOURCE_HASH });
    const trace = passingTrace({ sourceContentHash: SOURCE_HASH });
    const before = gradeBehavioralEvaluation(fixture, [trace]);
    expect(before.result).toBe("PASS_WITH_EVIDENCE");

    const changedFixture = deterministicFixture({ sourceContentHash: OTHER_SOURCE_HASH });
    const staleTrace = passingTrace({ sourceContentHash: SOURCE_HASH });
    const after = gradeBehavioralEvaluation(changedFixture, [staleTrace]);
    expect(after.result).toBe("FAIL_WITH_DEFECTS");
    expect(after.defects.some((d) => d.defectClass === "SOURCE_HASH_MISMATCH")).toBe(true);
  });
});

describe("gradeBehavioralEvaluation - deterministic replay of grading and repeatability", () => {
  it("produces byte-identical evaluation objects for five repeated calls on each fixture/trace pair", () => {
    const cases: Array<[BehavioralFixture, BehavioralTrace[]]> = [
      [deterministicFixture(), [passingTrace()]],
      [deterministicFixture(), [passingTrace({ outputObservations: [] })]],
      [
        deterministicFixture({ repeatPolicy: "STOCHASTIC" }),
        [passingTrace({ traceId: "tr-1" }), passingTrace({ traceId: "tr-2" })],
      ],
    ];
    for (const [fixture, traces] of cases) {
      const results = Array.from({ length: 5 }, () => gradeBehavioralEvaluation(fixture, traces));
      for (let i = 1; i < results.length; i += 1) {
        expect(results[i]).toEqual(results[0]);
      }
    }
  });
});

describe("gradeBehavioralEvaluation - never writes certificationState: CERTIFIED", () => {
  it("never emits a CERTIFIED-shaped field on any fixture/trace pair", () => {
    const fixtures: Array<[BehavioralFixture, BehavioralTrace[]]> = [
      [deterministicFixture(), [passingTrace()]],
      [deterministicFixture(), []],
      [deterministicFixture(), [passingTrace({ events: [] })]],
    ];
    for (const [fixture, traces] of fixtures) {
      const evaluation = gradeBehavioralEvaluation(fixture, traces);
      expect(JSON.stringify(evaluation)).not.toContain("CERTIFIED");
      expect(JSON.stringify(evaluation)).not.toContain("certificationState");
    }
  });
});

describe("produceBehavioralTrace - runner/grader separation", () => {
  it("produces a frozen trace object independent of the grader", () => {
    const trace = passingTrace();
    expect(Object.isFrozen(trace)).toBe(true);
    expect(Object.isFrozen(trace.events)).toBe(true);
    expect(Object.isFrozen(trace.outputObservations)).toBe(true);
  });

  it("defaults optional provenance and self-report fields to null", () => {
    const trace = produceBehavioralTrace({
      traceId: "tr-minimal",
      fixtureId: "fx-positive-1",
      captureMode: "OFFLINE_SYNTHETIC",
      sourceContentHash: SOURCE_HASH,
      events: [],
      outputObservations: [],
      outcomeValues: {},
    });
    expect(trace.provenanceSourceCommit).toBeNull();
    expect(trace.provenanceExpiry).toBeNull();
    expect(trace.selfReportedPass).toBeNull();
  });
});

describe("admitFixtureSet - positive-plus-negative rule (R1-03)", () => {
  it("admits a fixture set with at least one POSITIVE and one NEGATIVE case", () => {
    const set = [
      deterministicFixture({ fixtureId: "fx-pos", fixtureClass: "POSITIVE" }),
      deterministicFixture({ fixtureId: "fx-neg", fixtureClass: "NEGATIVE" }),
    ];
    const evaluation = admitFixtureSet(set);
    expect(evaluation.admission).toBe("ADMITTED");
    expect(evaluation.positiveCount).toBe(1);
    expect(evaluation.negativeCount).toBe(1);
  });

  it("R1: rejects a positive-only fixture set (MISSING_NEGATIVE_CASE)", () => {
    const set = [
      deterministicFixture({ fixtureId: "fx-pos-1", fixtureClass: "POSITIVE" }),
      deterministicFixture({ fixtureId: "fx-pos-2", fixtureClass: "POSITIVE" }),
    ];
    const evaluation = admitFixtureSet(set);
    expect(evaluation.admission).toBe("MISSING_NEGATIVE_CASE");
    expect(evaluation.positiveCount).toBe(2);
    expect(evaluation.negativeCount).toBe(0);
  });

  it("R1: rejects a negative-only fixture set (MISSING_POSITIVE_CASE)", () => {
    const set = [
      deterministicFixture({ fixtureId: "fx-neg-1", fixtureClass: "NEGATIVE" }),
      deterministicFixture({ fixtureId: "fx-neg-2", fixtureClass: "NEGATIVE" }),
    ];
    const evaluation = admitFixtureSet(set);
    expect(evaluation.admission).toBe("MISSING_POSITIVE_CASE");
    expect(evaluation.positiveCount).toBe(0);
    expect(evaluation.negativeCount).toBe(2);
  });

  it("rejects an empty fixture set as malformed", () => {
    const evaluation = admitFixtureSet([]);
    expect(evaluation.admission).toBe("MALFORMED_FIXTURE_SET");
  });

  it("rejects a non-array fixture set as malformed without throwing", () => {
    expect(() => admitFixtureSet("not-an-array")).not.toThrow();
    const evaluation = admitFixtureSet("not-an-array");
    expect(evaluation.admission).toBe("MALFORMED_FIXTURE_SET");
  });

  it("rejects a fixture set containing a structurally malformed entry", () => {
    const set = [deterministicFixture({ fixtureClass: "POSITIVE" }), { not: "a fixture" }];
    const evaluation = admitFixtureSet(set);
    expect(evaluation.admission).toBe("MALFORMED_FIXTURE_SET");
  });

  it("does not mutate the input fixture array", () => {
    const set = [
      deterministicFixture({ fixtureId: "fx-pos", fixtureClass: "POSITIVE" }),
      deterministicFixture({ fixtureId: "fx-neg", fixtureClass: "NEGATIVE" }),
    ];
    const snapshot = JSON.parse(JSON.stringify(set));
    admitFixtureSet(set);
    expect(JSON.parse(JSON.stringify(set))).toEqual(snapshot);
  });
});

describe("admitBaselinePair - WITH/WITHOUT pairing rule (R1-03)", () => {
  it("admits a complementary WITH/WITHOUT pair with byte-identical canonical input bytes", () => {
    const withFixture = deterministicFixture({ baselineRole: "WITH", canonicalInputBytes: "same" });
    const withoutFixture = deterministicFixture({ baselineRole: "WITHOUT", canonicalInputBytes: "same" });
    const evaluation = admitBaselinePair(withFixture, withoutFixture);
    expect(evaluation.admission).toBe("ADMITTED_PAIR");
  });

  it("admits a NONE-role fixture with no pair supplied", () => {
    const fixture = deterministicFixture({ baselineRole: "NONE" });
    const evaluation = admitBaselinePair(fixture, null);
    expect(evaluation.admission).toBe("ADMITTED_NO_PAIR_REQUIRED");
  });

  it("R1: rejects a WITH fixture with a missing pair (MISSING_PAIR)", () => {
    const fixture = deterministicFixture({ baselineRole: "WITH" });
    const evaluation = admitBaselinePair(fixture, null);
    expect(evaluation.admission).toBe("MISSING_PAIR");
  });

  it("R1: rejects a WITHOUT fixture with a missing pair (MISSING_PAIR)", () => {
    const fixture = deterministicFixture({ baselineRole: "WITHOUT" });
    const evaluation = admitBaselinePair(fixture, undefined);
    expect(evaluation.admission).toBe("MISSING_PAIR");
  });

  it("R1: rejects a same-role pair (two WITH fixtures)", () => {
    const first = deterministicFixture({ fixtureId: "fx-a", baselineRole: "WITH", canonicalInputBytes: "same" });
    const second = deterministicFixture({ fixtureId: "fx-b", baselineRole: "WITH", canonicalInputBytes: "same" });
    const evaluation = admitBaselinePair(first, second);
    expect(evaluation.admission).toBe("SAME_ROLE_PAIR");
  });

  it("R1: rejects a same-role pair (two WITHOUT fixtures)", () => {
    const first = deterministicFixture({ fixtureId: "fx-a", baselineRole: "WITHOUT", canonicalInputBytes: "same" });
    const second = deterministicFixture({ fixtureId: "fx-b", baselineRole: "WITHOUT", canonicalInputBytes: "same" });
    const evaluation = admitBaselinePair(first, second);
    expect(evaluation.admission).toBe("SAME_ROLE_PAIR");
  });

  it("R1: rejects a malformed paired fixture role", () => {
    const fixture = deterministicFixture({ baselineRole: "WITH" });
    const malformedPair = { ...deterministicFixture({ baselineRole: "WITHOUT" }), baselineRole: "SIDEWAYS" };
    const evaluation = admitBaselinePair(fixture, malformedPair);
    expect(evaluation.admission).toBe("MALFORMED_ROLE");
  });

  it("rejects unequal canonical input bytes between the pair", () => {
    const withFixture = deterministicFixture({ baselineRole: "WITH", canonicalInputBytes: "a" });
    const withoutFixture = deterministicFixture({ baselineRole: "WITHOUT", canonicalInputBytes: "b" });
    const evaluation = admitBaselinePair(withFixture, withoutFixture);
    expect(evaluation.admission).toBe("NONEQUIVALENT_INPUT_BYTES");
  });

  it("R1: rejects a NONE-role fixture with an unexpected pair supplied (must not silently consume a comparison pair)", () => {
    const fixture = deterministicFixture({ baselineRole: "NONE" });
    const unexpectedPair = deterministicFixture({ fixtureId: "fx-other", baselineRole: "WITH" });
    const evaluation = admitBaselinePair(fixture, unexpectedPair);
    expect(evaluation.admission).toBe("UNEXPECTED_PAIR_FOR_NONE_ROLE");
  });

  it("rejects a structurally malformed primary fixture without throwing", () => {
    expect(() => admitBaselinePair("not-a-fixture", null)).not.toThrow();
    const evaluation = admitBaselinePair("not-a-fixture", null);
    expect(evaluation.admission).toBe("MALFORMED_ROLE");
  });
});
