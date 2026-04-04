# CVF P4 CP15 Publish Implementation Delta — 2026-04-03

Memory class: SUMMARY_RECORD
Status: summary delta for P4/CP15 publish implementation packet.

## Packet

- `P4/CP15` — publish implementation for the first-wave shortlist
- Governing audit: `docs/audits/CVF_P4_CP15_PUBLISH_IMPLEMENTATION_AUDIT_2026-04-03.md`
- Governing review: `docs/reviews/CVF_GC019_P4_CP15_PUBLISH_IMPLEMENTATION_REVIEW_2026-04-03.md`

## Changes

### Files Modified

| File | Change |
|---|---|
| `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/package.json` | `version`: `3.0.0` → `0.1.0` |
| `EXTENSIONS/CVF_GUARD_CONTRACT/package.json` | `version`: `1.0.0` → `0.1.0` |
| `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/package.json` | `version`: `1.7.3` → `0.1.0` |

New docs only:
- `docs/audits/CVF_P4_CP15_PUBLISH_IMPLEMENTATION_AUDIT_2026-04-03.md`
- `docs/reviews/CVF_GC019_P4_CP15_PUBLISH_IMPLEMENTATION_REVIEW_2026-04-03.md`
- `docs/baselines/CVF_P4_CP15_PUBLISH_IMPLEMENTATION_DELTA_2026-04-03.md` (this file)

## Pre-Publish Checklist Status

| Item | Status |
|---|---|
| npm name availability: all three names | PASS — all available |
| CC-BY-NC-ND-4.0 in `package.json` + READMEs | PASS |
| `better-sqlite3` in `optionalDependencies` | PASS |

## Repo Truth After P4/CP15

| Package | `package.json` version | exportReadiness | npm publish status |
|---|---|---|---|
| `cvf-core-git-for-ai` | `0.1.0` | `READY_FOR_EXPORT` | blocked by CP16 |
| `cvf-guard-contract` | `0.1.0` | `READY_FOR_EXPORT` | blocked by CP16 |
| `cvf-runtime-adapter-hub` | `0.1.0` | `READY_FOR_EXPORT` | blocked by CP16 |

## Remaining Blocker

**TypeScript source packaging gap** — all three packages export `.ts` source files directly. A packaging architecture decision is required before `npm publish`:

- **Option A** — ship TypeScript source as-is (current state); requires consumer TypeScript compilation; acceptable for TypeScript-only integrators
- **Option B** — add compile-to-JS step; produces `.js` + `.d.ts`; compatible with all Node.js consumers

P4/CP16 must choose and implement one option before publication proceeds.

## Next Safe Lane

- `P4/CP16` — packaging architecture decision
- must choose Option A (TypeScript source) or Option B (compile-to-JS)
- must implement whichever is chosen
- after CP16: actual `npm publish` may proceed per the steps documented in the P4/CP15 audit

## Related Artifacts

- `docs/reference/CVF_PUBLICATION_DECISION_RECORD_2026-04-03.md`
- `docs/baselines/CVF_P4_CP14_PUBLICATION_DECISION_DELTA_2026-04-03.md`
