# CVF v1.6.1 → Web UI Integration — Assessment & Roadmap

> **Date:** 2026-02-21  
> **Scope:** Tích hợp v1.6.1 Governance Engine vào cvf-web (v1.6)  
> **Target:** Nâng cvf-web từ "client-side governance demo" → "enterprise governance platform"

---

## Part 1: Assessment — cvf-web hiện tại vs v1.6.1

### 1.1 cvf-web Governance Stack (TypeScript — Client-side)

| Capability | File | Cách hoạt động | Hạn chế |
|---|---|---|---|
| Quality Scoring | `src/lib/governance.ts` | 4-dim (completeness/clarity/actionability/compliance), format-based heuristics | Chỉ check format (headers, lists, code blocks, length) — không đánh giá correctness/safety |
| Risk Gate | `src/lib/risk-check.ts` | Regex parse R0-R3 từ text | Chỉ R0-R3 (thiếu R4), regex-based |
| Enforcement | `src/lib/enforcement.ts` | Budget + Spec gate + Risk gate → ALLOW/CLARIFY/BLOCK/NEEDS_APPROVAL | Client-side, không persistent, không multi-step approval |
| Spec Gate | `src/lib/spec-gate.ts` | Validate required fields → PASS/CLARIFY/FAIL | Chỉ check field presence |
| Safety | `src/lib/safety.ts` | 4 regex patterns prompt injection + 4 PII patterns | Regex-only, dễ bypass |
| Factual Scoring | `src/lib/factual-scoring.ts` | Jaccard/coverage/alignment → factual risk level | Client-side overlap calculation |
| Governance Context | `src/lib/governance-context.ts` | Phase (INTAKE→FREEZE), Role (OBSERVER→GOVERNOR), Risk (R0-R3) | Action-list authority chỉ, không có max_risk per phase |
| Enforcement Log | `src/lib/enforcement-log.ts` | `trackEvent()` to analytics | In-memory, mất khi refresh |
| Decision Log | `DecisionLogSidebar.tsx` | Props-based entries (`gate_approved/rejected/checklist_updated/retry`) | React state — mất khi refresh |
| Quality Badge | `QualityScoreBadge.tsx` | `⭐ {score.overall}% {label}` | Chỉ overall %, không show breakdown |

### 1.2 cvf-web Tech Stack

| Component | Version |
|---|---|
| Next.js | 16.1.6 |
| React | 19.2.3 |
| Zustand | 5.0.11 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| Vitest | 4.0.18 |
| Tests | 1255 passing |

### 1.3 Existing API Routes

| Route | Purpose |
|---|---|
| `/api/auth/login` | Authentication |
| `/api/auth/logout` | Logout |
| `/api/auth/me` | Current user |
| `/api/execute` | AI execution |
| `/api/pricing` | Pricing info |
| `/api/providers` | AI providers |

**→ Không có governance API route nào**

### 1.4 v1.6.1 Capabilities MỚI (cvf-web chưa có)

