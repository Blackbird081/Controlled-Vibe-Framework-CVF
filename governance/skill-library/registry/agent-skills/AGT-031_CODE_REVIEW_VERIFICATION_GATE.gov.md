# AGT-031: Code Review & Verification Gate

Text Encoding Exception: preserves pre-existing Unicode punctuation and symbols during semantic-preserving structural normalization.

> **Version:** 1.0.0
> **Name:** Code Review & Verification Gate
> **Phase:** All phases (Review, Verification, Quality Assurance)

---

## Source

- **Provenance:** Extracted from claudekit-skills/code-review (3-practice methodology), rewritten to CVF governance

---

## Capability

Systematic code review methodology enforcing **technical rigor over social performance**. Three distinct practices: receiving feedback correctly, requesting structured reviews, and verification gates that require evidence before any completion claims.

**Core Principle:** Technical correctness over social comfort. Verify before implementing. Ask before assuming. Evidence before claims.

### Three Practices Overview

| Practice | Trigger | Protocol |
|----------|---------|----------|
| **Receiving Feedback** | Code review comments arrive | READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT |
| **Requesting Review** | Task/feature completed | Dispatch code-reviewer subagent with SHA context |
| **Verification Gate** | About to claim success | IDENTIFY → RUN → READ → VERIFY → THEN CLAIM |

### Practice 1: Receiving Feedback

**Response Protocol:** READ → UNDERSTAND → VERIFY → EVALUATE → RESPOND → IMPLEMENT

**Forbidden Patterns (Performative Agreement)**

| ❌ NEVER Say | ✅ Say Instead |
|-------------|---------------|
| "You're absolutely right!" | "I understand the concern about X. Let me verify..." |
| "Great point!" | "Checking if this applies to our context..." |
| "Thanks for catching that!" | "Verified — the issue exists at line 42. Implementing fix." |
| "I completely agree" | "After reviewing: [technical assessment]" |

**Feedback Source Handling**
```
Who gave feedback?
│
├─ Human partner (trusted)
│  → Understand intent
│  → Implement after verification
│  → No performative agreement — just work
│
├─ External reviewer
│  → Verify technically correct
│  → Check for context they might be missing
│  → Push back with evidence if wrong
│  → Implement only if verified correct
│
└─ Automated tool (linter, CI)
   → Check if rule is valid for this context
   → Fix if legitimate, suppress with reason if not
```

**YAGNI Check Protocol** — before implementing any "suggested improvement":
1. Grep for actual usage of the suggested pattern
2. Verify the problem actually exists (not theoretical)
3. If no evidence of problem → don't implement
4. If evidence exists → implement with test proving fix

### Practice 2: Requesting Review

**When to Request**
- After completing each task in multi-step development
- After major feature or refactor completion
- Before merge to main branch
- After fixing complex bugs
- When stuck and need fresh perspective

**Review Request Template**
```
REVIEW REQUEST:
─────────────────────────
What was implemented: [description]
Plan/Requirements: [link or summary]
Base SHA: [git rev-parse HEAD~N]
Head SHA: [git rev-parse HEAD]
Files changed: [list key files]
Risk areas: [parts most likely to have issues]
Test coverage: [what's tested, what's not]
─────────────────────────
```

**Acting on Review Feedback**

| Severity | Action | Timeline |
|----------|--------|----------|
| **Critical** | Fix immediately, block merge | Before any other work |
| **Important** | Fix before proceeding to next task | Same session |
| **Minor** | Note for later, create TODO | Next available slot |
| **Stylistic** | Apply if team standard, skip if preference | On merge prep |

### Practice 3: Verification Gates

**The Iron Law:** NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE

**Verification Gate Protocol**
```
IDENTIFY the verification command needed
       │
       ▼
RUN the full command (not partial, not cached)
       │
       ▼
READ the complete output (not just exit code)
       │
       ▼
VERIFY output confirms the claim
       │
       ▼
THEN (and only then) state the claim WITH evidence
```

**Gate Requirements by Claim Type**

