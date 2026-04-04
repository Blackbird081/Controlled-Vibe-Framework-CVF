# CVF GC-019 P4 CP14 Publication Decision Review — 2026-04-03

Memory class: FULL_RECORD
Status: governance review of the P4/CP14 publication decision packet.

## Packet

- `P4/CP14` — publication decision for the first-wave shortlist
- Lane: Full Lane — new governance boundary (distribution model, registry, versioning policy)
- Audit: `docs/audits/CVF_P4_CP14_PUBLICATION_DECISION_AUDIT_2026-04-03.md`

## Governance Rule Applied

GC-019: changes to governed extension publication posture require an audit + review chain. This packet makes governance decisions that set the publication boundary; it does not publish any package. No source files or export maps are modified.

## Review

**Distribution model selection — `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`:**
The selection is consistent with the publication decision memo's second-ranked recommendation and is the best fit for the current state: three packages with explicit export maps and `READY_FOR_EXPORT` status. Options 1 (docs-only mirror) and 3 (open-core) do not serve the module export objective. Option 4 (full public monorepo) is explicitly rejected by the memo and by CVF's private-by-default posture. The selection is sound.

**Registry target — npm public registry:**
`cvf-core-git-for-ai`, `cvf-guard-contract`, and `cvf-runtime-adapter-hub` are Node.js packages. npm is the standard public registry. The package names must be verified for availability before any publish attempt; this verification is correctly deferred to the publication implementation packet.

**Versioning policy — semver `0.x`, initial `0.1.0`:**
Pre-stability versioning under `0.x` is correct for first-wave packages with no API stability guarantee. The `1.0.0` milestone requires a separate governance decision. The policy is conservative and appropriate.

**GC-039 landing path — HOLD:**
The landing path was put on HOLD in `P3/CP4` for the same reason. The audit correctly confirms this is not resolved. Keeping it on HOLD is appropriate — landing cannot proceed without a GC-039 extension packet. The audit correctly notes that publication can technically proceed from the restructuring branch without first landing to `cvf-next`, but that a landing must eventually occur.

**Verification checklist:** The audit includes three pre-publish verification items (npm name availability, CC-BY-NC-ND acknowledgment, `better-sqlite3` optional install test). These are the correct items to verify before the implementation packet.

**No implementation changes:** No source files, export maps, or package.json entries are modified by this packet.

## Review Result

`APPROVED`

Distribution model: `PRIVATE_MONOREPO + PUBLIC_MODULE_EXPORTS`. Registry: npm public. Versioning: semver `0.x`, initial `0.1.0`. GC-039 landing: HOLD.

## Consequence

`P4/CP14` establishes the publication decision baseline. A publication implementation packet (`P4/CP15`) may now proceed to define the concrete npm publishing steps, run the pre-publish verification checklist, and produce the governance artifacts for an actual publish event.