| # | Capability | v1.6.1 Module | Giá trị mang lại |
|---|---|---|---|
| 1 | Server-side governance pipeline | `core_orchestrator.py` | Deterministic 8-step evaluation thay client heuristics |
| 2 | REST API (5 endpoints) | `api/server.py` | Sẵn sàng integrate — `/evaluate`, `/approve`, `/ledger`, `/health`, `/risk-convert` |
| 3 | Multi-level approval workflow | `approval_layer/approval_workflow.py` | 4-cấp duyệt, SLA, escalation, override |
| 4 | Escalation engine | `approval_layer/escalation_engine.py` | Auto-escalate REJECTED → executive, FROZEN → admin |
| 5 | Policy-as-Code DSL | `policy_dsl/` | User tự viết rules RULE/WHEN/THEN, không cần code changes |
| 6 | Immutable hash-chain ledger | `ledger_layer/` | Persistent, tamper-evident, chain-validated audit trail |
| 7 | Policy simulation | `simulation_layer/` | What-if analysis: baseline vs new policy, impact ratio |
| 8 | Brand drift protection | `brand_control_layer/` | Token-based drift detection + auto-freeze |
| 9 | Compliance engine | `compliance_layer/` | HTML/CSS compliance, contrast engine, severity matrix |
| 10 | Override governance | `override_layer/` | Controlled overrides with expiry, tokens, schema validation |
| 11 | Decision matrix | `enforcement_layer/decision_matrix.py` | Prioritized rules, cumulative risk, ALLOW/DENY/REVIEW/ESCALATE/SANDBOX |
| 12 | Telemetry & trends | `telemetry_layer/` | Project scorecard (4 metrics), risk trend INCREASING/STABLE/DECREASING |
| 13 | Phase authority (granular) | `adapters/cvf_enforcement_adapter.py` | `can_approve`, `can_override`, `max_risk` per phase A-E |
| 14 | 4-dim quality (enhanced) | `adapters/cvf_quality_adapter.py` | Correctness, Safety (2x), Alignment, Quality + letter grades A-F |

---

## Part 2: Integration Roadmap

### Sprint Overview

| Sprint | Focus | Duration | Deliverables |
|---|---|---|---|
| **Sprint 1** | Foundation — API proxy + types | 2-3 ngày | Governance API routes, shared types, environment config |
| **Sprint 2** | Persistent Audit — Ledger viewer | 2-3 ngày | LedgerExplorer component, chain validation, replace DecisionLog |
| **Sprint 3** | Enhanced Scoring — Quality 4-dim | 1-2 ngày | QualityRadar component, 4-dimension breakdown, letter grades |
| **Sprint 4** | Approval Workflow UI | 3-4 ngày | ApprovalPanel, multi-step flow, SLA timers, escalation |
| **Sprint 5** | Phase Authority + Risk | 1-2 ngày | Server-side phase enforcement, R4 support, max_risk per phase |
| **Sprint 6** | Telemetry Dashboard | 2-3 ngày | Trend charts, project scorecard, risk heatmap |
| **Sprint 7** | Policy Simulation | 3-4 ngày | DSL editor, simulation runner, impact comparison |
| **Sprint 8** | Brand Drift + Override | 2-3 ngày | Drift indicator, override request/approval UI |
| **Total** | | **~16-24 ngày** | |

---

### Sprint 1: Foundation — API Proxy + Shared Types

**Goal:** Kết nối cvf-web với v1.6.1 FastAPI server qua Next.js API routes

#### 1.1 Environment Config

```
File: cvf-web/.env.local (new entries)

GOVERNANCE_ENGINE_URL=http://localhost:8000
GOVERNANCE_ENGINE_ENABLED=true
GOVERNANCE_ENGINE_TIMEOUT=5000
```

#### 1.2 Governance API Client

```
File: src/lib/governance-engine.ts (NEW)

Purpose: HTTP client wrapper cho v1.6.1 API
- governanceEvaluate(payload) → GovernanceEngineResult
- governanceApprove(payload) → ApprovalResult
- governanceLedger() → LedgerEntry[]
- governanceHealth() → HealthStatus
- governanceRiskConvert(level, direction) → ConvertedRisk
- Error handling: timeout, retry, fallback to client-side
```

#### 1.3 Next.js API Routes (Server-side proxy)

```
Files (NEW):
  src/app/api/governance/evaluate/route.ts   → proxy POST /api/v1/evaluate
  src/app/api/governance/approve/route.ts    → proxy POST /api/v1/approve
  src/app/api/governance/ledger/route.ts     → proxy GET  /api/v1/ledger
  src/app/api/governance/health/route.ts     → proxy GET  /api/v1/health
  src/app/api/governance/risk-convert/route.ts → proxy POST /api/v1/risk-convert
```

#### 1.4 Shared Types

