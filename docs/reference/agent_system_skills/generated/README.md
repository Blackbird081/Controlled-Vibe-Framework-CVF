# CVF ASSF Skill Index - Generated

Memory class: FULL_RECORD

Status: ACTIVE_REFERENCE

Date: 2026-06-23

docType: reference

Batch ID: ASSF-T2

## Purpose

This folder contains the generated ASSF skill index aggregate produced by
the deterministic generator
`governance/compat/generate_assf_skill_index.py`.

The canonical source of truth is the per-skill entry files under
`docs/reference/agent_system_skills/registry/entries/`. The generated
`skill-index.json` is a read-only aggregate; do not hand-edit it.

To regenerate after editing a source entry:

```
python governance/compat/generate_assf_skill_index.py --generate
```

To verify the aggregate matches its sources:

```
python governance/compat/check_assf_skill_index_drift.py
```

## Closure Token

GENERATED_SOURCE_LAYOUT_ADDED

This closure token records that the generated-source layout for the ASSF
skill index is now established. The source entries live under
`docs/reference/agent_system_skills/registry/entries/` and the generated
aggregate lives in this folder at `skill-index.json`. Authoring of
generated source layout is complete for ASSF-T2.

## Scope Boundary

This folder contains only the generated skill index aggregate. It is not
a package root, resolver, activation profile, CLI/MCP adapter, runtime
implementation, provider integration, or public artifact. Loading this
index never grants authority to commit, activate any skill, or expand
external-agent scope.

## Claim Boundary

`skill-index.json` is a metadata-only aggregate. It is not evidence of
runtime activation, CLI/MCP adapter implementation, provider availability,
external-agent authorization, or any claim beyond the bounded ASSF-T2
data-plane scope.

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: this generated index depends on private ASSF provenance evidence.
Public-safe skill index export requires separate redaction and public-sync
authorization.
