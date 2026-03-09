# ROADMAP HOÀN THIỆN CVF TOÀN DIỆN (2026-03-06)

Trạng thái: Roadmap tổng hợp để xử lý toàn bộ điểm yếu ghi nhận trong baseline review và định hướng phát triển tiếp theo.

> **Owner intent:** Dùng làm roadmap chính cho các đợt hardening và evolution sau baseline 2026-03-06  
> **Input baseline:** `CVF_DANH_GIA_DOC_LAP_TOAN_DIEN_2026-03-06.md`  
> **Executive companion:** `CVF_EXECUTIVE_REVIEW_BASELINE_2026-03-06.md`

---

## 1. Mục tiêu roadmap

Roadmap này có 2 mục tiêu tách biệt nhưng liên thông:

1. **Khép các điểm yếu hiện tại** đã ghi nhận trong baseline review.
2. **Định hướng phát triển dài hạn** để CVF tiến từ governance-first framework sang unified agent runtime substrate.

Nguyên tắc điều hành:

- Không phá baseline đang pass
- Không trộn hardening ngắn hạn với đổi core identity dài hạn
- Mọi phase đều phải có evidence, trace, gate, và rollback criteria

## 1.0.1 Why This Roadmap Exists

Roadmap này không tồn tại để "làm cho đủ checklist", mà để giúp người vận hành trả lời 3 câu hỏi khó nhất khi CVF lớn dần:

- phần nào thực sự giảm rủi ro vận hành, release, audit
- phần nào chỉ là tăng độ chi tiết nhưng chưa tăng độ tin cậy tương ứng
- phần nào nên dừng ở mức baseline tốt thay vì tiếp tục đào sâu

Vì vậy, từ mốc hiện tại trở đi, mọi quyết định mở thêm layer mới trong roadmap phải ưu tiên:

- `risk reduced` rõ ràng hơn `detail added`
- `machine-enforceable closure` hơn `narrative-only closure`
- `evidence value` hơn `semantic perfection`

## 1.1 Operational note (2026-03-07)

- Docs governance enforcement cho `docs/**/*.md` đã được triển khai **local-ready**:
  - `governance/compat/check_docs_governance_compat.py`
  - workflow hook trong `documentation-testing.yml`
- Conformance performance and governed Python automation now also have explicit local-ready rules:
  - secondary packet posture wrappers reuse one shared runtime-evidence bootstrap
  - the canonical Wave 1 runner records per-scenario duration
  - governed Python automation under `scripts/` and `governance/compat/` is size-guarded with exception registry support
  - `scripts/export_cvf_release_packet.py` has now been split into dedicated `scripts/release_packet/*.py` modules, so the exporter is no longer carried as a temporary size-policy exception
- Batch này **chưa push GitHub** theo owner rule; local state đã sẵn sàng để push khi được phép.
- Phần mở rộng enforcement sang `governance/toolkit/` và rộng hơn vẫn được xem là **deferred follow-up**, không phải priority số 1 hiện tại.
- Thứ tự ưu tiên thực thi ngắn hạn được chốt lại:
  1. Fix các vấn đề do independent assessment đã chỉ ra
  2. Giữ baseline/evidence/trace sạch và nhất quán
  3. Sau đó mới mở rộng governance enforcement phase tiếp theo

### Deferred follow-up: Docs Governance Enforcement Phase 2A

Mục tiêu:

- mở rộng gate từ `docs/**/*.md` sang `governance/toolkit/**` sau khi subtree đó được normalize naming/storage.

Trạng thái:

- **Not urgent**
- **Local recommendation recorded**
- **Do after independent-assessment remediation priorities**

## 1.2 Execution progress snapshot (updated 2026-03-07)

Completed or advanced locally since baseline freeze:

- Trace chain for the current hardening wave is now explicit:
  - requestId: `REQ-20260307-001`
  - trace doc: `CVF_UPGRADE_TRACE_2026-03-07.md`
- `docs/**/*.md` governance naming/storage enforcement is implemented and locally verified.
- `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` executor hardening has started:
  - verification modules are now pluggable at executor boundary
  - canonical pipeline order is still preserved by `GOVERNANCE_PIPELINE`
  - `artifact_integrity` now runs first as fail-fast trust boundary
  - executor can now persist phase report + hash ledger into `GovernanceAuditLog`
  - executor now binds `policyVersion` and default `auditPhase` from a shared control-plane contract
- Focused regression for the extension remains green after these changes.

Still open after this batch:

- `W1` is not closed: control-plane unification is still broader than extension-level executor hardening.
- `W2` is not closed: there is still no full cross-extension conformance suite.
- `P0` follow-up still recommended inside current hardening wave:
  - validate whether current trust-boundary-first ordering is sufficient across broader extension set
  - continue moving from extension-local hardening to ecosystem-level control-plane/conformance work

## 1.3 Status overview (updated 2026-03-08)

Mục đích của bảng này là để người đọc mới nhìn vào roadmap và biết ngay phần nào đã hoàn tất ở mức baseline local, phần nào mới đạt mức "rất mạnh nhưng chưa khép", và phần nào còn mở rõ ràng.

| Phase | Weakness chính | Trạng thái thực tế | Đánh giá ngắn |
|---|---|---|---|
| Phase 0 | Baseline freeze / governance hygiene | **DONE (local baseline)** | Baseline, executive review, decision matrix, trace chain, naming/storage/rotation rules đã vào nề nếp |
| Phase 1 | W1 — Unified control plane | **MOSTLY DONE, NOT CLOSED** | Đã có contract, snapshot, resolver, registry export; chưa thành single-source control plane cho toàn ecosystem |
| Phase 2 | W2 — E2E conformance | **STRONG WAVE 1 BASELINE, NOT CLOSED** | Wave 1 đã PASS 84 scenarios; đã có authoritative sequential runner, dependency-group reuse, golden baseline/diff, release-grade gate, capability-family coverage profile, minimum breadth rules, critical anchors, và family-level coverage groups, nhưng chưa phải full release-candidate gate cho mọi extension/future wave |
| Phase 3 | W3 — Skill governance operationalization | **MOSTLY DONE AT RUNTIME BASELINE** | Runtime blocking, successor, dependency/phase compatibility, upgrade orchestration đã có; rollout policy rộng hơn vẫn còn mở |
| Phase 4 | W4 — Durable execution / recovery | **STRONG DURABLE BASELINE, NOT CLOSED** | Rollback, replay, checkpoint/resume, cross-extension recovery/remediation đã có; broader long-running orchestration vẫn còn mở |
| Phase 5 | W5 + W6 — Release/version discipline | **BASELINE-COMPLETE (LOCAL-READY)** | Release manifest, module inventory, maturity matrix, consistency gate đã có và đang dùng được |
| Phase 6 | W7 — Enterprise evidence pack | **MOSTLY DONE, DEPTH-FROZEN FOR NOW** | 4 packet postures, 8 runtime families, cross-family policy chain đã đi tới `CF-084`; further semantic deepening is deferred unless a new real risk appears |

### 1.3.1 Quick Glance

