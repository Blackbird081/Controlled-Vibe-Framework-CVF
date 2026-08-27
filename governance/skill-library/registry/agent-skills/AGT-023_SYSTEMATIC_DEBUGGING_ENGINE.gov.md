# AGT-023: Systematic Debugging Engine

Text Encoding Exception: preserves pre-existing Unicode punctuation and symbols during semantic-preserving structural normalization.

> **Version:** 1.0.0
> **Status:** Active
> **Category:** Quality Assurance
> **Provenance:** claudekit-skills/debugging (mrgoonie/claudekit-skills)

---

## Source

- **Source:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) — debugging/ (4 sub-skills)
- **Sub-Skills:** systematic-debugging, defense-in-depth, root-cause-tracing, verification-before-completion
- **Pattern Type:** Framework-level debugging methodology with verification gates
- **CVF Adaptation:** Added governance constraints, risk classification, escalation rules, architecture questioning threshold
- **License:** MIT (source) → CC BY-NC-ND 4.0 (CVF adaptation)

---

## Capability

4-phase debugging methodology that ensures root cause investigation BEFORE any fix attempts. Prevents the common AI anti-pattern of "guess-and-fix" cycles that waste time and introduce new bugs.

**Iron Law:** NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.

### The Four Phases

```
Phase 1: Root Cause     →  Phase 2: Pattern      →  Phase 3: Hypothesis   →  Phase 4: Implementation
      ↓                          ↓                         ↓                         ↓
 Read errors              Find working examples     Form single theory      Create failing test
 Reproduce                Compare differences       Test minimally          Implement single fix
 Check recent changes     Identify gaps             One variable at a time  Verify fix
 Trace data flow          Understand dependencies   Confirm or reject       Document
```

**Phase 1 — Root Cause Investigation**
1. Read error messages COMPLETELY (don't skip stack traces)
2. Reproduce consistently (exact steps, every time?)
3. Check recent changes (git diff, new deps, config)
4. Gather evidence at component boundaries (log enter/exit each layer)
5. Trace data flow (where does bad value originate?)

**Phase 2 — Pattern Analysis**
1. Find working examples in same codebase
2. Compare working vs broken (list every difference)
3. Read reference implementations COMPLETELY (don't skim)
4. Understand all dependencies and assumptions

**Phase 3 — Hypothesis & Testing**
1. Form SINGLE hypothesis: "X is root cause because Y"
2. Test with SMALLEST possible change
3. One variable at a time
4. If fails → NEW hypothesis (don't stack fixes)

**Phase 4 — Implementation**
1. Create failing test case FIRST
2. Implement single fix addressing root cause
3. Verify: test passes, no regressions
4. **If 3+ fixes fail → STOP → Question architecture**

### Red Flags — STOP and Return to Phase 1
- "Just try changing X and see"
- "Quick fix for now, investigate later"
- "Add multiple changes, run tests"
- "I don't fully understand but this might work"
- "One more fix attempt" (after 2+ failures)
- Proposing solutions before tracing data flow

### Verification Gates
- NO completion claims without fresh verification evidence
- Tests pass: actual test output shows 0 failures
- Build succeeds: build command exit 0
- NEVER trust cached/stale results

### Sub-Skills Integrated

| Sub-Skill | Purpose |
|-----------|---------|
| Defense-in-Depth | Validate at every layer after fix |
| Root-Cause-Tracing | Trace backward through call stack |
| Verification-Before-Completion | Evidence before claims |

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R2 – Medium** |
| Autonomy | Supervised |
| Category | Quality Assurance |

### Authority Mapping

| Role | Permission |
|------|-----------|
| Orchestrator | Full: apply debugging methodology, approve architecture changes |
| Builder | Execute: run phases 1-3, propose fixes |
| Reviewer | Audit: verify debugging process was followed |
| Architect | Approve: architecture-level changes (when 3+ fixes fail) |

### Phase Applicability

| Phase | Usage |
|-------|-------|
| C – Build | Primary: debug during development |
| D – Review | Verify fixes, audit process compliance |

---

## Risk Justification

- R2 classification: can modify code, requires supervision for production fixes
- MUST complete Phase 1 before proposing any fix
- MUST NOT stack multiple fixes without verifying each
- MUST escalate to HITL after 3 failed fix attempts (architectural issue)
- MUST run verification commands, not just claim success

---

## Constraints

- MUST complete Phase 1 before proposing any fix
- MUST NOT stack multiple fixes without verifying each
- MUST escalate to HITL after 3 failed fix attempts (architectural issue)
- MUST run verification commands, not just claim success
- R2 classification: can modify code, requires supervision for production fixes

---

## Dependencies

- **AGT-022** (Problem-Solving Framework) — Dispatched from "code broken" stuck-type
- **AGT-002** (Code Execute) — Run diagnostic commands
- **AGT-007** (File Read) — Examine source code and logs

---

## Validation

### Success Criteria

| Criterion | Target | ClaudeKit Reported |
|-----------|--------|-------------------|
| First-time fix rate | ≥85% | 95% (systematic) vs 40% (random) |
| Time-to-resolution | ≤30 min avg | 15-30 min vs 2-3 hours (thrashing) |
| New bugs introduced | Near zero | Near zero vs common |
| Root cause identified before fix | 100% | Required by Iron Law |

---

## UAT Binding

**UAT Link:** `governance/skill-library/uat/results/UAT-AGT-023.md`

**PASS criteria:**
- [ ] First-time fix rate ≥85%
- [ ] Time-to-resolution ≤30 min avg
- [ ] Root cause identified before fix in 100% of cases
- [ ] No completion claims without fresh verification evidence

**FAIL criteria:**
- [ ] Fix proposed before Phase 1 root cause investigation completed
- [ ] Multiple fixes stacked without individual verification
- [ ] More than 3 failed fix attempts without HITL escalation
- [ ] Success claimed without fresh verification output

---

*Last Updated: February 18, 2026*
