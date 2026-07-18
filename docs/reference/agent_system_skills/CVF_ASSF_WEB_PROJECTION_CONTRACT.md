# CVF ASSF Web Projection Contract

Memory class: FULL_RECORD

Status: CANDIDATE

Date: 2026-06-25

docType: reference_contract

Batch ID: ASSF-T6

## Purpose

Define the canonical-vs-presentation boundary for CVF Web exposure of agent
system-skill packages. Establish the vocabulary, invariants, and external-agent
boundary that govern how future certified ASSF packages may be projected into
CVF Web without conflating Web presentation examples with canonical execution
authority.

## Scope

This contract applies to:

- any future CVF Web route, component, or data surface that displays or links
  certified ASSF package metadata;
- the existing CVF Web template-to-skill mapping and skill library integration;
- classification decisions about current Web skill/template examples.

This contract does not authorize:

- creation of any runtime Web route, component, API, loader, generator, or
  test;
- package instance creation, `SKILL.md`, `skill.source.json`, or registry entry
  creation;
- generated-index mutation or external CLI/MCP adapter implementation;
- activation of any skill or automatic promotion of any Web example to a
  certified package.

## Design Principles

### Principle 1: CVF Web Projects Packages; It Does Not Own Canonical Truth

CVF Web is a projection surface. Canonical truth for an ASSF package is the
package registry entry, the `SKILL.md` file, and the governing GC-018 and
source-verified certification review. A Web display or mapping is
**evidence of projection**, not evidence of certification.

### Principle 2: Presentation Examples Are Not Certified Packages

Existing CVF Web templates and skill-mapping entries are form-based UI
templates. They predate the ASSF certification architecture. No existing Web
example inherits certified package status solely by appearing in CVF Web
surfaces, the template-to-skill map, or the skill library.

### Principle 3: Projection Requires Prior Certification

A certified package projection exists only after the package has completed
ASSF certification (T7 or later), not before. The order is:

```
package certification (T7+) -> package registry entry -> projection allowed
```

Any route that reverses this order (projection -> certification) is forbidden.

### Principle 4: Authority Ceiling Is Preserved Through Projection

Projecting package metadata into CVF Web must not increase the package's
authority ceiling. The Web display is read-only metadata. No activation,
composition, promotion, role grant, or authority expansion may be triggered by
a Web projection event.

### Principle 5: External-Agent CLI/MCP Adapter Is Separately Governed

An external agent or CLI/MCP adapter that reads projected package metadata from
CVF Web requires a separate source-verified adapter work order. This contract
does not authorize that adapter.

## Classification Vocabulary

Each existing and future Web skill/template example must receive exactly one of
the following tokens:

| Token | Meaning |
|---|---|
| `CERTIFIED_PACKAGE_PROJECTION` | Package is certified under ASSF-T7+; Web display is an authoritative projection backed by package registry evidence. |
| `PACKAGE_CANDIDATE` | Example maps to a legacy skill or domain that could eventually be packaged under ASSF-T1+; currently lacks certification evidence. |
| `LEGACY_REFERENCE_ONLY` | Example exists as a navigation, folder, or cross-reference surface only; not a skill document and not a package candidate without separate review. |
| `DUPLICATE_OR_SUPERSEDED` | Example duplicates or is superseded by another entry; the superseding entry is named. |
| `REJECTED_WITH_REASON` | Example must not become a projection for a stated reason (authority violation, malformed schema, conflict); reason is documented. |

## Canonical-Vs-Presentation Boundary Table

