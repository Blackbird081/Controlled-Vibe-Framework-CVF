# Expert Rebuttal — Graphify / LLM-Powered / Palace Independent Evaluation

**Document ID:** `CVF_GRAPHIFY_LLM_POWERED_PALACE_EXPERT_REBUTTAL_2026-04-13`
**Date:** 2026-04-13
**Role:** Independent Expert Rebuttal Agent (Third-Party Review)
**Rebutting:** `docs/assessments/CVF_ADDING_NEW_GRAPHIFY_LLM_POWERED_PALACE_INDEPENDENT_EVALUATION_2026-04-13.md`
**Canon Baseline:** `CVF_MASTER_ARCHITECTURE_WHITEPAPER.md` v3.7-W46T1 (snapshot 2026-04-05, readout through 2026-04-13)
**Governing Axiom:** CVF là gốc. Mọi tri thức bên ngoài chỉ là input. Không có kiến trúc cạnh tranh.

---

## Executive Summary — Đồng ý hay Không?

**Verdict tổng thể của agent trước:** `ACCEPT AS DESIGN INPUT / DIRECT INTEGRATION NOT APPROVED`

**Verdict của tôi:** **ĐỒNG Ý CƠ BẢN, NHƯNG CÓ 4 ĐIỂM BẤT ĐỒNG NGHIÊM TRỌNG VÀ 3 BỔ SUNG THIẾU SÓT.**

Agent trước đã đúng ở:
- Giữ CVF-is-root discipline xuyên suốt
- Từ chối mọi "Approved for Integration" label
- Chạy test thực tế (Palace python → fail import)
- Phân biệt concept value vs implementation readiness

Agent trước đã **sai hoặc thiếu** ở:
1. **Đánh giá thấp giá trị tổ chức của Graphify** — graph indexing không chỉ là "pattern" mà là một gap thực sự trong Knowledge Layer hiện tại
2. **Quá nhẹ tay với LLM-Powered** — cluster này đẹp về lý thuyết nhưng có một lỗ hổng kiến trúc nghiêm trọng chưa ai chỉ ra
3. **Bỏ sót rủi ro trùng lặp chéo** giữa 3 folder — nhiều spec nói cùng một thứ bằng tên khác nhau
4. **Không thách thức nguồn gốc trí tuệ** — các `Thong_tin.md` trộn lẫn tổng hợp từ bên ngoài với phân tích gốc mà không tách rõ

---

## Phần I — Trả lời 8 Rebuttal Targets

### Target 1: LLM-Powered là cluster mạnh nhất hay Graphify tạo nhiều marginal value hơn?

**Agent trước nói:** LLM-Powered là strongest cluster.

**Tôi phản biện: ĐỒNG Ý MỘT NỬA.**

LLM-Powered đúng là mạnh nhất **về chiều sâu tư tưởng**. Nó chạm đúng bài toán "knowledge compilation vs retrieval" mà CVF chưa giải triệt để.

NHƯNG — nếu đo bằng **marginal value cho repo reality hiện tại** (CVF v3.7-W46T1, CLOSURE-ASSESSED), thì Graphify có thể tạo impact sớm hơn. Lý do:

1. CVF hiện có Knowledge Layer + Context Builder + Packager đều ở `DONE-ready`. Nhưng không có cơ chế nào giúp agent "hiểu cấu trúc quan hệ" giữa các module/file/concept trước khi query. Agent hiện phải grep/glob → đây chính xác là gap mà Graphify mô tả.
2. LLM-Powered đòi hỏi xây dựng một knowledge compilation pipeline hoàn chỉnh (ingest → compile → govern → store → lint → refactor). Đây là một **multi-wave undertaking**. Graphify chỉ cần mở rộng Knowledge Layer thêm một index type.

**Verdict Target 1:** LLM-Powered mạnh hơn về doctrine. Graphify mạnh hơn về actionability. Agent trước đúng về ranking nhưng chưa thấy rằng Graphify có thể là **first-mover** trong implementation order.

---

### Target 2: Từ chối `/graphify` quá nghiêm hay đúng?

**Agent trước nói:** Reject `/graphify` CLI — aligned with "no CLI runtime yet" posture.

**Tôi phản biện: ĐỒNG Ý VỀ KẾT LUẬN, NHƯNG LÝ DO CẦN CHÍNH XÁC HƠN.**