```
File: src/types/governance-engine.ts (NEW)

// v1.6.1 response types
interface GovernanceEngineResult {
  status: 'APPROVED' | 'MANUAL_REVIEW' | 'REJECTED' | 'FROZEN';
  risk_score: number;
  risk_level: string;
  decision: object;
  compliance_result: object | null;
  brand_result: object | null;
  cvf_risk_level: string;      // "R0"-"R4"
  cvf_risk_tier: string;       // "LOW"-"CRITICAL"
  cvf_quality: CVFQualityResult;
  cvf_enforcement: CVFEnforcementResult;
  ledger_hash: string;
  timestamp: string;
}

interface CVFQualityResult {
  correctness: number;     // 0-1
  safety: number;          // 0-1 (2x weight)
  alignment: number;       // 0-1
  quality: number;         // 0-1
  overall: number;         // weighted 0-1
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface CVFEnforcementResult {
  action: 'ALLOW' | 'BLOCK' | 'NEEDS_APPROVAL' | 'ESCALATE' | 'LOG_ONLY';
  phase_authority: {
    phase: string;
    can_approve: boolean;
    can_override: boolean;
    max_risk: string;
  };
}

interface LedgerBlock {
  hash: string;
  previous_hash: string;
  event: object;
  timestamp: string;
  block_index: number;
}

interface ApprovalRequest {
  request_id: string;
  status: string;
  current_step: number;
  total_steps: number;
  approvers: ApprovalStep[];
  sla_deadline: string | null;
  escalation_status: string | null;
}

interface ApprovalStep {
  role: string;
  approver: string | null;
  decision: string | null;
  timestamp: string | null;
  comment: string | null;
}
```

#### 1.5 Enforcement Integration (Dual-mode)

```
File: src/lib/enforcement.ts (MODIFY)

Add optional backend path:
- If GOVERNANCE_ENGINE_ENABLED && server reachable:
    → Call /api/governance/evaluate
    → Map GovernanceEngineResult → EnforcementResult
- Else:
    → Fall back to existing client-side evaluation
    
New function:
export async function evaluateEnforcementAsync(
  input: EnforcementInput
): Promise<EnforcementResult>
```

#### 1.6 Tests

```
Files (NEW):
  src/lib/__tests__/governance-engine.test.ts
  src/app/api/governance/evaluate/route.test.ts
  src/app/api/governance/health/route.test.ts
```

**Definition of Done:**
- [ ] API routes proxying correctly to FastAPI
- [ ] Fallback hoạt động khi v1.6.1 server unavailable
- [ ] Health check hiển thị trạng thái connection
- [ ] Tests pass (target: +15 tests)

---

### Sprint 2: Persistent Audit — Ledger Viewer

**Goal:** Thay thế in-memory DecisionLog bằng persistent immutable ledger

#### 2.1 LedgerExplorer Component

```
File: src/components/LedgerExplorer.tsx (NEW)

Features:
- Fetch từ /api/governance/ledger
- Hiển thị blockchain-style blocks:
  - Block index, timestamp
  - Hash (truncated) + copy button
  - Previous hash link
  - Event details (decision, risk, phase)
- Chain integrity indicator:
  - ✅ Green: chain valid
  - ❌ Red: tamper detected
- Filters: phase, risk level, date range, status
- Pagination (ledger có thể dài)
- Export JSON/CSV
```

#### 2.2 Client-side Chain Validation

```
File: src/lib/ledger-validator.ts (NEW)

Purpose: Verify hash chain integrity in browser
- validateChain(blocks: LedgerBlock[]): { valid: boolean, brokenAt?: number }
- Uses SubtleCrypto API (Web Crypto) cho SHA256
- Highlights broken block nếu tampered
```

#### 2.3 DecisionLogSidebar Enhancement

```
File: src/components/DecisionLogSidebar.tsx (MODIFY)

- Add tab: "Local Log" (existing) | "Audit Ledger" (new)
- "Audit Ledger" tab renders LedgerExplorer
- Keep "Local Log" tab for offline/fallback
- Add "Sync to Ledger" button: push local entries → /api/governance/evaluate
```