| Bucket | Phase | Ý nghĩa thực tế ngay lúc này |
|---|---|---|
| `Done` | `Phase 0`, `Phase 5` | Có thể xem như đã khép tốt ở mức baseline local-ready; phần còn lại chủ yếu là mở rộng coverage khi hệ lớn thêm |
| `Mostly done` | `Phase 1`, `Phase 3`, `Phase 4`, `Phase 6` | Đã có baseline mạnh và dùng được, nhưng chưa nên tuyên bố “đóng hoàn toàn” ở cấp toàn ecosystem |
| `Open next` | `Phase 2` | `Phase 2` hiện đã có release-grade gate cho Wave 1 với `84/84` covered scenarios, `18/18` critical anchors, và `17/17` coverage groups; bước tiếp theo phải qua Depth Audit để quyết định có nên mở rộng coverage thêm hay chuyển nguồn lực sang phase khác |

## 1.4 Detailed reality check (updated 2026-03-07)

### Phase 0 — Đã hoàn tất ở mức baseline vận hành

Why this phase matters:
- Nếu không khóa được baseline, toàn bộ các phase sau sẽ mất mốc đối chiếu và không còn cách chứng minh upgrade nào thực sự cải thiện hệ.

- Đây là phase đã chín nhất.
- Baseline review, executive review, roadmap, decision matrix, upgrade trace, conformance trace, test log, naming/storage rules, và rotation rules đều đã được chốt thành canonical artifacts.
- Ý nghĩa thực tế: phần "quản hồ sơ, quản bằng chứng, quản mốc đối soát" đã đủ ổn để dùng làm nền cho các batch nâng cấp tiếp theo.

### Phase 1 — Đã đi rất xa nhưng chưa thể gọi là hợp nhất toàn hệ

Why this phase matters:
- Đây là phase quyết định CVF có thật sự là một governance substrate nhất quán hay chỉ là nhiều enforcement islands ghép lại.

- Điểm đã làm thật:
  - executor hardening ở `v1.1.1`
  - unified governance snapshot ở `cvf-web`
  - registry/UAT binding path
  - canonical governance state registry export
  - operational entry đầu tiên đã có trong state source
- Điểm còn dang dở:
  - chưa phải mọi runtime/extension đều đọc cùng một control plane runtime state
  - coverage operational mới chỉ ở mức baseline đầu tiên, chưa phải diện rộng toàn ecosystem

### Phase 2 — Không còn là "ý tưởng", nhưng vẫn mới là Wave 1

Why this phase matters:
- Nếu không có conformance đủ mạnh, mọi tuyên bố "CVF đang hoạt động đúng" chỉ là niềm tin, không phải trạng thái kiểm được.

- Điểm đã làm thật:
  - cross-extension conformance registry
  - markdown + JSON report artifacts
  - authoritative sequential runner
  - per-scenario duration capture
  - frozen golden baseline + diff report
  - release-grade gate cho canonical Wave 1
  - release-grade profile theo capability families cốt lõi
  - minimum breadth thresholds cho từng capability family và toàn Wave 1
- hiện tại Wave 1 đã PASS `84` scenarios
- authoritative sequential runner đã được tối ưu bằng dependency groups, nên Wave 1 không còn bị chi phối bởi repeated packet/runtime bootstrap như trước
- Điểm còn dang dở:
  - mới là release-grade gate cho `Wave 1`, chưa phải full release gate cho mọi line/version trong tương lai
  - hiện vẫn là một conformance baseline mạnh, chưa phải đích cuối
  - packet-based scenarios still carry repeated dependency cost even after the first bootstrap reuse improvement

### Phase 3 — Skill governance đã operational ở mức runtime baseline

Why this phase matters:
- Skill là nơi policy chạm trực tiếp vào hành vi của agent; nếu phase này lỏng, toàn bộ phần governance phía trên rất dễ bị bypass ở runtime.

- Điểm đã làm thật:
  - revoked/deprecated/forbidden skill blocking
  - successor migration
  - dependency-status checks
  - phase-compatibility checks
  - multi-hop upgrade orchestration
- Điểm còn dang dở:
  - broader replacement policy
  - rollout strategy rộng hơn cho toàn ecosystem skills

### Phase 4 — Durable execution đã có baseline mạnh, nhưng chưa phải orchestration hoàn chỉnh

Why this phase matters:
- Đây là phase quyết định CVF có chịu được workflow dài, recovery, replay, và incident handling thật hay không.

- Điểm đã làm thật:
  - rollback/recovery
  - deterministic replay
  - checkpoint/resume
  - session-linked audit trail
  - cross-extension resume / replay / recovery
  - remediation policy, execution, adapters, receipts, export path
  - multi-runtime remediation evidence chain
- Điểm còn dang dở:
  - broader long-running orchestration ngoài boundary hiện tại
  - remediation automation sâu hơn cho các nhánh vẫn đang human-gated

### Phase 5 — Gần như đã khép ở mức local-ready

Why this phase matters:
- Nếu release/version line không rõ, toàn bộ evidence chain phía sau sẽ có giá trị audit thấp vì không biết đang phê duyệt đúng artifact nào.

- Điểm đã làm thật:
  - `CVF_RELEASE_MANIFEST.md`
  - `CVF_MODULE_INVENTORY.md`
  - `CVF_MATURITY_MATRIX.md`
  - consistency gate riêng cho release manifest
- Điểm còn dang dở:
  - chủ yếu là mở rộng coverage khi hệ còn tiếp tục lớn lên
  - không còn là weakness lớn ở baseline hiện tại

### Phase 6 — Đã vượt mức "có tài liệu", nhưng approval lifecycle vẫn chưa khép

Why this phase matters:
- Đây là phase chuyển CVF từ mức "có governance" sang mức "có thể giải trình và phòng thủ quyết định release/audit bằng evidence machine-checkable".

- Điểm đã làm thật:
  - enterprise evidence pack canonical
  - 4 packet postures: `local-ready`, `production-candidate review`, `internal audit`, `enterprise onboarding`
  - multi-runtime evidence manifest với `8` runtime families
  - cross-family packet coverage
  - deferred/promotion/approval policy layers
- approval artifact fulfillment / strength / authority layers
- approval artifact validity / invalidation / external issuer / external proof / external revocation / revocation-issuer / revocation-issuer-proof layers đã được kéo sâu tới `CF-084`
- Điểm còn dang dở:
- provenance-attestation provenance freshness-proof closure đã bắt đầu
- attestation-bearing provenance freshness-proof closure ở đầu ngoài cùng của revocation lifecycle
- xa hơn nữa là binding chặt hơn giữa freshness semantics, provenance-attestation provenance freshness proof, và proof-bearing revocation authority signals nếu Phase 6 tiếp tục mở sâu
- nói ngắn gọn: artifact đã được đánh giá về "có hay không", "mạnh tới đâu", "ai cấp", "còn hiệu lực không", "bị vô hiệu hóa từ nguồn nào", "attestation-bearing provenance đó đã được verify hay chưa", "provenance chain nào đang govern các attestation-bearing authority signals đó", "provenance-attestation provenance đó đã được verify hay chưa", "provenance-attestation provenance đó còn fresh hay không", và giờ cả "freshness-proof nào đang govern các provenance-bearing attestation chains đó", nhưng chưa khép phần closure cuối cùng giữa freshness-proof và authority-signal proof-bearing semantics ở đầu ngoài cùng của lifecycle
- Depth Audit hiện tại kết luận rằng phần closure còn lại này **chưa đủ giá trị để tiếp tục ưu tiên ngay**, nên Phase 6 được xem là `depth-frozen for now` cho đến khi xuất hiện một risk hoặc decision ambiguity mới có giá trị thật

