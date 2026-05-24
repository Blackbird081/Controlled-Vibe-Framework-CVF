# CVF Non-Coder First Receipt Guide

Status: PUBLIC_SAFE_GUIDE

Date: 2026-05-24

Audience: non-coders, solo operators, and small teams

---

## Goal

Get from a plain business task to one governed AI result with a receipt you can
keep for review.

This guide supports a bounded small-team path. It is not enterprise SaaS or
multi-tenant hosted GA readiness.

---

## What You Need

- A browser.
- One approved AI provider key configured by the workspace operator.
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

The receipt records that the result came through the governed path instead of
an unmanaged AI prompt.

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

## Claim Boundary

This guide supports only a bounded claim:

CVF has a proven small-team/non-coder path from trusted template selection to a
live governed execution receipt.

It does not claim universal provider stability, full hosted SaaS/GA readiness,
enterprise production readiness, autonomous memory reinjection, graph approval
authority, or global freeze release.
