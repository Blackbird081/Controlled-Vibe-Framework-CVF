# CVF CLI Surface Classification Standard

Memory class: FULL_RECORD

Status: ACTIVE_STANDARD

Date: 2026-06-30

docType: reference_standard

## Purpose

This standard defines the source-of-truth classification for CVF helper modules
that may or may not expose a direct command-line interface.

The goal is centralized control. Future agents must classify helper surfaces
before adding or refusing a CLI entrypoint, so CVF can keep evidence commands
runnable without turning every internal implementation file into a separate
public command.

## Scope / Applies-To

This standard applies to local CVF helper modules, especially files under
`governance/compat/`, when a future agent proposes adding, removing, or
withholding a command-line entrypoint.

It does not apply to provider-owned skill mechanisms, external plugin runtimes,
ASSF package activation, MCP adapter behavior, public export, or live provider
proof.

## Source Of Truth

| Field | Value |
|---|---|
| Machine registry | `governance/compat/CVF_CLI_SURFACE_CLASSIFICATION_REGISTRY.json` |
| Machine checker | `governance/compat/check_cli_surface_classification.py` |
| Classification owner | governed compatibility layer |
| Claim boundary | this standard classifies local helper entrypoints only; it does not authorize provider calls, runtime package activation, MCP adapter behavior, public-sync, or skill body loading |

## Classification Values

| Classification | Meaning | Required control |
|---|---|---|
| `CLI_REQUIRED` | The helper is a governed agent/operator evidence surface or repeatable task entrypoint. | File must expose `main()` and a `__main__` entrypoint. |
| `CLI_OPTIONAL` | The module API is canonical, but a CLI may exist as convenience if it does not widen authority. | Registry must state why CLI is optional and what command behavior is allowed. |
| `MODULE_ONLY` | The file is an internal library, split module, or implementation detail behind a parent command. | File must not expose a direct CLI entrypoint. |

## Required Registry Fields

Every registry entry must include:

- `path`
- `classification`
- `status`
- `ownerSurface`
- `reason`
- `evidence`

The `reason` field must explain the control decision, not only restate the
classification. The `evidence` field must name the tranche, scan, or review
that justified the classification.

## Decision Rules

Use `CLI_REQUIRED` when any of these are true:

- a governed artifact must cite repeatable command output from the helper;
- a future agent would otherwise need an ad hoc Python import snippet for a
  recurring preflight, readout, classification, or disclosure task;
- the helper name already communicates a standalone command surface and the
  behavior is bounded, deterministic, and safe to expose.

Use `CLI_OPTIONAL` when:

- the helper is useful interactively, but artifacts are not expected to cite it
  as primary evidence;
- the module API remains canonical and CLI output is only a convenience view;
- direct command use does not create new mutation or authority semantics.

Use `MODULE_ONLY` when:

- the file is a split implementation module behind a parent checker;
- direct command use would bypass context, range handling, parent validation, or
  closure semantics;
- a direct CLI would create a second source of truth for the same governance
  behavior.

## Required Checker Behavior

`governance/compat/check_cli_surface_classification.py --enforce` must validate:

- registry entries use known classification values;
- required fields are present;
- classified source files exist;
- `CLI_REQUIRED` files define `main()` and a `__main__` entrypoint;
- `MODULE_ONLY` files do not define direct CLI entrypoints.

## Current ADIF-CLI-T1 Classification

| Path | Classification | Rationale |
|---|---|---|
| `governance/compat/run_adif_defect_resolver.py` | `CLI_REQUIRED` | ADIF disclosure must be directly command-runnable. |
| `governance/compat/run_adif_preflight_readout.py` | `CLI_REQUIRED` | Preflight readout is an agent-facing evidence command. |
| `governance/compat/run_adif_finding_intake_bridge.py` | `CLI_REQUIRED` | Reviewer finding intake should not require ad hoc import snippets. |
| `governance/compat/check_work_order_dispatch_quality_*.py` split modules | `MODULE_ONLY` | Parent `check_work_order_dispatch_quality.py` owns the command surface. |

## Claim Boundary

This standard does not require every helper to have CLI. It requires every
future CLI decision to be classified, reviewable, and machine-checkable.
