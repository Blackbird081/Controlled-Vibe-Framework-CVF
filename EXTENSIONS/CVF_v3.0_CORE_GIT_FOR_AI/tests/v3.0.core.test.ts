import { describe, it, expect } from "vitest";
import { createCommit, parseCommit, verifyCommitIntegrity } from "../ai_commit/ai.commit.parser.js";
import { validateCommit } from "../ai_commit/ai.commit.validator.js";
import { ArtifactStagingArea } from "../artifact_staging/artifact.staging.js";
import { ArtifactLedger } from "../artifact_ledger/artifact.ledger.js";
import { ProcessModel } from "../process_model/process.model.js";
import type { AICommitInput } from "../ai_commit/ai.commit.schema.js";
import * as crypto from "crypto";

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeHash(content: string): string {
    return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function makeInput(overrides: Partial<AICommitInput> = {}): AICommitInput {
    return {
        agent_id: "agent-test-01",
        skill: "spec-writer",
        type: "SPEC",
        rationale: "Creating initial feature spec",
        phase: "SPEC",
        artifacts: [
            {
                type: "feature.spec",
                path: "docs/feature.spec.md",
                contentHash: makeHash("spec content"),
                operation: "CREATE",
            },
        ],
        parent_commit_id: null,
        ...overrides,
    };
}

// ─── AI Commit Model ──────────────────────────────────────────────────────────

describe("CVF Core — AI Commit Model", () => {
    it("createCommit produces deterministic commit_id", () => {
        const input = makeInput();
        const c1 = createCommit(input);
        const c2 = createCommit(input);
        expect(c1.commit_id).toBe(c2.commit_id);
        expect(c1.commit_id).toHaveLength(64); // SHA-256 hex
    });

    it("createCommit sets status=PENDING and populates artifact_snapshot", () => {
        const commit = createCommit(makeInput());
        expect(commit.status).toBe("PENDING");
        expect(commit.artifact_snapshot).toHaveLength(64);
        expect(commit.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("different inputs produce different commit_ids", () => {
        const c1 = createCommit(makeInput({ rationale: "reason A" }));
        const c2 = createCommit(makeInput({ rationale: "reason B" }));
        expect(c1.commit_id).not.toBe(c2.commit_id);
    });

    it("verifyCommitIntegrity returns true for untampered commit", () => {
        const commit = createCommit(makeInput());
        expect(verifyCommitIntegrity(commit)).toBe(true);
    });

    it("verifyCommitIntegrity returns false for tampered commit", () => {
        const commit = createCommit(makeInput());
        const tampered = { ...commit, rationale: "tampered" };
        expect(verifyCommitIntegrity(tampered)).toBe(false);
    });

    it("parseCommit accepts valid commit object", () => {
        const commit = createCommit(makeInput());
        const parsed = parseCommit(commit);
        expect(parsed.commit_id).toBe(commit.commit_id);
    });

    it("parseCommit throws on missing fields", () => {
        expect(() => parseCommit({ agent_id: "x" })).toThrow("missing required field");
    });

    it("parseCommit throws when input is not an object", () => {
        expect(() => parseCommit(null)).toThrow("input must be an object");
    });

    it("parseCommit throws when artifacts is not an array", () => {
        const commit = createCommit(makeInput());
        expect(() => parseCommit({ ...commit, artifacts: "invalid" })).toThrow(
            "artifacts must be an array"
        );
    });

    it("parseCommit throws when an artifact is not an object", () => {
        const commit = createCommit(makeInput());
        expect(() => parseCommit({ ...commit, artifacts: [123] })).toThrow(
            "each artifact must be an object"
        );
    });

    it("parseCommit throws when artifact fields are not strings", () => {
        const commit = createCommit(makeInput());
        const badArtifact = { ...commit.artifacts[0], operation: 1 };
        expect(() => parseCommit({ ...commit, artifacts: [badArtifact] })).toThrow(
            "artifact.operation must be a string"
        );
    });

    it("validateCommit passes on valid PENDING commit", () => {
        const commit = createCommit(makeInput());
        const result = validateCommit(commit);
        expect(result.valid).toBe(true);
        expect(result.violations).toHaveLength(0);
    });

    it("validateCommit catches empty agent_id (RULE-02)", () => {
        const commit = createCommit(makeInput({ agent_id: "" }));
        // Override commit_id check — we test RULE-02 specifically
        const result = validateCommit({ ...commit, agent_id: "" });
        const rules = result.violations.map((v) => v.rule);
        expect(rules).toContain("RULE-02");
    });

    it("validateCommit catches REJECTED without rejection_reason (RULE-08)", () => {
        const commit = createCommit(makeInput());
        const rejected = { ...commit, status: "REJECTED" as const };
        const result = validateCommit(rejected);
        const rules = result.violations.map((v) => v.rule);
        expect(rules).toContain("RULE-08");
    });

    it("validateCommit catches integrity mismatch (RULE-01)", () => {
        const commit = createCommit(makeInput());
        const tampered = { ...commit, rationale: "mutated content" };
        const result = validateCommit(tampered);
        const rules = result.violations.map((v) => v.rule);
        expect(rules).toContain("RULE-01");
    });

    it("validateCommit catches empty artifacts (RULE-03)", () => {
        const commit = createCommit(makeInput());
        const result = validateCommit({ ...commit, artifacts: [] });
        const rules = result.violations.map((v) => v.rule);
        expect(rules).toContain("RULE-03");
    });

    it("validateCommit catches invalid artifact hash (RULE-04)", () => {
        const commit = createCommit(makeInput());
        const badArtifact = { ...commit.artifacts[0], contentHash: "bad-hash" };
        const result = validateCommit({ ...commit, artifacts: [badArtifact] });
        const rules = result.violations.map((v) => v.rule);
        expect(rules).toContain("RULE-04");
    });

    it("validateCommit catches invalid timestamp (RULE-05)", () => {
        const commit = createCommit(makeInput());
        const result = validateCommit({ ...commit, timestamp: "not-iso8601" });
        const rules = result.violations.map((v) => v.rule);
        expect(rules).toContain("RULE-05");
    });

    it("validateCommit catches invalid parent_commit_id (RULE-06)", () => {
        const commit = createCommit(makeInput());
        const result = validateCommit({ ...commit, parent_commit_id: "invalid-parent" });
        const rules = result.violations.map((v) => v.rule);
        expect(rules).toContain("RULE-06");
    });

    it("validateCommit catches PENDING with rejection_reason (RULE-07)", () => {
        const commit = createCommit(makeInput());
        const pending = { ...commit, rejection_reason: "should-not-exist" };
        const result = validateCommit(pending);
        const rules = result.violations.map((v) => v.rule);
        expect(rules).toContain("RULE-07");
    });

    it("validateCommit catches REJECTED with blank rejection_reason (RULE-08)", () => {
        const commit = createCommit(makeInput());
        const rejected = { ...commit, status: "REJECTED" as const, rejection_reason: "   " };
        const result = validateCommit(rejected);
        const rules = result.violations.map((v) => v.rule);
        expect(rules).toContain("RULE-08");
    });
});

// ─── Artifact Staging ─────────────────────────────────────────────────────────

describe("CVF Core — Artifact Staging", () => {
    it("stageArtifact creates CANDIDATE with stable artifact_id", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        expect(a.status).toBe("CANDIDATE");
        expect(a.artifact_id).toHaveLength(64);
        expect(a.contentHash).toHaveLength(64);
    });

    it("submitToGovernance moves CANDIDATE to IN_GOVERNANCE", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        staging.submitToGovernance(a.artifact_id, "run-001");
        const updated = staging.getArtifact(a.artifact_id)!;
        expect(updated.status).toBe("IN_GOVERNANCE");
        expect(updated.governance_run_id).toBe("run-001");
    });

    it("acceptArtifact moves IN_GOVERNANCE to ACCEPTED", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        staging.submitToGovernance(a.artifact_id, "run-001");
        staging.acceptArtifact(a.artifact_id);
        expect(staging.getArtifact(a.artifact_id)!.status).toBe("ACCEPTED");
    });

    it("rejectArtifact sets REJECTED with reason", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        staging.submitToGovernance(a.artifact_id, "run-001");
        staging.rejectArtifact(a.artifact_id, "missing required fields");
        const rejected = staging.getArtifact(a.artifact_id)!;
        expect(rejected.status).toBe("REJECTED");
        expect(rejected.rejection_reason).toBe("missing required fields");
    });

    it("unstageArtifact removes CANDIDATE", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        staging.unstageArtifact(a.artifact_id);
        expect(staging.getArtifact(a.artifact_id)).toBeUndefined();
    });

    it("cannot submit non-CANDIDATE to governance", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        staging.submitToGovernance(a.artifact_id, "run-001");
        expect(() => staging.submitToGovernance(a.artifact_id, "run-002")).toThrow("only CANDIDATE");
    });

    it("cannot accept artifact unless IN_GOVERNANCE", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        expect(() => staging.acceptArtifact(a.artifact_id)).toThrow("only IN_GOVERNANCE");
    });

    it("cannot reject artifact unless IN_GOVERNANCE", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        expect(() => staging.rejectArtifact(a.artifact_id, "bad")).toThrow("only IN_GOVERNANCE");
    });

    it("cannot unstage non-CANDIDATE artifacts", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        staging.submitToGovernance(a.artifact_id, "run-001");
        expect(() => staging.unstageArtifact(a.artifact_id)).toThrow("Can only unstage CANDIDATE");
    });

    it("throws not found for unknown artifact ids", () => {
        const staging = new ArtifactStagingArea();
        expect(() => staging.submitToGovernance("missing-id", "run-x")).toThrow("not found");
    });

    it("supports status filtering and full listing", () => {
        const staging = new ArtifactStagingArea();
        const a1 = staging.stageArtifact("feature.spec", "/docs/spec.md", "content-v1");
        const a2 = staging.stageArtifact("feature.impl", "/src/feature.ts", "content-v2");
        staging.submitToGovernance(a2.artifact_id, "run-002");

        expect(staging.getAll()).toHaveLength(2);
        expect(staging.getAllByStatus("CANDIDATE")).toHaveLength(1);
        expect(staging.getAllByStatus("CANDIDATE")[0].artifact_id).toBe(a1.artifact_id);
        expect(staging.getAllByStatus("IN_GOVERNANCE")).toHaveLength(1);
    });
});