| Surface class | Canonical authority level | May inform projection? | May become CERTIFIED_PACKAGE_PROJECTION? | Condition for certification |
|---|---|---|---|---|
| ASSF package registry entry (`registry/`) | CANONICAL_PACKAGE_AUTHORITY | Yes | Yes | ASSF-T7+ certification review and registry commit |
| `skill-index.json` (generated) | METADATA_ONLY_DISPLAY | Yes, read-only | No -- display only | Underlying registry entry must be certified first |
| `skill-template-map.json` and `skill-template-map.ts` | PRESENTATION_MAPPING | No -- UI linkage only | No -- mapping does not certify | N/A |
| CVF Web template files (`lib/templates/*.ts`) | PRESENTATION_FORM | No -- UI form only | No -- form does not certify | N/A |
| CVF Web skill components (`SkillLibrary`, `SkillDetailView`) | DISPLAY_SURFACE | No -- read-only UI | No | N/A |
| `docs/concepts/skill-system.md` | PRODUCT_CONCEPT_REFERENCE | Reference only | No -- concept doc | N/A |
| `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/` | LEGACY_SKILL_LIBRARY | Legacy reference | No without T7 certification | Separate certification required per skill |

## Invariants

### No-Self-Certification Invariant

A Web example, template mapping, or presentation component must never claim its
own certification. Certification is an ASSF governance decision, not a Web
runtime event.

### No-Activation-By-Projection Invariant

Projecting a skill or package into CVF Web must not trigger, imply, or enable
any activation path. The `frontdoor-skills.ts` fetch and the `skill-index.json`
payload are read-only display feeds, not activation channels.

### No-Authority-Expansion Invariant

A projected package retains the same authority ceiling it held in the package
registry. The display tier (`frontDoorTier`, `frontDoorVisible`) is a
presentation hint, not an authority grant.

### Adapter-Separation Invariant

No CVF Web route, component, or data file constitutes an external CLI/MCP
adapter. External agents must obtain a separate source-verified adapter contract
before reading projected metadata programmatically.

## Failure Dispositions

| Failure pattern | Required action |
|---|---|
| A Web template is promoted to `CERTIFIED_PACKAGE_PROJECTION` without a registry entry | Block; return `REJECTED_WITH_REASON` |
| A projection event expands the package authority ceiling | Block; escalate to governance |
| A Web route activates or invokes a skill package | Block; architecture defect |
| An external agent reads projected metadata through an unauthorized adapter | Block; require adapter work order |
| A legacy skill-library entry is claimed certified without ASSF-T7 evidence | Reclassify as `PACKAGE_CANDIDATE` or `LEGACY_REFERENCE_ONLY` |

