# CVF System Unification Remediation Roadmap

Memory class: SUMMARY_RECORD

> Date: `2026-03-19`
> Source review: `docs/reviews/CVF_INDEPENDENT_SYSTEM_REVIEW_2026-03-19.md`
> Comparison anchor: `docs/baselines/CVF_SYSTEM_STATUS_ASSESSMENT_DELTA_2026-03-19.md`
> Goal: Close the major whole-system weaknesses identified in the independent system review
> Scope: Shared guard contract, governance execution model, workflow runtime, Web UI, cross-extension execution, and documentation alignment
> Priority bands: `P0-P2`

---

## Archive Notice

**This file has been reset for continuation.** The full history through W6-T76 has been
archived to:

`docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_ARCHIVE_W1-W6T76_2026-03-19_TO_2026-03-23.md`

The archive contains all GC-018 checkpoint blocks from W1-T1 through W6-T76 (1493 lines).

**Status at archive point (2026-03-23):**
- Total tranches closed: W1 through W6-T76 (76 tranches across all extensions)
- CVF_v1.7.1_SAFETY_RUNTIME: **565 tests / 50 files** (was 157 at W6-T55 start; +408 tests)
- LPF: 377 | GEF: 185 | EPF: 416 | CPF: 644 | GC: 172 — all planes green
- Branch: `cvf-next`

---

## Continuation Tranches (W6-T77+)

> Checkpoints below continue from the archive. Next tranche: W6-T77.

---

### GC-018 Checkpoint — W6-T77 (2026-03-23)

**Tranche:** W6-T77 — Safety Runtime Contract Validator, Domain Lock Engine & Dev-Automation Risk Scorer Tests Slice
**Branch:** cvf-next | **Risk:** R0 | **Lane:** Full Lane

- Dedicated tests for ContractValidator (validateDefinition: undefined/empty/valid; validateIOContract: missing-ids/mismatch/valid), DomainLockEngine.lock (analytical/creative/unknown-domain/classifier-mismatch), scoreRisk (clean-ADMIN/delete-keyword/long-instruction/devMode): `COMPLETED`
- 14 new tests in dedicated `safety-runtime-contract-validator-domain-lock-engine-risk.test.ts` (GC-023 compliant, 148 lines): `COMPLETED`
- Test-only tranche — no source modifications: `COMPLETED`
- CVF_v1.7.1_SAFETY_RUNTIME: 565→579 tests (+14). All planes green: `COMPLETED`

Baseline authorization artifact: `docs/baselines/CVF_WHITEPAPER_GC018_W6_T77_AUTHORIZATION_DELTA_2026-03-23.md`

---

### GC-018 Checkpoint — W6-T78 (2026-03-23)

**Tranche:** W6-T78 — Safety Runtime RefusalRouter, LLMAdapter, Deploy & PR Gateway Tests Slice
**Branch:** cvf-next | **Risk:** R0 | **Lane:** Full Lane

- Dedicated tests for RefusalRouter.evaluate (R0/R3/R4/R2+drift), LLMAdapter.generate (wrong-token-throws/correct-token/no-provider-fallback), deploy.gateway (no-client/register+deploy), pr.gateway (no-client/register+create+branchName): `COMPLETED`
- 12 new tests in dedicated `safety-runtime-refusal-router-llm-deploy-pr.test.ts` (GC-023 compliant, 179 lines): `COMPLETED`
- Test-only tranche — no source modifications: `COMPLETED`
- CVF_v1.7.1_SAFETY_RUNTIME: 579→591 tests (+12). All planes green: `COMPLETED`

Baseline authorization artifact: `docs/baselines/CVF_WHITEPAPER_GC018_W6_T78_AUTHORIZATION_DELTA_2026-03-23.md`

---

### GC-018 Checkpoint — W6-T79 (2026-03-23)

**Tranche:** W6-T79 — Validation Schemas & RefusalPolicyRegistry Tests Slice
**Branch:** cvf-next | **Risk:** R0 | **Lane:** Full Lane

- Dedicated tests for validate() helper (valid→success+data/invalid→success=false+errors/path:message format/null input), ProposalEnvelopeSchema (uuid/source/confidence/action), LoginRequestSchema (username-min3/password-min8), RegisterPolicySchema (version regex/empty-rules), LifecycleInputSchema (simulateOnly default), AISettingsSchema (temperature/maxTokens bounds), RefusalPolicyRegistry (latestVersion/get-v1-baseline/get-unknown-throws): `COMPLETED`
- 25 new tests in dedicated `safety-runtime-validation-schemas-refusal-policy-registry.test.ts` (GC-023 compliant, 205 lines): `COMPLETED`
- Test-only tranche — no source modifications: `COMPLETED`
- CVF_v1.7.1_SAFETY_RUNTIME: 591→616 tests (+25). All planes green: `COMPLETED`

Baseline authorization artifact: `docs/baselines/CVF_WHITEPAPER_GC018_W6_T79_AUTHORIZATION_DELTA_2026-03-23.md`

---

### GC-018 Checkpoint — W6-T80 (2026-03-23)

**Tranche:** W6-T80 — Approval State Machine, EventBus, Policy Hash, CostGuard & Roles Tests Slice
**Branch:** cvf-next | **Risk:** R0 | **Lane:** Full Lane

- Dedicated tests for nextState (proposed→validated/validated→3decisions/approved→executed/others-unchanged), EventBus (on/emit/off/onAll/offAll/listenerCount/clear/error-isolation), generatePolicyHash (hex64/deterministic/different-input), CostGuard.validate (OK/WARNING-80pct/LIMIT_EXCEEDED-tokens-files-user-daily), canExecute (ADMIN+OPERATOR→true/VIEWER→false), canApprove (ADMIN→true/others→false): `COMPLETED`
- 27 new tests in dedicated `safety-runtime-approval-statemachine-eventbus-cost-roles.test.ts` (GC-023 compliant, 215 lines): `COMPLETED`
- Test-only tranche — no source modifications: `COMPLETED`
- CVF_v1.7.1_SAFETY_RUNTIME: 616→643 tests (+27). All planes green: `COMPLETED`

Baseline authorization artifact: `docs/baselines/CVF_WHITEPAPER_GC018_W6_T80_AUTHORIZATION_DELTA_2026-03-23.md`

---

### GC-018 Checkpoint — W6-T81 (2026-03-23)

**Tranche:** W6-T81 — RiskEngine, StateStore, Policy Registry, Execution Boundary & Approval State Tests Slice
**Branch:** cvf-next | **Risk:** R0 | **Lane:** Full Lane

- Dedicated tests for RiskEngine.assess (CODE/POLICY-CRITICAL/INFRA-diff/dependency/migration-core), setState/getState/_clearAllStates (round-trip/unknown/clear), registerPolicy/getPolicy/listPolicies (hash/duplicate-throws/unknown-throws/list), runWithinBoundary (success/rethrow/suppress/eventBus-error), transitionApproval (PENDING→APPROVED/REJECTED/non-PENDING-throws): `COMPLETED`
- 19 new tests in dedicated `safety-runtime-risk-engine-state-store-policy-registry-boundary.test.ts` (GC-023 compliant, 198 lines): `COMPLETED`
- Test-only tranche — no source modifications: `COMPLETED`
- CVF_v1.7.1_SAFETY_RUNTIME: 643→662 tests (+19). All planes green: `COMPLETED`

Baseline authorization artifact: `docs/baselines/CVF_WHITEPAPER_GC018_W6_T81_AUTHORIZATION_DELTA_2026-03-23.md`

