 ---
  CVF v1.6 Governance & Security Review

  Following ULTRAREVIEW_INSTRUCTIONS.txt scope. Findings first, ordered by severity.

  ---
  CRITICAL

  1. In-Memory Approval Store — Volatile Governance State

  Why it matters: Approval decisions for high-risk (R3+) operations persist only in a JavaScript Map. A server restart, crash, or redeploy erases every
  pending and approved record, breaking audit trail integrity and potentially allowing previously-blocked requests to be re-evaluated from scratch.

  Files:
  - src/app/api/approvals/store.ts — entire store is new Map<string, ApprovalRequestRecord>()
  - src/app/api/approvals/[id]/route.ts — record.status = action mutates in-memory; no write-through
  - src/app/api/approvals/route.ts — getApprovalStore().set(id, record), no DB or file sync

  Scenario: Admin approves R3 operation → server restarts → user polls approval status → record gone → enforcement re-blocks; or (in a weak-enforcement
  path) re-evaluation accidentally passes without the original approval audit chain.

  Fix direction: Persist approval records to a stable store (file-backed JSON or external DB) and reload on startup. Atomic writes to prevent corruption.

  ---
  HIGH

  2. Service Token Auth — Simple String Comparison, No Rate-Limit Isolation

  Why it matters: x-cvf-service-token is verified with a plain === string compare. All service-token callers share a single rate-limit identity ('service'),
   so one aggressive caller can exhaust the bucket for all automated systems, and a leaked token is immediately usable with no signature or HMAC binding.

  Files:
  - src/app/api/execute/route.ts lines 115–117 — serviceToken === configuredServiceToken
  - src/lib/rate-limit.ts — callers without session collapse to 'service' identity

  Scenario: Attacker extracts token from env/logs; calls /api/execute from any machine; rate limiter sees one 'service' bucket shared with legitimate
  callers.

  Fix direction: Sign requests with HMAC-SHA256 (token is a signing key, not the secret itself); give each service token its own rate-limit identity.

  ---
  3. Approved Execution Not Re-Validated Against Original Intent

  Why it matters: When a request is approved, the approval record stores advisory metadata (riskLevel, phase, reason). At execution time, if a user provides
   the same approvalId with a different request body, the system does not verify the current request matches the approved snapshot.

  Files:
  - src/app/api/execute/route.ts lines 324–351 — creates approval record
  - src/app/api/approvals/[id]/route.ts lines 45–100 — approves without re-binding to original request hash

  Scenario: User gets R3 approval for "Deploy application" → modifies body to "Deploy + grant admin access" → reuses approvalId → original approval may
  cover the new, higher-risk intent.

  Fix direction: Store a content hash of the original request in the approval record; reject execution if the current request hash diverges.

  ---
  4. Break-Glass Token Never Expires in Code

  Why it matters: BREAK_GLASS_SESSION sets expiresAt: Number.MAX_SAFE_INTEGER. The token is a static env var with no code-enforced TTL. Even if rotation is
  documented, it is not enforced — a leaked token is permanently valid until manually rotated.

  Files:
  - src/lib/admin-session.ts lines 22–30 — expiresAt: Number.MAX_SAFE_INTEGER
  - src/lib/admin-session.ts lines 58–85 — resolveBreakGlassSession() fires audit but returns session immediately

  Scenario: Token leaks in a CI log or container image; attacker uses it indefinitely for owner-level impersonation.

  Fix direction: Encode issued-at timestamp in the token; enforce max lifetime (e.g., 30 days) in resolveBreakGlassSession(); reject if now - issuedAt >
  MAX_LIFETIME.

  ---
  5. Provider Router DENY Fallback — Fragile Logic

  Why it matters: routingResult.selectedProvider ?? provider falls back to the originally-requested provider if the router returns null. This is only safe
  because a separate if (decision === 'DENY') return error guard precedes it. If that guard is ever moved or refactored, the fallback directly defeats
  routing policy.

  Files:
  - src/app/api/execute/route.ts line 480 — routingResult.selectedProvider ?? provider
  - src/lib/ai/provider-router-adapter.ts lines 244–267 — DENY returns selectedProvider: null

  Fix direction: Assert if (!routingResult.selectedProvider && routingResult.decision !== 'ALLOW') throw — make the safe path explicit, not a by-product of
  guard ordering.

  ---
  6. Governance Engine Downtime Falls Back Silently to Client-Side Enforcement

  Why it matters: If the external governance engine is unreachable, evaluateEnforcementAsync catches the error and calls the local evaluateEnforcement()
  fallback. This is weaker (no live policy queries, no server-side data bindings). No alert fires, no audit event marks the degradation.

  Files:
  - src/lib/enforcement.ts lines 240–243 — if (!isGovernanceEngineEnabled()) return evaluateEnforcement(input)
  - src/lib/enforcement.ts lines 308–311 — catch { return evaluateEnforcement(input) }

  Scenario: Attacker DoS's governance engine → all requests fall back to client-side evaluation → R3 requests that require server-side policy data may pass
  without the intended block.

  Fix direction: On fallback, degrade to status: 'DEGRADED' and escalate rather than silently allow. Emit explicit audit event when fallback is used.

  ---
  MEDIUM

  7. Output Validation Retry Exhaustion Returns Bad Output Anyway

  After 2 retries, if output still fails validation, the system returns it with a qualityHint: 'needs_improvement' rather than blocking. For non-coder
  flows, an unsafe or low-quality response is shown without a hard refusal.

  File: src/app/api/execute/route.ts lines 585–644

  Fix direction: If retries are exhausted and validation.decision is still not PASS, return an error response and emit an audit event for validation
  exhaustion.

  ---
  8. Admin Routes — No Resource-Level RBAC

  Admin routes check role (canAccessAdmin) but not resource scope. An admin can modify any tool, quota, or DLP policy across all teams/orgs. If
  multi-tenancy is intended, this is a gap.

  Files: src/app/api/admin/tool-registry/policy/route.ts, src/app/api/admin/quota/policy/route.ts, src/lib/admin-session.ts lines 107–117

  ---
  9. Impersonation — Audit Log Conflates Impersonator and Impersonated Actions

  When impersonation is active, all audit events record actorId: impersonatedUserId. Actions taken by the owner while impersonating are indistinguishable
  from actions taken by the real user independently.

  Files: src/lib/middleware-auth.ts lines 98–119; src/app/api/admin/impersonate/[id]/route.ts line 81

  Fix direction: Always log both realActorId and impersonatedActorId in audit events.

  ---
  10. Git Governance Hooks Not Enforced in CI

  .githooks/pre-commit calls the governance hook chain, but --no-verify bypasses it locally and CI workflows do not invoke the chain. Hooks are cosmetic
  unless replicated as mandatory CI steps.

  Files: .githooks/pre-commit; .github/workflows/ci.yml lines 41–61 (no hook invocation)

  Fix direction: Add an explicit check:governance step to CI that runs run_local_governance_hook_chain.py; fail the job if any check fails.

  ---
  11. Service Token Callers Can Inject Arbitrary Knowledge Chunks

  Service token requests are allowed to provide knowledgeContext inline in the request body, bypassing retrieval scoping and tenant boundaries. A
  compromised service token lets an attacker inject arbitrary chunks into an execution.

  File: src/app/api/execute/route.ts lines 484–509

  Fix direction: Remove inline knowledge support for service tokens, or require chunks to be signed by the retrieval backend.

  ---
  Open Questions & Assumptions

  1. In-memory approval store — code comments acknowledge "no-database scope." Is this intentional for dev/demo, or expected to be production-grade?
  2. Service token trust level — is it assumed to be called only from internal networks where a simple string match is acceptable?
  3. Governance engine downtime — is graceful degradation to client-side evaluation within the system's stated contract, or should downtime always cause
  hard failure?
  4. Multi-tenancy — mock DB has teams, but admin routes don't scope resources by team. Single-org or genuinely multi-tenant?

  Residual Risks Not Fully Verified

  - Knowledge collection CRUD (/api/admin/knowledge/collections) — no visible team/org scope check confirmed
  - Quality score displayed in UI — no hallucination detection; badge may overstate accuracy for non-coders
  - Rate limiter per-IP vs. per-session logic under service token paths — needs tracing across middleware chain

  Highest-Priority Files for Manual Follow-Up

  ┌──────────┬────────────────────────────────┬──────────────────────────────────────────────────────────┐
  │ Priority │              File              │                           Why                            │
  ├──────────┼────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ 1        │ src/app/api/approvals/store.ts │ Replace in-memory Map with persistent storage            │
  ├──────────┼────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ 2        │ src/lib/admin-session.ts       │ Implement break-glass token expiry                       │
  ├──────────┼────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ 3        │ src/lib/enforcement.ts         │ Replace silent fallback with explicit degradation signal │
  ├──────────┼────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ 4        │ src/app/api/execute/route.ts   │ Approval re-validation + provider fallback assertion     │
  ├──────────┼────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ 5        │ .github/workflows/ci.yml       │ Wire governance hook chain as mandatory CI gate          │
  ├──────────┼────────────────────────────────┼──────────────────────────────────────────────────────────┤
  │ 6        │ src/lib/middleware-auth.ts     │ Separate real vs. impersonated actor in audit events     │
  └──────────┴────────────────────────────────┴──────────────────────────────────────────────────────────┘

