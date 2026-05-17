# CVF Unabsorbed Knowledge Final Consensus Roadmap — 2026-05-17

Memory class: FULL_RECORD

Status: FINAL — Claude and Codex consensus after audit. No further operator
authorization required for the inventory accuracy fixes and reporting rule
amendments below. Each absorption roadmap (steps 3-5) still requires its
own GC-018 packet when opened.

## Purpose

Final roadmap thống nhất giữa Claude và Codex cho việc xử lý unabsorbed
knowledge từ CVF 16.5 và CVF ADD, sau khi đã trải qua đầy đủ rebuttal +
audit cycle:

1. Inventory (`CVF_UNABSORBED_KNOWLEDGE_INVENTORY_2026-05-16.md`) — Codex
   draft, classified 10 items + 1 excluded list.
2. Codex self-rebuttal (`CVF_UNABSORBED_KNOWLEDGE_REPORTING_CORRECTION_REBUTTAL_2026-05-17.md`)
   — challenged scope của reporting rule.
3. Codex review packet (`CVF_UNABSORBED_KNOWLEDGE_CLAUDE_REVIEW_PACKET_2026-05-17.md`)
   — yêu cầu Claude review trước khi absorb.
4. Claude review (`CVF_UNABSORBED_KNOWLEDGE_CLAUDE_REVIEW_2026-05-17.md`)
   — `APPROVE_WITH_CHANGES`, 4 Required Changes (RC-1 → RC-4).
5. Codex response (`CVF_UNABSORBED_KNOWLEDGE_CODEX_RESPONSE_TO_CLAUDE_2026-05-17.md`)
   — `AGREED_WITH_AMENDMENTS`, accepted tất cả 4 RC với minor amendments.

This roadmap is the final converged state. No further review loop is needed.

## Scope

In scope:

- finalize inventory accuracy state (consensus on what is actually unabsorbed);
- finalize reporting rule scope (narrow triggers + enforcement surface);
- define the absorption sequence;
- define the claim boundary for each step.

Out of scope:

- implementing any absorption item — each implementation step requires its
  own GC-018 packet;
- changing GA posture (`GA_LOCAL_FIRST_APPROVED` unchanged);
- public README or CHANGELOG changes;
- live provider proof.

## Non-Goals

This consensus roadmap does **not**:

- implement any absorption item (each requires its own GC-018 packet later);
- implement runtime absorption items; Step 3 doctrine promotion is now recorded
  separately in its own doc-only promotion packet;
- change GA posture (`GA_LOCAL_FIRST_APPROVED` unchanged);
- change public README, CHANGELOG, or release gates;
- claim live provider proof;
- re-open the closed Claude–Codex review loop.

## Work Plan

| Step | Action | Status |
|---|---|---|
| 1 | Apply inventory accuracy fixes (RC-1, RC-2) | complete this commit |
| 2 | Apply reporting rule narrowing + enforcement (RC-3) | complete this commit |
| 3 | Open doctrine promotion packet for ADD-A + ADD-D + ADD-BRIEF | complete 2026-05-17 |
| 4 | Open GC-018 for OBS-1 Observability Plane Foundation | complete 2026-05-17 |
| 5 | Open GC-018 for ADD-PROVIDER Output Contracts | complete 2026-05-17 |
| 6 | Open GC-018 for GAP-MEM 3 memory sub-contracts | complete 2026-05-17 |
| 7 | ADD-W7-SIGNALS boundary signals schema extension | complete 2026-05-17 |
| 8 | ADD-B Context Profile Metadata | complete 2026-05-17 |
| 9+ | Defer remaining items until trigger conditions occur | pending — per item triggers |

## Acceptance Criteria

This consensus roadmap is accepted when all of the following are true:

- inventory file reflects the consensus accuracy state (CD-1);
- reporting rule has explicit triggers + enforcement surface (CD-2);
- absorption sequence is recorded as binding ordering rules (CD-3);
- no disagreements remain between Claude and Codex (CD-4);
- pre-commit governance hooks pass on all amended and new files;
- final consensus roadmap exists in `docs/roadmaps/` referencing all
  prerequisite review files;
