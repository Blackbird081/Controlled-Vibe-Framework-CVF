# CVF Qwen3 Hosted Proof Prerequisites

Memory class: POINTER_RECORD

docType: reference

Date: 2026-05-23

Status: VERIFIED — derived from D3→D10 blocker chain (8 tranches)

---

## Scope / Applies To

Applies to:

- any hosted proof call targeting Alibaba DashScope Qwen3 models via
  `https://vibcode.netlify.app/api/execute`;
- any new Qwen3 model addition to `PROVIDER_CAPABILITY_REGISTRY` under
  `providerId: "alibaba"`;
- any agent or operator preparing a Qwen3 hosted proof tranche under CVF
  governance.

Does not apply to:

- DeepSeek or OpenAI provider calls (different adapter paths);
- local `/api/execute` calls (no Skill Preflight or aiCommit gate);
- streaming Qwen3 calls (separate adapter path, not covered here).

---

## Scope / Target / Owner Boundary

Target surfaces:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/providers.ts`
  — `executeAlibaba`, `isQwen3Model`, `isQwen3ThinkingModel`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/provider-router-adapter.ts`
  — `WEB_PROVIDER_DEFINITIONS.alibaba.maxRiskLevel`
- `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts`
- `EXTENSIONS/CVF_MODEL_GATEWAY/src/providers/alibaba/capability.json`
- hosted endpoint: `https://vibcode.netlify.app/api/execute`

Owner boundary:

- read-only reference; no source changes in this document;
- any change to the above surfaces requires a fresh GC-018 and work order.

---

## Purpose

This document distills every prerequisite discovered during the D3→D10
Qwen3 hosted proof chain (2026-05-23) into a single pre-flight checklist.

Any future hosted proof targeting Alibaba DashScope Qwen3 models via
`https://vibcode.netlify.app/api/execute` must verify all items before
the first proof call. Skipping any one item reproduces a known blocker.

---

## Prerequisite Checklist

### P1 — Provider adapter: `enable_thinking` parameter

**Rule:** All non-streaming Qwen3 calls must include `enable_thinking` in
the request body. The value depends on model family:

| Model pattern | `enable_thinking` value | Helper |
| --- | --- | --- |
| `^qwen3-.*thinking` | `true` | `isQwen3ThinkingModel()` |
| `^qwen3-` (non-thinking) | `false` | `isQwen3Model()` |
| anything else | omit | — |

**Source file:**
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/providers.ts`
(functions `isQwen3Model`, `isQwen3ThinkingModel`, spread in `executeAlibaba`)

**Public commit:** `811e59f6`

**Discovery tranche:** D3 (missing entirely), D8 (direction wrong: `false`
on thinking model → blocked), D9 (fix confirmed; D9 blocked for unrelated reason)

---

### P2 — Model ID: use versioned suffix

**Rule:** The Qwen3 thinking model ID on DashScope international is
`qwen3-235b-a22b-thinking-2507`, not `qwen3-235b-a22b-thinking`.

| Model | Correct ID | Wrong ID |
| --- | --- | --- |
| Qwen3 235B thinking | `qwen3-235b-a22b-thinking-2507` | `qwen3-235b-a22b-thinking` |
| Qwen3 32B | `qwen3-32b` | — (no suffix needed) |

**Source file:**
`EXTENSIONS/CVF_MODEL_GATEWAY/src/providers/alibaba/capability.json`
`EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts`

**Discovery tranche:** D6 (model unavailable error with unversioned ID)

---

### P3 — Payload: use `cvfRiskLevel=R1`

**Rule:** The Alibaba provider in the CVF web provider router is capped at
`maxRiskLevel=R1`. Payloads with `cvfRiskLevel=R2` are denied with HTTP 403
before provider dispatch.

**Source file:**
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/provider-router-adapter.ts`
— `WEB_PROVIDER_DEFINITIONS.alibaba.maxRiskLevel = 'R1'`

**Implication for payload design:**
- Use `cvfRiskLevel: "R1"` in the request body.
- A `strategy_analysis` workflow at R2 is router-denied.
- To use R2, the router entry for Alibaba must be updated first (requires
  a separate GC-018; do not change without authorization).

**Discovery tranche:** D9 (HTTP 403, `No provider matches policy constraints`)

---

### P4 — Payload: declare Skill Preflight

**Rule:** The hosted `/api/execute` route requires `skillPreflightDeclaration`
in the payload for governed execution. Omitting it returns an error:
`Skill Preflight declaration is required before Build/Execute actions`.

**Required field:**
```json
{
  "skillPreflightDeclaration": "SKILL PREFLIGHT PASS — <model> — <date>"
}
```

**Discovery tranche:** D7 (HTTP 400, skill preflight gate blocked)

---

### P5 — Payload: include `aiCommit` metadata

**Rule:** After adding Skill Preflight, the route also requires `aiCommit`
metadata for governed proof calls. Omitting it causes a guard adjustment error.

**Required field:**
```json
{
  "aiCommit": {
    "commitMessage": "<descriptive message>",
    "scope": "proof"
  }
}
```

**Discovery tranche:** D8 (blocked at aiCommit guard after skill preflight added)

---

### P6 — Payload: safety filter avoidance

**Rule:** Some `strategy_analysis` payloads trigger the DashScope safety filter,
returning HTTP 400 with `success=false` and provider error `Safety filter triggered`.

**Known safe payload class:** Use a concrete, neutral business domain topic.
Avoid adversarial, policy-sensitive, or politically charged content.

The payload that passed P3 (receipt `rcpt-env-mpi55je6-hiddxq`) and D10
(receipt `rcpt-env-mpigxtmn-pml5ky`) used a product strategy framing.

**Discovery tranche:** D4 (safety filter on first R2 payload attempt)

