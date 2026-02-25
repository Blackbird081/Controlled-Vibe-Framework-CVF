# Changelog

All notable changes to /**CVF – Controlled Vibe Framework**/ will be documented in this file.

## [2.1.0] - 2026-02-23

### Added
- **Toast Notifications** — react-hot-toast cho hardStop, escalation, autonomy, phase, freeze
- **PDF Export** — jsPDF + autoTable report (Session Info, Final State, Timeline) với page numbers
- **Session Comparison** — So sánh 2 sessions side-by-side trong `/history`
- **Keyboard Shortcuts** — `Ctrl+1-4` phase, `Ctrl+5-8` risk, `Ctrl+N` step, `Ctrl+Shift+F` freeze
- **Multi-tab Sync** — BroadcastChannel API đồng bộ sessions giữa các tab
- **Dashboard Analytics** — `/analytics` với KPIs, risk distribution, profile usage, event breakdown
- **Accessibility** — ARIA labels, `role`, `aria-label`, keyboard navigation, semantic `<nav>`

### Changed
- `page.tsx`: thêm navigation bar (Analytics + History + Dark Mode), PDF export, shortcuts reference
- `history/page.tsx`: rewrite hoàn toàn — thêm compare mode, PDF export, analytics link
- `ClientProviders.tsx`: thêm `<Toaster>` provider
- `useGovernanceSession.ts`: thêm toast notifications cho mọi governance events

## [2.0.0] - 2026-02-23

### Added
- **Unit Test Suite** — 49 tests (20 engine + 29 session manager) using Vitest
- **Error Boundary** — React ErrorBoundary prevents white screen on runtime errors
- **Input Validation** — Constructor validates `initialAutonomy` range (0–100)
- **EventEmitter Pattern** — `subscribe()` + `notify()` replaces `refresh` counter
- **`useSyncExternalStore`** — React 18 compatible reactive state updates
- **Custom Hook** — `useGovernanceSession()` extracts all logic from page.tsx
- **Session Persistence** — Auto-save to localStorage on every state change
- **Session Restore** — `SessionManager.restore()` for read-only replay
- **Session History Page** — `/history` with list/detail view, export, delete
- **Dark Mode** — Toggle with `localStorage` persistence
- **Autonomy Timeline Chart** — Inline SVG line chart with gradient fill
- **Strategy Comparison Table** — 3 profiles × 4 R-levels with emoji indicators
- **Micro-animations** — Phase pulse, risk pulse, slide-in, count-pop, glow effects

### Changed
- `page.tsx` refactored: logic moved to custom hook
- `SessionManager` upgraded to V2.0 with observer pattern
- Tailwind config: added `darkMode: "class"` strategy

### Fixed
- **15 bugs total** (8 original + 7 discovered during testing)
- Duplicate event logging across all mutation methods
- Profile selector UI desync after new session
- Strategy not re-evaluated on profile change

## [1.7.0] - 2026-02-22

### Added
- Governance Strategy Engine (3 profiles: Conservative, Balanced, Exploratory)
- Strategy Adapter pattern for dynamic profile switching
- Session lifecycle management (ACTIVE → FROZEN)
- Complete audit trail with governance events
- Phase indicator, trust indicator, autonomy badge components
- Governance timeline and export functionality
