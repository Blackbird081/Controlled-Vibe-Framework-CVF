# CVF Unabsorbed Knowledge Inventory — 2026-05-16

Memory class: FULL_RECORD

Status: AMENDED 2026-05-17 — accuracy fixes applied per Claude review and Codex response

> **Amendment note 2026-05-17:** Claude review on 2026-05-17 spot-checked the
> original inventory against the current CPF/LPF/Skill Evolution code state
> and found three items overstated. Codex response 2026-05-17 accepted the
> findings with minor amendments. This file is updated to reflect the
> consensus state. See:
>
> - `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CLAUDE_REVIEW_2026-05-17.md`
> - `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_CODEX_RESPONSE_TO_CLAUDE_2026-05-17.md`

## Purpose

Liệt kê toàn bộ kiến thức có giá trị từ CVF 16.5 và CVF ADD đã trải qua
phản biện Claude–Codex đầy đủ nhưng **chưa được hấp thu vào CVF**. Mỗi mục
có đánh giá giá trị để người vận hành quyết định có nên mở roadmap hay không.

File này không authorize bất kỳ implementation nào. Nó là điểm khởi đầu cho
quyết định của người vận hành.

## Scope

Nguồn được review:

- `.private_reference/legacy/CVF 16.5/` — 11 folder nguồn
- `.private_reference/legacy/CVF ADD/` — 14 folder nguồn
- Synthesis: `CVF_ADD_FINAL_ACCEPTED_VALUE_AND_REJECTION_MAP_2026-05-07.md`
- Synthesis: `CVF_ADD_PHASE_A_GOVERNED_CAPABILITY_AND_BOUNDARY_GOVERNANCE_SYNTHESIS_2026-05-07.md`
- Synthesis: `CVF_ADD_PHASE_B_CONTINUITY_DELEGATION_AND_SCOPED_KNOWLEDGE_SYNTHESIS_2026-05-07.md`
- Synthesis: `CVF_ADD_SYNTHESIS_CLOSURE_AND_NEXT_REOPEN_DECISION_2026-05-07.md`
- Evidence: `docs/baselines/CVF_16_5_LIVING_INTEGRATION_CLASSIFICATION_SUMMARY_2026-05-16.md`

## Định nghĩa trạng thái

| Trạng thái | Nghĩa |
|---|---|
| `docs-classified` | Đã review, đã phân loại, chưa implement |
| `roadmap-ready` | Có đủ GC-018/ADR/source/test packet, sẵn sàng implement |
| `runtime-owned` | Đã implement với tests |
| `excluded` | Bị reject hoàn toàn, không actionable |

---

## Phần 1 — CVF 16.5: Observability Plane

### OBS-1 — CVF Observability Plane Foundation (abtop)

**Nguồn:** `.private_reference/legacy/CVF 16.5/abtop/CVF_OBSERVABILITY_PLANE_FOUNDATION/`

**Trạng thái hiện tại:** `runtime-owned` — completed 2026-05-17 through
OBS-1 runtime adoption. Observability Delta previously covered
`observe.only.signal.contract.ts`; OBS-1 now adds the read-only dashboard
snapshot contract and bilingual web-facing runtime monitor.

**Những gì đã có (từ 16.5 absorption):**
- Signal categories: `session`, `token_context`, `rate_limit`, `process_port`
- Observe-only policy: không kill/reroute/approve

**Những gì đã absorb thêm trong OBS-1:**

| File spec | CVF owner behavior |
|---|---|
| `CVF_RUNTIME_DASHBOARD_SPEC.md` | Read-only runtime dashboard snapshot and `/runtime` web page |
| `CVF_AGENT_SESSION_MONITOR.md` | Session panel records from web governance job audit |
| `CVF_TOKEN_CONTEXT_METER.md` | Token/context panel with no-guess unavailable state |
| `CVF_RATE_LIMIT_WATCHER.md` | Provider quota pressure panel from cost/quota policy |
| `CVF_PROCESS_PORT_GUARD.md` | Local process and managed-port visibility |
| `CVF_DASHBOARD_EVENT_STREAM.md` | Source-tagged dashboard event records |
| `CVF_OBSERVABILITY_POLICY.md` | Allowed observe-only actions and blocked interventions |
| `CVF_DASHBOARD_UI_CONTRACT.md` | English/Vietnamese web surface with source labels and empty states |

