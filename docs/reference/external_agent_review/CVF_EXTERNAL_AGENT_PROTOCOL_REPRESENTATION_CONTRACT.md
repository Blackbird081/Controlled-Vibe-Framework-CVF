# CVF External Agent Protocol Representation Contract

Memory class: POLICY_RECORD

Status: ACTIVE_REFERENCE

docType: reference

## Purpose

Keep the public single-file guide and the operator-portable four-file packet
aligned as representations of one external-agent round-trip protocol.

## Scope / Owner Boundary

This contract owns representation identity, version compatibility, precedence,
and snapshot-freshness semantics. It does not make operator-local packet files
CVF authority, publish private provenance, or authorize external effects.

## Protocol Identity

Canonical protocol identifier: `cvf.external-agent-round-trip`.

Current version: `1.2.0`.

Current compatible major: `1`.

Return schema `cvf.externalAgentReturn.v1` is retained unchanged: the
candidate-contract discriminator is an additive collection-level field, not a
return-schema major change.

Every representation must expose these fields:

```text
protocolVersion
projectionOf
compatibleWith
updatedAt
representation
```

`projectionOf` must equal `cvf.external-agent-round-trip`. Compatibility is
major-version based: `1.x` representations may be used together. A breaking
semantic or required-artifact change increments the major version.

## Representations

| Representation | Entry surface | Role |
|---|---|---|
| `PUBLIC_COMPACT_PROJECTION` | public `docs/guides/CVF_EXTERNAL_AGENT_ROUND_TRIP_KIT.md` | Single-file discovery when the public repository/link is supplied |
| `PORTABLE_EXPANDED_PACKET` | `CVF_EXTERNAL_AGENT_BOOTSTRAP_INSTRUCTIONS.md` plus three named companion files | Richer, refreshable offline or attachment-based context |

The portable companion set is:

- `CVF_CONTEXT_BRIEF.md`;
- `CVF_CURRENT_PUBLIC_SNAPSHOT.md`;
- `CVF_EXTERNAL_AGENT_RETURN_CONTRACT.md`.

Two generated supplements may accompany the stable four-file set:

- `CVF_PUBLIC_OWNER_SURFACE_INDEX.json`, copied from the public-safe owner
  projection for bounded owner discovery;
- `CVF_EXTERNAL_AGENT_TASK_CAPSULE.json`, generated for one exact task and
  source repository. It must be regenerated rather than reused for another
  repository.

`CVF_EXTERNAL_AGENT_PACKET_REFRESH_RECEIPT.json` records the public commit and
hashes produced by the latest packet refresh. These supplements do not become
CVF authority and do not change the four stable entry files.

## Gate A And Gate B

External implementation uses two ordered gates:

1. Gate A (`SOURCE_OWNER_OVERLAP`) verifies immutable source identity, license
   expression and source, current CVF owner surface, and overlap/novelty
   disposition before design or code.
2. Gate B (`DESIGN_CODE_TEST`) opens only after Gate A passes and requires
   implementation/design evidence plus executed negative semantic tests.

A large packet, JSON Schema pass, or positive example does not substitute for
either gate.

## Selection And Precedence

1. When only the public repository is supplied, use the public compact
   projection.
2. When the complete portable packet is supplied, its bootstrap is the
   startup entrypoint and its specialized files provide the richer context.
3. Current CVF source and explicit operator instructions outrank both
   representations for source and task facts.
4. A more restrictive authority, safety, evidence, or claim boundary wins.
5. Missing metadata, a major-version mismatch, or material semantic conflict
   requires `PROTOCOL_REPRESENTATION_DRIFT`; reverify source and narrow claims
   until reconciled.

## Snapshot Freshness Rule

`CVF_CURRENT_PUBLIC_SNAPSHOT.md` records a pinned audit anchor verified at a
specific time. It does not promise that the anchor remains live public `HEAD`.
At use time, record live `HEAD` independently. If it differs, retain the anchor
as historical evidence, read current source at the live SHA, and never combine
facts across commits without labeling both identities.

Cached browser, search, or commit-history surfaces are discovery aids, not
sufficient proof of live `HEAD`; use an exact Git ref query when available.

The governed refresh command is:

```powershell
.\scripts\Update-CVF-External-Agent-Packet.ps1 -Mode RefreshSnapshot
```