### Kết luận điều hành

- Nếu nhìn ở mức roadmap tổng thể, CVF hiện **không còn ở trạng thái "đang phác thảo"**.
- Các phase mạnh nhất hiện nay là `Phase 0`, `Phase 5`, `Phase 6`.
- Các phase đã rất mạnh nhưng chưa đóng tuyệt đối là `Phase 1`, `Phase 2`, `Phase 3`, `Phase 4`.
- Wave 1 canonical hiện tại là `84 scenarios / PASS`, nên vấn đề chính không còn là “có baseline conformance hay chưa” mà là phase nào còn tạo ra giá trị kiểm soát thực sự nếu tiếp tục đầu tư.
- `Phase 2` hiện đã có một `release-grade` quyết định máy-kiểm khá chặt cho Wave 1: `84/84` covered scenarios, `18/18` critical anchors, `17/17` family-level coverage groups.
- Sau Depth Audit, nhánh hợp lý nhất để đi tiếp không còn là đào sâu thêm `Phase 6`, mà là quay lại `Phase 2` và các weakness rộng hơn có giá trị hệ thống cao hơn.

## 1.5 Depth Audit Rule (mandatory before going deeper)

Depth Audit không còn là khuyến nghị riêng cho `Phase 6`.

Từ mốc này trở đi, **mọi phase** muốn mở thêm semantic layer, policy layer, `CF-*` batch, hoặc subdivision tương đương đều phải qua Depth Audit.

Canonical rule: `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`

Mỗi bước sâu hơn phải tự audit theo 5 câu hỏi sau:

1. `Risk reduction`: layer mới có chặn được một rủi ro thật, hay chỉ đổi cách gọi một tín hiệu đã có?
2. `Decision value`: layer mới có giúp release/audit/runtime decision tốt hơn, hay chỉ làm packet dài hơn?
3. `Machine enforcement`: layer mới có thể gắn với gate/check/evidence rõ ràng, hay chỉ thêm narrative?
4. `Operational cost`: layer mới có làm tăng đáng kể thời gian runner, độ dài log, độ phức tạp code, hay gánh nặng review?
5. `Opportunity cost`: có phase/open weakness nào khác đang thiếu hơn và đáng ưu tiên hơn không?

### 1.5.1 Scoring model and thresholds

Mỗi tiêu chí được chấm `0..2`. Tổng điểm tối đa là `10`.

| Tổng điểm | Quyết định |
|---|---|
| `8-10` | `CONTINUE` |
| `6-7` | `REVIEW REQUIRED` |
| `0-5` | `DEFER` |

Hard-stop override:

- nếu `Risk reduction = 0`
- hoặc `Decision value = 0`
- hoặc `Machine enforcement = 0`

thì mặc định quyết định phải là `DEFER`, kể cả tổng điểm danh nghĩa cao hơn.

### 1.5.2 Continue Criteria

Chỉ nên tiếp tục đào sâu khi thỏa đồng thời:

- giảm mơ hồ cho quyết định `release / audit / remediation / promotion`
- tạo được `artifact + gate + evidence` rõ ràng
- không trùng nghĩa với 1-2 layer ngay trước đó
- chi phí vận hành bổ sung vẫn chấp nhận được

### 1.5.3 Defer Criteria

Nên dừng hoặc defer khi:

- layer mới chủ yếu là semantic refinement của tín hiệu đã có
- cùng một risk có thể được chặn tốt hơn ở phase khác
- thêm layer làm runner chậm hơn hoặc code khó bảo trì hơn nhưng giá trị kiểm soát tăng ít
- roadmap bắt đầu lệch khỏi mục tiêu "đủ tin cậy để vận hành" sang mục tiêu "hoàn hảo hình thức"

### 1.5.4 Current Depth Audit Decision

Đánh giá tại thời điểm này:

- `Phase 6` đã đi tới điểm mà nhánh semantic closure hiện tại nên được đánh dấu `DEFER`
- `Phase 2` cũng phải dùng cùng rule này nếu Wave 1 bắt đầu tách thêm scenario chỉ để tăng semantic coverage mà không tăng decision quality
- từ điểm hiện tại trở đi, mọi layer mới nên được xem là `case-by-case`, không coi là auto-priority
- nếu một batch mới không chứng minh được `risk reduced > complexity added`, nên đánh dấu `defer` thay vì tiếp tục kéo chain dài thêm

### 1.5.5 Current scored audit for the next deferred candidate

Candidate vừa được audit:

- `Phase 6` next-step branch:
  - `external revocation issuer proof authority provenance-attestation provenance freshness-proof closure / proof-bearing closure`

Depth Audit:

- `Risk reduction`: `0`
- `Decision value`: `1`
- `Machine enforceability`: `2`
- `Operational efficiency`: `0`
- `Portfolio priority`: `0`
- `Total`: `3/10`
- `Decision`: `DEFER`

Reason:

- lớp kế tiếp chủ yếu mở rộng semantic closure của signals đã được govern và verify ở baseline hiện tại
- chưa chứng minh thêm được một risk vận hành/release/audit mới đủ rõ để biện minh cho chi phí complexity
- còn các open weaknesses rộng hơn ở `Phase 2` có giá trị hệ thống cao hơn tại thời điểm này

### 1.5.6 Current scored audit for the active next candidate

Candidate đang được phép triển khai:

- `Phase 2` next-step branch:
  - `release-grade family-level quality thresholds`

Depth Audit:

- `Risk reduction`: `2`
- `Decision value`: `2`
- `Machine enforceability`: `2`
- `Operational efficiency`: `1`
- `Portfolio priority`: `1`
- `Total`: `9/10`
- `Decision`: `CONTINUE`

Reason:

- giảm rủi ro kiểu `family PASS nhưng coverage lệch về một cluster`, đặc biệt ở `durable runtime` và `packet policy`
- tăng giá trị quyết định của `release-grade PASS` mà không mở thêm scenario hay kéo dài semantic chain
- thực thi được hoàn toàn bằng profile/gate hiện có, không đòi thêm runtime line mới
- chi phí vận hành tăng thấp hơn đáng kể so với việc mở thêm breadth hoặc quay lại đào sâu Phase 6

---

## 2. Danh sách weakness cần đóng

| ID | Weakness | Mức độ | Trạng thái hiện tại |
|---|---|---|---|
| W1 | Unified governance control plane chưa hoàn chỉnh | P0 | Chưa khép |
| W2 | E2E conformance chưa đủ sâu | P0 | Chưa khép |
| W3 | Skill governance chưa operationalized hoàn toàn | P1 | Một phần còn ở roadmap |
| W4 | Runtime orchestration chưa có durable execution đầy đủ | P1 | Thiếu checkpoint/pause-resume/recovery |
| W5 | Release/version narrative còn phức tạp | P1 | Chưa có manifest điều hành thống nhất |
| W6 | Ecosystem inventory và maturity mapping chưa đủ rõ | P2 | Có nhiều line/version nhưng chưa gom một view chuẩn |
| W7 | Enterprise evidence pack chưa đầy đủ | P2 | Audit mindset tốt nhưng chưa đóng gói thành control pack |