**Giá trị thực tế:**
- Operator thấy được agent nào đang chạy, đang dùng bao nhiêu context, quota
  còn bao nhiêu — mà không cần mở terminal
- Non-coder có thể phát hiện agent bị treo hoặc orphan process
- Không cần quyền can thiệp — read-only dashboard là an toàn nhất để ship

**Đánh giá:** ⭐⭐⭐⭐⭐ — Giá trị cao nhất trong các implementation candidates
(upgrade từ ⭐⭐⭐⭐ theo Claude review 2026-05-17 và Codex response). Hoàn toàn
read-only nên R0. Không overlap với bất kỳ governed surface nào hiện có. Spec
đầy đủ trong private reference. Không có owner surface CVF nào hiện đang gánh.

**Điều kiện để absorb:** Complete — see
`docs/roadmaps/CVF_OBSERVABILITY_PLANE_FOUNDATION_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md`.

---

## Phần 2 — CVF ADD: Family A + D (Được khuyến nghị promote ngay)

### ADD-A — Governed Capability Intake Doctrine

**Nguồn:** `CLI-Anything`, `Hugging Face`, `Hermes Agent`, `AGENT ENGINEER`

**Trạng thái hiện tại:** `docs-promoted` — promoted 2026-05-17 vào
`docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_AND_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-17.md`.

**Nội dung:**

Doctrine cho câu hỏi: *Khi nào thì một external tool/skill/provider được phép
dùng trong CVF?*

Intake lifecycle 8 bước (Discover → Classify → Risk-bind → Boundary-bind →
Adapter-bind → Evidence-bind → Evaluate → Retire) với metadata vocabulary
chuẩn:

```
capability_name, source_provenance, capability_class, risk_class,
owner_surface, allowed_operations, blocked_operations, sandbox_tier,
policy_binding, evidence_requirement, freshness_status,
evaluation_status, retirement_condition
```

**Owner surfaces đề xuất:**
- Policy Engine / Guard Engine / Skill Registry (Governance Layer)
- Command Runtime / Policy Gate / Sandbox Runtime / MCP Bridge (Execution Plane)
- W7 trace và eval records

**Giá trị thực tế:**
- CVF hiện không có doctrine rõ ràng để trả lời "external capability này có
  được phép dùng không" trước khi nó vào runtime
- Ngăn tool sprawl và third-party pattern silently trở thành CVF policy
- Áp dụng ngay cho việc đánh giá MCP tools, provider adapters, skill imports

**Đánh giá:** ⭐⭐⭐⭐⭐ — Giá trị cao nhất trong toàn bộ inventory. Đây là
upstream governance gap thực sự của CVF. Không cần code, chỉ cần doc + policy
promotion. Codex và Claude đều đồng ý đây là candidate ưu tiên 1.

**Điều kiện để absorb:** Complete — doc-only promotion packet closed at
`docs/reviews/CVF_ADD_A_D_BRIEF_DOCTRINE_PROMOTION_2026-05-17.md`.

---

### ADD-D — Boundary-First Governance Doctrine

**Nguồn:** `AI-first vs Human-first`, `Human System Harness`

**Trạng thái hiện tại:** `docs-promoted` — promoted 2026-05-17 cùng ADD-A và
ADD-BRIEF vào consolidated doctrine.

**Nội dung:**

Doctrine cho câu hỏi: *CVF governance phân loại các loại ràng buộc như thế
nào để tránh biến governance thành friction thay vì enforcement?*

Bốn policy class:

| Class | Nghĩa | Agent behavior |
|---|---|---|
| Hard prohibition | Không được làm | Dừng, record blocker |
| Soft constraint | Được làm với điều kiện | Optimize trong ràng buộc, record tradeoff |
| Communication policy | Cách trình bày bị ràng buộc | Trình bày outcome chính xác |
| Restricted execution path | Chỉ một số path được phép | Dùng allowed path, record adherence |

Ba W7 signal candidate mới:
- `path_lock_signal` — ghi nhận restricted path được chọn và tuân thủ
- `minimal_response_match` — ghi nhận agent giữ response bounded theo policy
- `restricted_path_count` — đếm số restricted-path gates đã qua

Brief Normalization: chuẩn hóa task thành goal + constraints + evidence
requirements + acceptance criteria + open risks trước khi grant design/build
authority.

