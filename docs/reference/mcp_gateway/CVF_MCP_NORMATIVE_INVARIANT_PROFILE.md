# CVF MCP 2026-07-28 Normative Invariant Profile

Memory class: governed-reference

Status: ACTIVE_REFERENCE

docType: reference

Date: 2026-08-23

## Purpose

Define the CVF-native interpretation of thirteen selected normative MCP
`2026-07-28` invariants. The profile gives local contract and test owners a
stable fail-closed vocabulary without importing an upstream implementation or
claiming MCP interoperability.

## Scope / Applies-To

Applies to local request-profile validation, design review, negative
conformance tests, and later source-verified MCP work orders. The implementation
owner is `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mcp.protocol.invariant.profile.ts`.

It does not implement a client, server, transport, tool, package adapter,
network listener, authorization server, cache, subscription stream, or MRTR
runtime.

## Source / Owner Boundary

Protocol facts come from the official MCP repository pinned by MCP-KAR-T0 at
tag commit `5f5440bb26a62e2cf3440b92da5a667efa03b267`. CVF interpretation and
admission semantics remain owned by this reference folder, execution-plane
contracts, work orders, approval gates, and evidence controls.

Discovery responses, capability advertisements, TTL values, cache scopes, and
request-state fields are evidence or protocol metadata. None of them grants CVF
authorization, approval, identity, or execution authority.

## Protocol Contract / Normative Mapping

| Rule ID | Pinned upstream source | CVF invariant | Failure decision |
| --- | --- | --- | --- |
| `MCP-PR-001` | `docs/specification/2026-07-28/basic/index.mdx`, `_meta` | modern requests carry protocol version and client capabilities per request | `INVALID_PARAMS`, JSON-RPC `-32602` |
| `MCP-PR-002` | `docs/specification/2026-07-28/basic/versioning.mdx`, Protocol Version Negotiation | requested version must be locally supported | `UNSUPPORTED_PROTOCOL_VERSION`, JSON-RPC `-32022` |
| `MCP-PR-003` | `docs/specification/2026-07-28/basic/index.mdx`, per-request fields | processing cannot rely on an undeclared required client capability | `MISSING_REQUIRED_CLIENT_CAPABILITY`, JSON-RPC `-32021` |
| `MCP-PR-004` | `docs/specification/2026-07-28/basic/versioning.mdx`, Extension Negotiation | an extension identifier is usable only when negotiated | `EXTENSION_NOT_NEGOTIATED` |
| `MCP-PR-005` | `docs/specification/2026-07-28/server/discover.mdx`, DiscoverResult note | self-reported discovery metadata cannot decide identity or authorization | `UNTRUSTED_DISCOVERY_EVIDENCE` |
| `MCP-PR-006` | `docs/specification/2026-07-28/basic/patterns/subscriptions.mdx`, Acknowledgment and Receiving Notifications | acknowledgment precedes events and event IDs correlate to the listen request | `SUBSCRIPTION_PROTOCOL_VIOLATION` |
| `MCP-PR-007` | `docs/specification/2026-07-28/basic/patterns/mrtr.mdx`, InputRequiredResult | `input_required` is incomplete continuation, not approval or completion | `INPUT_REQUIRED_CONTINUATION_VIOLATION` |
| `MCP-PR-008` | `docs/specification/2026-07-28/server/utilities/caching.mdx`, Cacheable Model and Security Considerations | TTL/scope governs freshness and reuse only; public scope cannot expose user-specific data | `UNSAFE_CACHE_HINT` |
| `MCP-PR-009` | `docs/specification/2026-07-28/basic/authorization/index.mdx`, Resource Parameter and Token Handling | a token must target the intended MCP server audience | `TOKEN_AUDIENCE_MISMATCH` |
| `MCP-PR-010` | `docs/specification/2026-07-28/basic/transports/streamable-http.mdx`, Header Validation | mirrored HTTP header and request-body values must agree | `HEADER_MISMATCH`, JSON-RPC `-32020` |
| `MCP-PR-011` | `docs/specification/2026-07-28/client/elicitation.mdx`, Form Mode and Security Considerations | form-mode elicitation rejects password, API-key, access-token, and payment-credential categories; unknown or malformed category metadata fails closed; URL mode may carry known sensitive categories outside the form surface | `UNSAFE_ELICITATION_REQUEST` |
| `MCP-PR-012` | `docs/specification/2026-07-28/client/roots.mdx`, overview and Security Considerations | deprecated roots are caller-validated informational hints only; malformed or non-file root evidence and any authorization, containment, confinement, or filesystem-authority claim fail closed | `ROOTS_HINT_AUTHORITY_VIOLATION` |
| `MCP-PR-013` | `docs/specification/2026-07-28/client/sampling.mdx`, Tools in Sampling and Tool Use and Result Balance | deprecated tool-enabled sampling requires declared `sampling.tools`; unique tool-use IDs correlate exactly once to the immediately following results-only user message | `SAMPLING_SEQUENCE_VIOLATION` |