---

## 3. Chiến lược tổng thể

### Track A — Hardening current operating baseline

Mục tiêu: làm cho CVF hiện tại đáng tin cậy hơn mà không thay đổi bản sắc hệ.

### Track B — Operational unification

Mục tiêu: gom policy, registry, approval, UAT, runtime state thành một control plane nhất quán.

### Track C — Platform evolution

Mục tiêu: bổ sung durable execution, full conformance, release manifest và enterprise readiness.

---

## 4. Phase roadmap

## Phase 0 — Freeze baseline and establish upgrade governance `[DONE]`

### Mục tiêu

- Khóa baseline 2026-03-06 làm mốc chính thức
- Tách rõ tài liệu baseline, executive review, và roadmap triển khai
- Thiết lập rule “append delta, không rewrite lịch sử”

### Deliverables

- Baseline review frozen
- Executive review split doc
- Comprehensive roadmap split doc
- Decision owner cho từng track

### Exit criteria

- Baseline có thể dùng làm mốc đối chiếu cho mọi đợt nâng cấp
- Các doc tham chiếu chéo rõ ràng

---

## Phase 1 — Unified Governance Control Plane `[MOSTLY DONE]`

### Mục tiêu

Đóng weakness `W1`.

### Vấn đề hiện tại

- Registry, UAT status, approval state, skill state và runtime enforcement đang phân tán.
- Một phần enforcement nằm ở docs, một phần ở extension code, một phần ở review workflow.

### Hạng mục triển khai

1. Tạo `control-plane schema` chuẩn cho:
   - agent identity
   - phase/role/risk state
   - skill state
   - UAT status
   - approval/override status
   - audit linkage
2. Chọn một `source of truth` duy nhất cho trạng thái runtime-governance.
3. Chuẩn hóa API hoặc module adapter để mọi extension đọc cùng một state.
4. Bắt buộc enforcement đọc từ control plane thay vì hardcode riêng từng module.

### Deliverables

- `governance-state schema`
- `registry aggregator`
- `approval state adapter`
- `uat status resolver`
- `single-source governance contract`

### Success metrics

- 100% runtime governance checks đọc từ cùng một contract
- Không còn phase/risk/skill state bị lặp định nghĩa ở nhiều nơi

### Gate

- Contract test cho governance state
- Backward compatibility statement
- Drift audit PASS

### Progress update (2026-03-07)

- Chưa đạt mục tiêu phase-level unification.
- Đã có một bước nền ở extension `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`:
  - executor orchestration không còn hardcode verification modules
  - audit persistence đã được nối vào runtime boundary khi có `GovernanceAuditLog`
  - trust boundary được đẩy lên đầu pipeline để reject sớm artifact không đáng tin
  - control-plane contract runtime đã xuất hiện để gom `policyVersion` + default `auditPhase` về một nguồn chuẩn dùng chung
- Đã có thêm một bước nối nhiều extension ở `CVF_v1.6_AGENT_PLATFORM/cvf-web`:
  - enforcement layer giờ trả ra unified governance snapshot cho phase/risk/approval/skill-preflight
  - server/client enforcement cùng map về một contract snapshot thay vì mỗi nơi tự giữ shape riêng
  - registry/UAT binding points đã được thêm vào snapshot contract
  - nếu caller truyền `registryBinding` / `uatBinding`, snapshot giờ có thể phản ánh trạng thái thật thay vì luôn `unbound`
  - `api/governance/evaluate` giờ đã có local resolver đọc Agent Registry + Self-UAT log để trả kèm governance bindings khi có `agent_id`
  - `evaluateEnforcementAsync` giờ ưu tiên route local này và đưa resolved bindings đi thẳng vào runtime enforcement snapshot, thay vì chỉ dừng ở API response layer
  - đã có thêm `docs/reference/CVF_GOVERNANCE_STATE_REGISTRY.json` như machine-readable artifact để runtime consumers dùng chung một canonical state source
  - canonical source records giờ đã có operational entry thật cho `AI_ASSISTANT_V1`, và state registry đã chuyển từ `template-only` sang `active`
- Ý nghĩa:
  - tốt hơn cho modularity và traceability
  - giảm thêm một lớp caller-level drift trong runtime hardening hiện tại
  - đóng thêm một khoảng trống thực thi giữa canonical CVF records và `cvf-web` execution path
  - nhưng vẫn chưa thay thế được một `single-source governance contract` cho toàn ecosystem
  - gap dữ liệu ban đầu của state registry đã được đóng ở mức local baseline đầu tiên, nhưng coverage vẫn mới ở 1 operational agent

---

## Phase 2 — End-to-End Conformance Pipeline `[OPEN NEXT]`

### Mục tiêu

Đóng weakness `W2`.

### Vấn đề hiện tại

- Module tests tốt, nhưng chưa đủ một conformance suite xuyên suốt nhiều layer.

### Hạng mục triển khai

1. Thiết kế `canonical scenario set` cho các flow:
   - intake/design/build/review
   - approval/reject/override
   - skill preflight pass/fail
   - risk escalation
   - audit and rollback
2. Tạo `e2e governance harness`.
3. Tạo `golden scenarios` cho expected decisions.
4. Bổ sung `cross-extension conformance run`.

### Deliverables

- `conformance scenarios`
- `governance-e2e suite`
- `golden decision baseline`
- `cross-extension coverage report`

### Success metrics

- Mỗi release candidate phải PASS conformance suite
- Mọi policy/regression thay đổi đều có diff report so với baseline

### Gate

- Conformance suite PASS
- Report archived vào trace/review chain

### Progress update (2026-03-07)

- Started.
- Initial cross-extension conformance layer now exists:
  - `docs/reference/CVF_CONFORMANCE_SCENARIOS.md`
  - `docs/reference/CVF_CONFORMANCE_SCENARIOS.json`
  - `scripts/run_cvf_cross_extension_conformance.py`
  - `docs/reviews/cvf_phase_governance/CVF_CROSS_EXTENSION_CONFORMANCE_REPORT_2026-03-07.md`
  - `docs/reviews/cvf_phase_governance/CVF_CROSS_EXTENSION_CONFORMANCE_SUMMARY_2026-03-07.json`
  - `governance/compat/check_conformance_artifact_consistency.py`
  - `docs/baselines/CVF_CONFORMANCE_GOLDEN_BASELINE_2026-03-07.json`
  - `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_DIFF_REPORT_2026-03-07.md`
  - `governance/compat/check_conformance_golden_diff.py`
  - `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_RELEASE_GATE_REPORT_2026-03-07.md`
  - `governance/compat/check_conformance_release_grade.py`
  - `scripts/run_cvf_conformance_release_gate.py`
  - `docs/reference/CVF_CONFORMANCE_RELEASE_GRADE_PROFILE_2026-03-08.json`
