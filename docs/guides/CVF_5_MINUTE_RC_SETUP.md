<!-- Memory class: FULL_RECORD -->
# CVF 5-Minute RC Setup

Date: 2026-05-08

Status: public local-first first-run path

## Boundary

This guide is for a public local-first setup. It is not a hosted installer and
does not claim zero friction across every environment. The commands below use
scripts and package commands that are present in the public repository.

## 1. Clone

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF
```

## 2. Install The Web Package

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci
```

Use `npm ci` because this package ships a lockfile.

## 3. Run A Non-Live Developer Check

```bash
npm run check
```

Then return to the repository root:

```bash
cd ../../..
```

For the broader non-live public gate, run:

```bash
python scripts/run_cvf_static_ci_gate.py --json
```

This static gate checks public surface, workflow orchestration, web build,
TypeScript, secrets, docs governance, and selected static governance tests. It
does not use live provider keys.

## 4. Create Local Env When You Need Live Proof

Create or edit:

```bash
EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/.env.local
```

Add only the provider keys you intend to use. Never commit `.env.local`. For
the current release-quality lane, use a DashScope-compatible key via
`DASHSCOPE_API_KEY`, `ALIBABA_API_KEY`, `CVF_ALIBABA_API_KEY`, or
`CVF_BENCHMARK_ALIBABA_KEY`.

## 5. Check Provider Readiness

Secret-safe key presence check:

```bash
python scripts/cvf_provider_check.py --provider alibaba --json
```

Optional live validation:

```bash
python scripts/cvf_provider_check.py --provider alibaba --live --json
```

DeepSeek can be checked with:

```bash
python scripts/cvf_provider_check.py --provider deepseek --json
```

## 6. Start Web

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Release-Quality Governance Proof

For claims that CVF controls AI/governance behavior, run:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

That command requires live provider evidence. UI mock checks are not governance
proof.