All source paths in the table are relative to the pinned source mirror root:
`.private_reference/source_mirrors/modelcontextprotocol__modelcontextprotocol/`.

## Requirements

- Evaluations are deterministic, local, and side-effect free.
- Missing required metadata fails closed before capability-dependent behavior.
- Exact MCP JSON-RPC error codes are emitted only where the pinned source
  defines them; CVF-only decisions use named local decision codes.
- Multiple violated invariants may be returned together; acceptance requires
  zero violations.
- Elicitation admission receives only a closed requested-data category
  vocabulary: `password`, `api-key`, `access-token`, `payment-credential`,
  `contact`, and `profile`. It receives no requested value, credential,
  payload, storage handle, or logging field.
- Form mode rejects the four sensitive categories and fails closed for empty,
  unknown, non-string, or otherwise malformed category metadata. URL mode
  accepts known sensitive categories because collection occurs outside the
  form surface. Ordinary `contact` and `profile` form categories remain valid.
- Roots admission receives only structural evidence: whether roots were
  presented, the closed URI-scheme classification `file`, caller-owned consent
  and path-validation confirmations, and the closed authority-claim vocabulary
  `hints-only`, `authorization`, `containment`, `confinement`, and
  `filesystem-authority`. It receives no path or URI value and performs no
  discovery, enumeration, normalization, resolution, opening, access, or
  containment operation. Only complete `hints-only` evidence passes.
- Sampling admission receives only capability names, message roles, structural
  content kinds, bounded correlation IDs, and an optional precomputed
  `MCPBusinessApprovalDecision`. It receives no prompt, tool input/result
  payload, model name, provider handle, transport, or execution callback.
  Tool-less sampling is accepted. Tool use requires `sampling.tools`, unique
  IDs, and exactly one matching result per use in the adjacent user message;
  that message may contain only tool results. Unknown, duplicate, missing,
  mismatched, mixed-content, malformed, and intervening cases fail closed.
- A supplied `existingApprovalDisposition` remains an immutable structural
  disposition owned by `MCPBusinessAdapterContract`; this profile neither
  derives nor changes it, and profile acceptance is not approval authority.
- The profile never converts discovery, cache, MRTR, or protocol metadata into
  approval or authorization.

## Verification

The focused test owner is
`EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/tests/mcp.protocol.invariant.profile.test.ts`.
It includes one accepted composite profile and negative cases for missing
metadata, unsupported version/capability, unnegotiated extension, untrusted
discovery use, subscription ordering/correlation, MRTR terminal misreading,
unsafe caching, audience mismatch, and HTTP header/body mismatch.
It also covers all four sensitive form categories, malformed and unknown form
metadata, sensitive URL-mode categories, ordinary contact/profile form
categories, roots hints and authority/malformed cases, sampling capability,
correlation, adjacency, results-only and malformed cases, and accepted
composite profiles with absent or complete legacy evidence.

Passing these tests proves only the local contract decisions. It does not prove
wire compatibility, transport behavior, security deployment, or conformance of
an external MCP implementation.

## Related Artifacts

- `docs/reference/mcp_gateway/README.md`
- `docs/reference/mcp_gateway/CVF_MODEL_GATEWAY_MCP_RUNTIME_BRIDGE_BOUNDARY.md`
- `docs/audits/CVF_MCP_KAR_T0_ABSORPTION_AUDIT_2026-08-23.md`
- `docs/work_orders/CVF_AGENT_WORK_ORDER_MCP_KAR_T1_2026_07_28_NORMATIVE_INVARIANT_PROFILE_2026-08-23.md`

## Claim Boundary

This profile is a private, local reference and deterministic decision contract.
It does not execute or intercept MCP traffic, validate a live peer, inspect or
act on a filesystem path, invoke a model or tool, run a sampling loop, derive
approval, activate a package, grant authority, call a provider, publish a
public artifact, deploy, or establish production readiness.
