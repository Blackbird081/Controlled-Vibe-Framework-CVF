# START HERE

> Shortest root-level entrypoint for first-time CVF readers.
>
> Canonical default first stop: [Getting Started](docs/GET_STARTED.md)

## Quick Routes

| If you are... | Open this next |
|---|---|
| New reader / General evaluator | [Getting Started](docs/GET_STARTED.md) and [Quick Orientation](docs/guides/CVF_QUICK_ORIENTATION.md) |
| Builder / Integrator | [Controlled Execution Loop](docs/concepts/controlled-execution-loop.md) and [Reference Governed Loop](docs/reference/CVF_REFERENCE_GOVERNED_LOOP.md) |
| Non-coder / Operator | [Getting Started](docs/GET_STARTED.md) and [Non-Coder Governed Packet](docs/reference/CVF_NONCODER_REFERENCE_GOVERNED_PACKET.md) |
| Architecture reader | [Architecture](ARCHITECTURE.md) and [Architecture Map](docs/reference/CVF_ARCHITECTURE_MAP.md) |

## Front-Door Rule

- use this file as a redirect, not as the full explanation
- use `README.md` for role-based triage
- use `ARCHITECTURE.md` for the system-shape view
- use [Docs Index](docs/INDEX.md) only after the initial front-door path when you need the deeper private-core chain

**If you only pick one page, open [docs/GET_STARTED.md](docs/GET_STARTED.md).**

## New Machine Quick Start

If this repo was freshly cloned and you only need one extension:

```bash
cd EXTENSIONS/<target-extension>
npm ci   # if package-lock.json exists
# or: npm install   # if that package has no lockfile
```

If you need all 4 foundations ready at once:

```powershell
.\scripts\bootstrap_foundations.ps1
```

```bash
./scripts/bootstrap_foundations.sh
```

Use [CVF New Machine Setup Checklist](docs/reference/CVF_NEW_MACHINE_SETUP_CHECKLIST.md) for the canonical flow.

*Last updated: 2026-04-07*