- Wave 1 conformance batch has PASSed across:
  - `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL`
  - `CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE`
  - `CVF_v1.8_SAFETY_HARDENING` rollback / recovery path
  - `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY` replay / drift detection path
  - `CVF_v1.7.1_SAFETY_RUNTIME` checkpoint / resume path
  - `CVF_v3.0_CORE_GIT_FOR_AI`
  - `cvf-web` phase authority and governance post-check layers
  - Phase 5 / Phase 6 consistency gates
  - skill misuse refusal path for revoked skills and forbidden operations
  - deprecated-skill filtering, loader blocking, and refusal routing
  - rollback record persistence and force-rollback recovery behavior
  - deterministic replay exact-match / drift / fail-closed behavior
  - stored-checkpoint resume from validated proposal state
  - cross-extension audit replay seeding from `CVF_v1.7.1_SAFETY_RUNTIME` into `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
  - cross-extension workflow resume from validated `CVF_v1.7.1_SAFETY_RUNTIME` checkpoints into `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
  - cross-extension recovery orchestration that distinguishes `resume` from `rollback-required` by consuming `CVF_v1.8_SAFETY_HARDENING` rollback records
  - cross-extension failure classification that now distinguishes `runtime interruption`, `policy refusal`, and `system abort` before any workflow resume path
  - cross-extension remediation policy that now maps orchestration outcomes to severity, approval needs, and next-step playbooks
  - cross-extension remediation execution that now auto-runs safe recovery steps for low-risk outcomes and fail-closes human-gated ones
  - remediation adapter layer that now exposes safe recovery execution through a machine-readable interface for future runtime adapters
  - a file-backed local remediation adapter that now persists safe recovery receipts as a runtime artifact instead of only holding them in memory
  - a remediation export path that now turns file-backed runtime receipts into a canonical markdown evidence log for the review/archive chain
  - a release-evidence remediation adapter that now emits both JSON and markdown evidence directly at runtime-safe remediation boundaries
  - the release-evidence remediation path now extends into `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`, so a second runtime family can emit compatible remediation evidence artifacts
- Wave 1 is now more than a report-only batch:
  - scenarios have a machine-readable canonical registry
  - runner emits both markdown and JSON artifacts
  - artifact consistency gate exists and is wired into `documentation-testing.yml`
  - a frozen golden decision baseline now exists for the current canonical Wave 1 state
  - the authoritative sequence now emits a conformance diff report so drift against the frozen baseline is reviewable, not implicit
  - the authoritative sequence now also emits a release-grade report, so `Wave 1 PASS + dependency groups PASS + NO DIFF` becomes one explicit governable decision instead of three separate checks
  - the release-grade decision is now anchored to an explicit capability-family profile, so `Wave 1 PASS` also has to prove breadth across core governance, skill governance, durable runtime, release/evidence, and packet-policy surfaces
  - the release-grade decision now also enforces minimum breadth thresholds and full disjoint coverage of the current 84-scenario Wave 1 baseline, so future drift cannot silently shrink one family while preserving aggregate PASS
  - the release-grade decision now also enforces critical-anchor scenarios per capability family, so a family cannot remain release-grade by satisfying only broad counts while missing its most decision-relevant scenarios
  - the release-grade decision now also enforces family-level coverage groups, so a family cannot remain release-grade by clustering all of its passing scenarios into only one sub-surface while leaving another required sub-surface uncovered
- W2 is no longer "completely open", but it is still not closed:
  - current suite is still focused, not a full release-candidate conformance gate beyond the current Wave 1 scope
  - durable execution coverage is still partial: rollback/recovery, replay, checkpoint/session resume, an audit-bridge replay baseline, a cross-extension workflow-resume baseline, a recovery-orchestration baseline, a failure-classification baseline, a remediation-policy baseline, a remediation-execution baseline, and a first remediation-adapter baseline now exist, but broader release-grade orchestration is still missing
  - deeper skill lifecycle behavior beyond deprecated/revoked blocking is still open
  - current Wave 1 release-grade decision is now guarded by `84/84` covered scenarios, `18/18` critical anchors, and `17/17` family-level coverage groups, so the next step should be chosen by Depth Audit instead of continuing semantic tightening by default

---

## Phase 3 — Operational Skill Governance `[MOSTLY DONE]`

### Mục tiêu

Đóng weakness `W3`.

### Vấn đề hiện tại

- Skill lifecycle mạnh về thiết kế nhưng chưa hoàn toàn trở thành execution gate thật.

### Hạng mục triển khai

1. Chuẩn hóa `skill registry runtime format`.
2. Runtime check bắt buộc:
   - skill exists
   - skill status active/verified
   - dependency status valid
   - phase compatibility valid
   - risk compatibility valid
3. Bổ sung deprecation/revocation flow.
4. Bổ sung migration path cho skill successor.
5. Thêm conformance case cho “use forbidden/deprecated/revoked skill”.

### Deliverables

- Runtime skill registry
- Skill status enforcement engine
- Deprecation/revocation policy
- Skill dependency validator

### Success metrics

- Không skill nào được execute khi không qua runtime preflight
- Revoked skill bị chặn nhất quán trong mọi entry point

### Gate

- Skill governance regression PASS
- Mapping/UAT consistency report PASS

### Progress update (2026-03-07)

- Started.
- Runtime skill misuse blocking now exists locally for:
  - revoked skills
  - deprecated skills
  - forbidden contract operations
- Canonical conformance coverage now includes:
  - `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/tests/skill.misuse.conformance.test.ts`
  - `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/tests/skill.deprecation.conformance.test.ts`
  - `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/tests/skill.successor.conformance.test.ts`
  - `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/tests/skill.phase-compat.conformance.test.ts`
  - `EXTENSIONS/CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE/tests/skill.upgrade-orchestration.conformance.test.ts`
- Current local baseline now verifies:
  - revoked skills are filtered from discovery and blocked at runtime load
  - deprecated skills are filtered from discovery and blocked at runtime load
  - refusal routing distinguishes revoked vs deprecated reasons
  - deprecated skills can migrate to an active successor through registry metadata
  - runtime loading fails closed when dependency status is blocked
  - runtime loading fails closed when current phase is incompatible with skill policy
  - deprecated skill upgrade chains can resolve across multiple successor hops
  - migration cycles fail closed instead of looping or silently downgrading
- Remaining work:
  - expand lifecycle coverage beyond current successor/upgrade orchestration into richer replacement policy and broader rollout flows

---

## Phase 4 — Durable Execution and Recovery `[MOSTLY DONE]`

### Mục tiêu

Đóng weakness `W4`.

### Vấn đề hiện tại

- Chưa có execution substrate đủ mạnh cho workflow dài, gián đoạn, hoặc cần khôi phục.

### Hạng mục triển khai

1. Thiết kế `execution checkpoint model`.
2. Bổ sung:
   - pause/resume
   - retry policy
   - timeout policy
   - deterministic rollback
   - failure recovery state
3. Tạo `execution journal` thống nhất với audit ledger.
4. Phân biệt:
   - recoverable failure
   - policy refusal
   - system abort

### Deliverables

- Checkpoint engine
- Resume protocol
- Timeout/retry policy
- Recovery flow spec
- Rollback verification tests

### Success metrics

- Workflow dài có thể resume không mất governance context
- Recovery path có audit trace đầy đủ

