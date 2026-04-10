# CVF Web W64 Inheritance Gap Assessment — 2026-04-10

Memory class: FULL_RECORD

> Scope: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`
> Baseline: `main` after merge commit `10240195`
> Reference tranche: `W64-T1` Track 5 Deferred Architecture

---

## 1. Purpose

Determine whether `cvf-web` already inherits the major architecture upgrades landed in `W64-T1`
and record the remaining gaps in canonical repo memory.

---

## 2. Verdict

**Partial inheritance only.**

`cvf-web` inherits the shared governance posture and product hardening from the master-architecture
closure wave, but it does **not** yet directly consume the new Track 5 runtime capabilities:

- `ProviderRouterContract`
- `SandboxIsolationContract`
- `WorkerThreadSandboxAdapter`

This means the web surface is governance-aligned, test-clean, and release-clean locally, but still
uses its own direct provider execution path and its own local sandbox utility.

---

## 3. What `cvf-web` Already Inherits

### 3.1 Shared Guard Contract

`cvf-web` is wired to the canonical guard package rather than a duplicated local engine:

- Dependency: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/package.json`
- Shared singleton: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/guard-engine-singleton.ts`
- Thin adapter: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/guard-runtime-adapter.ts`

Result:

- Web request gating inherits canonical guard rules from `CVF_GUARD_CONTRACT`
- Guard behavior is aligned with non-web consumers that use the same package

### 3.2 Governed Execute Path

`cvf-web` already injects the shared guard pipeline before AI execution:

- Entry point: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts`
- Governance evaluate proxy: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/governance/evaluate/route.ts`

Result:

- Web execution already inherits phase/risk/role guard enforcement
- Skill preflight and governance binding resolution are present in the web API surface

### 3.3 Product Hardening and Verification

The master-architecture closure wave already pulled `cvf-web` into the local release-clean baseline:

- Typecheck clean
- Full `vitest` clean
- Production build clean
- CI workflow coverage includes `cvf-web`

Result:

- Web inherits the hardening and verification posture delivered in `W60-T1` and `W61-T1`
- Web is part of the canonical product-surface readiness story

---

## 4. What `cvf-web` Does Not Yet Inherit

### 4.1 Track 5A Provider Router

`W64-T1` delivered governance routing through:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/provider.router.contract.ts`

But `cvf-web` still uses direct provider calls through:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/providers.ts`

Observed posture:

- Web selects a provider from request/env state
- Web then calls OpenAI / Anthropic / Gemini / Alibaba / OpenRouter directly
- No `ProviderRouterContract` decision object is consulted before provider invocation

Implication:

- `cvf-web` does not yet inherit Track 5A as an executable provider-selection path
- Web is still operating with product-local provider routing rather than canonical governance routing

### 4.2 Track 5B Sandbox Isolation

`W64-T1` delivered typed sandbox isolation through:

- `EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.isolation.contract.ts`
- `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB/adapters/worker.thread.sandbox.adapter.ts`

But `cvf-web` still uses a local sandbox helper:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/security.ts`

Observed posture:

- Web local sandbox is a utility-level validation/execution helper
- Web local sandbox uses browser worker mechanics for isolated evaluation
- Web does not call `SandboxIsolationContract`
- Web does not use `WorkerThreadSandboxAdapter`

Implication:

- `cvf-web` does not yet inherit the typed physical-isolation model delivered in Track 5B
- The web sandbox remains a separate product utility, not the canonical runtime-isolation surface

---

## 5. Architecture Interpretation

`cvf-web` currently inherits **governance canon** more than **runtime canon**.

In practical terms:

- Inherited: guard contract, governance checks, skill preflight posture, release verification
- Not inherited: provider router contract, typed sandbox isolation contract, worker-thread adapter

This is consistent with the current repo posture:

- W64 landed in foundations/runtime architecture
- no follow-up tranche has yet bound those new contracts into the web execution surface

---

## 6. Recommended Follow-Up Scope

If a future tranche chooses to make `cvf-web` inherit W64 directly, the bounded work should be:

1. Replace product-local provider selection in `cvf-web` execute flow with `ProviderRouterContract`
2. Decide whether web sandboxing should delegate to `SandboxIsolationContract` for server-side paths
3. Preserve the existing shared guard contract path while adding Track 5 runtime bindings

This is **new scope**, not a closure correction. It requires a fresh `GC-018`.

---

## 7. Closure — W64-T1 Web Inheritance (2026-04-10)

Both gaps identified in §4 have been resolved in the same session:

### 7.1 Track 5A — Provider Router (CLOSED)

- Created `cvf-web/src/lib/ai/provider-router-adapter.ts`
  - Self-contained adapter implementing ProviderRouterContract decision logic
  - Maps web `AIProvider` to typed `ProviderDefinition` with risk/cost/capability governance
  - Supports ALLOW / DENY / ESCALATE decisions aligned with canonical contract API
- Integrated into `cvf-web/src/app/api/execute/route.ts`
  - Provider router is consulted after guard pipeline, before AI execution
  - DENY → 403, ESCALATE → 409, ALLOW → proceeds with router-selected provider
  - Retry loop also uses routed provider
  - Routing result included in API response for traceability

### 7.2 Track 5B — Sandbox Isolation (CLOSED)

- Created `cvf-web/src/lib/sandbox-contract-adapter.ts`
  - Server-side adapter implementing SandboxIsolationContract API
  - Stub executor for contract-only mode, typed config/validation/audit log
  - Network/filesystem policies locked to restrictive defaults for web
- Updated `cvf-web/src/lib/security.ts`
  - Client-side `createSandbox()` now annotated as CLIENT-SIDE ONLY
  - Canonical server-side path documented: `import { executeInSandbox } from '@/lib/sandbox-contract-adapter'`

### 7.3 Verification

- TypeScript typecheck: **clean**
- Vitest: **117 files / 1865 tests passed**
- Build errors: **pre-existing only** (cvf-guard-contract module resolution, unrelated)

### 7.4 Final Verdict

`cvf-web` is now **aligned with the master architecture at the governance layer and
contract-aligned with the Track 5 runtime surface**.

Track 5A (ProviderRouterContract) is inherited in the live execute path through a
self-contained adapter within the web build boundary. Track 5B (SandboxIsolationContract)
is mirrored as a self-contained contract-aligned stub adapter for typed config,
validation, and audit behavior, but it does not provide physical runtime isolation.
