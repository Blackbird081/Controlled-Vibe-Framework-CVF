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

Current version: `1.1.0`.

Current compatible major: `1`.

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

## Claim Boundary

This contract prevents ambiguous representation precedence at the documentation
layer. It does not prove that an external agent read the packet, automatically
detect operator-local file drift, grant execution authority, or establish
current public facts without live source verification.
