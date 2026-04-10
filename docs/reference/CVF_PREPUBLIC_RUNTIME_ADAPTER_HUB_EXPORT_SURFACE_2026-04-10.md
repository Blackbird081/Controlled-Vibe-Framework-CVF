# CVF Pre-Public Export Surface — Runtime Adapter Hub

Memory class: POINTER_RECORD

> Package: `cvf-runtime-adapter-hub` v0.1.0
> Directory: `EXTENSIONS/CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
> exportReadiness: `CANDIDATE` (Phase B)
> Date: 2026-04-10

---

## Export Map (`package.json` exports field)

| Export key | Entry point | Description |
|------------|-------------|-------------|
| `"."` | `./index.ts` | Default barrel — re-exports contracts + adapters |
| `"./contracts"` | `./contracts/index.ts` | All adapter interface contracts |
| `"./adapters"` | `./adapters/index.ts` | All adapter implementations |
| `"./policy"` | `./policy/natural.policy.parser.ts` | Natural language policy parser |
| `"./explainability"` | `./explainability/explainability.layer.ts` | Explainability layer |
| `"./risk-models/risk-matrix"` | `./risk_models/risk.matrix.json` | Risk matrix data |
| `"./risk-models/destructive-rules"` | `./risk_models/destructive.rules.json` | Destructive operation rules |
| `"./risk-models/external-comm-rules"` | `./risk_models/external.comm.rules.json` | External communication rules |
| `"./risk-models/escalation-thresholds"` | `./risk_models/escalation.thresholds.json` | Escalation thresholds data |

---

## Primary Public Contracts

**`./contracts`** (`contracts/index.ts`) exports:
- `LLMAdapterInterface` — LLM model adapter contract
- `MemoryAdapterInterface` — Memory/persistence adapter contract
- `RuntimeAdapterInterface` — Generic runtime adapter contract
- `ToolAdapterInterface` — Tool invocation adapter contract
- `PolicyContract` — Policy evaluation contract

**`./adapters`** (`adapters/index.ts`) exports:
- `OpenClawAdapter` — OpenClaw LLM adapter
- `PicoClawAdapter` — PicoClaw LLM adapter
- `ZeroClawAdapter` — ZeroClaw LLM adapter
- `NanoAdapter` — Nano runtime adapter
- `ReleaseEvidenceAdapter` — Release evidence adapter
- `WorkerThreadSandboxAdapter` — Node.js worker_threads sandbox executor
- `executeFilesystemAction`, `executeHttpAction` — Base adapter helpers

---

## Publication Boundary

**Included in `npm pack`** (via `files` field):
- `README.md`
- `index.ts`
- `contracts/`
- `adapters/`
- `policy/natural.policy.parser.ts`
- `explainability/explainability.layer.ts`
- `risk_models/*.json` (4 risk model files)

**Not included** (excluded from pack):
- `tests/`
- `node_modules/`
- `dist/`
- `tsconfig.json`

---

## Typecheck Status

`npm run check` (typecheck + vitest): **PASS** — 71 tests, 0 failures (verified 2026-04-10)

`WorkerThreadSandboxAdapter` uses locally-mirrored sandbox types (`adapters/sandbox.types.ts`) to avoid cross-package `rootDir` breach (TS6059 resolved).

---

*Surface document date: 2026-04-10*
*Status: CANDIDATE — not yet published*