#### 2.4 Zustand Store Extension

```
File: src/lib/store.ts (MODIFY)

Add governance slice:
- ledgerEntries: LedgerBlock[]
- ledgerValid: boolean
- lastLedgerSync: string | null
- Actions: fetchLedger(), validateLedger()
```

**Definition of Done:**
- [ ] Ledger viewer hiển thị hash-chained blocks
- [ ] Chain validation chạy client-side
- [ ] Tamper detection visual indicator
- [ ] Filter + pagination hoạt động
- [ ] Tests pass (target: +12 tests)

---

### Sprint 3: Enhanced Quality Scoring — 4 Dimensions

**Goal:** Nâng quality scoring từ format-based → 4-dimension model với letter grades

#### 3.1 Extended Quality Types

```
File: src/lib/governance.ts (MODIFY)

Add:
interface EnhancedQualityScore extends QualityScore {
  // Existing: overall, completeness, clarity, actionability, compliance
  // New from v1.6.1:
  correctness: number;  // 0-100
  safety: number;       // 0-100 (2x weight)
  alignment: number;    // 0-100
  qualityDim: number;   // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  source: 'client' | 'server';
}
```

#### 3.2 Quality Radar Component

```
File: src/components/QualityRadar.tsx (NEW)

Features:
- Radar/spider chart hiển thị 4 dimensions
- Color-coded: green (A/B), yellow (C), red (D/F)
- Letter grade badge lớn ở center
- Tooltip giải thích từng dimension
- Toggle: simple view (existing badge) / detailed view (radar)
- Mobile: collapse thành horizontal bar chart
```

#### 3.3 QualityScoreBadge Enhancement

```
File: src/components/QualityScoreBadge.tsx (MODIFY)

- Show letter grade nếu có: "⭐ 85% B"
- Click → expand QualityRadar popup
- Color based on grade thay vì chỉ score number
```

**Definition of Done:**
- [ ] Quality radar hiển thị 4 dimensions khi server connected
- [ ] Letter grades A-F hiển thị
- [ ] Fallback: vẫn hiện existing format score khi offline
- [ ] Tests pass (target: +8 tests)

---

### Sprint 4: Approval Workflow UI

**Goal:** Multi-level approval flow thay thế simple NEEDS_APPROVAL flag

#### 4.1 ApprovalPanel Component

```
File: src/components/ApprovalPanel.tsx (NEW)

Features:
- Approval pipeline visualization (step-by-step):
  DEVELOPER → TEAM_LEAD → SECURITY_OFFICER → EXECUTIVE_APPROVER
- Each step shows: role, approver name, status icon, timestamp
- Current step highlighted
- SLA countdown timer (live ticking)
- Escalation badge khi auto-escalated
- Action buttons: Approve / Reject / Comment
- Role-based: chỉ show actions cho role phù hợp
```

#### 4.2 ApprovalModal Component

```
File: src/components/ApprovalModal.tsx (NEW)

Trigger: khi enforcement returns NEEDS_APPROVAL
- Shows: risk level, reasons, required approvers
- Input: comment/justification
- Submit → POST /api/governance/approve
- Real-time update khi approval step completes
```

#### 4.3 Approval Notification System

```
File: src/lib/approval-notifications.ts (NEW)

- Poll /api/governance/evaluate for status changes (interval: 5s)
- Toast notifications khi:
  - Approval request created
  - Step approved/rejected
  - SLA approaching deadline (< 1 hour)
  - Auto-escalated
  - Final approved/rejected
```

#### 4.4 GovernanceBar Integration

```
File: src/components/GovernanceBar.tsx (MODIFY)

- Add approval status indicator
- Badge count: pending approvals
- Click → open ApprovalPanel
```

