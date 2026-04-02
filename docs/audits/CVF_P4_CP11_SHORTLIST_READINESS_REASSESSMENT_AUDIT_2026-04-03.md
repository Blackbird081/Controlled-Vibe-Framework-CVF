# CVF P4 CP11 Shortlist Readiness Re-Assessment Audit — 2026-04-03

Memory class: FULL_RECORD
Status: approved conservative readiness re-assessment for the first-wave shortlist after boundary-formalization completion.

## Scope

- re-assess all three first-wave shortlist candidates after `P4/CP7-CP10`
- answer the primary question: does any candidate now have enough evidence to move beyond `NEEDS_PACKAGING`?
- identify specific remaining gaps per candidate

## Source Truth Reviewed

- `docs/reference/CVF_PREPUBLIC_SHORTLIST_WAVE_STATUS_2026-04-03.md`
- `docs/reference/CVF_PREPUBLIC_SHORTLIST_PACKAGING_BOUNDARY_2026-04-02.md`
- `docs/reference/CVF_PREPUBLIC_CORE_GIT_EXPORT_SURFACE_2026-04-03.md`
- `docs/reference/CVF_PREPUBLIC_GUARD_CONTRACT_EXPORT_SURFACE_2026-04-03.md`
- `docs/reference/CVF_PREPUBLIC_RUNTIME_ADAPTER_HUB_EXPORT_SURFACE_2026-04-03.md`
- `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/package.json`
- `EXTENSIONS/CVF_v3.0_CORE_GIT_FOR_AI/README.md`
- `EXTENSIONS/CVF_GUARD_CONTRACT/package.json`
- `EXTENSIONS/CVF_GUARD_CONTRACT/README.md`
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/package.json`
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/README.md`

## Re-Assessment Questions

The handoff defines three criteria for readiness uplift:

1. Does each candidate have enough standalone documentation clarity?
2. Are support obligations clear enough for external consumption?
3. Are capability boundaries and asset obligations explicit enough to survive release?

## Per-Candidate Findings

### `CVF_v3.0_CORE_GIT_FOR_AI`

**Q1 — Standalone documentation clarity:**
The current README is framed for private-core boundary reviewers. It documents the package boundary and non-goals clearly. It does not provide: installation instructions, peer or runtime dependency requirements, API reference, version compatibility statement, or deprecation policy. Not yet suitable for standalone external consumption.

**Q2 — Support obligations:**
No public support commitment is documented. The package has zero runtime dependencies, which simplifies the support surface, but no maintenance commitment, issue tracking surface, or SLA is defined.

**Q3 — Capability boundaries and assets:**
Export map is explicit and minimal (`"." -> index.ts` only). Five primitive families are named in `files`. No extra assets ship outside source files. Boundary is clear.

**License observation:** License is `CC-BY-NC-ND-4.0`. This is present and consistent but has not been explicitly discussed in the readiness context. Implications for external distribution must be acknowledged before any publication decision.

**Verdict:** `NEEDS_PACKAGING` confirmed. Remaining gaps: external-consumer documentation, explicit support commitment, license posture acknowledgment.

---

### `CVF_GUARD_CONTRACT`

**Q1 — Standalone documentation clarity:**
The current README is framed for private-core boundary reviewers. Export map and first-wave boundary are documented. It does not provide: installation instructions, configuration guide for the guard engine, usage examples for the guard runtime, or API reference.

**Q2 — Support obligations:**
`better-sqlite3` is still listed as a runtime dependency (not devDependency) in `package.json` despite audit persistence being classified as out-of-scope in `P4/CP8`. This dependency introduces a native binary module requirement for all consumers, not only those who use audit persistence. No support decision is documented for whether this dependency is required, optional, or should be moved to optional or peer before publication.

**Q3 — Capability boundaries and assets:**
Export surface is explicit and narrowed per CP8. Provider runtime adapters and enterprise subpath are correctly excluded. However, the `better-sqlite3` dependency gap means the package currently ships with a native binary for a capability that is declared first-wave-out-of-scope.

**License observation:** License is `CC-BY-NC-ND-4.0`. Same observation as above.

**Verdict:** `NEEDS_PACKAGING` confirmed. Remaining gaps: external-consumer documentation, `better-sqlite3` runtime dependency resolution, explicit support commitment, license posture acknowledgment.

---

### `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`

**Q1 — Standalone documentation clarity:**
The current README describes the bounded first-wave story and entry points. It does not provide: installation instructions, adapter selection guidance for external consumers, capability level differentiation explanation (shell-capable vs filesystem-capable vs HTTP-capable adapters), or risk-model JSON usage documentation for consumers of the named asset subpaths.

**Q2 — Support obligations:**
No public support commitment is documented. Four JSON risk-model assets are named explicitly in the export map, but their versioning, update policy, and consumption guidance are not defined.

**Q3 — Capability boundaries and assets:**
Export map is explicit and well-structured. Four named risk-model JSON assets are correctly identified. Adapter capability levels are referenced in out-of-scope language but not explained for external consumers — a gap for any publication readiness claim.

**License observation:** License is `CC-BY-NC-ND-4.0`. Same observation as above.

**Verdict:** `NEEDS_PACKAGING` confirmed. Remaining gaps: external-consumer documentation including capability level differentiation and risk-model asset guidance, explicit support commitment, license posture acknowledgment.

## Cross-Cutting Findings

1. All three candidates remain `NEEDS_PACKAGING` after conservative re-assessment.
2. All three READMEs are framed for private-core boundary reviewers, not external consumers.
3. All three carry `CC-BY-NC-ND-4.0`, which has not been discussed in the publication readiness context.
4. Candidate-specific blocker: `CVF_GUARD_CONTRACT` ships `better-sqlite3` as a runtime dependency despite audit persistence being first-wave-out-of-scope.

## Recommended Next Lane

A documentation-completion packet for the shortlist should address:

- external-consumer README rewrites for each candidate (install, use, configure)
- license posture acknowledgment for all three
- `better-sqlite3` dependency resolution for `CVF_GUARD_CONTRACT` before any readiness uplift

## Audit Result

`APPROVED`

## Consequence

`P4/CP11` closes the readiness re-assessment lane with no uplift. All three first-wave shortlist candidates remain `NEEDS_PACKAGING`. Specific gaps are now documented as the authoritative re-assessment record.
