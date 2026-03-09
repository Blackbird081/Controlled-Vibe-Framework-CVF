# CVF EXTENSION VERSIONING GUARD

> **Type:** Governance Guard  
> **Effective:** 2026-03-08  
> **Status:** Active  
> **Applies to:** All humans and all AI agents creating extensions in CVF repositories  
> **Authority:** ADR-021 — CVF Ecosystem Restructure  

---

## 1. PURPOSE

This guard enforces a mandatory naming convention for all extension folders under `EXTENSIONS/`.

As CVF evolves from a single framework into an ecosystem with multiple development streams (engineering, ecosystem expansion, CLI, SDK, integrations...), each stream needs an isolated version space to prevent naming collisions and version ambiguity.

Without this guard:

- `CVF_v2.1_INTENT_VALIDATION/` could be mistaken for a sub-extension of `CVF_v2.0_NONCODER_SAFETY_RUNTIME/`
- Different streams may accidentally reuse the same version number
- Future developers cannot tell which stream an extension belongs to

---

## 2. RULE

> **NON-NEGOTIABLE:**  
> Every extension folder created under `EXTENSIONS/` MUST follow the Universal Naming Convention defined in this guard.  
> Extensions that do not comply MUST be renamed before merge or commit to any shared branch.

This rule applies equally to:

- human authors,
- AI agents,
- migration/cleanup work,
- newly created extensions under `EXTENSIONS/`.

---

## 3. UNIVERSAL NAMING CONVENTION

### 3.1 Required format

```text
CVF_{STREAM}_v{major}.{minor}_{MODULE_NAME}/
```

| Component | Required | Description |
|---|---|---|
| `CVF_` | ✅ Always | Fixed prefix — confirms this belongs to CVF ecosystem |
| `{STREAM}_` | Conditional | Stream identifier. Omitted ONLY for legacy engineering extensions |
| `v{major}.{minor}` | ✅ Always | Semantic version within the stream |
| `_{MODULE_NAME}` | ✅ Always | UPPERCASE_SNAKE_CASE, describes the module function |

### 3.2 Naming examples

**Correct:**

```
CVF_v1.6.1_GOVERNANCE_ENGINE/                ← engineering (legacy, no stream prefix)
CVF_v3.0_CORE_GIT_FOR_AI/                    ← engineering (legacy, no stream prefix)
CVF_ECO_v1.0_INTENT_VALIDATION/              ← ecosystem stream
CVF_ECO_v1.1_NL_POLICY/                      ← ecosystem stream
CVF_CLI_v1.0_RUNNER/                          ← CLI stream (future)
CVF_SDK_v1.0_AGENT_GUARD/                     ← SDK stream (future)
```

**Incorrect:**

```
intent_validation/                            ← no CVF_ prefix, no version
CVF_INTENT_VALIDATION/                        ← no version number
v2.1_NL_POLICY/                               ← no CVF_ prefix
CVF_v2.1_NL_POLICY/                           ← wrong: reuses engineering version space for non-engineering module
CVF_ecosystem_v1.0_Domain_Guards/             ← wrong: lowercase stream, mixed case module name
```

---

## 4. REGISTERED STREAMS

Each development direction has its own stream prefix and isolated version space.

### 4.1 Active streams

| Stream prefix | Development direction | Version space | Status |
|---|---|---|---|
| `CVF_v*` | **Engineering** (Core + Full) | v1.0 → v3.0+ | ✅ Active — legacy, no stream tag |
| `CVF_ECO_v*` | **Ecosystem expansion** | v1.0+ | ✅ Active — registered ADR-021 |

### 4.2 Reserved streams (not yet active)

| Stream prefix | Development direction | Activation condition |
|---|---|---|
| `CVF_CLI_v*` | CLI tooling | When CLI Runner development begins |
| `CVF_SDK_v*` | SDK packages (npm, PyPI) | When Agent Guard SDK development begins |
| `CVF_INT_v*` | Framework integrations (LangChain, CrewAI) | When integration development begins |

### 4.3 Stream registration rules

To register a new stream:

1. Stream prefix MUST be ≤ 4 characters, UPPERCASE
2. Stream MUST be documented in an ADR or governance record
3. Stream gets its own version space, starting from `v1.0`
4. Stream prefix MUST NOT collide with any existing stream
5. Registration MUST be added to Section 4.1 of this guard

---

## 5. VERSION RULES

### 5.1 Version semantics (per stream)

| Change type | Version bump | Example |
|---|---|---|
| New module or breaking change | Major: `v1.0` → `v2.0` | `CVF_ECO_v2.0_AGENT_GUARD_SDK/` |
| Feature addition within same scope | Minor: `v1.0` → `v1.1` | `CVF_ECO_v1.1_NL_POLICY/` |
| Hotfix (optional) | Patch: `v1.0` → `v1.0.1` | `CVF_ECO_v1.0.1_INTENT_VALIDATION/` |

### 5.2 Cross-stream isolation

> **MANDATORY:**  
> Version numbers in different streams are independent. `CVF_v1.6` and `CVF_ECO_v1.6` are completely unrelated modules.  
> No stream may assume ownership of another stream's version numbers.

### 5.3 Legacy engineering stream

The engineering stream (`CVF_v*`) does NOT use a stream prefix for backward compatibility:

- ✅ `CVF_v3.0_CORE_GIT_FOR_AI/` — correct (legacy format)
- ❌ `CVF_ENG_v3.0_CORE_GIT_FOR_AI/` — wrong (do not add stream prefix to legacy)

This exception applies ONLY to the original engineering stream. All new streams MUST include their stream prefix.

---

## 6. ENFORCEMENT

### 6.1 Violations include:

- Creating extension folders without `CVF_` prefix
- Using version numbers that collide with another stream's space
- Omitting version number from extension folder name
- Using an unregistered stream prefix
- Using lowercase or mixed case for stream prefix or module name

### 6.2 Required action on violation:

1. Stop the naming drift
2. Rename folder to compliant form
3. Update all internal references
4. Document the correction in commit message

### 6.3 Pre-commit check

Before committing a new extension folder:

```
✅ Does it start with CVF_?
✅ Does it have a version number?
✅ Is the stream prefix registered in this guard?
✅ Does the version NOT collide with existing versions in the same stream?
✅ Is the module name UPPERCASE_SNAKE_CASE?
```

---

## 7. INTERACTION WITH OTHER GUARDS

| Guard | Relationship |
|---|---|
| `CVF_DOCUMENT_NAMING_GUARD.md` | Complementary — that guard covers `docs/**/*.md`, this guard covers `EXTENSIONS/*/` |
| `CVF_DOCUMENT_STORAGE_GUARD.md` | Complementary — storage taxonomy applies to docs inside extensions |
| `CVF_ADR_GUARD.md` | Upstream — new stream registration requires ADR |
| `CVF_ARCHITECTURE_CHECK_GUARD.md` | Complementary — architecture checks validate extension structure |

---

## 8. FINAL CLAUSE

Extension naming under CVF is part of governance discipline.

If an extension is important enough to build, it is important enough to name correctly.

The Universal Naming Convention ensures that CVF can scale from a single framework to a multi-stream ecosystem without naming chaos — the same principle CVF applies to AI agents: **control the rules, not the agents**.