Việc reject `/graphify` là đúng, nhưng lý do KHÔNG CHỈ là "CLI runtime deferred." Lý do sâu hơn:

1. **`/graphify` tự chọn bypass path.** Guard Spec (`CVF_GRAPH_MEMORY_GUARD_SPEC.md`) viết `pre_tool_use` hook ưu tiên graph trước grep. Trong CVF, hành vi mặc định của agent không được thay đổi bởi một module chưa qua GC-018. Đây là vi phạm nguyên tắc `Agents do not control the system that governs them`.
2. **Naming pollution.** `cvf graph build`, `cvf graph update`, `cvf graph query`, `cvf graph visualize`, `cvf graph export`, `cvf graph validate`, `cvf graph status`, `cvf graph purge` — 8 commands cho một module chưa hề tồn tại trong runtime. Đây là "spec inflation" — viết spec trước khi có problem statement rõ ràng.

**Verdict Target 2:** Agent trước đúng kết luận, nhưng lý do chưa đủ sâu. Bổ sung: reject vì governance bypass risk, không chỉ vì timing.

---

### Target 3: Graph Memory Layer có phải gap thực sự không?

**Agent trước nói:** Chưa xác định rõ — nêu thành câu hỏi mở.

**Tôi phản biện: CÓ, ĐÂY LÀ GAP THỰC SỰ, NHƯNG PHẢI REFRAME.**

Phân tích cụ thể:

| CVF hiện có | Điều Knowledge Layer hiện tại KHÔNG làm được |
|---|---|
| `KnowledgeRankingBatchContract` | Ranking dựa trên query signal, KHÔNG dựa trên structural relationship |
| `ContextPackagerBatchContract` | Pack context deterministic, NHƯNG không biết file A depends on file B |
| `RetrievalBatchContract` | Retrieve chunks/documents, NHƯNG không navigate theo graph |

Gap thực sự là: **Knowledge Layer hiện không có structural index.** Nó query + rank text, nhưng không hiểu dependency, call graph, hay concept hierarchy.

Tuy nhiên, giải pháp KHÔNG phải tạo "Graph Memory Layer" như một layer mới. Giải pháp đúng là:
- Mở rộng `Knowledge Layer` thêm một `StructuralIndex` capability
- Bổ sung `Context Builder` thêm `graph-informed packaging` mode

Đây là **enhancement** của owned surfaces, không phải **new layer**.

**Verdict Target 3:** Gap có thật. Nhưng agent trước đúng khi từ chối framing "new layer." Giải pháp là enhancement, không phải new surface.

---

### Target 4: Palace commentary có thực sự mạnh hơn Palace code không?

**Agent trước nói:** Có. `Thong_tin.md` CVF-faithful hơn python code.

**Tôi phản biện: ĐỒNG Ý HOÀN TOÀN, VÀ BỔ SUNG BẰNG CHỨNG MẠNH HƠN.**

Bằng chứng bổ sung:

1. **`cvf_mempalace_adapter.py`** — `retrieve()` dùng substring match `if query.lower() in record.content.lower()`. Đây là text scan naïve, không liên quan gì đến palace hierarchy hay semantic retrieval. Nó KHÔNG sử dụng `wing`, `hall`, `room` trong logic retrieval. Palace structure bị bypass ngay trong chính implementation.

2. **`cvf_memory_evaluator.py`** — `recall_at_k` tính `min(len(results), k) / max(k, 1)`. Đây KHÔNG phải recall thực. Recall = (relevant items retrieved) / (total relevant items). Code này tính (items returned) / k — nghĩa là nó đo **coverage of result set**, không phải **quality of recall**. Metric bị sai về definition.

3. **`cvf_w7_memory_record.py`** — `validate()` chỉ check `content != ""` và `truth_score >= 0`. CVF's actual W7 dependency chain (Runtime→Artifact→Trace→Planner→Decision→Eval/Builder→Memory) hoàn toàn bị bỏ qua. File này claim W7 compliance nhưng không enforce bất kỳ dependency nào.

4. **`Thong_tin.md` (Palace)** lại viết rất chính xác: "module/layer phù hợp nhất để hấp thụ MemPalace là Knowledge Layer và Context Builder & Packager, với điểm neo governance nằm ở W7MemoryRecord" — đây là phân tích kiến trúc ĐÚNG, ngược hẳn với code cùng folder.

