# CVF ASSF Skill Registry Sources

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-23

docType: reference

Batch ID: ASSF-T2

## Purpose

This folder holds the compact per-skill JSON source files consumed by the
deterministic ASSF skill index generator
(`governance/compat/generate_assf_skill_index.py`).

Each file under `entries/` is the authoritative source for one skill
candidate. The generator reads every `*.json` file, strips source-only
fields (currently `registryOrder`), sorts by `registryOrder` then
`skillId`, and writes the aggregate to
`docs/reference/agent_system_skills/generated/skill-index.json`.

Do not hand-edit the generated index. Edit only the entry sources here,
then regenerate.

## Scope Boundary

This folder is a governed registry source family. It is not a package
root, resolver, generated index, CLI/MCP adapter, runtime implementation,
activation profile, provider integration, or public artifact.

## Current Disposition

| Surface | Disposition |
|---|---|
| Per-skill source entries | `CANDIDATE` or `PROPOSED` lifecycle state only |
| Generated index | produced by `generate_assf_skill_index.py --generate` |
| Package instances | N/A with reason: not created by ASSF-T2 |
| CLI/MCP adapter | N/A with reason: `DEFERRED_WITH_REASON` per dual-agent standard |
| Runtime/provider/live behavior | N/A with reason: not in ASSF-T2 scope |

## Adding A New Entry

1. Create `entries/<skill-id>.json` conforming to the T1 contract field
   families.
2. Set `registryOrder` to the next available integer.
3. Set `status` to `CANDIDATE` or `PROPOSED`; do not set `ACTIVE`.
4. Run `python governance/compat/generate_assf_skill_index.py --generate`.
5. Run `python governance/compat/check_assf_skill_index_drift.py` and
   confirm PASS.

## Claim Boundary

This folder is a governed registry source family for ASSF-T2. It does not
activate, expose, or authorize any skill package, CLI/MCP adapter,
runtime behavior, or external-agent projection.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this registry source family currently depends on private ASSF
provenance evidence. Public-safe skill registry export requires separate
redaction and public-sync authorization.
