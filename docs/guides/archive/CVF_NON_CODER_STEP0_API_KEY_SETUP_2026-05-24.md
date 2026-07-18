# CVF Non-Coder Step 0 API-Key Setup Guide

Memory class: SUMMARY_RECORD

Status: PUBLIC_SAFE_GUIDE

Date: 2026-05-24

Audience: non-coders, solo operators, and small teams

---

## Goal

Configure one approved AI provider key so CVF can run a live governed
execution and return a receipt.

This guide is Step 0 before the first-receipt guide. It is not a provider
account procurement promise, hosted secret-vault setup, or enterprise
credential-management process.

---

## Purpose

Close the setup gap before a non-coder or small-team operator runs the first
governed `/api/execute` proof.

---

## Scope / Target / Owner Boundary

Target: local operator setup for one live provider lane.

Owner: CVF onboarding documentation.

Boundary: local environment-variable setup only; no raw secrets are shown, and
no secret should be committed to Git.

---

## Owner / Source

Sources: R3 Step 0 setup baseline, P1 first-receipt proof, and the mandatory
live-governance proof rule.

---

## Protocol / Contract / Requirements

Recommended first provider lane: Alibaba DashScope-compatible `qwen-turbo`.

Accepted environment variable names:

- `DASHSCOPE_API_KEY`
- `ALIBABA_API_KEY`
- `CVF_ALIBABA_API_KEY`
- `CVF_BENCHMARK_ALIBABA_KEY`

Use only one of these unless an operator intentionally keeps aliases for
compatibility.

---

## Enforcement / Verification

Verification must print only whether a key is present. It must not print the
key value.

PowerShell readiness check:

```powershell
$env:DASHSCOPE_API_KEY -and $env:DASHSCOPE_API_KEY.Trim().Length -gt 0
```

Expected output:

```text
True
```

If the output is blank or `False`, CVF will not have a live Alibaba key in that
terminal.

---

## Step 0 Path

1. Get a provider key from the provider account your team uses.
2. Open the CVF web app folder:

```text
EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
```

3. Create or open `.env.local`.
4. Add one environment variable line using your real key value.
5. Do not commit `.env.local`.
6. Restart the dev server or route proof process after changing the file.
7. Run the readiness check above.
8. Continue to the first-receipt guide.

Do not paste provider keys into chat messages, Markdown docs, screenshots, or
Git commits.

---

## First Receipt Command

For release-quality proof, use the release gate after the key is configured:

```powershell
python scripts/run_cvf_release_gate_bundle.py --json
```

The release gate must use a live governance call when a governance claim is
being made.

---

## If No Key Is Available

You can still inspect UI structure, templates, and documentation. You cannot
claim live governance behavior, first-receipt readiness, provider routing, or
production readiness until a live key is available and the proof passes.

---

## Claim Boundary

This guide supports a bounded claim:

CVF documents how a small-team operator can configure one live provider key
without committing or printing the secret.

It does not claim automated provider signup, universal provider availability,
hosted secret management, enterprise onboarding, broad provider stability, or
full production readiness.

---

## Related Artifacts

- `docs/guides/CVF_NON_CODER_SETUP_GUIDE_2026-05-24.md`
- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`

