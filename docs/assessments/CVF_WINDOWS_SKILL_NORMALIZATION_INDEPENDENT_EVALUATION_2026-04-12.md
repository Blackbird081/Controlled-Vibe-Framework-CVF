# CVF Windows Skill Normalization — Independent Evaluation

Memory class: FULL_RECORD

> **Date:** 2026-04-12
> **Evaluator:** Codex independent pass
> **Source folder:** `.private_reference/legacy/CVF ADDING NEW/Windows_Skill_Normalization`
> **Method:** full file-by-file sweep of all 7 markdown files, then cross-check against active CVF canon, W7 promoted drafts, skill-intake policy, and current sandbox/runtime posture
> **Boundary:** this evaluation concerns only the `Windows_Skill_Normalization` packet; it is separate from the active PVV/provider API-key evidence workstream

---

## 1. Gate Zero

Full sweep completed for all source files:

1. `Thong_tin.md`
2. `CVF_W7_Windows_Skill_Normalization.md`
3. `CVF_W7_Windows_Skill_Normalization_Spec.md`
4. `CVF_W7_Cross_Platform_Normalization_Policy.md`
5. `CVF_W7_PowerShell_Command_Catalog.md`
6. `CVF_W7_Skill_Evaluation_Checklist.md`
7. `CVF_W7_Windows_Skill_Refactor_Report.md`

Cross-check references used:

- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md`
- `docs/reference/CVF_W7_CLI_GOVERNANCE_BINDINGS.md`
- `docs/reference/CVF_W7_CLI_SCHEMA_CONTRACTS.md`
- `docs/reference/CVF_W7_CLI_COMMAND_SURFACE.md`
- `governance/skill-library/specs/EXTERNAL_SKILL_INTAKE.md`
- `governance/toolkit/05_OPERATION/SKILL_INTAKE_GOVERNANCE.md`
- `docs/assessments/CVF_TRACK5_DEFERRED_ARCHITECTURE_READINESS_ASSESSMENT_2026-04-08.md`
- `AGENT_HANDOFF.md`

## 2. Executive Verdict

**Verdict:** `ACCEPT IN PRINCIPLE / CURATE BEFORE PROMOTION`

This packet contains useful knowledge for CVF, especially around:

- execution-environment metadata
- Windows-native shell normalization
- compatibility evaluation before skill intake or execution

However, it should **not** be integrated as a broad canonical doctrine in its current form.

The correct integration level is:

- `platform-specific design uplift`
- `Windows execution profile / normalization guidance`
- `curated intake and evaluation augmentation`

It is **not**:

- a new architectural layer
- a replacement for existing skill-intake governance
- a replacement for CVF-wide command-runtime doctrine
- a basis for changing sandbox posture

## 3. What Is Actually Valuable

### 3.1 High-value contribution

The strongest contribution is the idea that external skills or skill-like assets should carry declared execution-environment metadata before they are normalized or executed.

This is useful because it helps CVF distinguish:

- skill intent
- runtime environment expectations
- platform-specific execution constraints

That improves governance quality and lowers avoidable retry/error cost in Windows-native environments.

### 3.2 Strongest reusable concepts

The most reusable concepts in the packet are:

1. explicit environment declaration
2. platform-aware normalization policy
3. pre-runtime compatibility evaluation
4. Windows command equivalence catalog as a bounded reference

These fit CVF best as:

- W7 intake enrichment
- registry/evaluation metadata
- operational reference for Windows-native execution

### 3.3 Best architectural fit

The best fit inside CVF is:

- Governance Layer:
  - execution-environment metadata
  - compatibility checks
  - bounded policy/guard alignment
- Execution Plane:
  - platform-aware command normalization reference
- Learning Plane:
  - environment compatibility assessment as a provisional evaluation stream

## 4. Required Corrections Before Any Promotion

These corrections are mandatory if any part of this packet is promoted into CVF root docs.

### A. Reclassify source quality

The packet repeatedly labels itself `Canonical` or `Approved for Integration`.
That is too strong.

Correct posture:

- source materials remain `community_analysis` or `internal_design_draft`
- only CVF-synthesized outputs may become reference docs

### B. Do not overclaim sandbox support

The packet lists:

- Windows Sandbox
- Docker Windows Containers
- Windows Server
- WSL

as if they are already part of CVF-supported sandbox runtime posture.

That is not aligned with current canon.

Current canon is:

- `worker_threads` is the delivered first sandbox adapter
- Docker remains deferred-by-default unless reopened under a fresh bounded trigger

Therefore this packet must not imply a sandbox-platform expansion.

### C. Do not treat PowerShell mapping as CVF-wide execution doctrine

The PowerShell command catalog is useful, but it is a **Windows operator profile**, not the global command-runtime doctrine for all CVF.

It should be framed as:

- Windows-native mapping reference
- local execution-profile appendix

It should not be framed as:

- universal command-runtime spec
- replacement for cross-platform execution behavior

### D. Do not let environment guards collapse into raw string blacklist logic

Examples like `Reject-Bash-On-Windows` are directionally useful, but too shallow if treated as actual doctrine.

Enforcement should not rely only on substring matching such as:

- `ls `
- `grep `
- `cat `
- `export `

Correct use:

- environment declaration first
- compatibility evaluation second
- guard/policy enforcement against declared profile and operation class

### E. Do not replace active skill-intake governance

The packet has useful compatibility logic, but it does not supersede:

- `EXTERNAL_SKILL_INTAKE.md`
- `SKILL_INTAKE_GOVERNANCE.md`

At most, it augments them with environment-compatibility checks.

### F. Do not equate refactor outcome with CVF-wide quality proof

The packet’s 86-skill refactor insight is valuable evidence of local execution improvement, but it is still a bounded input.

It does not by itself prove:

- universal agent quality uplift
- cross-provider runtime uplift
- general CVF execution superiority

## 5. Architectural Assessment By Topic

### 5.1 Environment metadata

**Assessment:** `AGREE`

This is the strongest part of the packet.

CVF currently has:

- source-quality metadata
- candidate asset type metadata
- governance/trace metadata

It does **not yet cleanly canonize** a Windows-oriented execution-environment profile for W7 skill-like assets.

This packet offers a useful extension candidate such as:

```yaml
execution_environment:
  os: windows|linux|macos
  shell: powershell|bash|zsh
  shell_version: string
  script_type: ps1|sh
  compatibility: native|cross-platform