---

### P7 — Model registry: both models must be in PROVIDER_CAPABILITY_REGISTRY

**Rule:** Before running hosted proof, both target models must be registered
under `alibaba` in `PROVIDER_CAPABILITY_REGISTRY`.

Current registry state (as of D3):
- `qwen3-32b`: `supportedMethods: ["complete", "chat"]`, `defaultMethod: "complete"`
- `qwen3-235b-a22b-thinking`: `supportedMethods: ["complete", "chat", "reasoning"]`, `defaultMethod: "complete"`

**Source files:**
- `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts`
- `EXTENSIONS/CVF_MODEL_GATEWAY/src/providers/alibaba/capability.json`

**Discovery tranche:** D3 (registry added as part of tranche scope)

---

## Proof Call Template

Minimal JSON body that satisfies all prerequisites for a Qwen3 hosted proof:

```json
{
  "workflowType": "strategy_analysis",
  "cvfRiskLevel": "R1",
  "provider": "alibaba",
  "model": "<model-id>",
  "skillPreflightDeclaration": "SKILL PREFLIGHT PASS — <model-id> — YYYY-MM-DD",
  "aiCommit": {
    "commitMessage": "hosted proof: <model-id> strategy_analysis R1",
    "scope": "proof"
  },
  "topic": "<neutral business topic>",
  "context": "<concrete context>",
  "options": ["<option A>", "<option B>"],
  "constraints": ["<constraint>"],
  "priority": "value"
}
```

Replace `<model-id>` with:
- `qwen3-32b` — no `enable_thinking` header needed (adapter handles it)
- `qwen3-235b-a22b-thinking-2507` — no `enable_thinking` header needed (adapter handles it)

The adapter in `providers.ts` injects the correct `enable_thinking` value
automatically based on model ID pattern matching.

---

## Pass/Fail Matrix (inherited from P3)

| Criterion | Required value |
| --- | --- |
| HTTP status | `200` |
| `success` | `true` |
| `decision` | `ALLOW` |
| `routingDecision` | `ALLOW` |
| `evidenceMode` | `live` |
| `provider` | `alibaba` |
| `model` | matches requested model |
| Receipt id | present (non-empty) |
| Trace id | present (non-empty) |
| Raw secret printed | `false` |

---

## Adding a New Qwen3 Model — Quick Steps

1. **Check model ID** — verify the exact versioned ID on DashScope international
   (`dashscope-intl.aliyuncs.com`). Append `-YYMM` suffix if required (e.g., `-2507`).

2. **Update registry** — add entry to `PROVIDER_CAPABILITY_REGISTRY` under
   `alibaba` and update `capability.json`.

3. **Classify model type** — does the model name contain `thinking`?
   - Yes → adapter sends `enable_thinking=true` automatically via `isQwen3ThinkingModel`
   - No → adapter sends `enable_thinking=false` automatically via `isQwen3Model`
   No code change needed if the pattern matches.

4. **Verify router risk** — confirm `cvfRiskLevel=R1` is sufficient for the
   model. If the model requires R2 routing, update
   `WEB_PROVIDER_DEFINITIONS.alibaba.maxRiskLevel` under a fresh GC-018.

5. **Run focused tests** — `npm run test:run -- src/lib/ai/providers.test.ts`
   in `cvf-web` and registry tests in `CVF_MODEL_GATEWAY`.

6. **Use proof call template** above with the new model ID.

7. **Authorize via GC-018** before any hosted proof call.

---

## Known Boundaries

- Alibaba provider router: `maxRiskLevel=R1` (source: `provider-router-adapter.ts`)
- `qwen3-32b`: PASS at D5, receipt `rcpt-env-mpidzqv4-ysriei`
- `qwen3-235b-a22b-thinking-2507`: PASS at D10, receipt `rcpt-env-mpigxtmn-pml5ky`
- These receipts are free-tier bounded (expiry 2026-06-02); do not claim
  paid-tier, rate-limit, or production equivalence.

---

## Claim Boundary

This document claims only what was directly observed in the D3→D10 tranche
chain on 2026-05-23 against free-tier Alibaba DashScope quota.

Claims:

- prerequisites P1–P7 are each verified by at least one blocker/pass event;
- `qwen3-32b` passes the P3 pass/fail matrix under these prerequisites;
- `qwen3-235b-a22b-thinking-2507` passes the P3 pass/fail matrix under
  these prerequisites at `cvfRiskLevel=R1`.

Does not claim:

- broad Qwen3 model stability or production readiness;
- Alibaba R2 routing capability (router currently capped at R1);
- repeatability beyond free-tier quota (expires 2026-06-02);
- paid-tier, rate-limit, or production-load equivalence;
- that other Qwen3 model IDs (not listed) will pass without verification.

Verification:

- prerequisites verified by running the D3→D10 tranche chain;
- any new model must be verified independently against this checklist;
- router `maxRiskLevel` must be re-verified if `provider-router-adapter.ts`
  is updated.

---

## Evidence Chain

| Tranche | Blocker / Result | Key learning |
| --- | --- | --- |
| D3 | `enable_thinking` missing | DashScope requires param for all Qwen3 non-streaming |
| D4 | Safety filter triggered | R2 payload with sensitive framing → provider rejects |
| D5 | `qwen3-32b` PASS; `qwen3-235b-a22b-thinking` model not found | Model ID needs `-2507` suffix |
| D6 | Skill Preflight required | Route gate requires declaration before execution |
| D7 | aiCommit guard blocked | Route gate requires aiCommit metadata |
| D8 | `enable_thinking` wrong direction | Thinking models need `true`, not `false` |
| D9 | Router `R2` denied | Alibaba capped at `R1` in provider router |
| D10 | PASS | All prerequisites satisfied with `R1` payload |