**Verdict Target 4:** Agent trước hoàn toàn đúng. Palace code tệ hơn agent trước còn nói. Bổ sung: code có lỗi logic (recall metric sai), semantic mismatch (adapter bypass palace structure), và W7 compliance chỉ cosmetic.

---

### Target 5: Palace python file có nên salvage mạnh hơn không?

**Agent trước nói:** Chỉ `cvf_mem_memory_schema.py` có partial salvage value.

**Tôi phản biện: ĐỒNG Ý. KHÔNG NÊN SALVAGE THÊM.**

Lý do:

1. **Import path `control_plane.knowledge.*`** không tồn tại trong repo. CVF canonical code nằm trong `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/` và viết bằng TypeScript, không phải Python. Python slice này giả định một project structure không có thật.

2. **`cvf_mem_memory_schema.py`** có đúng 1 giá trị salvageable: danh sách field names (`wing`, `hall`, `room`, `drawer`, `closet_summary`, `tunnel_links`, `confidence_score`, `truth_score`, `contradiction_flag`). Nhưng field list thì nên nằm trong spec doc, không phải trong dead python code.

3. **Execution Plan** (`CVF_MEMPALACE_INTEGRATION_EXECUTION_PLAN.md`) đánh dấu tất cả 8 hạng mục là ✅. Nhưng code không chạy, test fail, và không module nào tồn tại trong repo. Checklist sai sự thật.

**Verdict Target 5:** Agent trước đúng. Không cần salvage thêm. Vocabulary đã nằm trong `Thong_tin.md` và absorption spec, không cần giữ dead code.

---

### Target 6: Mapping `Schema → Governance Layer` trong LLM-Powered có đúng balance không?

**Agent trước nói:** "Directionally understandable but too casual." External prompt-file conventions are not automatically governance authority.

**Tôi phản biện: ĐỒNG Ý, VÀ BỔ SUNG MỘT CẢNH BÁO LỚN HƠN.**

Agent trước đúng nhưng chưa đủ mạnh. Vấn đề sâu hơn:

`LLM-Powered/Thong_tin.md` viết:
> "Schema — một file như CLAUDE.md hay AGENTS.md, đóng vai trò hướng dẫn cho LLM"

Và `CVF_KNOWLEDGE_COMPILATION_INTEGRATION_SPEC.md` map:
> "Schema (CLAUDE.md/AGENTS.md) → Governance Layer"

**Đây là lỗi kiến trúc.** Trong CVF:
- Governance Layer chứa **Policy Engine, Trust & Isolation, Audit/Consensus, Guard Engine, Skill Registry** — tất cả đều có contract, test, và enforcement runtime
- `CLAUDE.md` / `AGENTS.md` là **prompt configuration files** — không có enforcement power, không có audit trail, không có guard stack

Mapping prompt files → Governance Layer sẽ **hạ thấp tiêu chuẩn** của Governance Layer CVF. Governance trong CVF nghĩa là **enforcement + audit + invariant**, không phải "file hướng dẫn LLM."

Nếu cần map, đúng nhất phải là:
- `CLAUDE.md/AGENTS.md` → **Context Builder input** (control plane, không phải governance)
- Schema rules → **Policy Engine candidates** (cần compile thành guard trước khi có hiệu lực)

**Verdict Target 6:** Agent trước đúng direction nhưng chưa đủ mạnh. Bổ sung: đây là lỗi kiến trúc, không chỉ "casual mapping."

---

### Target 7: File nào promotion-ready với light edit?

**Agent trước nói:** Heavy edit là minimum threshold cho mọi file.

**Tôi phản biện: GẦN ĐỒNG Ý, NHƯNG CÓ 2 NGOẠI LỆ.**

Sau khi đọc kỹ lại toàn bộ 21 file, tôi cho rằng:

**2 file có thể promote với medium edit (không cần heavy):**

1. `CVF_KNOWLEDGE_COMPILATION_POLICY.md` — Policy core đã khá clean. Cần: bỏ `CVF là gốc` (redundant — mọi agent đã biết), thêm owner/version/date theo CVF governance template, tightening field names. Không cần restructure.