// ─── Artifact Ledger ──────────────────────────────────────────────────────────

describe("CVF Core — Artifact Ledger", () => {
    it("commit writes ACCEPTED artifact to ledger with version=1", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        staging.submitToGovernance(a.artifact_id, "run-001");
        staging.acceptArtifact(a.artifact_id);

        const ledger = new ArtifactLedger();
        const entry = ledger.commit(staging.getArtifact(a.artifact_id)!, "commit-abc");
        expect(entry.version).toBe(1);
        expect(entry.previous_hash).toBeNull();
        expect(ledger.size()).toBe(1);
    });

    it("commit is idempotent for same contentHash", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        staging.submitToGovernance(a.artifact_id, "run-001");
        staging.acceptArtifact(a.artifact_id);

        const ledger = new ArtifactLedger();
        const e1 = ledger.commit(staging.getArtifact(a.artifact_id)!, "commit-1");
        const e2 = ledger.commit(staging.getArtifact(a.artifact_id)!, "commit-2");
        expect(e1.contentHash).toBe(e2.contentHash);
        expect(ledger.size()).toBe(1); // no duplicate
    });

    it("getHistory tracks multiple versions", () => {
        const staging1 = new ArtifactStagingArea();
        const a1 = staging1.stageArtifact("feature.spec", "/docs/spec.md", "v1");
        staging1.submitToGovernance(a1.artifact_id, "run-1");
        staging1.acceptArtifact(a1.artifact_id);

        const staging2 = new ArtifactStagingArea();
        const a2 = staging2.stageArtifact("feature.spec", "/docs/spec.md", "v2");
        staging2.submitToGovernance(a2.artifact_id, "run-2");
        staging2.acceptArtifact(a2.artifact_id);

        const ledger = new ArtifactLedger();
        ledger.commit(staging1.getArtifact(a1.artifact_id)!, "commit-1");
        ledger.commit(staging2.getArtifact(a2.artifact_id)!, "commit-2");

        const history = ledger.getHistory(a1.artifact_id);
        expect(history).toHaveLength(2);
        expect(history[0].version).toBe(1);
        expect(history[1].version).toBe(2);
        expect(history[1].previous_hash).toBe(history[0].contentHash);
    });

    it("rejects non-ACCEPTED artifacts", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        // Not accepted — still CANDIDATE
        const ledger = new ArtifactLedger();
        expect(() => ledger.commit(staging.getArtifact(a.artifact_id)!, "commit-1")).toThrow("ACCEPTED");
    });

    it("supports content and commit lookup helpers", () => {
        const staging = new ArtifactStagingArea();
        const a = staging.stageArtifact("feature.spec", "/docs/spec.md", "content");
        staging.submitToGovernance(a.artifact_id, "run-001");
        staging.acceptArtifact(a.artifact_id);

        const ledger = new ArtifactLedger();
        const entry = ledger.commit(staging.getArtifact(a.artifact_id)!, "commit-xyz");

        expect(ledger.getByHash(entry.contentHash)?.artifact_id).toBe(a.artifact_id);
        expect(ledger.getLatest(a.artifact_id)?.commit_id).toBe("commit-xyz");
        expect(ledger.getByCommit("commit-xyz")).toHaveLength(1);
        expect(ledger.getLedgerHistory()).toHaveLength(1);
    });

    it("returns empty history for unknown artifact", () => {
        const ledger = new ArtifactLedger();
        expect(ledger.getHistory("unknown-artifact")).toEqual([]);
    });
});