### Gate

- Failure injection tests PASS
- Replay/recovery tests PASS

### Progress update (2026-03-07)

- Started.
- Initial local durable recovery conformance slice now exists:
  - `EXTENSIONS/CVF_v1.8_SAFETY_HARDENING/tests/durable.recovery.conformance.test.ts`
  - `EXTENSIONS/CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/tests/replay.conformance.test.ts`
  - `docs/reference/CVF_CONFORMANCE_SCENARIOS.md`
  - `docs/reference/CVF_CONFORMANCE_SCENARIOS.json`
  - `docs/reviews/cvf_phase_governance/CVF_CROSS_EXTENSION_CONFORMANCE_REPORT_2026-03-07.md`
  - `docs/reviews/cvf_phase_governance/CVF_CROSS_EXTENSION_CONFORMANCE_SUMMARY_2026-03-07.json`
- Current local baseline now verifies:
  - verification anomaly triggers rollback and records recovery state
  - mutation-not-applied failure triggers rollback and records recovery state
  - force rollback preserves snapshot linkage in the rollback record
  - deterministic replay returns `EXACT` when context is unchanged
  - deterministic replay returns `DRIFT` when file context changes
  - deterministic replay fails closed for unknown execution records
  - proposals can pause after validation and resume from a stored checkpoint
  - session-bound checkpoints require the correct session identity and resume token before continuing
  - checkpoint resumes now record resume count metadata for long-running session continuity
  - authorized session resumes now persist checkpoint/session linkage into the execution journal
  - `v1.7.1` audit-linked execution records can now seed `v1.9` replay for exact replay, drift detection, and unauthorized-resume fail-closed behavior
  - validated `v1.7.1` checkpoints can now seed a guarded cross-extension workflow resume into `v1.9` only when session/token checks pass
  - `v1.8` rollback records can now block cross-extension resume and force a `rollback-required` orchestration decision before replay is attempted
  - cross-extension orchestration can now classify `runtime interruption`, `policy refusal`, and `system abort` as distinct non-resume outcomes
  - each cross-extension orchestration outcome now emits a remediation policy with severity, approval requirement, and next-step playbook
  - safe remediation steps can now execute automatically for `RESUMED` and `INTERRUPTED`, while `ROLLBACK_REQUIRED`, `REFUSED`, and `ABORTED` stay human-gated
  - safe remediation execution now has a machine-readable adapter seam, so future runtime-specific adapters can plug in without changing orchestration policy
  - safe remediation execution can now persist file-backed runtime receipts through a local adapter artifact while human-gated outcomes still leave no adapter artifact behind
  - file-backed runtime receipts can now be exported into a canonical markdown evidence log and picked up by release-facing documentation
  - release-grade remediation evidence can now be emitted directly by a runtime adapter instead of always depending on a separate export step after execution
  - release-grade remediation evidence is no longer isolated to `v1.9`; the adapter-hub line now has a compatible evidence-emission path as well
  - `v1.9` + `v1.7.3` remediation evidence can now be assembled into a single multi-runtime manifest that feeds the current release packet / enterprise evidence chain
  - the multi-runtime manifest now carries release-grade metadata (`versionToken`, `releaseLine`, `maturity`, `evidenceAnchor`) and has a dedicated consistency gate against the release packet and `CVF_RELEASE_MANIFEST.md`
  - `CVF_v1.8_SAFETY_HARDENING` rollback/recovery evidence now participates as a third runtime family in the same release-grade manifest chain
  - the current runtime evidence set now has an explicit cross-family release-policy gate, not just structural metadata checks
  - package-level `npx tsc --noEmit` for `CVF_v1.7.1_SAFETY_RUNTIME` is no longer blocked by Prisma client resolution drift
- Remaining work:
  - extend current recovery-orchestration baseline into broader release-grade orchestration across more than the `v1.7.1/v1.8 -> v1.9` boundary
  - deepen executable remediation beyond the current safe subset into richer recovery automation with stronger guardrails
  - extend the current multi-runtime evidence baseline beyond the current `v1.9 + v1.7.3` pair into additional runtime families and richer release-grade orchestration
  - extend current journal linkage into deeper release-grade durable execution gates

---

## Phase 5 — Release, Version, and Baseline Discipline `[DONE]`

### Mục tiêu

Đóng weakness `W5` và `W6`.

### Vấn đề hiện tại

- Dễ mơ hồ giữa stable line, draft line, extension line, reviewed line, local-only line.

### Hạng mục triển khai

1. Tạo `release manifest` duy nhất cho toàn CVF.
2. Gắn cho mỗi module:
   - maturity
   - owner
   - test status
   - coverage snapshot
   - release line
   - baseline reference
3. Tạo `ecosystem inventory map`.
4. Chuẩn hóa cách công bố:
   - stable
   - draft
   - local-only
   - review-only
   - frozen

### Deliverables

- `CVF_RELEASE_MANIFEST.md`
- `CVF_MODULE_INVENTORY.md`
- `CVF_MATURITY_MATRIX.md`
- update rules cho README / VERSIONING / architecture map

### Success metrics

- Một người mới có thể xác định đúng module nào là current baseline trong dưới 5 phút
- Không còn mâu thuẫn rõ giữa release docs và reviewed baseline

### Gate

- Manual doc audit PASS
- Version consistency check PASS

### Progress update (2026-03-07)

- Started.
- Canonical Phase 5 deliverables created locally:
  - `docs/reference/CVF_RELEASE_MANIFEST.md`
  - `docs/reference/CVF_MODULE_INVENTORY.md`
  - `docs/reference/CVF_MATURITY_MATRIX.md`
- Entry points updated so versioning policy and release-state reality are no longer conflated.
- Technical checker implemented locally:
  - `governance/compat/check_release_manifest_consistency.py`
  - CI hook added in `documentation-testing.yml`
- Remaining work:
  - validate manifest content against broader extension set over time
  - expand checker scope if future drift patterns appear outside current Phase 5 contract

---

## Phase 6 — Enterprise Evidence Pack `[MOSTLY DONE / DEFER FURTHER DEPTH FOR NOW]`

### Mục tiêu

Đóng weakness `W7`.

### Vấn đề hiện tại

- Có tư duy audit tốt, nhưng chưa thành bộ bằng chứng chuẩn cho enterprise/governance review.

### Hạng mục triển khai

1. Tạo evidence pack chuẩn gồm:
   - control objectives
   - policy references
   - UAT evidence
   - test evidence
   - approval trace
   - incident / override records
2. Tạo mapping tài liệu theo control families.
3. Chuẩn hóa review packet cho:
   - internal audit
   - release approval
   - enterprise onboarding

### Deliverables

- `CVF_ENTERPRISE_EVIDENCE_PACK.md`
- control-to-artifact mapping
- release approval packet template

### Success metrics

- Có thể xuất bộ bằng chứng kiểm soát từ baseline + trace mà không lục thủ công toàn repo

### Gate

- Evidence completeness review PASS

### Progress update (2026-03-07)

- Started.
- Canonical Phase 6 deliverables created locally:
  - `docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md`
  - `docs/reference/CVF_CONTROL_TO_ARTIFACT_MAPPING.md`

---