2. `CVF_COMPILED_CONTEXT_POLICY.md` — Rất compact, 48 lines, highly compatible. Cần: bỏ "CCP-03" wording trùng với existing Guard Engine language, thêm mapping rõ ràng vào `ContextPackagerBatchContract`.

**Tất cả file còn lại:** đồng ý cần heavy edit hoặc reference-only.

**Verdict Target 7:** Agent trước gần đúng nhưng hơi quá strict. 2 file trên có thể medium-edit promotion.

---

### Target 8: Có path nào biến graph preference / compiled-knowledge preference thành policy default không?

**Agent trước nói:** Câu hỏi mở, không trả lời.

**Tôi trả lời: CÓ, NHƯNG PHẢI QUA 2 GATE.**

**Gate 1 — Evidence:** Phải chứng minh bằng benchmark thực tế rằng graph-informed retrieval hoặc compiled-knowledge retrieval cho kết quả tốt hơn current Knowledge Layer retrieval trên ít nhất 3 CVF use-case thực. Nhắc lại: W8-T2 `PerformanceBenchmarkHarnessContract` đã canonical nhưng vẫn `PROPOSAL ONLY`. Benchmark harness có rồi nhưng chưa có data.

**Gate 2 — Governance:** Policy default mới cần GC-018 authorization riêng. Không thể smuggle default changes qua design input intake.

Con đường khả thi nhất:
1. Tạo bounded experiment wave (GC-018 fresh)
2. Implement graph index enhancement trong Knowledge Layer
3. Run benchmark so sánh: current retrieval vs graph-augmented retrieval
4. Nếu kết quả đủ mạnh → propose policy default change qua Governance Layer
5. Human sign-off

**Verdict Target 8:** Có path hợp lệ, nhưng cần 2 hard gates: evidence + governance. Không thể default by document.

---

## Phần II — Những Điều Agent Trước Bỏ Sót

### Blind Spot 1: Semantic Overlap Giữa 3 Folder

Agent trước đánh giá từng folder độc lập nhưng **không chỉ ra overlap.** Đây là vấn đề nghiêm trọng:

| Concept | Graphify nói | LLM-Powered nói | Palace nói |
|---|---|---|---|
| "Context pre-build" | Graph report → context builder | Compiled knowledge → context builder | Closet/drawer → context narrowing |
| "Structured memory" | Node/edge graph | Concept/entity/summary pages | Wing/hall/room hierarchy |
| "Maintenance/quality" | Drift detection guard | Knowledge lint engine | Contradiction detection |
| "Governance compliance" | 8 graph guards (G-GM-01→08) | 6 knowledge guards (KG-G1→G6) | 8 W7 guards (G1→G8) |

**Tổng cộng: 22 guard-like constructs** được đề xuất bởi 3 folder. CVF hiện có **8 shared + 15 runtime = 23 guards.** Nếu accept cả 3, guard count sẽ nhân đôi từ 23 → 45. Đây là **naming inflation disaster** — chính xác rủi ro mà Agent 2 đã cảnh báo trong rebuttal 2026-04-12.

> [!WARNING]
> Nếu tích hợp material từ cả 3 folder, PHẢI có deduplication audit trước. Không một guard ID mới nào được tạo ra mà chưa map ngược vào 8 core + 15 runtime guards hiện hành.

### Blind Spot 2: Tất Cả 3 Folder Đều Viết Bởi Cùng Một Tư Duy

Agent trước không nhận xét về điều này, nhưng rõ ràng cả 3 folder đều mang dấu ấn của **cùng một author** với **cùng một pattern**:

1. Mỗi folder mở đầu bằng `Thong_tin.md` tổng hợp kiến thức từ bên ngoài
2. Sau đó sản sinh N spec files theo template `CVF_[CONCEPT]_[MODULE]_SPEC.md`
3. Mỗi spec file có mapping table `External Concept → CVF Module`
4. Mỗi spec file kết thúc bằng tuyên bố "CVF là gốc, X chỉ là input"

Pattern này nhất quán nhưng tạo ra **confirmation bias risk**: specs được viết để "chứng minh" rằng external knowledge fits CVF, thay vì để "kiểm nghiệm" xem nó có fit hay không. Không có file nào nêu rõ: "Concept X từ Graphify/Palace/Karpathy KHÔNG phù hợp với CVF vì lý do Y."

