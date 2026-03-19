# CVF Non-Coder Reference Governed Packet

Status: reusable non-coder evidence packet for the canonical controlled loop.

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

Primary user-facing entrypoint:

- App Builder Wizard review step

## What It Packages

The governed packet shows:

1. canonical `INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE`
2. human approval checkpoints before build and freeze
3. one governed execution handoff payload for the Web execution path
4. one freeze receipt with:
   - accepted output
   - baseline artifact
   - locked scope
   - follow-up items

## Why It Matters

- it gives non-coder supervision one reusable artifact instead of relying only on screenshots, dispersed UI states, or narrative docs
- it makes future audits faster because reviewers can inspect one packet and compare it with the coder-facing reference loop
- it improves evidence quality without overstating that the non-coder path already has total ecosystem parity

## Current Caveat

This packet is a governed handoff and evidence artifact.

It improves the non-coder reference path substantially, but it is not yet the same thing as one fully packaged live runtime helper equivalent to `CvfSdk.runReferenceGovernedLoop()`.