- no implementation has been started by this packet.

All seven criteria are met by this commit.

## Source

Final consensus is built from:

- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_INVENTORY_2026-05-16.md` (amended 2026-05-17)
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CLAUDE_REVIEW_2026-05-17.md`
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CODEX_RESPONSE_TO_CLAUDE_2026-05-17.md`
- `docs/roadmaps/CVF_UNABSORBED_KNOWLEDGE_REPORTING_CORRECTION_ROADMAP_2026-05-17.md` (amended 2026-05-17)
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_REPORTING_CORRECTION_REBUTTAL_2026-05-17.md`
- `docs/baselines/CVF_16_5_LIVING_INTEGRATION_CLASSIFICATION_SUMMARY_2026-05-16.md`

## Baseline

After Claude–Codex consensus:

- inventory has been amended with accuracy fixes (GAP-AGENT → GAP-AGENT-HANDOFF
  with reduced scope; GAP-MEM scope thu hẹp từ 9 → 3 specific items; GAP-SKILL
  removed; OBS-1 upgraded to ⭐⭐⭐⭐⭐; ADD-BRIEF và ADD-W7-SIGNALS added);
- reporting rule has been narrowed to 3 explicit trigger conditions + 1
  enforcement checklist line;
- consensus on absorption sequence: doctrine first, implementation second,
  deferred items remain deferred until their triggers occur.

## Consensus Decisions

### CD-1 — Inventory accuracy state (final)

| Item | Final classification | Sao | Notes |
|---|---|---|---|
| OBS-1 Observability Plane Foundation | runtime-owned | ⭐⭐⭐⭐⭐ | completed 2026-05-17 |
| ADD-A Governed Capability Intake | promoted doctrine | ⭐⭐⭐⭐⭐ | completed 2026-05-17 |
| ADD-D Boundary-First Governance | promoted doctrine | ⭐⭐⭐⭐⭐ | completed 2026-05-17 |
| ADD-BRIEF Brief Normalization | promoted doctrine | ⭐⭐⭐⭐ | completed 2026-05-17 |
| ADD-PROVIDER Output Contracts | runtime-owned | ⭐⭐⭐ | completed 2026-05-17 |
| GAP-MEM (3 items) | runtime-owned | ⭐⭐⭐ | completed 2026-05-17 |
| GAP-AGENT-HANDOFF | Nhóm 3 deferred | ⭐⭐ | Scope reduced from full agent governance |
| ADD-W7-SIGNALS | runtime-owned | ⭐⭐⭐ | completed 2026-05-17 |
| ADD-B Context Profile | runtime-owned | ⭐⭐⭐ | completed 2026-05-17 |
| ADD-C1 Continuity | Nhóm 3 deferred | ⭐⭐⭐ | Unchanged |
| ADD-C2 Delegation | Nhóm 3 deferred | ⭐⭐⭐ | Unchanged |
| ADD-E1 Scoped Knowledge | Nhóm 3 deferred | ⭐⭐ | Unchanged |
| GAP-SKILL | REMOVED | — | Spot-check found false positive |

### CD-2 — Reporting rule scope (final)

**Triggers (3 explicit conditions):**

1. External-knowledge absorption tranche closure with reviewed-but-unabsorbed
   items remaining;
2. GA or RC release closure;
3. Tranche-series closure (≥3 related tranches closing on the same date).

**Does NOT apply to:** single-tranche closures, single-item review closures,
routine implementation closures, bug fixes, doc-only closures.

**Enforcement surface:** one checklist line in tranche-closure / release-gate
checklist:

> "If this closure matches a trigger condition in CVF Reporting Rule, attach
> an operator-facing unabsorbed-knowledge summary."

No new tooling, no new file, no new hook.

### CD-3 — Absorption sequence (final)

