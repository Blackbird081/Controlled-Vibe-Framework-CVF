# CVF Whitepaper — Git for AI Development

> **Developed by Tien - Tan Thuan Port@2026**  
> **Version:** v3.0 (branch `cvf-next`)  
> **Date:** 2026-03-06

---

## Abstract

Modern AI development suffers from a fundamental engineering problem: **lack of determinism and traceability**.

AI systems generate code, architecture, and decisions without a structured development model. While traditional software engineering relies on Git-based workflows, AI development is largely unstructured and non-auditable.

**Controlled Vibe Framework (CVF)** introduces a Git-inspired development paradigm for AI systems — transforming AI generation into a deterministic, traceable, and governed process.

CVF defines:
- **AI Commits** — atomic, auditable units of AI work
- **Artifact Lineage** — content-addressed, version-tracked artifacts
- **Skill Lifecycle** — controlled evolution of AI capabilities
- **Phase-based Development** — deterministic pipeline enforcement
- **Governance Validation** — pluggable verification modules

Together, these mechanisms create a **Git-like development substrate for AI-driven systems**.

---

## 1. The Problem with AI Development

Current AI-assisted tools focus on generation capabilities (code, architecture, tests, docs). They lack critical engineering infrastructure:

| Missing Capability | Impact |
|---|---|
| Traceability | Cannot understand what the AI changed or why |
| Version governance | AI artifacts lack controlled evolution |
| Reproducibility | AI results are difficult to reproduce deterministically |
| Auditability | Decisions cannot be traced back to reasoning steps |
| Phase discipline | AI generates in the wrong order, skipping validation |

As AI systems become more complex, these gaps become serious engineering risks.

---

## 2. Git as an Engineering Paradigm

Git is not merely a version control tool. It is a **development model** built on a few simple primitives:

| Git Primitive | Role |
|---|---|
| `blob` | Content-addressed file identity |
| `tree` | Snapshot of artifact set |
| `commit` | Atomic unit of change with parent lineage |
| `branch` | Independent development line |
| `merge` | Controlled integration of work |
| `staging area` | Buffer between work and commit |

These primitives power the world's most auditable, reproducible development workflow.

**CVF applies the same primitives to AI development.**

---

## 3. CVF Core — Git for AI Development

### 3.1 AI Commit (≈ Git commit)

Every AI action that produces output MUST be expressed as an `AICommit`:

```
AICommit {
  commit_id:          SHA-256 of (agent_id + skill + artifacts + phase)
  agent_id:           which AI agent produced this
  skill:              which capability was exercised
  type:               SPEC | DESIGN | IMPLEMENT | TEST | REVIEW | FIX | ...
  rationale:          WHY the AI made this decision
  phase:              which CVF phase this was produced in
  artifacts:          [{ type, path, contentHash, operation }]
  parent_commit_id:   lineage chain (like Git's parent)
  artifact_snapshot:  SHA-256 of all artifacts (like Git's tree hash)
  timestamp:          ISO 8601
  status:             PENDING | VALIDATED | REJECTED | SUPERSEDED
}
```

**Properties:**
- **Deterministic ID** — same inputs → same commit_id → reproducible
- **Immutable** — commits are never modified, only superseded
- **Tamper-evident** — `verifyCommitIntegrity()` re-derives and compares commit_id

### 3.2 Artifact (≈ Git blob)

An artifact is any output produced by an AI agent:

- Content-addressed: `artifact_id = SHA-256(type:path)` — stable even if renamed
- Hash-tracked: `contentHash = SHA-256(content)` — detects silent rewrites
- Version history: multiple `LedgerEntry` per artifact_id

### 3.3 Artifact Staging (≈ Git index)

The staging area buffers AI-produced artifacts before governance validation:

```
CANDIDATE → IN_GOVERNANCE → ACCEPTED
      ↳ REJECTED (can be revised and re-staged)
```

Equivalent to `git add` (stage) → governance (review) → `git commit` (ledger).

### 3.4 Artifact Ledger (≈ Git object store)

Append-only, content-addressed store of ACCEPTED artifacts:
- **Immutable entries** — no writes after commit
- **Full lineage** — `getHistory(artifact_id)` returns all versions
- **Rollback-ready** — `previous_hash` chain enables safe revert

### 3.5 Process Model (≈ Git branch)

A `CVFProcess` is a named, phase-driven development line:
- Independent of other processes (multi-agent parallel development)
- Deterministic advancement: `advanceStage()` requires governance gate to pass
- Full transition history: every stage change is recorded with triggering commit

---

## 4. CVF Full — AI Governance Framework

CVF Full extends CVF Core with **pluggable verification** and **observability**:

| Component | Purpose |
|---|---|
| Phase Gate (v1.1.x) | Artifact existence checks, risk level (R0–R3) |
| State Enforcement | Deadlock detection, dead-end states |
| Scenario Simulation | Behavioral path coverage |
| Artifact Integrity | Hash verification, tamper detection |
| Audit Log | Hash Ledger snapshots, phase reports |
| Governance Executor | Orchestrates pipeline in deterministic order |

**Design Invariant INV-E:** Verification modules are PLUGGABLE — not hardcoded in CVF Core.

---

## 5. Why CVF Over Alternatives

| Feature | Git (code) | AI Copilot | CVF |
|---|---|---|---|
| Version tracking | ✅ | ❌ | ✅ (Artifact Ledger) |
| Deterministic output | ✅ | ❌ | ✅ (commit_id is deterministic) |
| Governance validation | ❌ | ❌ | ✅ (Phase Gate + Pipeline) |
| Phase discipline | ❌ | ❌ | ✅ (Process Model) |
| AI-specific traceability | ❌ | partial | ✅ (agent_id, skill, rationale) |
| Tamper detection | ✅ (SHA-1) | ❌ | ✅ (SHA-256 per artifact) |

---

## 6. Adoption Path

CVF is designed for **non-disruptive, incremental adoption**:

1. **Visibility phase** — add CVF Core observation only (no enforcement)
2. **Risk awareness** — CVF reports but does not block
3. **Policy enforcement** — Phase Gate enforces R3 rejection
4. **Execution governance** — GovernanceExecutor orchestrates full pipeline
5. **Autonomous governance** — AI agents self-validate before commit

Full adoption strategy: `docs/reference/CVF_ADOPTION_STRATEGY.md`

---

## 7. Conclusion

CVF solves the core engineering problem of AI development:

> **AI produces outputs. CVF makes those outputs auditable, reproducible, and governed.**

By mapping AI development onto Git's proven primitives — Commit, Artifact, Staging, Branch — CVF provides the missing engineering substrate for the AI era.

CVF Core is minimal: 3+1 primitives, zero external dependencies, ~500 lines of TypeScript.  
CVF Full is composable: pluggable governance modules, no breaking changes to Core.

**CVF is Git for the age of AI.**