**Definition of Done:**
- [ ] Multi-step approval pipeline hiển thị đúng
- [ ] Approve/reject actions gửi đến API
- [ ] SLA countdown hoạt động
- [ ] Escalation hiển thị
- [ ] Tests pass (target: +15 tests)

---

### Sprint 5: Phase Authority + R4 Support

**Goal:** Server-side phase enforcement với `can_approve`, `can_override`, `max_risk`

#### 5.1 Enhanced Phase Authority

```
File: src/lib/governance-context.ts (MODIFY)

Update types:
- CVFRiskLevel: add 'R4'
- Add PhaseAuthority interface:
  { can_approve: boolean, can_override: boolean, max_risk: CVFRiskLevel }
- PHASE_AUTHORITY_MATRIX: Record<CVFPhaseToolkit, PhaseAuthority>
  INTAKE → { can_approve: false, can_override: false, max_risk: 'R1' }
  DESIGN → { can_approve: false, can_override: false, max_risk: 'R2' }
  BUILD  → { can_approve: true,  can_override: false, max_risk: 'R3' }
  REVIEW → { can_approve: true,  can_override: true,  max_risk: 'R3' }
  FREEZE → { can_approve: true,  can_override: true,  max_risk: 'R4' }
```

#### 5.2 Risk Gate Enhancement

```
File: src/lib/risk-check.ts (MODIFY)

- Add R4 support: R4 always → BLOCK (no override possible except Phase E)
- Phase-aware risk gate: check max_risk per current phase
- New: getRiskSeverityColor('R4') → 'red-900'
```

#### 5.3 GovernanceBar Visual Updates

```
File: src/components/GovernanceBar.tsx (MODIFY)

- R4 option in risk selector (with WARNING icon)
- Phase authority indicators: lock icon if !can_approve, key icon if can_override
- Tooltip: "Phase BUILD: max risk R3, cannot override"
```

**Definition of Done:**
- [ ] R4 hiển thị và enforce
- [ ] Phase authority limits risk selection
- [ ] Visual indicators cho phase capabilities
- [ ] Tests pass (target: +10 tests)

---

### Sprint 6: Telemetry Dashboard

**Goal:** Governance health metrics + risk trend visualization

#### 6.1 GovernanceMetrics Component

```
File: src/components/GovernanceMetrics.tsx (NEW)

4 metric cards:
- Risk Index (0-1, color gradient)
- Approval Efficiency (% approved / total)
- Governance Stability (decision consistency over time)
- Compliance Integrity (% compliant evaluations)

Data source: new API endpoint wrapping TelemetryExporter + ProjectScorecard
```

#### 6.2 RiskTrendChart Component

```
File: src/components/RiskTrendChart.tsx (NEW)

- Line chart: risk scores over time (last 7/30/90 days)
- Trend indicator: ↗ INCREASING (red) / → STABLE (yellow) / ↘ DECREASING (green)
- Overlay: approval/rejection events as markers
- Filter by project
```

#### 6.3 AnalyticsDashboard Integration

```
File: src/components/AnalyticsDashboard.tsx (MODIFY)

Add new tab: "Governance Health"
- GovernanceMetrics (4 cards)
- RiskTrendChart
- Decision distribution pie chart (APPROVED/REVIEW/REJECTED/FROZEN)
- Phase distribution bar chart
```

#### 6.4 API Endpoints

```
Files (NEW):
  src/app/api/governance/metrics/route.ts     → project scorecard
  src/app/api/governance/trends/route.ts      → risk trend data
```

**Definition of Done:**
- [ ] 4 metric cards hiển thị real data
- [ ] Risk trend chart hoạt động
- [ ] Trend indicator chính xác
- [ ] Tests pass (target: +12 tests)

---

### Sprint 7: Policy Simulation

**Goal:** DSL editor + what-if analysis trực tiếp trong browser

#### 7.1 Policy Editor Component