**Owner surfaces đề xuất:**
- Policy Engine / Guard Engine / Audit (Governance Layer)
- AI Boardroom / Reverse Prompting / CEO Orchestrator (Control Plane)
- W7 planner, decision, eval, trace extensions
- Learning Plane: overconstraint và pseudo-brief contamination signals

**Giá trị thực tế:**
- CVF hiện xử lý governance như on/off — doctrine này cho phép phân biệt
  "cấm hoàn toàn" với "được làm nhưng cần record"
- Ngăn governance trở thành path-locking không cần thiết
- 3 W7 signals mới có thể bổ sung vào evidence receipt schema mà không cần
  runtime thay đổi

**Đánh giá:** ⭐⭐⭐⭐⭐ — Giá trị cao nhất, cùng loại với ADD-A. Đây là
corrective doctrine quan trọng nhất trong pack. Không cần code.

**Điều kiện để absorb:** Complete — promoted cùng ADD-A và ADD-BRIEF trong
consolidated doctrine file.

---

### ADD-BRIEF — Brief Normalization Doctrine

**Nguồn:** Phase A synthesis, từ `Human System Harness`, `Hermes Agent`

**Trạng thái hiện tại:** `docs-promoted` — added per Claude review và promoted
2026-05-17 cùng ADD-A/ADD-D.

**Nội dung:**

Doctrine cho brief-to-work normalization:

- Chuẩn hóa task thành: goal, constraints, evidence requirements, current
  owner surfaces, acceptance criteria, open risks
- Detect solution bias trước khi grant design/build authority
- Preserve operator intent trong khi cho agents resolve technical route
  decisions inside CVF rules
- Record assumptions chỉ khi chúng affect acceptance hoặc safety

**Owner surfaces đề xuất:**

- Agent operating contract layer
- Planning / roadmap layer
- Reverse Prompting / CEO Orchestrator (Control Plane)

**Giá trị thực tế:**

- Trực tiếp giải quyết vấn đề "agent push ordinary technical decisions back
  to operator" mà bạn đã raise
- Phù hợp với GA posture: governance qua boundary, không qua path-locking

**Đánh giá:** ⭐⭐⭐⭐ — Subordinate to ADD-D (theo Codex amendment 2026-05-17).
Ship trong cùng promotion packet với ADD-A + ADD-D thay vì standalone.

**Điều kiện để absorb:** Complete — promoted in the same packet as ADD-A +
ADD-D.

---

### ADD-W7-SIGNALS — W7 Boundary-First Signal Candidates

**Nguồn:** Phase A synthesis, Family D

**Trạng thái hiện tại:** `runtime-owned` — completed 2026-05-17 through the
Guard Contract ADD-W7-SIGNALS schema extension. ADD-D doctrine was promoted
first, satisfying the trigger condition.

**Nội dung:**

3 signal candidates mới cho evidence receipt schema:

| Signal | Ghi nhận điều gì |
|---|---|
| `path_lock_signal` | Restricted path được chọn và tuân thủ |
| `minimal_response_match` | Agent giữ response bounded theo policy |
| `restricted_path_count` | Số restricted-path gates đã qua |

**Giá trị thực tế:**

- Có thể absorb vào W7 evidence receipt schema mà không cần thay đổi runtime
- Cung cấp audit visibility cho boundary-first governance

**Đánh giá:** ⭐⭐⭐ — Subordinate to ADD-D doctrine. Signals chỉ có nghĩa
khi 4 policy classes (hard prohibition / soft constraint / communication
policy / restricted execution path) đã được promote.

**Điều kiện để absorb:** ADD-D promotion dependency satisfied 2026-05-17.
Still requires a separate schema-extension roadmap before implementation.

---

## Phần 3 — CVF ADD: Deferred — Cần điều kiện cụ thể

### ADD-B — Governed Context Profile Metadata

**Nguồn:** `Workflow GoClaw`, `caveman`, `AGENT ENGINEER`, `Agent Harnesses`

**Trạng thái hiện tại:** `runtime-owned` — completed 2026-05-17 through the
Control Plane Foundation ADD-B context profile metadata contract.

**Nội dung:**

Metadata compact cho context budgeting theo session type và risk:

Allowed uses: context budgeting, source relevance tagging, handoff detection,
freshness marking, skill fit notes, reinjection eligibility, evidence hints.