> [!IMPORTANT]
> Trong CVF governance, burden of proof phải đặt đúng chiều: material bên ngoài phải CHỨNG MINH nó fit, không phải CVF phải CHỨA nó vì có mapping table.

### Blind Spot 3: LLM-Powered Có Lỗ Hổng Kiến Trúc Chưa Ai Chỉ Ra

`CVF_KNOWLEDGE_COMPILATION_INTEGRATION_SPEC.md` propose 5 knowledge loops: `Ingest → Compile → Query → Maintain(Lint) → Refactor`.

Agent trước khen đây là "strongest cluster." Tôi đồng ý về giá trị concept, NHƯNG:

**Lỗ hổng:** Loop này KHÔNG có **versioning/rollback gate.**

- Khi LLM compile raw source thành compiled knowledge, bước compile có thể **inject errors** (hallucination, misinterpretation, wrong cross-link).
- Khi lint/refactor chạy, nó có thể **merge pages sai**, **rename concepts sai**, **delete "orphan" mà thực ra cần giữ**.
- Hiện không có cơ chế nào trong 5 loops để **rollback**.

CVF đã giải bài toán này cho code: `REVIEW → FREEZE` phase với audit. Nhưng cho knowledge compilation, chưa có auditable freeze step.

**Đề xuất bổ sung:** Loop phải thành 6:
```
Ingest → Compile → GOVERN(audit + checkpoint) → Query → Maintain → Refactor
```

Nếu thiếu `GOVERN` step giữa `Compile` và `Query`, compiled knowledge sẽ trôi vào context mà không qua governance gate. Đây chính xác là vi phạm `Zero Bypass` principle.

---

## Phần III — Đánh Giá Lại File-by-File (Chỉ Nêu Bất Đồng Với Agent Trước)

| File | Agent trước | Tôi | Lý do bất đồng |
|---|---|---|---|
| `CVF_GRAPH_MEMORY_LAYER_SPEC.md` | `ADAPT_HEAVY` | **ADAPT_HEAVY** (đồng ý nhưng tăng priority) | Agent trước xếp #4 trong promotion order. Tôi xếp **#3** vì nó address real gap |
| `CVF_KNOWLEDGE_COMPILATION_POLICY.md` | `ADAPT_LIGHT` | **ADAPT_LIGHT** (đồng ý — upgrade thành medium-edit candidate) | Promotion-ready sớm hơn agent trước nghĩ |
| `CVF_COMPILED_CONTEXT_POLICY.md` | `ADAPT_LIGHT` | **ADAPT_LIGHT** (đồng ý — upgrade thành medium-edit candidate) | Compact, clean, compatible |
| `CVF_GRAPH_MEMORY_GUARD_SPEC.md` | `REFERENCE_WITH_PARTIAL_SALVAGE` | **REJECT_FOR_NOW** (bất đồng) | Guard family hoàn toàn premature. Provenance concern đã covered bởi existing `AuditTrailGuard`. Partial salvage sẽ tạo naming confusion |
| `CVF_MEMPALACE_ABSORPTION_SPEC.md` | `ADAPT_HEAVY` | **ADAPT_HEAVY** (đồng ý nhưng giảm priority) | Agent trước xếp #5. Tôi đồng ý #5 nhưng note: value nằm ở `Thong_tin.md`, không phải spec này |
| `cvf_mempalace_adapter.py` | `REJECT_FOR_NOW` | **REJECT** (không phải "for now" — reject vĩnh viễn ở dạng hiện tại) | Substring scan adapter không có giá trị ở bất kỳ thời điểm nào. Nếu cần adapter sau này, phải viết mới from scratch |
| `cvf_memory_evaluator.py` | `REJECT_FOR_NOW` | **REJECT** (permanent ở dạng hiện tại) | Metric sai fundamental (recall formula wrong). Không thể salvage, phải rewrite |

Tất cả file còn lại: **đồng ý với agent trước.**

---

## Phần IV — Refined Promotion Order (Nếu Future Wave Mở)

Agent trước đề xuất LLM-Powered → Graphify → Palace. Tôi refine:

### Tier 1 — Near-term promotion candidates (medium-to-heavy edit)

1. `CVF_KNOWLEDGE_COMPILATION_POLICY.md` — medium edit
2. `CVF_COMPILED_CONTEXT_POLICY.md` — medium edit
3. `CVF_KNOWLEDGE_COMPILATION_INTEGRATION_SPEC.md` — heavy edit (add GOVERN gate, soften approval language)

