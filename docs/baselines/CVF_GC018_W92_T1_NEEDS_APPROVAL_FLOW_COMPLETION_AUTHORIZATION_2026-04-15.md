# GC-018 Continuation Candidate — W92-T1 NEEDS_APPROVAL Flow Completion

Memory class: SUMMARY_RECORD

> Date: 2026-04-15
> Tranche: W92-T1
> Class: PRODUCT / NON_CODER_VALUE / WORKFLOW_COMPLETION
> Prerequisite status: Gate 1 MET (W90-T1); Gate 2 MET (W91-T1)

---

## Authorization Statement

W92-T1 is authorized to proceed.

All prerequisites are met:
- Gate 1 (≥8 HIGH_RISK patterns): MET — W90-T1 CLOSED DELIVERED
- Gate 2 (≥7/9 templates usable): MET — W91-T1 CLOSED DELIVERED 9/9 PASS
- Measurement standard: ACTIVE — `CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md` §7

---

## Scope

**Goal:** Build the NEEDS_APPROVAL front-door flow so non-coders have an actual action path — not a dead end.

**Exit criteria (per measurement standard §7):**
1. Non-coder can encounter `NEEDS_APPROVAL` ✓ (already exists)
2. Non-coder can take a visible next action from the front-door flow
3. Non-coder can create a reviewable approval request artifact
4. Non-coder sees a deterministic status lifecycle
5. Non-coder understands the next step after approval or rejection

Minimum lifecycle vocabulary: `submitted` → `pending` → `approved` / `rejected`

**NOT in scope:**
- Real-time push notifications for approval decisions
- Database persistence (in-memory store is sufficient for this tranche)
- Multi-approver workflows or routing logic
- Admin approval UI (approvers already have `/api/governance/approve`)
- Any W93/W94 scope
- Any UI redesign beyond the NEEDS_APPROVAL flow in ProcessingScreen

---

## Current State (Dead End)

When `enforcement.status === 'NEEDS_APPROVAL'`, ProcessingScreen:
- Sets an error message and shows the guided response panel
- Falls through to mock execution mode
- Provides NO action path for the non-coder

`/api/governance/approve` exists for approvers but there is NO endpoint for non-coders to **submit** an approval request. The `GovernanceApprovalState` type has `PENDING/APPROVED/REJECTED` vocabulary but it is never surfaced to non-coders.

---

## Implementation Plan

### New: `POST /api/approvals` + `GET /api/approvals/[id]`

- In-memory approval request store (module-level Map, resets on restart — sufficient for W92-T1 scope)
- `POST /api/approvals`: create approval request with fields: `id` (uuid), `templateId`, `templateName`, `intent`, `reason`, `status: 'pending'`, `submittedAt`
- `GET /api/approvals/[id]`: return current status for a given request ID
- No auth required for POST (non-coder submitting their own request)
- Returns: `{ id, status: 'pending', submittedAt, message }`

### Modified: `ProcessingScreen.tsx`

Add state:
- `approvalRequestId: string | null` — ID of submitted approval request
- `approvalSubmitting: boolean` — loading state for submit button

When `NEEDS_APPROVAL`:
- Show existing guided response panel (unchanged)
- Add "Submit for Review" button below the guided response
- On button click: POST to `/api/approvals`, set `approvalRequestId`
- After submission: replace button with status panel showing:
  - Request ID
  - Status: `submitted` → `pending`
  - What happens next explanation

### New: `ProcessingScreen.test.tsx` additions (W92-T1 section)

- Test: "Submit for Review" button renders on NEEDS_APPROVAL
- Test: button calls POST /api/approvals with correct templateId + intent
- Test: status panel shows after submission with request ID
- Test: button does not render for BLOCK (distinct from NEEDS_APPROVAL)

---

## Code Change Scope

| File | Change | Current Lines |
|---|---|---|
| `src/app/api/approvals/route.ts` | NEW — POST submit + GET list | 0 |
| `src/app/api/approvals/[id]/route.ts` | NEW — GET status by ID | 0 |
| `src/components/ProcessingScreen.tsx` | MODIFIED — add approval submission UI | 351 |
| `src/components/ProcessingScreen.test.tsx` | MODIFIED — add W92-T1 test section | 175 |

GC-023 compliance:
- ProcessingScreen.tsx: 351 → ~430 lines (advisory threshold: 700 — SAFE)
- ProcessingScreen.test.tsx: 175 → ~250 lines (advisory threshold: 800 — SAFE)
- New files: new, no existing limit

---

## Tranche Boundary

- Starts: this document
- Code changes: YES — new API routes + ProcessingScreen UI modifications
- Ends: post-run Gate 3 determination + GC-026 sync + handoff update

---

*Authorization filed: 2026-04-15 — W92-T1 NEEDS_APPROVAL Flow Completion*
