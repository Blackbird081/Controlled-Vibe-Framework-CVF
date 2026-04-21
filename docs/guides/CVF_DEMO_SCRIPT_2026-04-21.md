# CVF Demo Script

**Date:** 2026-04-21  
**Audience:** operators, collaborators, potential adopters  
**Default mode:** all paths run without paid API calls unless live mode is explicitly opted in  

---

## Before You Start

Prerequisites (all paths):

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
npm run dev
# Dev server starts at http://localhost:3000
```

No API key required for Demo Path A and B.  
Demo Path C requires an Alibaba or DeepSeek key only for the optional live canary step.

Claim boundary to keep in mind during any demo:

> CVF proves governed AI-assisted development. Multi-provider operability is proven for Alibaba and DeepSeek. Provider parity is not claimed. Provider economics are user-selected.

---

## Demo Path A — Non-Coder App Builder

**Audience:** stakeholders who want to see CVF's non-coder value proposition  
**Duration:** ~5 minutes  
**Live API call:** not required  

### What this demonstrates

A user with no coding background can create a governed application using CVF's front-door wizard. CVF handles structure, risk classification, and intake — the user only provides intent.

### Steps

**Step 1 — Open the landing page**

Navigate to `http://localhost:3000/landing`

Point out:
- bilingual support (toggle EN/VI)
- "Start Building" CTA
- the three value props: governed, multi-provider, non-coder accessible

**Step 2 — Enter the template gallery**

Navigate to `http://localhost:3000` (home/dashboard)

Point out:
- curated template cards by use case
- categories: app builder, content strategy, data analysis, research, etc.
- each template has a governance tier displayed

**Step 3 — Select a non-coder starter template**

Select any template from the gallery (e.g., "App Builder" or "Business Strategy").

Click "Use Template" or "Start".

**Step 4 — Walk through the intake wizard**

The wizard walks through:
1. Project name and description
2. Target users
3. Primary goal
4. Risk appetite (low / medium / high)

Fill in minimal values — purpose is to show the structured intake, not to produce a real deliverable.

**Step 5 — Show the governance output**

After intake, CVF shows:
- risk classification (R0 / R1 / R2 / R3)
- suggested next steps per classification
- approval gates if risk level is elevated

**What to say:**

> "No code was written. CVF used the operator's intent to classify risk, propose a governed path, and gate the next action. This is the non-coder value path — governance without programming."

---

## Demo Path B — Governed Risk / Approval Path

**Audience:** engineering leads, security reviewers, governance stakeholders  
**Duration:** ~5 minutes  
**Live API call:** not required  

### What this demonstrates

CVF classifies AI operations by risk level and blocks or gates high-risk operations at runtime — not just in documentation.

### Steps

**Step 1 — Open the agent task panel**

Navigate to `http://localhost:3000` and open or simulate an agent task.

If using a template with a high-risk operation step, proceed to that step.

**Step 2 — Trigger a high-risk classification**

Actions that typically classify as R2 or R3:
- "delete all project data"
- "publish to external API without review"
- "execute SQL migration on production database"

Enter any such intent in the agent input or select a high-risk template action.

**Step 3 — Show the High-Risk Guided Response panel**

CVF intercepts the action and displays:
- risk level badge (R2 or R3)
- plain-language explanation of why the action is high-risk
- required approval scope
- confirmation prompt: "Do you authorize this action within the stated scope?"

**Step 4 — Show the block behavior**

Do not confirm. Show that:
- the action does not proceed
- CVF explains what approval is needed
- the session audit trail records the attempted action and the block

**Step 5 — Show the approval path (optional)**

Confirm the action. Show that:
- CVF records the approval with scope
- the action proceeds within the approved scope
- the audit trail shows the full decision chain

**What to say:**

> "CVF enforces governed AI behavior at runtime. The governance is not advisory — it blocks the action. Approval is explicit, scoped, and auditable."

---

## Demo Path C — Provider Switch / Certified Lane

**Audience:** technical evaluators, multi-provider adopters, platform operators  
**Duration:** ~5 minutes (default); ~10 minutes with live canary  
**Live API call:** optional — requires operator key  

### What this demonstrates

CVF supports multiple AI providers. Alibaba and DeepSeek are both CERTIFIED by canary evidence. The operator can see lane status, inspect evidence, and optionally run a live canary.

### Steps

**Step 1 — Open Settings**

Navigate to `http://localhost:3000/settings` or open Settings from the sidebar.

**Step 2 — Show the Provider section**

Point out the provider cards:
- Anthropic (default, always present)
- Alibaba Cloud (qwen-turbo)
- DeepSeek (deepseek-chat)

**Step 3 — Show lane status badges**

For Alibaba and DeepSeek, lane badges display:
- `Certified` (green badge)
- `3/3 PASS` pass window
- tooltip: "User-paid provider lane — Certification reflects CVF canary evidence, not universal provider parity"

For an unconfigured provider (no key set), the badge shows `Unconfigured`.

**Step 4 — Explain the evidence chain**

Point to the operator documentation:
- `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` — current status per provider
- `docs/audits/alibaba-canary/INDEX.md` — Alibaba receipt index
- `docs/audits/deepseek-canary/INDEX.md` — DeepSeek receipt index

**What to say:**

> "The certification badge is not marketing. It reflects three consecutive canary runs — six governed scenarios each — where the provider returned correct, policy-compliant output. The receipts are stored in the repo."

**Step 5 — Switch provider (optional)**

Select Alibaba or DeepSeek in the ProviderSwitcher dropdown.

Show that the UI updates the active provider without a full reload.

**Step 6 — Run a live canary (optional, requires API key)**

Only do this if the operator has provided their own key and agrees to the cost.

```bash
# Exit dev server first or run in a separate terminal
python scripts/run_cvf_provider_live_canary.py --provider alibaba
# or
python scripts/run_cvf_provider_live_canary.py --provider deepseek
```

Expected output: 6/6 scenarios PASS, receipt printed to console.

**What to say:**

> "Multi-provider operability is proven. Provider parity is not claimed — Alibaba and DeepSeek have different latency, cost, and billing. The operator chooses which provider economics match their use case."

---

## Demo Notes for Operators

**What to avoid saying:**

- "CVF is production-ready for enterprise deployment" — say "CVF is a governance framework ready for governed development and evaluation"
- "All providers have the same performance" — say "CVF certifies behavioral compliance; provider economics vary"
- "CVF replaces your existing CI/CD" — say "CVF adds a governance layer over AI-assisted development"
- "This works with any model" — say "Alibaba and DeepSeek are certified; other providers are experimental until canary-run"

**If asked about API keys during demo:**

> "All default demo paths run without live API calls. When an operator supplies their own key, CVF can run live canaries against that provider. No keys are stored or transmitted by CVF."

**If asked about E2E tests:**

> "CVF has unit tests and provider canary tests. Some Playwright E2E tests have known drift after recent UI changes — that is a known gap in the limitations register, not a hidden deficiency."

**If asked about cost:**

> "CVF itself has no usage cost. Live canary runs consume the operator's provider API credits. A 6-scenario Alibaba canary costs fractions of a cent at qwen-turbo rates."

---

## Quick Reference — Key URLs (local dev)

| Path | What it shows |
|---|---|
| `http://localhost:3000/landing` | Front-door landing — value props, CTAs |
| `http://localhost:3000` | Home — template gallery |
| `http://localhost:3000/settings` | Settings — provider lane badges |
| `http://localhost:3000/safety` | Safety — risk visualization |
| `http://localhost:3000/governance` | Governance — policy rules |

---

*Filed: 2026-04-21 — demo script for RC public readiness*
