<!-- Memory class: SUMMARY_RECORD -->

# CVF W130 Export Activation Contract

> Date: 2026-04-28
> Status: LOCKED
> Tranche: W130-T1 — Noncoder Evidence And Pack Export Activation
> Authorization: `docs/baselines/CVF_GC018_W130_T1_NONCODER_EVIDENCE_AND_PACK_EXPORT_ACTIVATION_AUTHORIZATION_2026-04-28.md`

---

## 1. Problem Statement

After the full W129 rollout (`evidence_export=no_data`, `deliverable_pack=no_data`),
no `evidence_exported` or `deliverable_pack_exported` event was fired in any of the
three stage captures. The analytics infrastructure is wired and tested, but the
affordances are visually buried inside the Export dropdown and the secondary Pack tab.

Noncoder users who complete a governed execution session do not encounter a clear
"save your results" moment.

---

## 2. UX Changes (binding)

### 2.1 Noncoder Export Nudge Section (`data-testid="noncoder-export-nudge"`)

**When shown:** `onFollowUp` prop is provided AND `output` is non-empty.

The `onFollowUp` prop is the accurate proxy for noncoder sessions. It is only passed
in `home/page.tsx` when the user reaches a completed execution via the noncoder
iteration memory path.

**Position:** After the pack view, before the follow-up section.

**Contents:**
- Section header: "Save your results" (EN) / "Lưu kết quả của bạn" (VI)
- Brief description explaining governance evidence and deliverable pack
- CTA 1: `data-testid="nudge-copy-evidence-btn"` — copies evidence receipt to clipboard;
  fires `trackEvent('evidence_exported', { format: 'receipt_copy' })` on click.
  Only rendered when `evidenceReceipt` is available.
- CTA 2: `data-testid="nudge-download-pack-btn"` — calls existing `handleDownloadPack()`;
  already fires `trackEvent('deliverable_pack_exported', ...)`.

### 2.2 Pack Tab Default In Noncoder Mode

**Change:** `viewMode` initial state uses `onFollowUp ? 'pack' : 'result'`.

When the `onFollowUp` prop is present (noncoder mode), the Pack tab is the first
visible tab. The Result tab remains accessible via click. The existing toggle is
not removed.

**Rationale:** The deliverable pack is the primary takeaway for noncoder users.
Showing it first makes the download CTA immediately visible without requiring a tab
click.

---

## 3. Analytics Events (existing — no new events)

| Event | Trigger | Handler |
|---|---|---|
| `evidence_exported` | Nudge "Copy Evidence Receipt" clicked | New `handleCopyReceiptWithTracking` |
| `deliverable_pack_exported` | Nudge "Download Pack" clicked | Existing `handleDownloadPack` |

Both events already exist in `AnalyticsEventType`. No additions required.

---

## 4. W128 Lane Exit Criteria

| Lane | Current | Target after W130 |
|---|---|---|
| `evidence_export` | `no_data` | exits `no_data` (≥1 `evidence_exported` event) |
| `deliverable_pack` | `no_data` | exits `no_data` (≥1 `deliverable_pack_exported` event) |

Lane exit is measured by the `computeLaneReadout` function in `noncoder-rollout-readout.ts`.
Both lanes use `evidence_export_rate` and `deliverable_pack_export_rate` which require
at least one event to compute a non-`no_data` status.

---

## 5. Test Contract

### Unit tests (ResultViewer.test.tsx — new tests)

| Test | Assertion |
|---|---|
| nudge renders when `onFollowUp` provided | `getByTestId('noncoder-export-nudge')` exists |
| nudge not rendered when `onFollowUp` absent | `queryByTestId('noncoder-export-nudge')` is null |
| nudge copy btn fires `evidence_exported` | `mockTrackEvent` called with `evidence_exported` |
| nudge pack btn fires `deliverable_pack_exported` | `mockTrackEvent` called with `deliverable_pack_exported` |
| pack tab is default in noncoder mode | viewMode === 'pack' class active on Pack button |

### E2E test (w130-evidence-pack-export.live.spec.ts)

- At least 1 `evidence_exported` event in localStorage analytics
- At least 1 `deliverable_pack_exported` event in localStorage analytics
- `evidence_export` lane exits `no_data`
- `deliverable_pack` lane exits `no_data`
- Live `/api/execute` call with real Alibaba key confirmed

---

## 6. Hard Constraints

1. No governance execution path changes
2. No new feature flags
3. No new analytics event types
4. ResultViewer existing 36 tests must all continue to pass
5. Export nudge must only appear when `output` is non-empty
6. No raw API key values may appear in any output