| Claim | Required Evidence | Verification Command |
|-------|-------------------|---------------------|
| "Tests pass" | Test output showing 0 failures | `npm test` / `pytest` full output |
| "Build succeeds" | Build command with exit 0 | `npm run build` full output |
| "Bug is fixed" | Original symptom no longer reproduces | Test that exercises the bug |
| "Feature complete" | Line-by-line requirements checklist | Each requirement verified |
| "No regressions" | Full test suite + affected area tests | `npm test` + targeted tests |
| "Ready to deploy" | All above + security scan | Full CI pipeline pass |

**Red Flags — STOP Immediately**
- Using "should"/"probably"/"seems to" → STOP, run verification
- Expressing satisfaction before running tests → STOP, run tests first
- About to commit without verification → STOP, verify everything
- Trusting previous test run (>5 minutes old) → STOP, run again
- Any wording implying success without evidence → STOP, get evidence

### Decision Tree: Complete Review Flow

```
SITUATION?
│
├─ Received feedback
│  ├─ Unclear items? → STOP, ask for clarification on ALL unclear items
│  ├─ From human partner? → Understand, verify, then implement (no performative agreement)
│  ├─ From external reviewer? → Verify technically, push back if wrong
│  └─ From automated tool? → Check if rule applies to context
│
├─ Completed work
│  ├─ Major feature/task? → Request structured review
│  ├─ Bug fix? → Request review focused on root cause
│  └─ Before merge? → Full review with test evidence
│
└─ About to claim status
   ├─ Have fresh verification (<5 min)? → State claim WITH evidence
   └─ No fresh verification? → RUN verification first, then claim
```

### Integration with CVF Workflow

- **With AGT-026 (Testing):** Code Change → AGT-026 Testing Pyramid → AGT-031 Review → Verification Gate → Merge
- **With AGT-023 (Debugging):** Bug Report → AGT-023 Root Cause → Fix → AGT-031 Verification Gate → Confirm Fix
- **With AGT-030 (Deployment):** Feature Complete → AGT-031 Review → AGT-026 CI Gates → AGT-030 Deploy

### Anti-Patterns

| ❌ Anti-Pattern | 💥 Why It's Harmful | ✅ Correct Approach |
|----------------|--------------------|--------------------|
| Performative agreement | Masks lack of understanding | Technical assessment first |
| Implementing before verifying feedback | May introduce new bugs | Verify feedback is correct first |
| Claiming "done" without running tests | False confidence, broken code | Run full verification, show evidence |
| Batch-reviewing at the end | Accumulated tech debt, costly fixes | Review after each task/feature |
| Skipping review for "small changes" | Small changes cause most outages | All changes get verification gate |
| Trusting cached/stale test results | Environment may have changed | Always run fresh verification |

---

## Governance

| Field | Value |
|-------|-------|
| Risk Level | **R1 — Auto** (guidance methodology, no destructive operations) |
| Autonomy | Auto |
| Authority | All roles |
| Phase | All phases (Review, Verification, Quality Assurance) |

---

## Risk Justification

- R1 classification: guidance methodology, no destructive operations
- Verification gates are NON-NEGOTIABLE — no claims without fresh evidence
- Code review responses must NEVER include performative agreement patterns
- External feedback must be technically verified before implementation
- Review requests must include SHA context for reproducibility

---

## Constraints

- Verification gates are NON-NEGOTIABLE — no claims without fresh evidence
- Code review responses must NEVER include performative agreement patterns
- External feedback must be technically verified before implementation
- Review requests must include SHA context for reproducibility

---

## Dependencies

- **AGT-023** (Systematic Debugging)
- **AGT-026** (Full-Stack Testing)

---

## UAT Binding

**PASS criteria:**
- [ ] No completion claim made without fresh verification evidence (<5 min old)
- [ ] Review requests include Base SHA and Head SHA context
- [ ] Feedback responses contain no forbidden performative-agreement phrasing
- [ ] Critical review findings fixed before merge

**FAIL criteria:**
- [ ] "Tests pass" / "Build succeeds" / "Feature complete" claimed without command output evidence
- [ ] Performative agreement phrase ("You're absolutely right!", "Great point!") used in a feedback response
- [ ] Cached/stale (>5 min) test result relied upon for a completion claim
- [ ] Small change merged without a verification gate