Blocked uses: policy override, hidden memory write, intent routing replacement,
provider bypass, unreviewed tool permission, runtime execution authorization.

**Giá trị thực tế:**
- Giảm token waste — context được shape theo risk level thay vì load đồng đều
- Cải thiện handoff quality
- Phù hợp với non-coder routing hiện có

**Đánh giá:** ⭐⭐⭐ — Giá trị tốt nhưng cần owner surface cụ thể. Nếu không
map được vào Context Builder / Knowledge Layer, risk biến thành "metadata for
metadata's sake". Chỉ absorb khi có roadmap chạm vào context packaging.

**Điều kiện để absorb:** Mở roadmap context packaging upgrade hoặc knowledge
layer enhancement, khi đó dùng Family B làm design input.

---

### ADD-C1 — Continuity / Restart / Handoff Doctrine

**Nguồn:** `Agent Harnesses`, `Hermes Agent`, `Human System Harness`

**Trạng thái hiện tại:** `runtime-owned` — completed 2026-05-17 through the
Control Plane Foundation continuity checkpoint schema contract.

**Nội dung:**

Language cho long-running agent work:
- checkpoint: compact state record tại phase boundary
- restore: dùng prior checkpoint không re-litigate closed decisions
- handoff: transfer task state sang agent khác hoặc future session
- artifact memory: preserve file paths, decisions, proof requirements
- reinjection: reintroduce prior context chỉ khi còn relevant và được phép

**Giá trị thực tế:**
- Trực tiếp hỗ trợ CVF multi-agent và downstream workspace
- Overlap với W123 — cần map cẩn thận để không duplicate

**Đánh giá:** ⭐⭐⭐ — Giá trị tốt, nhưng W123 đã cover một phần. Absorb
khi mở lại roadmap continuity/handoff.

**Điều kiện để absorb:** Mở W123 continuation roadmap.

---

### ADD-C2 — Delegation / Worker / Subagent Contracts

**Nguồn:** `deepagents`, `Hermes Agent`, `Human System Harness`

**Trạng thái hiện tại:** `runtime-owned` — completed 2026-05-17 through the
Control Plane Foundation delegation contract and Execution Plane thin boundary
guard.

**Nội dung:**

Contract language cho multi-agent work:
- explicit ownership of files/modules/responsibility
- workers không reverting unrelated edits
- bounded write scope
- final report of changed files
- delegation chỉ khi materially advances main task
- subagents inherit governance boundaries

**Giá trị thực tế:**
- Directly needed khi CVF mở rộng sang multi-agent orchestration
- Hiện tại CVF có `agent.governed.session.contract.ts` nhưng không có
  delegation receipt hay worker boundary contract

**Đánh giá:** ⭐⭐⭐ — Giá trị tốt. Cần W7/W8 agent orchestration roadmap
làm trigger.

**Điều kiện để absorb:** Mở W7/W8 agent orchestration roadmap.

---

### ADD-E1 — Scoped Knowledge / Code Graph / Cortex

**Nguồn:** `code-review-graph`, `cortex-hub`

**Trạng thái hiện tại:** `runtime-owned` — completed 2026-05-17 through the
Control Plane Foundation scoped knowledge provider contract.

**Nội dung:**

Read-only bounded knowledge input với:
- source scope, confidence, provenance, freshness
- static code intelligence để giảm broad file scanning
- graph-scoped context assembly
- memory và shared knowledge với explicit trust boundaries

**Giá trị thực tế:**
- Hữu ích khi CVF cần code graph hoặc indexed reference work
- Giảm context waste khi query code intelligence
- Chưa có use case cụ thể trong CVF hiện tại

**Đánh giá:** ⭐⭐ — Giá trị conditional. Absorbed as a bounded read-only
provider contract after operator authorization for the remaining deferred
queue; no indexing runtime or code execution was introduced.

**Điều kiện để absorb:** Complete — see
`docs/roadmaps/CVF_ADD_E1_SCOPED_KNOWLEDGE_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md`.

---

### ADD-PROVIDER — Provider/Runtime Output Contracts

**Nguồn:** `openrouter-cli.git`, `CLI-Anything`, `Hermes Agent`, `AGENT ENGINEER`

**Trạng thái hiện tại:** `runtime-owned` — completed 2026-05-17 in
`EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-output-contract.ts`.

**Nội dung:**