✻ Worked for 3m 38s

※ recap: Reviewing CVF v1.6 for security and governance gaps. Review is complete — 11 findings returned, ranging from critical (in-memory approval store) to
   medium. Next: decide which findings to fix. (disable recaps in /config)

-------------------------------------------------------------------
Next review:

Findings từ cloud review — 8 issues, trình bày theo severity giảm dần.

  ---
  CVF Ultrareview — Findings (22 files, 967 insertions)

  ---
  CRITICAL

  1. Ba module bị thiếu — build fail, mọi evidence runner không chạy được

  Files:
  - src/app/api/execute/route.ts:25,27 — import @/lib/service-token-auth và ../approvals/approval-binding
  - src/lib/admin-session.ts:9 — import @/lib/service-token-auth
  - scripts/w114_noncoder_outcome_evidence_pack.js:12, w119:11, w98:14, w99:9 — require('./service-token-signature.cjs')

  Scenario: npm run build fail với Module not found. npm run test:run không collect được test nào. Tất cả 4 evidence runners crash ngay require() trước khi
  gọi bất kỳ HTTP request nào. Mọi remediation claim trong AGENTS.md (service-token signing, approval hash binding, break-glass constant-time compare) là
  non-executable tại HEAD.

  Fix: Tạo ba file còn thiếu:
  - src/lib/service-token-auth.ts — export verifyServiceTokenRequest, deriveServiceTokenIdentity, constantTimeEqual
  - src/app/api/approvals/approval-binding.ts — export buildApprovalRequestSnapshot, computeApprovalRequestHash
  - scripts/service-token-signature.cjs — export buildServiceTokenHeaders

  ---
  HIGH

  2. Approval replay không giới hạn trong 24h — một approval = N lần execute

  File: src/app/api/execute/route.ts:438–452

  Scenario: Sau khi admin approve R3 request, resume branch chỉ emit APPROVAL_CONSUMED audit event nhưng không đổi status record. Record vẫn
  status='approved'. Caller giữ approvalId có thể replay cùng {body, approvalId} bao nhiêu lần tùy ý trong 24h expiry window — mỗi lần đều pass hết các
  guard (hash match, not expired, status='approved').

  Fix: Sau appendAuditEvent(APPROVAL_CONSUMED), atomically set status: 'consumed' (hoặc store.delete(id)) trước khi fall through. Guard if
  (approvalRecord.status !== 'approved') → 409 sẽ chặn mọi replay tiếp theo.

  ---
  3. Cross-tenant approval replay — hash không include actor identity

  File: src/app/api/execute/route.ts:210–235, src/app/api/approvals/route.ts, src/app/api/approvals/store.ts

  Scenario: buildApprovalRequestSnapshot chỉ hash payload fields (templateId, intent, inputs, provider...) — không include userId/orgId/teamId. GET
  /api/approvals trả về toàn bộ store (no tenant scope). Bob (orgB) enumerate approvals → copy requestSnapshot + approvalId của Alice (orgA) → POST
  /api/execute với session của mình → hash match → resume under Bob's session context, consuming Alice's admin approval.

  Fix: Thêm actorUserId/actorOrgId/actorTeamId vào ApprovalRequestSnapshot và include trong hash. Trong /api/execute approvalId branch, so sánh identity của
   caller với stored submitter. Scope GET /api/approvals theo org/team.

  ---
  4. Approval hash inconsistent giữa /api/approvals và /api/execute — direct-submit flow luôn 409

  File: src/app/api/approvals/route.ts:54–73, src/app/api/execute/route.ts:149,215

  Hai asymmetry:
  1. /api/execute trim inputs (String(v ?? '').trim()), /api/approvals không trim — cùng input ' Test ' cho hai hash khác nhau
  2. /api/approvals đọc body.phase/body.riskLevel; /api/execute đọc body.cvfPhase/body.cvfRiskLevel — không có field naming nào yield hash match từ cả hai
  phía

  Scenario: Non-coder POST /api/approvals → admin approve → non-coder POST /api/execute với approvalId → hash mismatch → 409 mãi mãi. Chỉ internal
  auto-create path (approval tạo trong chính execute route) hoạt động đúng vì cùng in-memory body.

  Fix: Push normalization (trim + field aliasing phase → cvfPhase) vào trong buildApprovalRequestSnapshot helper để cả hai call site share canonical form.

  ---
  5. CI governance hook chạy từ sai working directory — CI red-ball mọi push

  File: .github/workflows/ci.yml:40–41

  Scenario: Job web-ui-tests có defaults.run.working-directory: EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web. Step "Governance Hook Chain" chạy python
  governance/compat/run_local_governance_hook_chain.py — Python resolve path thành cvf-web/governance/compat/... (không tồn tại). Exit code 2 → toàn bộ job
  fail trước cả npm ci. Mọi PR đều đỏ vì path error, không phải governance failure.

  Fix:
  - name: Governance Hook Chain
    working-directory: ${{ github.workspace }}
    run: python governance/compat/run_local_governance_hook_chain.py --hook pre-commit

  ---
  6. Break-glass TTL vô hiệu khi issuedAt là timestamp tương lai

  File: src/lib/admin-session.ts:48–67

  Scenario: Token cvfbg.9999999999999.secret → regex extract issuedAt = 9999999999999 (năm ~2286) → Date.now() - 9999999999999 là số âm lớn → negative >
  maxAgeMs là false → TTL check không fire → session được grant với expiresAt hàng trăm năm sau. Operator typo CVF_BREAK_GLASS_TOKEN_ISSUED_AT=2099-01-01
  cũng trigger cùng path.

  Fix: Trong resolveBreakGlassIssuedAt, reject bất kỳ issuedAtMs > Date.now() + GRACE_MS với audit event BREAK_GLASS_DENIED { reason: 'future-issued-at' }.

  ---
  MEDIUM

  7. W114 knowledge ingest silently fail — K1/K2/K3 chạy trên empty collections

  File: scripts/w114_noncoder_outcome_evidence_pack.js:55–77

  Scenario: Mọi chunk trong W114 có shape { id, content } thiếu keywords field. /api/knowledge/ingest validate Array.isArray(chunk.keywords) → HTTP 400 mỗi
  chunk. Error body là valid JSON ({ error: '...' }) nên .catch() không fire, runner log accepted: 0 và tiếp tục. K1/K2/K3 execute với
  knowledgeInjection.source = 'none'. Markdown output vẫn assert "reflected project-specific facts" — sai hoàn toàn. CI thấy process.exitCode = 0 vì AI vẫn
  produce output.

  Fix: Thêm keywords: [...] vào mọi chunk (theo pattern của w119). Gate runner trên status === 200 && accepted === chunks.length.

  ---
  NIT

  8. Output-validation exhaustion 422 response embed decision: 'ALLOW' trong receipt

  File: src/app/api/execute/route.ts:778–792

  HTTP status 422 + error: 'Generated response failed output validation' + audit outcome: 'BLOCKED' — nhưng governanceEvidenceReceipt.decision là 'ALLOW' vì
   enforcement.status đã được narrow trước đó. Audit trail có thể recover nhưng receipt contradicts HTTP response.

  Fix: Pass decision: 'BLOCK' (hoặc 'OUTPUT_VALIDATION_EXHAUSTED') vào buildEvidenceReceipt trên branch này thay vì enforcement.status.

  ---
  Priority Action Order