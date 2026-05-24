# CVF Execution Diagnostics And First-Value Hardening Evidence - 2026-05-24

Status: PUBLIC_SUMMARY

## What Was Proven

CVF now has a bounded execution diagnostic contract for live-run failures.
When a governed live provider call fails without usable output, the execute
path can return a structured diagnostic instead of leaving the operator with a
generic failure.

The public-safe claim covers three linked product improvements:

- V3: execution diagnostics classify provider and route failures with a
  machine-readable diagnostic object.
- V1: the non-coder first-value UI surfaces the classified diagnostic and does
  not silently replace a classified live failure with mock output.
- V2: evidence receipt copy/export text now includes action-oriented sections:
  "What happened", "Why this can be used", and "What to do next".
- WC-2: the non-coder first-value UI also avoids mock output after
  unclassified failed real execution attempts.

## Live Proof Summary

A live unavailable-model probe returned `success=false` with a classified
diagnostic instead of an ambiguous failure:

- provider lane: Alibaba-compatible live lane
- diagnostic class: `model_unavailable`
- user action: `change_model`
- retryable: `false`
- evidence receipt: `rcpt-env-mpjiqzqg-v3k25r`
- trace: `env-mpjiqzqg-v3k25r`
- evidence mode: `live`
- raw secret printed: `false`

Focused verification passed:

- 107 focused web tests for the V1/V2/V3 closure
- 23 focused ProcessingScreen tests for WC-2
- web TypeScript check
- mandatory release gate bundle: 7/7 PASS

## Boundary

This evidence does not claim provider uptime, production SLA, broad hosted
readiness, universal CLI/MCP parity, memory prompt reinjection, graph authority,
or a new receipt envelope. It proves a bounded diagnostic and evidence-to-action
surface for classified CVF live-run failures, plus truthful non-coder failure
handling when a real execution attempt fails without a diagnostic.
