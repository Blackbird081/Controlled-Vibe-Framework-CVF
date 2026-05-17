# CVF – Controlled Vibe Framework V2.1

> Governance-first supervision layer for AI-assisted development.

---

## Giới thiệu

CVF Web UI là **Governance Dashboard** cho vibe coders, non-coders, và AI-supervised development teams.

**Không phải** AI engine, orchestration platform, hay agent OS.

CVF là hệ thống giám sát: hiển thị rủi ro, kiểm soát quyền hạn AI, quản lý phiên làm việc, và cung cấp audit trail.

---

## Kiến trúc

```
CVF Core (risk classification)
   ↓
GovernanceStrategyAdapter (behavioral reaction)
   ↓
SessionManager (state + audit log + lifecycle + EventEmitter)
   ↓
useGovernanceSession (React hook + useSyncExternalStore + Toast)
   ↓
Experience Layer (UI — read-only + keyboard shortcuts)
```

### Nguyên tắc

- **Core-first** — UI không tính toán risk hay governance logic
- **UI read-only** — chỉ đọc state, không can thiệp logic
- **Observer pattern** — SessionManager notify UI qua EventEmitter
- **Multi-tab sync** — BroadcastChannel API đồng bộ giữa các tab
- **Persistence** — Session auto-save qua localStorage

---

## Tính năng

| Tính năng | Mô tả |
|---|---|
| **Phase Awareness** | 4 phases: Discovery → Planning → Execution → Verification |
| **Strategy Profiles** | 3 profiles: Conservative, Balanced, Exploratory |
| **Risk Simulation** | R0 → R3, trigger strategy decisions |
| **Trust Indicator** | Semantic trust status (Safe / Monitor / High Risk / Critical) |
| **Autonomy Badge** | Semantic autonomy mode (Controlled / Semi-Auto / Autonomous) |
| **Autonomy Chart** | SVG line chart hiển thị autonomy theo thời gian |
| **Strategy Comparison** | Bảng so sánh 3 profiles × 4 R-levels |
| **Toast Notifications** | Real-time alerts cho hardStop, escalation, autonomy changes |
| **PDF Export** | Audit report PDF (jsPDF) — Session Info, State, Timeline |
| **Session Comparison** | So sánh 2 sessions side-by-side |
| **Keyboard Shortcuts** | Ctrl+1-4 phase, Ctrl+5-8 risk, Ctrl+N step, Ctrl+Shift+F freeze |
| **Dashboard Analytics** | `/analytics` — KPIs, risk distribution, event breakdown |
| **Session Persistence** | Auto-save localStorage, restore on reload |
| **Session History** | Xem lại, so sánh, export, xóa sessions đã lưu |
| **Dark Mode** | Toggle 🌙/☀️ với localStorage persistence |
| **Multi-tab Sync** | BroadcastChannel API đồng bộ real-time |
| **Accessibility** | ARIA labels, keyboard navigation, semantic HTML |
| **Error Boundary** | Bảo vệ khỏi white screen khi runtime error |
| **Unit Tests** | 49 tests (Vitest) — engine + session manager |

---

## Cấu trúc thư mục

```
cvf-web/
├── app/
│   ├── globals.css                     ← Dark mode + animations
│   ├── layout.tsx                      ← Root layout + ErrorBoundary
│   ├── page.tsx                        ← Dashboard (9 sections)
│   ├── history/
│   │   └── page.tsx                    ← Session History + Comparison
│   └── analytics/
│       └── page.tsx                    ← Dashboard Analytics
│
├── components/
│   ├── ErrorBoundary.tsx
│   ├── ClientProviders.tsx             ← ErrorBoundary + Toaster
│   └── governance/
│       ├── TrustIndicator.tsx
│       ├── AutonomyStatusBadge.tsx
│       ├── AutonomyChart.tsx           ← SVG line chart
│       ├── GovernanceActionPrompt.tsx
│       ├── PhaseIndicator.tsx
│       ├── PhasePermissionNotice.tsx
│       ├── GovernanceProfileSelector.tsx
│       ├── StrategyComparisonTable.tsx ← Profile comparison
│       ├── GovernancePDFExport.tsx     ← PDF report
│       ├── DarkModeToggle.tsx
│       ├── GovernanceTimeline.tsx
│       ├── GovernanceEventItem.tsx
│       └── GovernanceExportButton.tsx
│
├── hooks/
│   ├── useGovernanceSession.ts         ← Custom hook + Toast + auto-save
│   ├── useKeyboardShortcuts.ts         ← Keyboard shortcuts
│   └── useMultiTabSync.ts              ← BroadcastChannel sync
│
├── lib/
│   ├── sessionManager.ts              ← State + audit + lifecycle + EventEmitter
│   ├── storage/
│   │   ├── sessionSerializer.ts       ← Serialize/deserialize
│   │   └── sessionStorage.ts          ← localStorage adapter
│   └── strategy/
│       ├── governanceStrategy.types.ts
│       ├── governanceStrategy.config.ts
│       ├── governanceStrategy.engine.ts
│       └── governanceStrategy.adapter.ts
│
├── __tests__/
│   ├── governanceStrategy.engine.test.ts   ← 20 tests
│   └── sessionManager.test.ts              ← 29 tests
│
├── .github/workflows/ci.yml           ← GitHub Actions CI
├── CHANGELOG.md
├── UPGRADE_RECOMMENDATIONS.md         ← 8 đề xuất nâng cấp còn lại
├── vitest.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── next.config.js
```

---

## Chạy ứng dụng

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`

### Chạy tests

```bash
npm test            # Run once
npm run test:watch  # Watch mode
```

### Build

```bash
npm run build
```

---

## Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: TailwindCSS + CSS Variables (dark mode)
- **State**: SessionManager + EventEmitter + `useSyncExternalStore`
- **Notifications**: react-hot-toast
- **PDF**: jsPDF + jspdf-autotable
- **Testing**: Vitest
- **CI/CD**: GitHub Actions

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+1-4` | Set Phase (discovery/planning/execution/verification) |
| `Ctrl+5-8` | Set Risk (R0/R1/R2/R3) |
| `Ctrl+N` | Next Step |
| `Ctrl+Shift+F` | Freeze Session |

---

## Tài liệu

- `CHANGELOG.md` — Lịch sử thay đổi (V1.7 → V2.0 → V2.1)
- `UPGRADE_RECOMMENDATIONS.md` — 8 đề xuất nâng cấp còn lại
- `docs/archive/` — Tài liệu V1.6 và V1.7 blueprint gốc
