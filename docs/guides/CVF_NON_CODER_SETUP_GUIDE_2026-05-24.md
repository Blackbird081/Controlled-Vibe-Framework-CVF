# CVF Non-Coder First Receipt Guide

Memory class: SUMMARY_RECORD

Status: PUBLIC_SAFE_GUIDE

Date: 2026-05-24

Audience: non-coders, solo operators, and small teams

---

## Goal

Get from a plain business task to one governed AI result with a receipt you can
keep for review.

This guide proves a bounded small-team path. It is not enterprise SaaS or
multi-tenant hosted GA readiness.

---

## Purpose

Provide a public-safe, non-coder-readable first-receipt path for CVF's bounded
small-team production-readiness claim.

---

## Scope / Target / Owner Boundary

Target: non-coder and small-team operators using a trusted template.

Owner: CVF public onboarding and product-orientation documentation.

Boundary: first governed receipt only; no enterprise onboarding, RBAC
administration, hosted operations, or incident response.

---

## Owner / Source

Sources: P1 small-team/non-coder production-readiness tranche, live governed
`/api/execute` proof recorded in private provenance, and the public catalog
boundary requiring public-safe evidence paths.

---

## Protocol / Contract / Requirements

The user path is: choose a trusted template, enter plain-language inputs, run
governed execution, verify a live receipt exists, and retain the receipt with
the result.

Required proof indicators: `success=true`, `evidenceMode=live`, route
`/api/execute`, no mock fallback, and no printed secret.

---

## Enforcement / Verification

P1 verification used a signed hosted `/api/execute` call and a public-sync
`Test-Path` check for this guide and the public catalog.

This public guide intentionally omits private service-token headers, raw
receipts, API keys, and internal review packets.

---

## What You Need

- A browser.
- One approved AI provider key configured by the workspace operator. If this
  is not done yet, complete Step 0 first:
  `docs/guides/archive/CVF_NON_CODER_STEP0_API_KEY_SETUP_2026-05-24.md`.
- Access to the CVF web app or a protected CVF `/api/execute` endpoint.
- A business task that fits one of the trusted templates.

Recommended first template:

- `strategy_analysis`

---

## First Receipt Path

1. Open the CVF web app.
2. Choose a trusted template. Start with `Strategy Analysis`.
3. Fill the plain-language fields:
   - topic;
   - context;
   - options;
   - constraints;
   - priority.
4. Run the governed execution.
5. Confirm the result includes a governance receipt.
6. Keep or export the receipt with the result.

The receipt is the important part. It records that the result came through the
governed path instead of an unmanaged AI prompt.

---

## Example Inputs

Topic:

```text
Small-team launch plan
```

Context:

```text
A non-coder founder wants a short plan for testing a customer onboarding offer
with five pilot customers.
```

Options:

```text
Use the strategy_analysis template.
Keep the recommendation plain-language.
Export or copy the governance receipt after execution.
```

Constraints:

```text
Do not claim broad production stability. Keep the plan usable by a small team.
```

Priority:

```text
First governed receipt
```

---

## What Good Looks Like

- The request returns `success=true`.
- The receipt says `evidenceMode=live`.
- The route is `/api/execute`.
- The provider is an approved provider configured by the operator.
- The output is useful and not a mock fallback.
- No API key, service token, or signed header appears in the result or docs.

---

## Three Friction Points Closed In P1

| Friction point | P1 decision |
| --- | --- |
| "Which template should I use first?" | Closed by naming `strategy_analysis` as the recommended first receipt path. |
| "What fields do I type?" | Closed by the concrete example inputs above. |
| "How do I know it was governed?" | Closed by receipt checks: live evidence, route, provider, and no mock fallback. |

Deferred:

- Enterprise onboarding, team RBAC design, multi-tenant setup, and hosted SaaS
  incident process remain out of scope for this small-team path.

---

## Claim Boundary

This guide supports only a bounded claim:

CVF has a proven small-team/non-coder path from trusted template selection to a
live governed execution receipt.

It does not claim:

- universal provider stability;
- full hosted SaaS/GA readiness;
- enterprise production readiness;
- autonomous memory reinjection;
- graph approval authority;
- global freeze release.

---

## Related Artifacts

- `docs/guides/archive/CVF_NON_CODER_STEP0_API_KEY_SETUP_2026-05-24.md`
- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`
- `docs/evidence/web-governance-path.md`
