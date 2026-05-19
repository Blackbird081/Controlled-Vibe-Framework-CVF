# Start with CVF — What can you do today?

CVF is a governance framework for AI-assisted software development.
Before reading about how it works, here are four things you can do with
it right now.

---

## 1. Generate a governed Product Brief

Submit a product brief request through the CVF web UI. CVF resolves your
role, binds the workflow, calls the AI provider under a governed policy,
and returns a structured receipt with step traces and a governance
decision record.

Evidence: [docs/evidence/phase-e-governed-execution-chain.md](evidence/phase-e-governed-execution-chain.md)

---

## 2. Run the governance CLI against a live execute route

Use `cvf execute` to call the governed execute path from the command
line. The CLI sends a signed POST request, receives the execution result,
and returns the governance receipt.

```
cvf execute --template app_builder_complete --role Developer \
  --endpoint http://localhost:3000 --input '{"intent":"build a task manager"}'
```

Evidence: [EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/execute.client.ts](../EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/execute.client.ts)

---

## 3. Prove governance on a live AI provider

Run CVF's release gate bundle to confirm that governance receipts,
role resolution, step traces, and output permission checks all pass on
a real AI provider (Alibaba or DeepSeek).

Evidence: [docs/evidence/latest-release-gate.md](evidence/latest-release-gate.md)
Provider lanes: [docs/evidence/provider-lanes.md](evidence/provider-lanes.md)

---

## 4. Browse and run governed outcome templates

The web UI home page lists outcome templates — Product Brief, SOP,
Marketing Copy, Strategy Analysis, and more. Select a template, fill in
the inputs, and run it through the governed execute chain.

Evidence: [docs/evidence/web-governance-path.md](evidence/web-governance-path.md)

---

## Next steps

| Goal | Where to go |
|---|---|
| Understand the architecture | [ARCHITECTURE.md](../ARCHITECTURE.md) |
| Set up CVF locally (Vietnamese + English) | [docs/GET_STARTED.md](GET_STARTED.md) |
| See the full capability catalog | [docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md](reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md) |
| Understand what CVF claims and does not claim | [docs/evidence/claim-boundaries.md](evidence/claim-boundaries.md) |
| Governance controls and extensions | [GOVERNANCE.md](../GOVERNANCE.md) |

---

*CVF v4.0.0 GA — released 2026-05-16. Governance claims are bounded to
certified provider lanes and the flows listed above. See
[docs/evidence/claim-boundaries.md](evidence/claim-boundaries.md) for
the full boundary statement.*