```
File: src/components/PolicyEditor.tsx (NEW)

- Code editor with DSL syntax highlighting
  (option: Monaco Editor hoặc CodeMirror 6)
- Syntax: RULE/WHEN/THEN
- Auto-complete cho field names (violation, risk_score, cvf_phase, cvf_risk_level)
- Validation: highlight lỗi syntax
- Save/load policies
```

#### 7.2 SimulationRunner Component

```
File: src/components/SimulationRunner.tsx (NEW)

- Upload hoặc chọn sample scenarios
- Run: baseline policy vs edited policy
- Results:
  - Impact ratio (% decisions changed)
  - Side-by-side comparison table
  - Changed decisions highlighted (red/green diff)
  - Risk: nếu impact > 30% → warning
```

#### 7.3 Simulation Page

```
File: src/app/(main)/simulation/page.tsx (NEW)

Layout:
┌──────────────────────────┬──────────────────────────┐
│  Policy Editor           │  Simulation Results      │
│  (left panel)            │  (right panel)           │
│                          │                          │
│  RULE ...                │  Impact: 15%             │
│  WHEN ...                │  Changed: 3/20 decisions │
│  THEN ...                │                          │
│                          │  ┌─────┬────────┬──────┐ │
│  [Run Simulation]        │  │ # │ Before │ After │ │
│  [Save Policy]           │  │ 1 │ ALLOW  │ BLOCK │ │
│                          │  │...│ ...    │ ...   │ │
└──────────────────────────┴──────────────────────────┘
```

#### 7.4 API Endpoint

```
File: src/app/api/governance/simulate/route.ts (NEW)

POST { baseline_dsl: string, new_dsl: string, scenarios: object[] }
→ proxy to v1.6.1 simulation endpoint (needs new FastAPI endpoint)
```

**Definition of Done:**
- [ ] DSL editor với syntax highlighting
- [ ] Simulation chạy và hiển thị impact
- [ ] Side-by-side comparison
- [ ] Tests pass (target: +10 tests)

---

### Sprint 8: Brand Drift + Override Governance

**Goal:** Brand protection UI + controlled override mechanism

#### 8.1 BrandDriftIndicator Component

```
File: src/components/BrandDriftIndicator.tsx (NEW)

- Drift score bar (0-100%): green < 20%, yellow 20-50%, red > 50%
- Token-level diff viewer: approved config vs current
- Freeze status badge: 🔒 FROZEN / ✅ COMPLIANT / ⚠️ DRIFTING
- Trigger: khi system prompt hoặc config thay đổi
```

#### 8.2 OverrideRequestModal Component

```
File: src/components/OverrideRequestModal.tsx (NEW)

Trigger: khi enforcement BLOCK + user wants exception
- Form:
  - Justification (required, min 50 chars)
  - Scope: this request only / project-wide
  - Expiry date selector (max 30 days)
  - Risk acknowledgment checkbox
- Submit → POST /api/governance/override (new endpoint)
- Shows override token + expiry countdown after approval
```

#### 8.3 Active Overrides Indicator

```
File: src/components/ActiveOverrides.tsx (NEW)

- List active overrides: scope, expiry countdown, approved_by
- Visual: ⏳ badge with count in GovernanceBar
- Warning khi approaching expiry (< 24h)
- Auto-remove expired overrides
```

#### 8.4 API Endpoints

```
Files (NEW):
  src/app/api/governance/brand-drift/route.ts  → brand guardian check
  src/app/api/governance/override/route.ts     → override CRUD
```

**Definition of Done:**
- [ ] Brand drift indicator hiển thị
- [ ] Override request workflow hoạt động
- [ ] Expiry countdown chính xác
- [ ] Tests pass (target: +12 tests)

---

## Part 3: Technical Requirements

### 3.1 v1.6.1 Server Requirements