### Tier 2 — Strategic candidates (heavy edit + gap evidence required)

4. `CVF_GRAPH_MEMORY_LAYER_SPEC.md` — heavy edit (reframe as Knowledge Layer enhancement, remove CLI, remove standalone guard family)
5. `CVF_GRAPH_MEMORY_DATA_MODEL.md` — heavy edit (tighten to W7 semantics)

### Tier 3 — Vocabulary salvage only

6. `CVF_KNOWLEDGE_LINT_ENGINE_SPEC.md` — absorb into LPF chain
7. `CVF_KNOWLEDGE_SCHEMA_TEMPLATE.md` — template seed
8. `CVF_MEMPALACE_ABSORPTION_SPEC.md` — memory routing vocabulary
9. `cvf_mem_memory_schema.py` — field names only

### Tier 4 — Reference/Provenance only

10. All 3 `Thong_tin.md` files (high provenance, not canon)
11. `CVF_GRAPH_MEMORY_GUARD_SPEC.md`
12. `cvf_mem_context_mapper.py`
13. `cvf_w7_memory_record.py`
14. `mempalace_config.yaml`

### Permanent Reject (ở dạng hiện tại)

15. `CVF_GRAPHIFY_CLI_COMMAND_SPEC.md` — CLI deferred by design
16. `CVF_MEMPALACE_INTEGRATION_EXECUTION_PLAN.md` — checklist sai sự thật
17. `cvf_mempalace_adapter.py` — logic sai
18. `cvf_memory_evaluator.py` — metric sai
19. `test_memory_schema.py` — test fail, quá thin

---

## Phần V — Kết Luận Phản Biện

### Đồng ý với Agent Trước (8 điểm)

1. ✅ Verdict tổng thể `ACCEPT AS DESIGN INPUT / DIRECT INTEGRATION NOT APPROVED` — chính xác
2. ✅ LLM-Powered là strongest cluster về doctrine — đúng
3. ✅ Reject mọi "Approved for Integration" label — bắt buộc
4. ✅ Palace commentary > Palace code — đã xác nhận với thêm bằng chứng
5. ✅ CLI material deferred — đúng
6. ✅ No Palace code file implementation-ready — đúng (code tệ hơn còn nói)
7. ✅ Avoid numeric scoring — đúng, consistent với LPF calibration posture
8. ✅ Future reuse qua CVF-native synthesis — đúng method

### Bất đồng với Agent Trước (4 điểm)

1. ❌ Agent trước đánh thấp giá trị cấu trúc của Graphify — graph indexing address real gap trong Knowledge Layer
2. ❌ Agent trước quá nhẹ tay khi không chỉ ra lỗ hổng versioning/rollback trong LLM-Powered compilation loop
3. ❌ `CVF_GRAPH_MEMORY_GUARD_SPEC.md` nên reject, không phải partial salvage — guard family premature là naming inflation risk
4. ❌ `cvf_mempalace_adapter.py` và `cvf_memory_evaluator.py` nên permanent reject, không phải "for now"

### Bổ sung Agent Trước Bỏ Sót (3 điểm)

1. 🔴 **Cross-folder deduplication warning** — 22 guard-like constructs sẽ nhân đôi guard count nếu không dedup
2. 🔴 **Confirmation bias pattern** — 3 folder đều viết theo template "map → conclude CVF hấp thụ" mà không có counterfactual analysis
3. 🔴 **Schema → Governance mapping** trong LLM-Powered là **lỗi kiến trúc**, không chỉ casual mapping

### Đề Xuất Hành Động

1. **Immediate:** Reclassify tất cả approval language thành `DESIGN INPUT — NOT APPROVED`
2. **Short-term:** Tạo một CVF-native synthesis note duy nhất (merge 3 folder), với deduplication audit bắt buộc
3. **Medium-term:** Nếu mở bounded wave cho knowledge enhancement, ưu tiên theo Tier 1→4 promotion order ở trên
4. **Permanent:** Quarantine tất cả CLI spec cho đến khi W7/CLI family được explicitly reopened

---

*Expert Rebuttal Agent | 2026-04-13*
*Methodology: Full read of 21 source files + canonical whitepaper + previous assessment + 1 empirical test (Palace python) + 1 architectural gap analysis*
