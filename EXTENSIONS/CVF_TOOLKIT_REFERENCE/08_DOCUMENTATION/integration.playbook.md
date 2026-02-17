# Integration Playbook

## Step 1: Lock CVF

Confirm cvf_version.lock is valid.

---

## Step 2: Register Skills

Use skill.registry.ts or extension skill packs.

---

## Step 3: Assign Risk

Use financial.risk.profile.ts or custom domain profile.

---

## Step 4: Configure AI Provider

Select provider:
- OpenAI
- Claude
- Gemini

Initialize with:
- API key
- Approved model

---

## Step 5: Connect Workflow

If using Dexter:
- Use dexter.workflow.adapter.ts
- Use dexter.agent.bridge.ts

If custom workflow:
- Use cvf.skill.adapter.ts
- Use cvf.governance.adapter.ts

---

## Step 6: Run UAT

For MEDIUM+ skills:
- Use uat.runner.ts
- Follow uat.rubric.md

---

## Step 7: Apply Freeze (HIGH/CRITICAL)

Follow freeze.protocol.md

---

## Step 8: Generate Compliance Report

Use compliance.report.generator.ts
