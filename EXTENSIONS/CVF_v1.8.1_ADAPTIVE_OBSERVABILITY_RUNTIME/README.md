# CVF v1.8.1 — Adaptive Observability Runtime

> **CVF Version:** v1.8.1 — Sub-extension of v1.8 (Safety Hardening)
> **Layer:** 2.5 (Safety Runtime) + 3 (Observability)
> **Status:** Implemented
> **Integrated:** 2026-03-05 | **ADR:** ADR-013

---

## 1. Overview

CVF v1.8.1 extends v1.8 (Safety Hardening) with two tightly-coupled capabilities:

- **Adaptive Governance** — runtime-aware enforcement that adjusts controls based on live metrics
- **Observability Layer** — telemetry, satisfaction analytics, cost tracking, version impact analysis

These two form a **feedback loop**: Observability feeds metrics -> Adaptive Governance adjusts enforcement -> Execution -> Observability logs result.

```
Execution
  -> Observability (telemetry, satisfaction, cost, regression)
  -> Risk Scoring (correction rate, token spikes, security incidents)
  -> Adaptive Policy (normal / moderate / strict / block)
  -> Runtime Guard (adjust temperature, tokens, require clarification)
  -> Next Execution
```

---

## 2. Architecture

```
/governance/
    adaptive.policy.ts     <- Derives enforcement mode from risk score
    runtime.guard.ts       <- Guards execution with adjusted params
    skill.risk.score.ts    <- Calculates risk from observability metrics
    adaptive/
        Readme.md
        config.schema.ts
        policy.deriver.ts
        risk.engine.ts
        runtime.guard.ts

/observability/
    telemetry.pipeline.ts      <- Core telemetry ingestion
    invocation.logger.ts       <- Log each skill invocation
    token.metrics.ts           <- Track token usage per skill
    cost.calculator.ts         <- Convert tokens to cost estimate
    satisfaction.analyzer.ts   <- Regex-based user satisfaction detection
    correction.cluster.ts      <- TF-IDF clustering of user corrections
    version.snapshot.ts        <- SHA-256 skill version tracking
    regression.detector.ts     <- Detect satisfaction/cost regression trends
    health.monitor.ts          <- Threshold-based health alerts
    ab.testing.engine.ts       <- A/B test framework for skill variants

/storage/
    metrics.store.ts       <- Persistent metrics storage
    audit.store.ts         <- Security audit log store
    snapshot.store.ts      <- Version snapshot storage

/ui/dashboards/
    risk.dashboard.tsx
    skill.analytics.dashboard.tsx
    cost.dashboard.tsx
    security.audit.dashboard.tsx

/sdk/
    cvf.client.ts          <- External integration client
    integration.hooks.ts   <- Hooks for third-party systems
```

---

## 3. Adaptive Governance

Risk scoring formula (from `skill.risk.score.ts`):

```
Risk Score =
  (correctionRate * 40)      max 40 points
+ (regression ? 25 : 0)      +25 if regression detected
+ (securityIncidents * 5)    max 20 points
+ (tokenSpike ? 15 : 0)      +15 if token usage spiked >30%
```

Enforcement modes (from `adaptive.policy.ts`):

| Risk Score | Mode | Temperature Cap | Max Tokens | Block? |
|---|---|---|---|---|
| 0-39 | normal | 0.8 | 2000 | No |
| 40-69 | moderate | 0.5 | 1200 | No |
| 70-89 | strict | 0.3 | 800 | No (clarification required) |
| 90+ | strict | 0.3 | 800 | Yes (blocked) |

---

## 4. CVF Compatibility

| Principle | Status |
|---|---|
| Human authority | OK — Guard returns result, human decides |
| Safety over speed | OK — Block execution when risk critical |
| No silent mutation | OK — All invocations logged via telemetry |
| Backward compat | OK — Does not modify v1.8 or v1.7.x |
| Audit trail | OK — storage/ + observability/ log everything |

---

## 5. Versioning

**Chain:** v1.8 (Safety Hardening) -> v1.8.1 (Adaptive Observability Runtime)

Does NOT replace v1.8. Adds feedback loop + analytics on top.

---

*See [ADR-013](../../docs/CVF_ARCHITECTURE_DECISIONS.md) for integration rationale.*