Execution adapters nên emit:
- JSON envelopes chuẩn
- stable exit codes
- stdout/stderr separation rõ ràng
- provider/request metadata
- retry metadata
- NDJSON/streaming semantics

**Giá trị thực tế:**
- CVF Model Gateway và Execute Route hiện không có output contract chuẩn
- Cải thiện traceability khi provider timeout / fallback / receipt-missing
- W132 close rồi nhưng chưa absorb phần này

**Đánh giá:** ⭐⭐⭐ — Giá trị tốt và actionable ngay. Absorb vào Model Gateway
hoặc Execute Route spec khi có roadmap provider stability tiếp theo.

**Điều kiện để absorb:** Complete — see
`docs/roadmaps/CVF_ADD_PROVIDER_OUTPUT_CONTRACTS_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md`.

---

## Phần 4 — CVF 16.5: Gaps trong runtime-owned lanes

Các lane đã được mark `runtime-owned` nhưng phần implementation thực tế
**ít hơn đáng kể** so với "definition of alive" trong classification summary.

### GAP-MEM — Controlled Memory: thiếu 3 memory-specific sub-contracts

**Trạng thái:** `runtime-owned` — completed 2026-05-17. LPF already had
memory gateway, learning reinjection, feedback ledger, and governance signal
contracts. The 3 reduced sub-contract gaps are now implemented.

**Amendment 2026-05-17:** Claude spot-check thấy LPF đã có
`controlled.memory.gateway.contract.ts`, `learning.reinjection.contract.ts` +
pipeline variants, `feedback.ledger.contract.ts`, 60+ contracts khác. Codex
response xác nhận 3 items cụ thể (tên normative) còn thiếu từ AgentMemory
private reference:

| Contract còn thiếu | Chức năng | Nguồn |
|---|---|---|
| `memory_privacy_filter` | PII redaction tại memory write boundary (không phải generic governance signal redaction) | `.private_reference/legacy/CVF 16.5/agentmemory/` |
| `memory_capture_adapter` | Typed input contract từ agent → governed memory record | Như trên |
| `memory_retention_policy` | TTL + review-gate + expiry-by-classification | Như trên |

Implemented owner files:

- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.subcontracts.ts`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/controlled.memory.gateway.contract.ts`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/tests/controlled.memory.subcontracts.test.ts`

**Các items khác từ AgentMemory** (event hooks, access policy, guard contract)
**không thuộc gap này** vì overlap với LPF's existing `governance.signal.*`
và `learning.observability.*` contracts. Không được duplicate.

**Đánh giá:** ⭐⭐⭐ — Giá trị có ý nghĩa nhưng scope nhỏ hơn nhiều so với
inventory ban đầu. 3 sub-contracts cụ thể, không phải 9.

---

### GAP-SKILL — REMOVED 2026-05-17

**Status:** Removed per Claude spot-check + Codex response.

**Reason:** Spot-check thấy 7 files trong evolution_engine/ (549 LOC tổng,
contract 411 LOC + 6 helpers 13-40 LOC mỗi) **không phải stubs**, mà là
minimal executable implementations có thật logic. `experience.collector.ts`
ghi JSON lines thật, các helpers khác có chức năng tương đương. Lane này
genuinely `runtime-owned` per closure packet.

Future expansion (more reflection patterns, mutation planner depth) thuộc về
một separate skill governance enhancement roadmap, không phải "unabsorbed
CVF 16.5 knowledge".

---

### GAP-AGENT-HANDOFF — Cross-agent handoff + delegation receipt flow

**Trạng thái:** Lane `runtime-owned`. CPF đã có đầy đủ agent governance
contracts. Structured cross-agent handoff và delegation receipt bridge
completed 2026-05-17.

**Amendment 2026-05-17:** Claude spot-check thấy GAP-AGENT ban đầu overstated
nghiêm trọng. CPF thực tế đã có:

- `agent.registration.batch.contract.ts` (registry — đã có)
- `agent.definition.boundary.contract.ts` (permission profile — đã có)
- `agent.definition.capability.batch.contract.ts` (capability — đã có)
- `agent.definition.audit.batch.contract.ts` (audit receipt — đã có)
- `agent.scope.resolution.batch.contract.ts` (scope — đã có)
- `orchestration.contract.ts` + 3 pipeline variants (orchestration rules — đã có)
- `agent.governed.session.contract.ts` (session boundary — đã có)

Codex response xác nhận: GAP-AGENT ban đầu phải remove. Phần còn thiếu thực
sự là một item nhỏ hơn nhiều:

**`GAP-AGENT-HANDOFF`** — structured cross-agent handoff protocol và
delegation receipt bridge now wired as a typed handoff contract across the
existing CPF contracts.

**Đánh giá:** ⭐⭐ — Scope nhỏ. Completed 2026-05-17 as a bridge contract; no
new agent authority.

---

## Tóm tắt ưu tiên

### Nhóm 1 — Absorbed doc-only promotion (consensus executed 2026-05-17)

| ID | Tên | Promotion status |
|---|---|---|
| ADD-A | Governed Capability Intake Doctrine | promoted in consolidated doctrine |
| ADD-D | Boundary-First Governance Doctrine | promoted in consolidated doctrine |
| ADD-BRIEF | Brief Normalization Doctrine | promoted in consolidated doctrine |

**Hành động:** Complete. See
`docs/reviews/CVF_ADD_A_D_BRIEF_DOCTRINE_PROMOTION_2026-05-17.md` and
`docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_AND_BOUNDARY_FIRST_GOVERNANCE_DOCTRINE_2026-05-17.md`.

---

### Nhóm 2 — Cần GC-018 riêng, giá trị cao (theo thứ tự ưu tiên)

| Thứ tự | ID | Giá trị |
|---|---|---|
| 1 | OBS-1 Observability Plane ⭐⭐⭐⭐⭐ | Complete 2026-05-17; read-only runtime dashboard + bilingual web route `/runtime` |
| 2 | ADD-PROVIDER Output Contracts ⭐⭐⭐ | Complete 2026-05-17; JSON envelope, NDJSON, stdout policy, exit codes |
| 3 | GAP-MEM 3 memory sub-contracts ⭐⭐⭐ | Complete 2026-05-17; privacy filter + capture adapter + retention policy |
| 4 | ADD-W7-SIGNALS W7 Signal Candidates ⭐⭐⭐ | Complete 2026-05-17; optional boundary signal fields on governance evidence receipt schema |
| 5 | ADD-B Context Profile Metadata ⭐⭐⭐ | Complete 2026-05-17; advisory context profile metadata for source ranking, budget hints, and sensitivity flags |
| 6 | GAP-AGENT-HANDOFF Cross-agent handoff ⭐⭐ | Complete 2026-05-17; typed handoff record, receipt ID, validation helper, and policy continuity check |
| 7 | ADD-C1 Continuity Checkpoint ⭐⭐⭐ | Complete 2026-05-17; shared checkpoint record shape for closed decisions, open items, artifacts, reinjection policy, and evidence receipts |
| 8 | ADD-C2 Delegation / Subagent Contracts ⭐⭐⭐ | Complete 2026-05-17; delegation ownership, inherited boundaries, closure requirements, and EPF delegated-write boundary guard |
| 9 | ADD-E1 Scoped Knowledge / Code Graph ⭐⭐ | Complete 2026-05-17; read-only scoped knowledge provider contract, intake subclass mapping, context-profile source relevance bridge, and provider-action block |

---

### Nhóm 3 — Deferred, chờ trigger cụ thể

No remaining Nhóm 3 deferred items after Step 10c closure on 2026-05-17.

---

### Nhóm 4 — Excluded (không revisit)

| Nguồn | Lý do |
|---|---|
| Parallel runtime / memory server / agent OS | Duplicate authority |
| Subscription/proxy bypass claims | Không phù hợp CVF |
| Self-mutating skills runtime | Governance risk quá cao |
| Hidden model substitution | Violates transparency |
| gridex (E2 DB taxonomy) | Product-specific, ngoài CVF scope |
| Pancake-specific MCP profile (1/8 file) | Domain-specific, defer trừ khi có POS roadmap |

---

## Source

- `docs/baselines/CVF_16_5_LIVING_INTEGRATION_CLASSIFICATION_SUMMARY_2026-05-16.md`
- `.private_reference/legacy/CVF ADD/REVIEW FOLDER/CVF_ADD_FINAL_ACCEPTED_VALUE_AND_REJECTION_MAP_2026-05-07.md`
- `.private_reference/legacy/CVF ADD/REVIEW FOLDER/CVF_ADD_PHASE_A_GOVERNED_CAPABILITY_AND_BOUNDARY_GOVERNANCE_SYNTHESIS_2026-05-07.md`
- `.private_reference/legacy/CVF ADD/REVIEW FOLDER/CVF_ADD_PHASE_B_CONTINUITY_DELEGATION_AND_SCOPED_KNOWLEDGE_SYNTHESIS_2026-05-07.md`
- `.private_reference/legacy/CVF ADD/REVIEW FOLDER/CVF_ADD_SYNTHESIS_CLOSURE_AND_NEXT_REOPEN_DECISION_2026-05-07.md`
- `.private_reference/legacy/CVF ADD/REVIEW FOLDER/CVF_ADD_KNOWLEDGE_ABSORPTION_EXECUTIVE_ASSESSMENT_2026-05-06.md`
- `.private_reference/legacy/CVF 16.5/abtop/Thong_tin.md`

## Claim Boundary

File này không authorize bất kỳ implementation, runtime change, hay public
claim nào. Nó chỉ ghi lại những gì đã được review và quyết định trong
private synthesis nhưng chưa được báo cáo cho người vận hành.

Bất kỳ implementation nào cũng cần GC-018 mới trừ Nhóm 1 (doc-only promotion).

## Findings

Có hai loại gap thực sự:

1. **Gap do scope boundary rõ ràng** — CVF 16.5 absorption và CVF ADD synthesis
   đều kết thúc đúng theo scope đã cam kết. Không có lỗi execution. Nhưng
   cả hai quy trình đều không tạo ra một bản báo cáo tổng hợp cho người vận
   hành về những gì *nằm ngoài scope* nhưng vẫn có giá trị.

2. **Gap do handoff không đầy đủ** — CVF ADD synthesis khuyến nghị rõ ràng
   "Promote A + D as first and only public promotion candidate" nhưng không
   agent nào thực hiện bước đó hay thông báo cho người vận hành.

Sau absorption 2026-05-17: **3 doc-only doctrine items promoted**, **9 nhóm 2
runtime items implemented**, **0 nhóm 3 deferred candidates** còn lại, và
**6 items excluded hoàn toàn**.

## Risk

**R0 cho Nhóm 1 (ADD-A + ADD-D + ADD-BRIEF):** Promotion completed doc-only;
no runtime risk.

**R1 cho Nhóm 2 (OBS-1, GAP-MEM, ADD-PROVIDER, ADD-W7-SIGNALS, ADD-B,
GAP-AGENT-HANDOFF, ADD-C1, ADD-C2, ADD-E1):** Complete 2026-05-17 with fresh
GC-018 packets and focused implementation evidence.
Risk chính là scope creep nếu future work mở rộng khỏi claim boundary đã ghi.

**R0 cho Nhóm 3:** No remaining deferred items in this absorption queue.

Không có corrective action bắt buộc. Tất cả items đều có precedent review
đầy đủ từ Claude–Codex rebuttal chain.

## Decision

Nhóm 1 và Nhóm 2 consensus queue đã complete locally on 2026-05-17.
No remaining deferred items from this inventory are pending. Any future
expansion requires a fresh trigger-specific roadmap and GC-018.

## Enforcement

Không có enforcement requirement từ file này. File này chỉ là inventory.

Bất kỳ implementation nào cũng phải tuân theo:
- GC-018 authorization trước khi execution (trừ doc-only promotion)
- No-Orphan Integration Rule từ `CVF_16_5_LIVING_INTEGRATION_CLASSIFICATION_SUMMARY_2026-05-16.md`

## Related Artifacts

- `docs/baselines/CVF_16_5_LIVING_INTEGRATION_CLASSIFICATION_SUMMARY_2026-05-16.md`
- `docs/evidence/cvf-16-5-runtime-absorption.md` (public-sync)
- `docs/reviews/CVF_16_5_EXTERNAL_KNOWLEDGE_INTAKE_REVIEW_2026-05-16.md`
- `docs/reviews/CVF_16_5_EXTERNAL_KNOWLEDGE_INTAKE_REVIEW_CLAUDE_REBUTTAL_2026-05-16.md`
- `docs/reviews/CVF_16_5_EXTERNAL_KNOWLEDGE_INTAKE_REVIEW_CODEX_RESPONSE_TO_CLAUDE_2026-05-16.md`
