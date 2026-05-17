# AGT-026: Full-Stack Testing Engine

> **Version:** 1.0.0  
> **Status:** Active  
> **Risk Level:** R2 – Medium  
> **Autonomy:** Supervised  
> **Category:** Quality Assurance  
> **Provenance:** claudekit-skills/web-testing + claude-code-templates/testing (davila7/claude-code-templates, mrgoonie/claudekit-skills)

---

## 📋 Overview

Complete testing methodology that implements the **70-20-10 Testing Pyramid** with automated CI gate enforcement. Covers unit, integration, E2E, load, security, visual regression, and accessibility testing. Not a tool reference — a strategic framework that tells the agent **what to test, when, and how much**.

**Key Principle:** Tests are a CI pipeline with gates. Fast tests gate slow tests. No E2E without unit coverage first.

---

## 🎯 Capabilities

### Testing Pyramid (70-20-10)

```
                    ╱╲
                   ╱E2E╲          10% — Critical user flows only
                  ╱ 10%  ╲        Playwright, 5-30s per test
                 ╱────────╲
                ╱Integration╲     20% — API endpoints, DB ops
               ╱    20%      ╲    Vitest + fixtures, 100-500ms
              ╱────────────────╲
             ╱      Unit        ╲  70% — Functions, utilities, logic
            ╱       70%          ╲ Vitest/Jest, <50ms per test
           ╱──────────────────────╲
```

### Test Type Decision Matrix

| What to Test | Type | Framework | Speed | When |
|-------------|------|-----------|-------|------|
| Pure functions, utilities | Unit | Vitest | <50ms | Every commit |
| State management logic | Unit | Vitest | <50ms | Every commit |
| API endpoints | Integration | Vitest + supertest | 100-500ms | Every PR |
| Database operations | Integration | Vitest + test DB | 100-500ms | Every PR |
| Module interactions | Integration | Vitest | 100-500ms | Every PR |
| Login/signup flow | E2E | Playwright | 5-30s | Before deploy |
| Checkout/payment flow | E2E | Playwright | 5-30s | Before deploy |
| Search + navigation | E2E | Playwright | 5-30s | Before deploy |
| API performance | Load | k6 | varies | Pre-release |
| OWASP vulnerabilities | Security | Custom + tools | varies | Pre-release |
| UI regressions | Visual | Playwright screenshots | 2-5s | Every PR |
| WCAG compliance | Accessibility | axe-core | 1-3s | Every PR |

### CI Gate System

```yaml
# Gate 1: Fast Fail (unit tests) — MUST pass before Gate 2
gate_1_unit:
  command: "npx vitest run --reporter=junit"
  timeout: 120s
  coverage_threshold: 80%
  fail_action: block_merge

# Gate 2: Integration (after unit pass)
gate_2_integration:
  command: "npx vitest run --config vitest.integration.config.ts"
  timeout: 300s
  requires: gate_1_unit
  fail_action: block_merge

# Gate 3: E2E (after integration pass)
gate_3_e2e:
  command: "npx playwright test"
  timeout: 600s
  requires: gate_2_integration
  fail_action: block_deploy

# Gate 4: Quality (parallel with Gate 3)
gate_4_quality:
  accessibility: "npx @axe-core/cli $URL"
  performance: "npx lhci autorun"
  security: "npm audit --audit-level=high"
  requires: gate_2_integration
  fail_action: warn
```

### Flakiness Mitigation Protocol

```
FLAKY TEST DETECTED?
│
├─ 1. Identify: Failed once, passed on retry
│
├─ 2. Classify root cause:
│   ├─ Timing issue → Add explicit waits (not sleep)
│   ├─ Race condition → Fix async ordering
│   ├─ External dependency → Mock/stub it
│   ├─ State leakage → Isolate test, fresh fixtures
│   └─ Animation/transition → Wait for animation end
│
├─ 3. Fix immediately (not quarantine)
│
└─ 4. Add stability assertion:
    └─ Run 10x in CI. If fails once → not fixed.
```

### Critical E2E Scenarios (Always Test)

```
Authentication:
  □ Sign up → verify email → login → logout
  □ Password reset flow
  □ OAuth login (Google/GitHub)
  □ Session expiry + redirect

Core Business:
  □ CRUD flow for primary entity
  □ Search → filter → sort → paginate
  □ Form submission with validation errors
  □ File upload + preview

Payment (if applicable):
  □ Add to cart → checkout → payment → confirmation
  □ Subscription upgrade/downgrade
  □ Payment failure → retry

Cross-Browser:
  □ Chrome (latest)
  □ Firefox (latest)
  □ Safari (latest, macOS)
  □ Mobile viewports (375px, 768px)
```

### Performance Testing with k6

```javascript
// Load test pattern
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up
    { duration: '5m', target: 50 },   // Sustain
    { duration: '2m', target: 100 },  // Spike
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // <1% failure rate
  },
};
```

### Coverage Strategy

| Layer | Minimum | Good | Excellent |
|-------|---------|------|-----------|
| Unit | 60% | 80% | 95%+ |
| Integration | 40% | 60% | 80%+ |
| E2E | Critical paths | Happy + error paths | Full matrix |
| Overall | 70% | 85% | 95%+ |

---

## 🔐 CVF Governance

### Authority Mapping

| Role | Permission |
|------|-----------|
| Orchestrator | Full: define testing strategy, approve coverage thresholds |
| Builder | Execute: write and run tests |
| Reviewer | Audit: verify test quality and coverage |
| Architect | Design: define E2E scenarios and performance targets |

### Phase Applicability

| Phase | Usage |
|-------|-------|
| B – Design | Define testing strategy and coverage targets |
| C – Build | Write and run tests (primary use) |
| D – Review | Audit test coverage and quality |

### Constraints

- MUST follow 70-20-10 pyramid ratios (±10%)
- MUST NOT skip Gate 1 (unit) to run Gate 3 (E2E)
- MUST fix flaky tests immediately, never quarantine
- MUST achieve minimum 60% unit coverage before merge
- MUST test all critical E2E scenarios before deploy
- R2 classification: can execute tests (external processes), requires supervision

---

## 🔗 Dependencies

- **AGT-023** (Systematic Debugging) — Debug failing tests
- **AGT-002** (Code Execute) — Run test commands
- **AGT-015** (Workflow Hook) — Pre-commit test automation
- **AGT-025** (API Architecture) — API test design

---

## 📊 Validation

### Success Criteria

| Criterion | Target |
|-----------|--------|
| Test pyramid adherence | 70±10% unit, 20±10% integration, 10±5% E2E |
| Flaky test rate | <2% of total tests |
| CI gate pass rate | ≥95% of builds pass all gates |
| Critical E2E coverage | 100% of critical paths tested |
| Performance baseline | P95 latency within thresholds |

### UAT Link

`governance/skill-library/uat/results/UAT-AGT-026.md`

---

## 📚 Attribution

- **Source:** [mrgoonie/claudekit-skills](https://github.com/mrgoonie/claudekit-skills) — web-testing (Playwright, Vitest, k6, testing pyramid)
- **Source:** [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) — testing commands and hooks
- **Pattern Type:** Framework-level testing strategy with automated gate enforcement
- **CVF Adaptation:** Added CI gate system, flakiness protocol, governance constraints, pyramid enforcement
- **License:** MIT/Apache-2.0 (sources) → CC BY-NC-ND 4.0 (CVF adaptation)

---

*Last Updated: February 17, 2026*