| Step | Type | Item | Authorization required |
|---|---|---|---|
| 1 | Doc edit | Inventory accuracy fix (RC-1, RC-2) | Already applied 2026-05-17 |
| 2 | Doc edit | Reporting rule narrowing (RC-3) | Already applied 2026-05-17 |
| 3 | Doctrine promotion | ADD-A + ADD-D + ADD-BRIEF consolidated | Complete: `docs/reviews/CVF_ADD_A_D_BRIEF_DOCTRINE_PROMOTION_2026-05-17.md` |
| 4 | Implementation | OBS-1 Observability Plane Foundation | Complete: `docs/roadmaps/CVF_OBSERVABILITY_PLANE_FOUNDATION_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md` |
| 5 | Implementation | ADD-PROVIDER Output Contracts | Complete: `docs/roadmaps/CVF_ADD_PROVIDER_OUTPUT_CONTRACTS_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md` |
| 6 | Implementation | GAP-MEM 3 memory sub-contracts | Complete: `docs/roadmaps/CVF_GAP_MEM_SUBCONTRACTS_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md` |
| 7 | Implementation | ADD-W7-SIGNALS boundary signals schema extension | Complete: `docs/roadmaps/CVF_ADD_W7_SIGNALS_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md` |
| 8 | Implementation | ADD-B Context Profile Metadata | Complete: `docs/roadmaps/CVF_ADD_B_CONTEXT_PROFILE_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md` |
| 9+ | Deferred | Remaining Nhóm 3 items | Each requires its own GC-018 when trigger occurs |

**Step ordering rules (consensus):**

- Steps 1 và 2 đã apply (this commit).
- Step 3 (doctrine promotion) closed 2026-05-17; Step 4 (OBS-1
  implementation) is now the next eligible absorption roadmap.
- Steps 4, 5, 6 có thể chạy độc lập sau Step 3 (không có dependency giữa
  chúng).
- Step 7 (ADD-W7-SIGNALS) completed 2026-05-17 after ADD-D promotion.
- Step 8 (ADD-B Context Profile Metadata) completed 2026-05-17 after operator
  authorization.
- Step 9+ chỉ khi trigger conditions của từng item xảy ra.

### CD-4 — Disagreements resolved

Không có disagreement còn lại. Codex response 2026-05-17 đã accept tất cả 4
Required Changes của Claude. Amendments của Codex là minor scope
clarifications, không phải counter-positions.

Cụ thể các điểm thống nhất sau audit:

- **GAP-AGENT scope:** Claude phát hiện overstated → Codex confirm CPF đã có
  đầy đủ agent contracts → consensus: reduce scope thành GAP-AGENT-HANDOFF.
- **GAP-MEM scope:** Claude phát hiện overstated (9 items) → Codex confirm
  LPF đã có nhiều memory contracts → consensus: reduce to 3 specific items
  với normative names.
- **GAP-SKILL classification:** Claude phát hiện không phải stubs → Codex
  confirm helpers là minimal executable → consensus: remove khỏi inventory.
- **ADD-BRIEF separation:** Claude phát hiện synthesis đã name riêng → Codex
  accept với subordinate clause → consensus: ship cùng ADD-A/D packet.
- **ADD-W7-SIGNALS separation:** Claude phát hiện có thể absorb schema-only →
  Codex accept với deferred-until-ADD-D clause → trigger met after ADD-D
  promotion; schema extension completed 2026-05-17.
- **OBS-1 priority:** Claude phát hiện understated → Codex accept upgrade →
  consensus: ⭐⭐⭐⭐⭐.
- **Reporting rule scope:** Claude yêu cầu explicit triggers + enforcement →
  Codex accept → consensus: 3 triggers + 1 checklist line.

## Claim Boundary

This consensus roadmap:

- **không** authorize implementation runtime nào;
- **không** authorize public claim change nào;
- **đã** record doctrine promotion completion through the separate Step 3
  promotion packet;
- **không** require live provider proof (không có runtime claim);
- **đã** authorize inventory accuracy fixes (Step 1, đã apply);
- **đã** authorize reporting rule narrowing (Step 2, đã apply);
- **đã** xác lập sequence cho các absorption steps tiếp theo (binding
  ordering rules).

Các absorption steps 4-7 mỗi step cần:

- một authorization packet riêng (GC-018 or later scoped authorization);
- không cần phản biện thêm về whether to absorb — consensus đã quyết định
  về what to absorb và ordering;
- phải tuân theo CD-3 step ordering rules.