// ─── Process Model ────────────────────────────────────────────────────────────

describe("CVF Core — Process Model", () => {
    it("createProcess initializes at first stage", () => {
        const pm = new ProcessModel();
        const proc = pm.createProcess("proc-1", "Feature X", "feature-x");
        expect(proc.current_stage).toBe("SPEC");
        expect(proc.status).toBe("ACTIVE");
        expect(proc.transitions).toHaveLength(0);
    });

    it("advanceStage moves to next stage when gate passes", () => {
        const pm = new ProcessModel();
        pm.createProcess("proc-1", "Feature X", "feature-x");
        pm.advanceStage("proc-1", "commit-abc", true);
        expect(pm.getProcess("proc-1")!.current_stage).toBe("STATE_MACHINE");
    });

    it("advanceStage throws when gate does not pass", () => {
        const pm = new ProcessModel();
        pm.createProcess("proc-1", "Feature X", "feature-x");
        expect(() => pm.advanceStage("proc-1", "commit-abc", false)).toThrow("gate did not pass");
    });

    it("transition history is appended on each advance", () => {
        const pm = new ProcessModel();
        pm.createProcess("proc-1", "Feature X", "feature-x");
        pm.advanceStage("proc-1", "commit-1", true);
        pm.advanceStage("proc-1", "commit-2", true);
        const transitions = pm.getProcess("proc-1")!.transitions;
        expect(transitions).toHaveLength(2);
        expect(transitions[0].from_stage).toBe("SPEC");
        expect(transitions[0].to_stage).toBe("STATE_MACHINE");
    });

    it("process auto-completes at final stage", () => {
        const pm = new ProcessModel();
        const seq = ["A", "B", "C"];
        pm.createProcess("proc-1", "Short", "comp", seq);
        pm.advanceStage("proc-1", "c1", true); // A→B
        pm.advanceStage("proc-1", "c2", true); // B→C (final)
        expect(pm.getProcess("proc-1")!.status).toBe("COMPLETED");
    });

    it("createProcess rejects empty stage sequence", () => {
        const pm = new ProcessModel();
        expect(() => pm.createProcess("proc-1", "Feature X", "feature-x", [])).toThrow(
            "stage_sequence must not be empty"
        );
    });

    it("advanceStage throws for missing process", () => {
        const pm = new ProcessModel();
        expect(() => pm.advanceStage("missing", "c1", true)).toThrow("not found");
    });

    it("advanceStage throws when process is not ACTIVE", () => {
        const pm = new ProcessModel();
        pm.createProcess("proc-1", "Feature X", "feature-x");
        const proc = pm.getProcess("proc-1") as any;
        proc.status = "PAUSED";
        expect(() => pm.advanceStage("proc-1", "c1", true)).toThrow("cannot advance stage");
    });

    it("advanceStage throws when current_stage is not in stage sequence", () => {
        const pm = new ProcessModel();
        pm.createProcess("proc-1", "Feature X", "feature-x");
        const proc = pm.getProcess("proc-1") as any;
        proc.current_stage = "UNKNOWN_STAGE";
        expect(() => pm.advanceStage("proc-1", "c1", true)).toThrow("already at final stage");
    });

    it("advanceStage throws when already at final stage", () => {
        const pm = new ProcessModel();
        pm.createProcess("proc-1", "Feature X", "feature-x", ["A", "B"]);
        pm.advanceStage("proc-1", "c1", true);
        expect(pm.getProcess("proc-1")!.status).toBe("COMPLETED");
        expect(() => pm.advanceStage("proc-1", "c2", true)).toThrow("cannot advance stage");

        const proc = pm.getProcess("proc-1") as any;
        proc.status = "ACTIVE";
        expect(() => pm.advanceStage("proc-1", "c3", true)).toThrow("already at final stage");
    });

    it("lists all and active processes", () => {
        const pm = new ProcessModel();
        pm.createProcess("proc-1", "Feature X", "feature-x");
        pm.createProcess("proc-2", "Feature Y", "feature-y", ["A", "B"]);
        pm.advanceStage("proc-2", "c1", true); // completed
        expect(pm.getAll()).toHaveLength(2);
        expect(pm.getAllActive()).toHaveLength(1);
        expect(pm.getAllActive()[0].process_id).toBe("proc-1");
    });
});