It performs no push. It requires a clean public-sync `main`, verifies that its
HEAD equals live `origin/main`, then refreshes the operator-local snapshot,
owner index, and receipt. A local public candidate that has not been pushed is
therefore rejected instead of being labeled live public state.

## Candidate Contract Discriminator And Receipt Binding (1.2.0)

Protocol `1.2.0` adds an optional collection-level `candidateContractVersion`
field read alongside `suggestedAbsorptionCandidates`. The normative candidate
shape, provenance-lane separation, and dual-reader compatibility table are
owned by
`docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md`;
this contract records only the version-compatibility and receipt-evidence
obligations:

- every new `1.2.0` producer must emit `candidateContractVersion: 1`,
  including when the candidate array is empty;
- a validation receipt binding candidate-aware `PASS` must expose
  `validatedReturnManifestSha256`, `validatedProtocolVersion: "1.2.0"`, and
  `validatedCandidateContractVersion: 1`;
- a legacy or candidate-unaware `PASS` receipt is valid historical evidence
  but is insufficient to open typed Local reconciliation;
- `1.1.0` returns remain readable; their untyped, non-empty candidate rows
  are preserved as historical evidence and are never silently promoted to
  typed candidate status by later revalidation.

## Public/Portable Projection Release Boundary

Protocol `1.2.0` is released to the public compact projection and the
operator-portable packet only as documentation and return-validation contract
semantics. The synchronized release updates both representations'
`protocolVersion`, `compatibleWith`, and `updatedAt` fields together. Release
does not imply that an External Agent read the new packet, that any candidate
was accepted, or that runtime/provider/implementation authority was granted.

## Update Rule

Any change to protocol semantics must update every affected representation's
`protocolVersion`, `compatibleWith`, and `updatedAt` fields in the same logical
release. A compact-only wording change may retain the version only when it does
not change required behavior, return shape, authority, or claim boundaries.

## External Knowledge Intake Routing

| Field | Value |
|---|---|
| Chain map | `docs/reference/external_agent_review/CVF_EXTERNAL_KNOWLEDGE_ABSORPTION_CHAIN_MAP.md` |
| Input type | external-agent packet request |
| Chain map route | external feedback -> representation relationship clarification -> public compact and operator-portable alignment |
| Matching local-view guard | `governance/compat/check_external_knowledge_intake_routing.py` |
| Owner surface | `docs/reference/external_agent_review/CVF_EXTERNAL_AGENT_PROTOCOL_REPRESENTATION_CONTRACT.md` |
| Disposition | ADAPT existing external-agent packet routing with explicit representation identity and drift handling |
| Claim boundary | documentation and compatibility contract only; no runtime, provider, deployment, or production claim |

## Epistemic Process Block

### Expected Result / Prediction

Bumping the private protocol owner to `1.2.0` for the accepted candidate
discriminator and receipt-binding enrichment was expected to require no
return-schema-major change and no break in `1.1.0` read compatibility, since
the accepted design treats the discriminator as additive.

### Evidence Comparison

The implemented and synchronized dual-reader table (`LEGACY_EMPTY`,
`LEGACY_UNTYPED_NOT_PROMOTABLE`, `STRICT_V1`, `UNSUPPORTED_OR_MALFORMED`) and
the focused test matrix confirm that pre-existing `1.1.0` returns with empty
or non-empty untyped candidate arrays continue to validate under the
existing `PASS`/`RETURN_FOR_REPAIR` semantics, matching the prediction.

### Contradiction Or Gap Disposition

No contradiction was found in the version-compatibility design itself. This
enrichment does surface a separate, unrelated governance-checker/owner-surface
mismatch on a sibling material path
(`CVF_EXTERNAL_AGENT_FINDING_ABSORPTION_WORKFLOW.md`), recorded in the paired
worker return rather than here, since it does not affect this contract's own
version-compatibility content.

### Claim Update

This contract now documents `1.2.0` as the synchronized private, public
compact, and operator-portable protocol version. External receipt of or
conformance to that release still requires separate evidence.

## Claim Boundary

This contract prevents ambiguous representation precedence at the documentation
layer. It does not prove that an external agent read the packet, automatically
detect operator-local file drift, grant execution authority, or establish
current public facts without live source verification.