```

Recommended status:

- `accept as design candidate`
- preferred insertion point is Stage 1 `external_intake_profile` optional enrichment
- escalate to `Required-when` for `W7SkillAsset` candidates that contain executable code blocks
- do not inject into core schema until a dedicated schema-extension review is done

### 5.2 Cross-platform normalization policy

**Assessment:** `PARTIAL AGREE`

The policy direction is good:

- skills should declare environment
- platform-dependent commands should not remain implicit

But the current packet is still too thin and platform-binary.
It needs CVF-native phrasing around:

- declaration
- normalization
- compatibility scoring
- governance consequences

Recommended posture:

- synthesize into a CVF-native `execution environment normalization policy`
- keep it as `internal_design_draft`
- treat the source file as an augmentation appendix candidate rather than standalone canon

### 5.3 PowerShell command catalog

**Assessment:** `PARTIAL AGREE`

The mapping table is helpful and practical.
It is especially valuable for:

- Windows-native operator environments
- external skill refactor guidance
- pre-ingestion normalization

But it should not be promoted as-is because:

- it is still a local shell-command equivalence table
- some mappings are context-sensitive
- current agent/tool instructions already govern shell safety in more detail

Recommended posture:

- keep as Windows appendix/reference
- not as standalone canon that redefines command runtime

### 5.4 Skill evaluation checklist

**Assessment:** `AGREE WITH EDITS`

This is one of the most promotable files.
It gives CVF a practical gate for deciding whether an external skill is:

- Windows-native
- merely compatible
- still requiring refactor
- rejectable

But it should be merged carefully with existing intake governance so that:

- compatibility score does not replace governance fit
- environment readiness does not replace domain/UAT review
- the checklist functions as a third gate in the intake pipeline, after governance-fit checks and before final registry admission

### 5.5 Main normalization doc

**Assessment:** `PARTIAL AGREE`

`CVF_W7_Windows_Skill_Normalization.md` is the best synthesis document in the folder, but it overstates authority.

Good parts:

- architecture mapping
- separation between external repo and CVF root
- skill/agent registry implications

Weak parts:

- `Canonical` self-classification
- `Approved for Integration` wording
- sandbox overreach
- simplified guard examples that are too literal

### 5.6 Minimal spec file

**Assessment:** `LOW VALUE`

`CVF_W7_Windows_Skill_Normalization_Spec.md` is too small and largely redundant.

It does not justify a standalone promoted doc.
Its useful content should be merged into a richer CVF-native schema draft if promotion happens later.

## 6. File-by-File Curation

### 6.1 Promote candidate — medium edit

`CVF_W7_Cross_Platform_Normalization_Policy.md`

Why:

- captures the right core principle
- can become a bounded CVF-native policy draft with cleanup

Required edits:

- remove `Canonical`
- add source-quality posture
- bind to existing skill-intake governance instead of standing alone
- replace simplistic deny logic with profile-aware governance logic

### 6.2 Promote candidate — medium edit

`CVF_W7_Skill_Evaluation_Checklist.md`

Why:

- strong operational value
- easy to use during intake/review

Required edits:

- align score outputs with CVF governance outcomes
- make it an augmentation layer, not a standalone admission gate
- add explicit boundary to existing skill/UAT/registry pipeline

### 6.3 Promote candidate — heavy edit or appendix only

`CVF_W7_PowerShell_Command_Catalog.md`

Why:

- practical Windows mapping value

Required edits:

- reframe as Windows operator reference
- remove broad canonical claims
- add safety note that mapping is contextual and does not override tool/runtime policy
- keep as appendix/reference, not standalone canon

### 6.4 Promote candidate — medium edit

`CVF_W7_Windows_Skill_Normalization.md`

Why:

- useful synthesis
- strongest narrative doc in the folder

Why not direct promotion:

- authority overclaim
- sandbox overclaim
- too broad to promote unchanged

Primary correction set:

- strip self-declared `Canonical`
- strip `Approved for Integration`
- remove sandbox expansion claims entirely
- retain architecture mapping and synthesis sections

### 6.5 Merge-only source

`CVF_W7_Windows_Skill_Normalization_Spec.md`

Why:

- too thin for standalone use
- overlaps with richer docs

### 6.6 Provenance + bounded evidence source

`CVF_W7_Windows_Skill_Refactor_Report.md`

Why:

- good provenance and result summary
- contains the only bounded quantitative evidence in the packet
- not canon-grade doctrine by itself, but useful as evidence backing for narrow quality claims

### 6.7 Provenance only

`Thong_tin.md`

Why:

- useful for origin story and rationale
- not suitable as canon source

## 7. Accurate Integration Level

If the question is:

**“Mức độ tích hợp chính xác vào CVF là gì?”**

then the accurate answer is:

### Level 1 — Safe to absorb now

- conceptual guidance for environment declaration
- Windows compatibility review logic
- compatibility checklist patterns
- bounded PowerShell mapping reference

### Level 2 — Needs CVF-native synthesis first

- execution-environment schema extension
- normalization policy wording
- compatibility signal output model

### Level 3 — Not justified now

- sandbox-platform expansion claims
- CVF-wide execution doctrine replacement
- automatic guard doctrine based only on string blacklist logic
- any claim that this packet is already canonical

## 8. Recommended Final Decision

**Recommended status:** `ACCEPT IN PRINCIPLE / CURATE BEFORE PROMOTION`

That means:

- yes, this packet improves CVF quality if curated properly
- no, it should not be copied wholesale into CVF root
- yes, a shortlist can be synthesized into CVF-native docs
- no, no implementation follow-up should start from this packet until the curation pass is done

## 9. Promotion Shortlist

If you want to continue later, the best shortlist is:

1. synthesize a new `CVF_W7_EXECUTION_ENVIRONMENT_NORMALIZATION_POLICY.md`
2. synthesize a new `CVF_W7_WINDOWS_COMPATIBILITY_EVALUATION_CHECKLIST.md`
3. extend `CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md` with optional `execution_environment` enrichment and a bounded `Required-when` rule for executable `W7SkillAsset` candidates
4. optionally add a Windows appendix/reference for PowerShell mappings

Do **not** directly promote:

1. `Thong_tin.md`
2. `CVF_W7_Windows_Skill_Refactor_Report.md`
3. `CVF_W7_Windows_Skill_Normalization_Spec.md`
4. `CVF_W7_Windows_Skill_Normalization.md` unchanged

## 10. Quality Claim Boundary

This packet supports exactly two levels of quality claim:

### 10.1 Bounded claim

Allowed:

- Windows-oriented skill normalization reduced avoidable runtime mismatch, retry, and token waste in the observed refactor context

### 10.2 Inferred principle

Allowed as design heuristic, not as runtime proof:

- execution-environment normalization reduces avoidable runtime errors across platforms

Not allowed:

- CVF-wide quality uplift proof
- provider-quality proof
- agent-superiority proof

## 11. Final Rule

This packet is useful because it teaches CVF how to reason about platform-specific execution fit.

Its correct role is:

- governed normalization input
- not canon by self-declaration
- not runtime proof
- not architecture replacement
