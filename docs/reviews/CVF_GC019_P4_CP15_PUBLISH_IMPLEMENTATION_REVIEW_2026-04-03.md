# CVF GC-019 P4 CP15 Publish Implementation Review — 2026-04-03

Memory class: FULL_RECORD
Status: governance review of the P4/CP15 publish implementation packet.

## Packet

- `P4/CP15` — publish implementation for the first-wave shortlist
- Lane: Full Lane — implementation changes (version fix) + gap documentation
- Audit: `docs/audits/CVF_P4_CP15_PUBLISH_IMPLEMENTATION_AUDIT_2026-04-03.md`

## Governance Rule Applied

GC-019: changes to governed extension surfaces require an audit + review chain. This packet modifies three `package.json` version fields and produces governance documentation. No export maps, source files, or test files are modified.

## Review

**Pre-publish checklist — all three items pass:**
npm name availability confirmed (live registry check, all three names return 404). License presence confirmed in all `package.json` files and READMEs. `better-sqlite3` confirmed in `optionalDependencies` with no install scripts. All checklist items defined in P4/CP14 are satisfied.

**Version fix — correct and contained:**
The three packages carried internal CVF architectural version labels (`3.0.0`, `1.0.0`, `1.7.3`) that were never npm releases. Resetting to `0.1.0` is correct per the P4/CP14 versioning policy and accurately signals pre-stability to npm consumers. The change is contained to the `version` field in each `package.json`. No other metadata is modified.

**TypeScript source packaging gap — correctly identified and deferred:**
All three packages ship TypeScript source via `main`, `types`, and `exports` fields. This is the correct observation. The audit presents Option A (ship TypeScript source as-is) and Option B (add compile-to-JS step) without choosing between them. This is the right posture — this is a packaging architecture decision that belongs in a dedicated CP, not an implicit side effect of the implementation packet. Deferring to P4/CP16 is correct.

**Concrete publish steps — correctly gated:**
The audit documents the precise publishing commands but explicitly gates them on CP16 resolution. The steps are accurate for unscoped public npm packages. The `--access public` flag is required for publishing unscoped packages from organizations or private registries. The post-publish verification step (`npm view <name>@0.1.0`) is sound.

**No premature publication:** This packet does not execute `npm publish`. The sole remaining blocker before publication is the CP16 packaging architecture decision.

## Review Result

`APPROVED`

Version fix delivered. Pre-publish checklist complete. TypeScript packaging gap deferred to P4/CP16.

## Consequence

`P4/CP15` establishes the pre-publish implementation baseline. All three packages are at `0.1.0` in their `package.json`. The sole remaining blocker before `npm publish` is the packaging architecture decision in P4/CP16.
