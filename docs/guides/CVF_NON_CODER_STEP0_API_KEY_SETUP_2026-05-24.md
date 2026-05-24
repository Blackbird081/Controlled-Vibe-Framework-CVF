# CVF Non-Coder Step 0 API-Key Setup Guide

Status: PUBLIC_SAFE_GUIDE

Date: 2026-05-24

Audience: non-coders, solo operators, and small teams

---

## Goal

Configure one approved AI provider key so CVF can run a live governed
execution and return a receipt.

This is Step 0 before the first-receipt guide. It is not provider account
procurement, hosted secret-vault setup, or enterprise credential management.

---

## Recommended First Lane

Recommended first provider lane: Alibaba DashScope-compatible `qwen-turbo`.

Accepted environment variable names:

- `DASHSCOPE_API_KEY`
- `ALIBABA_API_KEY`
- `CVF_ALIBABA_API_KEY`
- `CVF_BENCHMARK_ALIBABA_KEY`

Use only one unless your operator intentionally keeps aliases for
compatibility.

---

## Setup Path

1. Get a provider key from the provider account your team uses.
2. Open the CVF web app folder:

```text
EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
```

3. Create or open `.env.local`.
4. Add one environment variable line using your real key value.
5. Do not commit `.env.local`.
6. Restart the dev server or proof process after changing the file.
7. Run a boolean readiness check without printing the key value.
8. Continue to the first-receipt guide.

PowerShell readiness check:

```powershell
$env:DASHSCOPE_API_KEY -and $env:DASHSCOPE_API_KEY.Trim().Length -gt 0
```

Expected output:

```text
True
```

---

## First Receipt

After Step 0 succeeds, continue here:

`docs/guides/CVF_NON_CODER_SETUP_GUIDE_2026-05-24.md`

For release-quality governance proof, use the release gate from the private
operator workspace. UI-only walkthroughs are not governance proof.

---

## If No Key Is Available

You can still inspect UI structure, templates, and documentation. You cannot
claim live governance behavior, first-receipt readiness, provider routing, or
production readiness until a live key is available and the proof passes.

---

## Claim Boundary

This guide supports only a bounded setup claim: a small-team operator has a
documented way to configure one live provider key without committing or
printing the secret.

It does not claim automated provider signup, universal provider availability,
hosted secret management, enterprise onboarding, broad provider stability, or
full production readiness.

