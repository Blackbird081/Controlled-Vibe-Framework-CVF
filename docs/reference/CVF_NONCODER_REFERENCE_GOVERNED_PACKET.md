# CVF Non-Coder Reference Governed Packet

Status: reusable non-coder governed packet plus three live Web execution paths for the canonical controlled loop on the active reference line.

## Purpose

- provide one repeatable non-coder-facing packet that explains the governed loop without requiring users to inspect runtime internals
- package the most important supervision evidence in one place:
  - phases
  - approval checkpoints
  - execution handoff
  - freeze receipt
- strengthen the roadmap claim that the non-coder path is no longer only a collection of loosely related UI surfaces

## Where It Lives

Active implementation:

- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/non-coder-reference-loop.ts`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/AppBuilderWizard.tsx`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/BusinessStrategyWizard.tsx`
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ResearchProjectWizard.tsx`

Primary user-facing entrypoint:

- App Builder Wizard review step
- Business Strategy Wizard review step
- Research Project Wizard review step

## What It Packages

The governed packet shows:

1. canonical `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE`
2. human approval checkpoints before build and freeze
3. one governed execution handoff payload for the Web execution path
4. live launch paths from App Builder Wizard, Business Strategy Wizard, and Research Project Wizard into the Web `execute` pipeline
5. one freeze receipt with:
   - accepted output
   - baseline artifact
   - locked scope
   - follow-up items

## Why It Matters

- it gives non-coder supervision one reusable artifact instead of relying only on screenshots, dispersed UI states, or narrative docs
- it proves that at least three non-coder paths can now execute through the governed Web pipeline with pre-bound phase, risk, scope, and skill-preflight metadata
- it makes future audits faster because reviewers can inspect one packet and compare it with the coder-facing reference loop
- it improves evidence quality without overstating that the non-coder path already has total ecosystem parity

## Current Caveat

These reference paths are now live on the active Web path, but they are still narrower than full ecosystem parity.

What remains open:

- broader parity across auxiliary extension families
- evidence depth equivalent across every channel family, not only the App Builder Wizard, Business Strategy Wizard, and Research Project Wizard reference paths