## Source Verification Block

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Source fact type | Disposition |
|---|---|---|---|---|---|---|
| T1 package contract defines `certificationState` | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Compact Machine Source Schema | `certificationState` | ASSF-T1 package schema | EXISTS | ACCEPT |
| T1 package contract defines `externalCliMcpDisposition` | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Compact Machine Source Schema | `externalCliMcpDisposition` | ASSF-T1 package schema | EXISTS | ACCEPT |
| T1 separates adapter projection from canonical authority | `docs/reference/agent_system_skills/CVF_ASSF_PACKAGE_CONTRACT.md` | Internal-Agent And External-Agent CLI/MCP Disposition Fields | `adapterContract` | ASSF-T1 package schema | LITERAL_INVARIANT | ACCEPT |
| T2 generated index is metadata-only and not activation evidence | `docs/reference/agent_system_skills/generated/skill-index.json` | `claimBoundary` | `claimBoundary` | ASSF-T2 generated index | LITERAL_INVARIANT | ACCEPT |
| T5 composition contract forbids authority expansion through composition | `docs/reference/agent_system_skills/CVF_ASSF_COMPOSITION_CONTROL_CONTRACT.md` | Authority And Risk Boundary | `authorityCeiling` | ASSF-T5 composition contract | LITERAL_INVARIANT | ACCEPT |
| Web mapping separates template input side and skill knowledge side | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/skill-template-map.ts` | file header comment | `templateToSkillMap` | CVF Web skill-template mapping | LITERAL_INVARIANT | ACCEPT |
| Web mapping lookup function exists | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/skill-template-map.ts` | `getSkillForTemplate` | `getSkillForTemplate` | CVF Web skill-template mapping | EXISTS | ACCEPT |
| Web Skill interface uses `corpusClass` not ASSF `certificationState` | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/types/skill.ts` | `Skill` interface | `corpusClass` | CVF Web Skill type | EXISTS | ACCEPT |
| Web front-door function fetches read-only skills index payload | `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/frontdoor-skills.ts` | `fetchFrontDoorSkillRecords` | `fetchFrontDoorSkillRecords` | CVF Web frontdoor-skills | EXISTS | ACCEPT |
| Concept doc defines current skills as form-based templates | `docs/concepts/skill-system.md` | What is a Skill? | `.skill.md` | current product skill concept | EXISTS | ACCEPT |
| Dual Agent standard requires both consumer rows and adapter boundary | `docs/reference/CVF_DUAL_AGENT_SURFACE_ACCOUNTING_STANDARD_2026-06-23.md` | Mandatory Dual Agent Surface Matrix | `EXTERNAL_AGENT_CLI_MCP` | Dual Agent Surface Accounting Standard | VALUE_SET | ACCEPT |

## ADIF Defect Registry Disclosure

Resolver query: taskClass=`Reference contract authoring`, role=`worker`, lifecyclePhase=`pre-implementation`

Returned defects:
- ADIF-0001: Exhaustive directory claim omits actual children
- ADIF-0002: Provider-local interaction accepted as authority
- ADIF-0006: Source Verification symbol cell contains a value/type
- ADIF-0007: Gate keyword in exclusion prose triggers wrong evidence class

Remediation applied:
- ADIF-0001: This contract does not claim exhaustive enumeration; the migration audit records actual search commands and bounded results.
- ADIF-0002: All source verification cites CVF-governed files and current repository source files.
- ADIF-0006: Source Verification symbol cells contain bare field/path/function names only.
- ADIF-0007: Exclusion prose is kept in the Scope section; it does not serve as evidence for unrelated registries.

## Dual Agent Surface Matrix

| Consumer class | Interface or owner surface | Authority and risk boundary | Evidence | Adapter boundary | Disposition |
|---|---|---|---|---|---|
| `INTERNAL_AGENT` | This contract and the T6 migration audit | Internal agents may read projection classifications and invariants; they may not infer certification or activation from Web presentation surfaces | T1 package contract, T2 generated index claim boundary, T5 composition contract, this contract, and T6 migration audit | no internal loader, resolver change, route, or runtime projection is implemented by this tranche | `CONTRACT_ONLY` |
| `EXTERNAL_AGENT_CLI_MCP` | Future external CLI/MCP or adapter that reads projected package metadata from CVF Web | No external agent may mutate, certify, activate, or execute packages through Web projection surfaces; adapter owner and authorization are deferred | Dual Agent Surface Accounting Standard, T1 `externalCliMcpDisposition` field, and this contract adapter-separation invariant | adapter owner is deferred; separate source-verified adapter work order required before any external CLI/MCP projection readout | `DEFERRED_WITH_REASON` |

## Delta Execution Claim Boundary Control Block

| Field | Disposition |
|---|---|
| claimScope | ASSF-T6 Web projection boundary definition -- contract document only |
| claimDisposition | BOUNDED_CLAIM_WITH_EVIDENCE -- documentation tranche; no runtime implementation |
| receiptEvidence | N/A with reason: no runtime execution, provider call, or adapter receipt |
| actionEvidence | ACTION_EVIDENCE_PRESENT -- Source Verification Block and migration audit classification ledger |
| invocationBoundary | governed local repository documentation only |
| interceptionBoundary | no IDE, shell, git, filesystem, provider, CLI, MCP, or Web runtime interception claim |
| claimLanguage | defines boundary rules for future certified package Web projection |
| forbiddenExpansion | no runtime route, component, API, resolver, generator, checker, package instance, SKILL.md, skill.source.json, generated-index mutation, CLI/MCP adapter, provider/live proof, public-sync, or session state edit |

## Public Export Disposition

DEFERRED_PRIVATE_ONLY

Reason: private provenance architecture contract. Public-safe export requires
separate redaction and public-sync authorization.

## Claim Boundary

This contract is architecture authority for how future certified ASSF packages
may be projected into CVF Web. It does not certify any package, activate any
skill, change CVF Web runtime surfaces, authorize CLI/MCP adapter behavior, or
claim that any current Web example is a certified projection.

No package activation claim. No public-sync claim.
