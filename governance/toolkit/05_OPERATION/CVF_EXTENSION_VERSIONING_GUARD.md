# CVF Extension Versioning Guard

**Guard Class:** `PACKAGE_AND_RUNTIME_ALIGNMENT_GUARD`
**Status:** Active naming and version-space contract for extension folders under `EXTENSIONS/`.
**Applies to:** All humans and AI agents creating, renaming, or migrating extension folders in CVF repositories.
**Enforced by:** `governance/compat/check_foundational_guard_surfaces.py`, `docs/CVF_CORE_KNOWLEDGE_BASE.md`, `docs/CVF_ARCHITECTURE_DECISIONS.md`

## Purpose

- prevent naming collisions and version ambiguity across extension streams
- preserve isolated version space as CVF expands beyond the original engineering stream
- keep extension identity legible enough for governance, architecture review, and later maintenance

## Rule

Every extension folder created under `EXTENSIONS/` MUST follow the universal naming convention in this guard. Non-compliant extensions must be renamed before merge or commit to any shared branch.

This applies equally to:

- human authors
- AI agents
- migration and cleanup work
- newly created extensions under `EXTENSIONS/`

### Universal Naming Convention

Required format:

```text
CVF_{STREAM}_v{major}.{minor}_{MODULE_NAME}/
```

| Component | Required | Description |
|---|---|---|
| `CVF_` | Always | fixed prefix showing the folder belongs to CVF |
| `{STREAM}_` | Conditional | stream identifier, omitted only for legacy engineering extensions |
| `v{major}.{minor}` | Always | semantic version within the stream |
| `_{MODULE_NAME}` | Always | `UPPERCASE_SNAKE_CASE` module name |

Examples:

- `CVF_v1.6.1_GOVERNANCE_ENGINE/`
- `CVF_v3.0_CORE_GIT_FOR_AI/`
- `CVF_ECO_v1.0_INTENT_VALIDATION/`
- `CVF_ECO_v1.1_NL_POLICY/`
- `CVF_CLI_v1.0_RUNNER/`
- `CVF_SDK_v1.0_AGENT_GUARD/`

Non-compliant examples:

- `intent_validation/`
- `CVF_INTENT_VALIDATION/`
- `v2.1_NL_POLICY/`
- `CVF_v2.1_NL_POLICY/`
- `CVF_ecosystem_v1.0_Domain_Guards/`

### Registered Streams

Active streams:

| Stream Prefix | Direction | Version Space | Status |
|---|---|---|---|
| `CVF_v*` | engineering core and full | `v1.0` to `v3.0+` | active legacy stream |
| `CVF_ECO_v*` | ecosystem expansion | `v1.0+` | active |

Reserved streams:

| Stream Prefix | Direction | Activation Condition |
|---|---|---|
| `CVF_CLI_v*` | CLI tooling | when CLI Runner development begins |
| `CVF_SDK_v*` | SDK packages | when Agent Guard SDK development begins |
| `CVF_INT_v*` | framework integrations | when integration development begins |

To register a new stream:

1. keep the prefix at four characters or fewer and uppercase
2. document the stream in an ADR or governance record
3. start its version space at `v1.0`
4. avoid collisions with existing streams
5. add the registration to this guard

### Version Rules

Per-stream semantics:

| Change Type | Version Bump | Example |
|---|---|---|
| new module or breaking change | major | `CVF_ECO_v2.0_AGENT_GUARD_SDK/` |
| feature addition within same scope | minor | `CVF_ECO_v1.1_NL_POLICY/` |
| hotfix | patch | `CVF_ECO_v1.0.1_INTENT_VALIDATION/` |

Cross-stream isolation is mandatory: `CVF_v1.6` and `CVF_ECO_v1.6` are unrelated modules and may not assume ownership of each other's version space.

The engineering stream keeps the legacy `CVF_v*` format without a stream prefix for backward compatibility. New streams must include their stream prefix.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_foundational_guard_surfaces.py`
- architecture and governance review must reject extension folders that break the registered naming convention
- ADR-backed stream registration is required before a new stream becomes active
- remediation requires renaming the folder, updating internal references, and documenting the correction in the same batch

Pre-commit review questions:

- does it start with `CVF_`?
- does it have a version number?
- is the stream prefix registered?
- does the version avoid collision within the stream?
- is the module name `UPPERCASE_SNAKE_CASE`?

## Related Artifacts

- `docs/CVF_CORE_KNOWLEDGE_BASE.md`
- `docs/CVF_ARCHITECTURE_DECISIONS.md`
- `governance/toolkit/05_OPERATION/CVF_ARCHITECTURE_CHECK_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_DOCUMENT_NAMING_GUARD.md`

## Final Clause

If an extension is important enough to build, it is important enough to name in a way that keeps the whole ecosystem legible.