GA posture (`GA_LOCAL_FIRST_APPROVED`) không thay đổi. 10 lanes đã
`runtime-owned` không thay đổi.

## Verification / Evidence

Verification trước khi commit consensus roadmap:

- GC-045 markdown structural completeness PASS;
- governed file size guard PASS;
- docs governance PASS;
- exception registry integrity PASS;
- pre-commit hook chain PASS;
- inventory file đã được amend với consensus state;
- reporting rule đã được narrow với explicit triggers;
- không có file nào claim implementation đã occur (chỉ amendments doc-level).

Evidence files:

- this roadmap;
- amended `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_INVENTORY_2026-05-16.md`;
- amended `docs/roadmaps/CVF_UNABSORBED_KNOWLEDGE_REPORTING_CORRECTION_ROADMAP_2026-05-17.md`;
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CLAUDE_REVIEW_2026-05-17.md`;
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CODEX_RESPONSE_TO_CLAUDE_2026-05-17.md`.

## Risk

R0 cho consensus roadmap này: documentation only.

Residual risks (mitigated):

- **Risk:** future agents có thể re-expand scope đã reduce (GAP-MEM, GAP-AGENT).
  **Mitigation:** CD-1 table có normative item names; CD-4 ghi rõ
  disagreements đã resolved.
- **Risk:** Step 4 (OBS-1) opens without referencing the promoted doctrine.
  **Mitigation:** OBS-1 authorization packet must reference the consolidated
  doctrine promoted on 2026-05-17.
- **Risk:** reporting rule không được apply.
  **Mitigation:** CD-2 enforcement surface đã ghi vào tranche-closure
  checklist requirement.

No code risk vì không có runtime change.

## Decision

**Final consensus decision (Claude + Codex):**

Steps 1 và 2 đã apply trong commit này. Inventory đã được amended với
consensus accuracy state. Reporting rule đã được narrow với explicit
triggers + enforcement surface.

Step 3 is complete. Steps 4-9 là roadmap forward. Mỗi step yêu cầu một
authorization packet riêng khi mở:

- Step 3 (ADD-A + ADD-D + ADD-BRIEF doctrine promotion): completed by
  `docs/reviews/CVF_ADD_A_D_BRIEF_DOCTRINE_PROMOTION_2026-05-17.md`.
- Steps 4, 5, 6 (OBS-1, ADD-PROVIDER, GAP-MEM): completed with fresh GC-018.
- Step 7 (ADD-W7-SIGNALS): completed with fresh GC-018 after ADD-D promotion.
- Step 8 (ADD-B Context Profile Metadata): completed with fresh GC-018 after
  operator authorization.
- Step 9+: defer cho đến khi trigger conditions xảy ra.

Không có further review loop required. Consensus đã đạt được sau:

- Codex draft (inventory)
- Codex self-rebuttal
- Codex review packet
- Claude review (`APPROVE_WITH_CHANGES`)
- Codex response (`AGREED_WITH_AMENDMENTS`)
- This final consensus roadmap

Operator có thể accept hoặc reject consensus roadmap này, nhưng không cần
phải answer per-item questions. Roadmap đã thống nhất.

## Related Artifacts

- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_INVENTORY_2026-05-16.md`
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CLAUDE_REVIEW_PACKET_2026-05-17.md`
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CLAUDE_REVIEW_2026-05-17.md`
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CODEX_RESPONSE_TO_CLAUDE_2026-05-17.md`
- `docs/reviews/CVF_ADD_A_D_BRIEF_DOCTRINE_PROMOTION_2026-05-17.md`
- `docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_AND_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-17.md`
- `docs/roadmaps/CVF_UNABSORBED_KNOWLEDGE_REPORTING_CORRECTION_ROADMAP_2026-05-17.md`
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_REPORTING_CORRECTION_REBUTTAL_2026-05-17.md`
- `docs/reviews/CVF_OPERATOR_PROGRESS_AND_UNABSORBED_KNOWLEDGE_REPORT_2026-05-17.md`
- `docs/baselines/CVF_16_5_LIVING_INTEGRATION_CLASSIFICATION_SUMMARY_2026-05-16.md`