## 1.5 UPDATE (2026-03-09) — Phase 1-4 Gaps Closed

### Phát triển đã hoàn thành

Ngày 2026-03-09, tất cả các gaps còn dang dở trong Phase 1-4 đã được implement với runtime modules và test coverage đầy đủ:

| Phase | Trạng thái cũ | Trạng thái mới | Implementation |
|---|---|---|---|
| **Phase 1** | MOSTLY DONE, NOT CLOSED | ✅ **CLOSED** | `UnifiedStateResolver` (23 tests) |
| **Phase 2** | STRONG WAVE 1 BASELINE | ✅ **CLOSED** | `CVF_CONFORMANCE_SCENARIOS_WAVE2.json` (24 scenarios) |
| **Phase 3** | MOSTLY DONE AT RUNTIME | ✅ **CLOSED** | `SkillRolloutEngine` (23 tests) |
| **Phase 4** | STRONG DURABLE BASELINE | ✅ **CLOSED** | `WorkflowCoordinator` (30 tests) |

### Deliverables đã tạo

1. **UnifiedStateResolver** (`CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL/governance/control_plane/`)
   - Single-source governance state resolver
   - 5-level source hierarchy with drift detection
   - Agent management with UAT binding
   - Pipeline order and trace field validation

2. **Wave 2 Conformance Scenarios** (`docs/reference/CVF_CONFORMANCE_SCENARIOS_WAVE2.json`)
   - 24 scenarios covering all 12 CVF_ECO extensions
   - 6 capability families with critical anchors
   - Extensibility framework for future waves

3. **SkillRolloutEngine** (`CVF_v3.0_CORE_GIT_FOR_AI/skill_lifecycle/`)
   - 5-stage enterprise rollout lifecycle
   - Canary deployment with anomaly detection
   - Successor validation and grace period enforcement

4. **WorkflowCoordinator** (`CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/`)
   - Multi-extension orchestration engine
   - Checkpointing, pause/resume, reverse rollback
   - Remediation policies with severity escalation

### Metrics tổng quan

- **New runtime modules:** 3
- **New conformance scenarios:** 24
- **New tests:** 76 (23 + 23 + 30)
- **Pass rate:** 100%
- **Track I status:** 100% PRODUCTION READY

### Impact

Với việc hoàn thành Phase 1-4, CVF hiện có:
- **Control plane hoàn chỉnh:** Single-source governance state
- **Conformance hoàn chỉnh:** Wave 1 + Wave 2 coverage
- **Skill governance hoàn chỉnh:** Enterprise rollout capability
- **Durable execution hoàn chỉnh:** Production orchestration

Tất cả các weakness W1-W4 đã được đóng với runtime implementations, không chỉ với deliverables.
  - `docs/reference/CVF_RELEASE_APPROVAL_PACKET_TEMPLATE.md`
- Authority separation recorded in `ADR-018`.
- Local enforcement and example packet now exist:
  - `governance/compat/check_enterprise_evidence_pack.py`
  - `docs/reviews/cvf_phase_governance/CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md`
- Local synthesis/export path now exists:
  - `scripts/export_cvf_release_packet.py`
  - `scripts/export_cvf_remediation_receipt_log.py`
  - `scripts/export_cvf_multi_runtime_evidence_manifest.py`
  - `docs/reviews/cvf_phase_governance/CVF_W4_REMEDIATION_RECEIPTS_LOCAL_BASELINE_2026-03-07.json`
  - `docs/reviews/cvf_phase_governance/CVF_W4_REMEDIATION_RECEIPT_LOG_2026-03-07.md`
  - `docs/reviews/cvf_phase_governance/CVF_W4_MULTI_RUNTIME_EVIDENCE_MANIFEST_2026-03-07.json`
  - `docs/reviews/cvf_phase_governance/CVF_W4_MULTI_RUNTIME_EVIDENCE_LOG_2026-03-07.md`
- Release packet / enterprise evidence chain now validates a runtime-evidence manifest instead of only linking one remediation artifact/log pair.
- Multi-runtime runtime-evidence linkage now has a dedicated consistency gate:
  - `governance/compat/check_runtime_evidence_manifest.py`
- Cross-family packet posture now also has a dedicated semantic gate:
  - `governance/compat/check_runtime_evidence_release_policy.py`
