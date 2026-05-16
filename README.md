# Controlled Vibe Framework (CVF)

> **Developed by Tien / Blackbird081**
>
> **Controlled vibe coding. Not faster, but safer and more governable.**

[![License](https://img.shields.io/badge/license-CC%20BY--NC--ND%204.0-blue.svg)](LICENSE)
[![Release Gate](https://img.shields.io/badge/release%20gate-7%2F7%20PASS-brightgreen.svg)](docs/evidence/latest-release-gate.md)
[![Provider Proof](https://img.shields.io/badge/provider%20proof-3%20live%20lanes%206%2F6-brightgreen.svg)](docs/evidence/provider-lanes.md)
[![Public Surface](https://img.shields.io/badge/public%20surface-scanned-blue.svg)](governance/public-surface-manifest.json)
[![Architecture](https://img.shields.io/badge/architecture-diagram%20first-blue.svg)](ARCHITECTURE.md)

## Quick Navigation

<table>
  <tr>
    <td align="center"><a href="#core-value"><strong>Core Value</strong></a></td>
    <td align="center"><a href="#try-the-web-interface"><strong>Web UI</strong></a></td>
    <td align="center"><a href="#architecture-at-a-glance"><strong>Overview</strong></a></td>
    <td align="center"><a href="#who-cvf-is-for"><strong>Audience</strong></a></td>
    <td align="center"><a href="#quick-start"><strong>Start Here</strong></a></td>
    <td align="center"><a href="ARCHITECTURE.md"><strong>Architecture</strong></a></td>
    <td align="center"><a href="#provider-boundary"><strong>Providers</strong></a></td>
    <td align="center"><a href="#governance-boundary"><strong>Governance</strong></a></td>
    <td align="center"><a href="#public-evidence"><strong>Evidence</strong></a></td>
  </tr>
</table>

CVF is a local-first governance control plane for AI and agent execution. It
sits between a user request and any provider, agent, tool, or workflow, then
enforces risk, approval, DLP, provider routing, output validation, audit
receipts, and cost/quota signals before returning governed output.

In this repository, "control plane" means an AI governance gateway: the policy,
routing, approval, validation, receipt, and cost-signal layer around execution.
It is not a claim of Kubernetes-style infrastructure control-plane parity.

CVF solves three problems in AI-assisted development: uncontrolled provider
costs, ungoverned agent execution, and lack of verifiable audit trails. Without
CVF, agents can call providers without budget enforcement, leak or repeat
sensitive content in outputs, and leave weak evidence of what ran.

## Purpose

Help a new evaluator understand what CVF is, how to run the smallest useful
local path, what evidence currently supports public claims, and what CVF does
not claim.

## Core Value

CVF gives people a safer way to use AI for real work. Before an AI result is
treated as ready to review, CVF checks the request, keeps the provider choice
visible, records what happened, watches for unsafe output, and gives the user a
receipt they can keep or hand off.

When CVF absorbs new approved knowledge, the goal is not to hide more machinery
behind the scenes. The goal is to make the web experience more useful for
non-coders: clearer starting points, better review packets, visible receipts,
and fewer hidden assumptions when work moves from an AI response to a real
decision.

## Try the Web Interface

CVF includes a dedicated web-facing platform for operators and non-coders to
manage governed AI workflows without touching a line of code.

**Access the live platform:** [vibcode.netlify.app/home](https://vibcode.netlify.app/home)

What you can do on the Web UI:

- **Interactive dashboard:** view AI execution history, provider choices, cost
  signals, and token behavior.
- **Visual audit trail:** inspect receipts and review states for AI-assisted
  work.
- **No-code configuration:** adjust provider and policy settings through the
  interface instead of editing source files.

## Web Workflows

Three governed end-user workflows are available without writing code:

| Workflow | Route | What it does |
| --- | --- | --- |
| Knowledge Intake | `/knowledge/intake` | Submit new notes, policies, or product facts as a governed knowledge packet with a visible source, audience, and review boundary. |
| Artifact Export | `/artifacts` | Export any CVF document as a self-contained HTML review packet. When the governance engine is configured, the export includes a live governance receipt (`decision: ALLOW`, risk level, timestamp). |
| Work Transfer | `/work-transfer` | Review the audit history of recorded actions and export individual records as governed HTML artifacts for handover or review. |

All three routes are reachable from the sidebar and from the home
screen after login.

## Scope

This README is the public orientation layer for the current clean public repo.
It points to architecture, governance, provider, cost, evidence, provenance, and
guide documents. It is not the full internal development journal.

## Claim Boundary

Allowed public claim: CVF is a local-first governance control plane for AI and
agent execution with current live evidence for bounded governance behavior.
Not allowed: CVF has output-quality parity with direct providers, all providers
are equivalent, or mock UI tests prove governance behavior.

## Attribution

CVF is owned and governed by **Tien / Blackbird081**. Claude and Codex are
acknowledged AI collaboration contributors for design, implementation,
repository maintenance, governance checks, and verification support. See
[CONTRIBUTORS.md](CONTRIBUTORS.md).

## Source

CVF is a documentation-and-runtime repository owned by Tien / Blackbird081.
Public source of truth is this repository; provenance history is preserved
in a separate provenance repository accessible to partners on request.

## Requirements

To evaluate CVF locally, an operator needs:

- Git and Node.js (for the Next.js control surface);
- a DashScope-compatible (or other listed-provider) API key supplied via
  environment variable when live governance proof is required;
- familiarity with the documents pointed at by [Quick Navigation](#quick-navigation).

## Enforcement

- Provider boundary: every governed request runs through the policy,
  validation, and receipt path documented in [GOVERNANCE.md](GOVERNANCE.md).
- Public claim boundary: every public quality or governance claim must cite
  a curated evidence file under [docs/evidence/](docs/evidence/).
- Release gate: the local release-gate bundle described in
  [docs/evidence/latest-release-gate.md](docs/evidence/latest-release-gate.md)
  is the authoritative governed-operability proof.

## Related Artifacts

- [ARCHITECTURE.md](ARCHITECTURE.md) — technical evaluation surface
- [GOVERNANCE.md](GOVERNANCE.md) — governance boundary
- [PROVIDERS.md](PROVIDERS.md) — provider expectations
- [COST_AND_QUOTA.md](COST_AND_QUOTA.md) — cost and quota posture
- [PROVENANCE.md](PROVENANCE.md) — provenance split
- [docs/evidence/](docs/evidence/) — curated public evidence

## Current Live-Proof Boundary

> Current live proof: Alibaba/DashScope is the primary certified release lane
> with a `7/7` release-gate PASS. Alibaba, DeepSeek, and OpenAI have current
> named-model governed live canary receipts at `6/6` PASS. These are
> governed-path operability proofs, not QBS quality benchmark scores.
>
> Current quality status: CVF is a governance-first local deployment baseline.
> Non-coder deliverable contracts have been hardened, but EVT-4 output-quality
> parity is not proven. See
> `docs/evidence/current-cvf-quality-status.md`.
>
> Fresh local-first release gate: `7/7` PASS on 2026-05-16 with live governance
> E2E. See `docs/evidence/local-first-release-gate-proof-2026-05-16.md`.
>
> CVF 16.5 knowledge absorption is now public as bounded product evidence for
> provider choice, memory handling, knowledge intake, reviewable artifacts,
> change packets, and skill improvement boundaries. See
> `docs/evidence/cvf-16-5-runtime-absorption.md`. This is local evidence, not a
> new live-provider proof or output-quality parity claim.

## Who CVF Is For

CVF is for builders, operators, and small teams who want a governed baseline for
AI-assisted work without spending months wiring their own rules, provider
checks, approval points, output validation, and audit receipts from scratch.

It is a good fit when you need:

- AI or agent execution to pass through explicit risk and policy gates
- local-first control over provider keys, cost, quota, and evidence
- a repeatable path for non-coder or operator-facing governed requests
- a control layer that can sit around providers, tools, or agents
- reviewable memory, knowledge intake, tool use, delegation, and change packets

For non-coders, the practical value is simpler: CVF helps turn AI output into a
reviewable work packet. The user should be able to see what was asked, what was
checked, what evidence exists, what still needs judgment, and what can be
handed to the next person without guessing.

## Who CVF Is Not For

CVF is not a one-size-fits-all AI framework.

You may not need CVF if you already have a stable Claude Code, Codex, Cursor, or
custom agent setup with reliable hooks, policies, skills, cost controls, and
evidence capture. CVF is also not a hosted SaaS product, an autonomous AGI
system, a no-config consumer app, or a replacement for your existing CI/CD.

The goal is not to use CVF for its own sake. The goal is to build, ship,
operate, and review AI-assisted work with clearer boundaries.

## Minimum Useful CVF

The smallest useful slice is:

```text
request -> risk check -> governed provider call -> validation -> audit receipt
```

In practice:

- in 30 minutes, run the web app and inspect the governed request path
- in 1 day, add an operator-supplied provider key and run the live release gate
- in 1 week, connect a real workflow and decide which actions require approval

For a practical walkthrough and common failure boundaries, see
`docs/guides/minimum-useful-cvf.md`.

## Architecture At A Glance

```mermaid
flowchart LR
  subgraph Entry["Entry Surfaces"]
    User["Non-coder UI"]
    Dev["SDK / CLI"]
    Agent["Plugin / Agent"]
  end

  subgraph Govern["Governance Control Plane"]
    Guard["Guard Contract<br/>phase / role / risk / scope"]
    Control["Control Plane<br/>intake / context / routing"]
    Runtime["Execution Plane<br/>policy gate / job state"]
  end

  subgraph Boundary["Approved Execution Boundary"]
    Adapter["Provider or Tool Adapter"]
    Provider["Live Provider / Agent / Tool"]
  end

  subgraph Evidence["Evidence + Continuation"]
    Review["DLP / validation / bypass checks"]
    Receipt["Audit receipt + cost signal"]
    Learning["Learning signal<br/>feedback / drift / reinjection"]
  end

  User --> Guard
  Dev --> Guard
  Agent --> Guard
  Guard --> Control --> Runtime --> Adapter --> Provider
  Provider --> Review --> Receipt --> Learning
  Learning -. governed feedback .-> Control
```

CVF should be understood as a governed control plane: entry surfaces submit
intent, guard/control/runtime layers decide what may run, approved execution
stays outside the governance boundary, and evidence closes the loop. See
[ARCHITECTURE.md](ARCHITECTURE.md) for the full module map, dependency rules,
active reference path, and interaction model.

## Current Public Surface

This renewed repository contains the current product surface:

- foundation packages for guard, control, execution, governance expansion, and learning planes
- CVF 16.5 knowledge absorption surfaces that make provider choice, memory,
  knowledge intake, review packets, change handoff, and skill improvement more
  explicit and easier to inspect
- the `cvf-web` control surface used by operators and non-coders
- release-gate scripts and protected live-gate workflow
- curated evidence summaries and provider boundaries
- public-surface guardrails that keep internal provenance material out of this repo

The full development history is preserved separately in the provenance archive.
See `PROVENANCE.md`.

## Technical Footprint

The public repository is intentionally slimmed for external use, so its GitHub
language mix is different from the private provenance archive. Current public
surface by GitHub Linguist byte count:

| Language | Public role | Current share |
|---|---|---:|
| TypeScript | Web control surface, governance runtime contracts, tests | 98.7% |
| JavaScript | Node scripts, config, build/runtime helpers | 0.8% |
| Python | Release gates, public-surface scanners, provider readiness checks | 0.3% |
| CSS | Web styling surface | 0.1% |

The private provenance archive contains a broader historical language mix and
more internal verification material. The public repo preserves only the current
external-facing implementation, docs, and proof surfaces.

## Quick Start

Install the web app:

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci
npm run build
npm run dev
```

Open:

```text
http://localhost:3000
```

For live governance proof, set a DashScope-compatible key in the environment:

```bash
DASHSCOPE_API_KEY=<operator-supplied-key>
```

Accepted aliases:

```text
ALIBABA_API_KEY
CVF_ALIBABA_API_KEY
CVF_BENCHMARK_ALIBABA_KEY
```

Then run:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

That command is the release-quality proof command. It includes live governance
E2E and must fail if no DashScope-compatible live key is available.

For the smallest operational path, use `docs/guides/minimum-useful-cvf.md`.
For the current recommended deployment baseline, use
`docs/guides/local-first-deployment-baseline.md`.

## Module Map

| Path | Purpose |
|---|---|
| `EXTENSIONS/CVF_GUARD_CONTRACT` | Shared guard contract, typed runtime helpers, default governance engine. |
| `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION` | Control-plane contracts for routing, context, knowledge, and coordination. |
| `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION` | Execution-plane contracts for dispatch, policy gates, command runtime, and reintake. |
| `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION` | Expansion layer for governance checkpoints, watchdog signals, and audit surfaces. |
| `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION` | Learning-plane contracts for feedback, scoring, drift, and reinjection. |
| `EXTENSIONS/CVF_MODEL_GATEWAY` | Model/provider routing, credential boundary, fallback policy, quota ledger, sticky session, and gateway receipts. |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web` | Web control surface and non-coder/operator UI. |
| `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE` | Skill governance plus proposal-only governed skill evolution loop. |
| `EXTENSIONS/CVF_v1.8.1_ADAPTIVE_OBSERVABILITY_RUNTIME` | Observe-only runtime signal contracts that do not mutate governance policy. |
| `ECOSYSTEM/doctrine` | Current doctrine and layer model for CVF positioning. |
| `governance/public-surface-manifest.json` | Allowlist and classification for public files. |
| `scripts/check_public_surface.py` | Fast public-release scanner. |

See `ARCHITECTURE.md` for the diagram-first architecture view, including the
module map, dependency rules, active reference path, interaction model, and
clone treeview.

## Provider Boundary

CVF is provider-agnostic by design. Providers connect through bounded adapters
and must expose enough metadata for CVF to govern input, execution, output, and
receipts.

Current public evidence is intentionally bounded:

- Alibaba/DashScope has live release-gate proof on the active lane.
- DeepSeek has confirmatory/provider-lane evidence, not a blanket parity claim.
- OpenAI, Gemini, Claude, and other providers can be added through adapters, but
  this repo does not claim parity until live evidence exists.

See `PROVIDERS.md` and `docs/evidence/provider-lanes.md`.

## Governance Boundary

CVF governance behavior means:

- risk classification
- approval flow
- DLP and redaction
- bypass detection
- provider routing
- output validation
- audit trail and evidence receipts

Any public claim about those behaviors must cite live provider evidence.
Mock mode is acceptable only for UI structure, navigation, layout, and RBAC
checks that do not assert AI governance behavior.

## Quality Benchmark Suite

CVF publishes its benchmark methodology separately from benchmark scores. The
Quality Benchmark Suite defines how CVF quality claims must be measured before
they are made public:

- `docs/benchmark/README.md`
- `docs/benchmark/quality-benchmark-suite-methodology.md`
- `docs/benchmark/quality-benchmark-suite-claim-ladder.md`
- `docs/benchmark/quality-benchmark-suite-standards-alignment.md`

Current status: methodology and run artifacts are public, but no public QBS
quality score is claimed. The Alibaba/DashScope powered lane has reached a
pre-registered R10 checkpoint, but live R10 execution still requires an explicit
operator command with `--confirm-live-cost`. Until execution artifacts and
reviewer scoring exist, QBS remains methodology/readiness evidence only.

Release-gate evidence proves governed operability. QBS is the separate method
for measuring quality and control value; no QBS score is claimed until a
powered run is published.

## Cost And Quota

CVF is local-first. The operator supplies provider keys, controls where data is
stored, and decides when cost-bearing live gates run.

Cost/quota controls are part of the governance surface:

- live gates require explicit key/environment setup
- protected GitHub workflow requires an operator confirmation input
- provider keys must never be printed, committed, or stored in evidence
- cost spikes and quota policy belong in `COST_AND_QUOTA.md`

## Netlify

The root `netlify.toml` points Netlify to:

```text
EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
```

If an existing Netlify site was connected to the old repository before renewal,
reconnect it to this renewed repository if Netlify does not follow the GitHub
rename/reuse automatically.

## Public Evidence

Start here:

- `docs/evidence/README.md`
- `docs/evidence/current-cvf-quality-status.md`
- `docs/evidence/local-first-release-gate-proof-2026-05-16.md`
- `docs/evidence/cvf-16-5-runtime-absorption.md`
- `docs/evidence/latest-release-gate.md`
- `docs/evidence/provider-lanes.md`
- `docs/evidence/web-governance-path.md`
- `docs/evidence/redaction-and-key-safety.md`
- `docs/evidence/claim-boundaries.md`
- `docs/guides/local-first-deployment-baseline.md`

## What Is Intentionally Not Here

This public repository does not include the internal operating journal:

- agent handoffs
- Claude/Codex rebuttal chains
- raw wave roadmaps
- raw browser traces
- uncurated audits and baselines
- local runtime state
- provider-key setup transcripts

Those belong in the private provenance archive or local operator storage.