```
Deployment: v1.6.1 FastAPI server phải chạy cùng lúc với cvf-web

Development:
  Terminal 1: cd cvf-web && npm run dev           # port 3000
  Terminal 2: cd ai_governance_core && uvicorn api.server:app --port 8000

Production (Docker Compose — future):
  services:
    web:
      build: ./cvf-web
      ports: ["3000:3000"]
      environment:
        GOVERNANCE_ENGINE_URL: http://governance:8000
    governance:
      build: ./ai_governance_core
      ports: ["8000:8000"]
```

### 3.2 New v1.6.1 API Endpoints Needed

Sprint 6-8 cần thêm endpoints ở v1.6.1 server:

| Endpoint | Sprint | Purpose |
|---|---|---|
| `GET /api/v1/metrics/{project_id}` | 6 | Project scorecard |
| `GET /api/v1/trends/{project_id}` | 6 | Risk trend data |
| `POST /api/v1/simulate` | 7 | Run policy simulation |
| `GET /api/v1/brand-drift` | 8 | Brand drift check |
| `POST /api/v1/override` | 8 | Request override |
| `GET /api/v1/overrides/active` | 8 | List active overrides |

### 3.3 Test Targets

| Sprint | New Tests | Cumulative |
|---|---|---|
| Sprint 1 | +15 | 1270 |
| Sprint 2 | +12 | 1282 |
| Sprint 3 | +8 | 1290 |
| Sprint 4 | +15 | 1305 |
| Sprint 5 | +10 | 1315 |
| Sprint 6 | +12 | 1327 |
| Sprint 7 | +10 | 1337 |
| Sprint 8 | +12 | 1349 |
| **Total** | **+94** | **~1349** |

### 3.4 Dependencies (cvf-web)

```
New packages needed:
  @monaco-editor/react  — Sprint 7 (DSL editor)
  recharts              — Sprint 6 (trend charts, nếu chưa có)
  
Existing packages sufficient:
  zustand               — store extension
  lucide-react          — icons
  tailwind              — styling
  vitest                — tests
```

---

## Part 4: Priority & Phasing

### Phase I — Core Integration (Sprint 1-3)
**ROI cao nhất, effort thấp nhất**

```
Sprint 1: API Proxy         → Mở cổng kết nối
Sprint 2: Ledger Viewer      → Persistent audit (thay React state)
Sprint 3: Quality 4-dim      → Enhanced scoring
```

→ Kết quả: cvf-web có backend governance + persistent audit + quality grades
→ Effort: 5-8 ngày
→ Tests: +35

### Phase II — Enterprise Features (Sprint 4-5)
**Differentiation — enterprise capabilities**

```
Sprint 4: Approval Workflow   → Multi-level approval
Sprint 5: Phase Authority     → Granular enforcement
```

→ Kết quả: Full approval pipeline + R4 + phase-aware risk
→ Effort: 4-6 ngày
→ Tests: +25

### Phase III — Analytics & Simulation (Sprint 6-7)
**Insights & policy management**

```
Sprint 6: Telemetry Dashboard → Governance health metrics
Sprint 7: Policy Simulation   → What-if analysis
```

→ Kết quả: Health dashboard + DSL editor + simulation
→ Effort: 5-7 ngày
→ Tests: +22

### Phase IV — Protection & Control (Sprint 8)
**Advanced governance**

```
Sprint 8: Brand Drift + Override → Protection + exceptions
```

→ Kết quả: Brand drift + controlled override
→ Effort: 2-3 ngày
→ Tests: +12

---

## Part 5: Risk & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| v1.6.1 server unavailable | Web UI governance fails | Dual-mode: fallback to client-side evaluation |
| Latency added by API calls | Slower UX | Optimistic UI, show client-side result first → update with server result |
| Breaking changes in v1.6.1 API | Integration breaks | Version header in API, contract tests |
| Monaco Editor bundle size | Larger initial load | Dynamic import, code-split simulation page |
| Zustand store migration | Data loss | Versioned persist migration |

---

*Roadmap generated: 2026-02-21 | Target completion: Phase I in ~1 week*