- `CVF_v1.7.1_SAFETY_RUNTIME` checkpoint/session evidence now participates as a fourth runtime family in the same release-grade manifest chain.
- Packet validation no longer stops at the local baseline packet; a second canonical `production-candidate review snapshot` posture now exists for the same runtime evidence set.
- Packet validation now also covers a third canonical `internal audit evidence snapshot` posture, so Phase 6 packet automation is not limited to release-facing review paths.
- Packet validation now also covers a fourth canonical `enterprise onboarding snapshot` posture, so Phase 6 packet automation spans release, audit, and onboarding semantics.
- `CVF_v1.6_AGENT_PLATFORM` governance snapshot/enforcement evidence now participates as a fifth runtime family in the same release-grade manifest chain.
- `CVF_v1.6.1_GOVERNANCE_ENGINE` policy/enforcement/approval evidence now participates as a sixth runtime family in the same release-grade manifest chain.
- `CVF_v1.2.2_SKILL_GOVERNANCE_ENGINE` filtering/phase-gating/migration evidence now participates as a seventh runtime family in the same release-grade manifest chain.
- `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` integrity/pipeline/audit evidence now participates as an eighth runtime family in the same release-grade manifest chain.
- The canonical release packet now has to explain the linked multi-runtime manifest directly through a cross-family coverage section, instead of only linking the manifest as an opaque artifact.
- The same cross-family coverage contract now also applies to the secondary packet postures (`production-candidate`, `internal audit`, `enterprise onboarding`), not only the local-ready packet.
- Deferred families are now expected to be stratified explicitly by `release line`, `maturity band`, and `promotion eligibility`, with packet-specific mixed-maturity posture documented for every packet type.
- **Packet posture semantic chain (CF-044 → CF-084):** Between CF-044 and CF-084, packet posture was progressively deepened through 40 incremental semantic layers covering: family classification, promotion policy, approval eligibility, transition prerequisites, fulfillment evidence, approval artifact binding/strength/authority/validity, revocation evidence, external authority trust, issuer attestation/verification, proof binding/verification/attestation, revocation validation, revocation issuer authority/attestation/proof, provenance chains, provenance-attestation verification/freshness, and provenance-attestation provenance freshness-proof verification. Each layer adds one governed state distinction that prevents implicit assumptions in the packet posture. **Depth Audit scored the next layer beyond CF-084 as 3/10 = DEFER** (see Section 1.5.5). Full per-scenario detail is preserved in `CVF_CONFORMANCE_TRACE_2026-03-07.md`.
- Secondary packet posture validation now reuses a shared runtime-evidence bootstrap, so the same multi-runtime baseline is not redundantly regenerated three times inside one secondary packet aggregation batch.
- Canonical Wave 1 conformance output now records per-scenario duration, so optimization can target measured hotspots instead of subjective reports.
- Canonical Wave 1 conformance now also uses an explicit `runtime_evidence_release_state` dependency group in the runner, so packet-family and runtime-evidence scenarios reuse one precomputed release/evidence state instead of rebuilding the same bootstrap for every downstream scenario.
- The authoritative Wave 1 closeout is now down to about `299.6s` from the prior `320.903s`, so scenario-level dependency reuse has started reducing repeated packet/runtime bootstrap cost without changing scenario semantics.
- Canonical Wave 1 conformance now also uses an explicit `packet_posture_state` dependency group in the runner, so scenarios `CF-044..CF-068` reuse one precomputed local+secondary packet posture baseline instead of rerunning the full packet aggregation chain per downstream gate.
- The authoritative Wave 1 closeout is now down to about `115.3s` from the prior `299.6s`, so packet-posture reuse has removed the largest remaining repeated cost after release-state reuse and made the local/secondary packet aggregation layer no longer the dominant bottleneck.
- Canonical Wave 1 conformance now also routes `CF-042..CF-043` through the shared packet-posture cache and uses dedicated `v19_conformance_state`, `v171_conformance_state`, and `v122_conformance_state` dependency groups, so repeated Vitest startups for the `v1.9`, `v1.7.1`, and focused `v1.2.2` scenario clusters are no longer paid once per scenario.
- The authoritative Wave 1 closeout is now down to about `62.0s` from the prior `115.3s`, so the dominant repeated scenario-cluster cost has been removed and the remaining hotspots are now the standalone baselines such as `CF-004`, `CF-005`, `CF-008`, `CF-010`, `CF-027`, and `CF-029`.
- Governed Python automation under `scripts/` and `governance/compat/` is now size-guarded, and `scripts/export_cvf_release_packet.py` has already been brought back under threshold by extraction into dedicated `scripts/release_packet/*.py` modules.
- `scripts/export_cvf_multi_runtime_evidence_manifest.py` has now been modularized into `scripts/runtime_evidence_manifest/*.py`, so the main entrypoint is back under threshold and the next automation-size review can wait until a new governed hotspot actually emerges instead of carrying a pre-emptive exception.
- Authoritative verification during the manifest-exporter refactor exposed latent drift in `scripts/release_packet/approval_artifact_policies.py`; that packet-policy drift has now been corrected and revalidated through the canonical Wave 1 sequence, so the refactor batch improved both maintainability and packet-policy consistency instead of only moving code around.
- **Wave 1 scenario extensions (CF-063 → CF-084):** Scenarios CF-063 through CF-084 progressively extended the external approval-artifact chain from proof binding/verification/attestation (CF-063–065) through revocation validation/attestation/issuer authority (CF-066–069), revocation issuer proof verification/attestation/freshness (CF-070–072), authority provenance chains (CF-073–076), provenance-attestation verification/freshness (CF-077–080), and provenance-attestation provenance freshness-proof verification (CF-081–084). Canonical Wave 1 is now closed at `scenarioCount = 84`, `overallResult = PASS`. Full per-scenario trace is in `CVF_CONFORMANCE_TRACE_2026-03-07.md`.
- Packet-posture bootstrap now re-exports the local canonical packet even when `CVF_SKIP_RUNTIME_EVIDENCE_RELEASE_GATE=1`, so cache reuse no longer risks stale local packet semantics when the exporter evolves between focused gate runs.
- The canonical incremental test log is now governed as an active review window with explicit rollover thresholds, archive location, and technical enforcement, so evidence review remains sustainable as the baseline grows.
- The canonical conformance trace is now governed as a scoped active review window with its own rollover thresholds, archive location, and technical enforcement, so Wave 1 evidence growth stays reviewable without mixing trace-rotation policy across unrelated review chains.
- Remaining work:
  - broaden packet validation beyond the current `local-ready + production-candidate review + internal audit + enterprise onboarding` set if more packet families are added
  - extend the current release-metadata baseline to runtime families beyond the current `v1.9 + v1.8 + v1.7.3 + v1.7.1 + v1.6 + v1.6.1 + v1.2.2 + v1.1.1` set and future packet types
  - move from current revocation-issuer proof timestamp / invalidation-source semantics into stronger external issuer timestamp verification / invalidation-authority validation if packets begin consuming externally issued revocation issuer artifacts

---

## 5. Hướng phát triển dài hạn sau khi đóng weakness

## Direction A — CVF as Agent Operating Substrate

Mục tiêu:

- từ governance framework tiến lên execution substrate có state, recovery, orchestration, replay, contract enforcement.

## Direction B — Policy-as-Code Runtime

Mục tiêu:

- policy không chỉ là docs hoặc config rời, mà là hệ compile/validate/version/migrate được.

## Direction C — Multi-Agent Governance Fabric

Mục tiêu:

- nhiều agent cùng làm việc nhưng vẫn chia phase, role, risk, authority, lineage rõ ràng.

## Direction D — Enterprise Adoption Layer

Mục tiêu:

- đóng gói CVF thành thứ dễ áp dụng cho team/enterprise mà không phải đọc toàn bộ repo trước.

---

## 6. Ưu tiên triển khai đề xuất

| Phase | Priority | Tác động | Độ khó | Ghi chú |
|---|---|---|---|---|
| Phase 0 | P0 | Rất cao | Thấp | Đã gần hoàn tất |
| Phase 1 | P0 | Rất cao | Cao | Quan trọng nhất để khép governance runtime gap |
| Phase 2 | P0 | Rất cao | Cao | Bắt buộc để có system truth |
| Phase 3 | P1 | Cao | Trung bình | Làm sau control plane |
| Phase 4 | P1 | Cao | Cao | Nền tảng cho platform evolution |
| Phase 5 | P1 | Cao | Trung bình | Giảm nhầm lẫn release/baseline |
| Phase 6 | P2 | Trung bình | Trung bình | Quan trọng cho enterprise scaling |

### Priority override note

- Mọi mở rộng governance automation ngoài `docs/**/*.md` hiện tại phải đứng **sau** các remediation item xuất phát từ independent baseline review.
- Không mở Phase 2A enforcement nếu còn làm chậm việc khép `W1`, `W2`, `W3`.

---

## 7. Đề xuất thứ tự thực thi thực tế

### Wave 1 — Close governance gaps

- Phase 0
- Phase 1
- Phase 2

### Wave 2 — Operationalize execution

- Phase 3
- Phase 4

### Wave 3 — Scale and package

- Phase 5
- Phase 6

---

## 8. Exit condition của roadmap này

Roadmap được xem là hoàn thành khi:

- control plane đã hợp nhất,
- conformance suite đã trở thành release gate,
- skill governance chạy như runtime gate thật,
- workflow dài có checkpoint/recovery,
- release manifest và module inventory đã rõ,
- enterprise evidence pack xuất được từ baseline + trace.

---

## 9. Final Recommendation

CVF không nên tiếp tục mở rộng theo kiểu “thêm module mới trước, hợp nhất sau”.  
Thứ tự đúng là:

1. khóa baseline,
2. hợp nhất governance runtime,
3. tạo conformance truth,
4. operationalize skill/runtime,
5. rồi mới mở rộng thành platform sâu hơn.

Nếu đi đúng thứ tự này, CVF có thể tiến từ một framework governance mạnh thành một **AI development operating substrate** thực thụ mà không làm vỡ baseline hiện tại.
