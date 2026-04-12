# CVF ADDING NEW — Rebuttal Checklist

Checklist phản biện cho:

- `docs/assessments/CVF_ADDING_NEW_INDEPENDENT_EVALUATION_2026-04-12.md`
- `.private_reference/legacy/CVF ADDING NEW/REVIEW/CVF_ADDING_NEW_FINAL_INTEGRATION_DECISION_2026-04-12.md`

> **Date**: 2026-04-12
> **Purpose**: buộc vòng phản biện tiếp theo trả lời rõ ràng theo chuẩn CVF
> **Rule**: không được phản biện chung chung. Nếu không đồng ý, phải chỉ ra chính xác:
> - không đồng ý điểm nào
> - vì sao không đồng ý
> - dựa trên file nào
> - tác động kiến trúc là gì
> - đề xuất sửa cụ thể là gì

## 1. Response Format Bắt Buộc

Mỗi mục phản biện phải trả lời theo đúng mẫu sau:

```text
Item:
Verdict: AGREE | PARTIAL AGREE | DISAGREE
Why:
Evidence:
Architectural impact:
Required correction:
```

Quy tắc:

- `AGREE` chỉ dùng khi đồng ý thực chất, không cần sửa nội dung
- `PARTIAL AGREE` dùng khi hướng đúng nhưng wording, scope, mapping, hoặc blocker chưa chuẩn
- `DISAGREE` dùng khi kết luận hiện tại sai hoặc quá mạnh/yếu so với evidence
- `Evidence` phải trỏ tới file cụ thể, không được chỉ nói "theo cảm nhận"
- `Required correction` không được bỏ trống nếu verdict là `PARTIAL AGREE` hoặc `DISAGREE`

## 2. Gate Zero — Kiểm tra phạm vi đọc

Phải xác nhận trước:

1. Đã đọc toàn bộ 18 file `.md` trong 3 folder nguồn chưa
2. Đã đọc 2 file đích cần phản biện chưa
3. Có file nào chưa đọc nhưng vẫn dùng để kết luận không

Nếu câu trả lời cho (1) hoặc (2) là `chưa`, phản biện bị xem là chưa hợp lệ.

## 3. Checklist Phản Biện Chính

### A. Completeness Claim

Item: Claim rằng full sweep toàn bộ source set đã hoàn tất

Phải phản biện:

1. Claim này có đúng không
2. Có file `.md` nào trong 3 folder chưa được tính không
3. Có file non-`.md` nào đáng kể mà lẽ ra phải đọc không

Không đồng ý thì phải nói rõ:

- file nào bị bỏ sót
- bỏ sót đó làm sai kết luận nào

### B. Source Quality Classification

Item: Xếp toàn bộ nguồn vào `community_analysis / not official documentation`

Phải phản biện:

1. Xếp loại này có quá chặt hay quá lỏng không
2. Có file nào thực chất là spec nội bộ dùng được như primary design input không
3. Có claim định lượng nào đang bị xử lý chưa đúng mức độ rủi ro không

Không đồng ý thì phải nói rõ:

- file nào nên đổi hạng
- vì sao đổi hạng
- đổi hạng đó kéo theo thay đổi nào trong quyết định cuối

### C. Semantic Policy Intent Registry

Item: Reclassify semantic guard vocabulary thành:

- `guard_alias`
- `policy_intent`
- `output_contract`
- `eval_signal`

Phải phản biện:

1. Reclassification này có đúng bản chất CVF không
2. Danh sách 6 `guard-aligned aliases` có thiếu hoặc thừa không
3. Các mục như `NO_ASSUMPTION`, `REQUIRE_CLARIFICATION`, `COMPLETE_OUTPUT_REQUIRED`, `XSS_PREVENTION` đang được đặt đúng lớp chưa

Không đồng ý thì phải nói rõ:

- mục nào đang xếp sai lớp
- lớp đúng phải là gì
- owner CVF nào phải nhận mục đó

### D. Deduplication Gate

Item: Từ semantic set ban đầu chỉ nên còn một tập guard-aligned nhỏ, không giữ guard set phẳng

Phải phản biện:

1. Dedup gate này có đủ chặt không
2. Có guard semantic nào thực sự cần guard mới độc lập không
3. Nếu có guard mới, enforcement surface là gì

Không đồng ý thì phải nói rõ:

- guard nào cần tồn tại độc lập
- ví dụ violation cụ thể
- tại sao existing guard không đủ

### E. Skill Normalization Model

Item: Dùng mô hình 3 tầng:

- `external intake profile`
- `w7 normalized asset candidate`
- `registry-ready governed asset`

Phải phản biện:

1. Mô hình 3 tầng này có đúng hơn mô hình hiện tại không
2. Có bước nào thiếu giữa normalize và registry-ready không
3. `Command Runtime` có đang bị loại ra quá xa hay không

Không đồng ý thì phải nói rõ:

- pipeline đúng phải là gì
- bước nào cần thêm hoặc bỏ
- vì sao thay đổi đó phù hợp whitepaper/handoff hơn

### F. Required / Optional / CVF-Generated Layers

Item: 9-layer model bị hạ về:

- Required: L0-L2
- Optional: L3-L6
- CVF-Generated: L7-L8

Phải phản biện:

1. Cách chia này có thực dụng và đúng CVF không
2. Layer 7 có nên hoàn toàn CVF-generated không
3. Layer 5 scripts/tools có nên luôn optional không

Không đồng ý thì phải nói rõ:

- layer nào đang xếp sai
- lý do
- tác động tới ingest/compile/validate

### G. Planner Trigger Heuristics

Item: Trigger chỉ được sinh:

- `candidate_refs`
- `confidence`
- `missing_inputs`
- `clarification_needed`
- `negative_matches`

và không được route thẳng `target_skill`

Phải phản biện:

1. Kết luận này có quá chặt không
2. Có trường hợp nào CVF cho phép direct target selection nhưng vẫn không bypass governance không
3. `negative_matches` có đủ để tránh over-routing chưa

Không đồng ý thì phải nói rõ:

- field nào nên thêm hoặc bỏ
- direct target có được phép ở mức nào
- control surface nào giữ an toàn

### H. Evaluation Signal Posture

Item: Signal registry chỉ được nhận ở trạng thái provisional, chưa gán fixed TruthScore deltas

Phải phản biện:

1. Kết luận này có đúng với LPF hiện tại không
2. Có signal nào đủ chín để vào canon scoring ngay không
3. `weak_trigger_definition` có thật sự là first implementation tốt nhất không

Không đồng ý thì phải nói rõ:

- signal nào nên làm trước
- bằng chứng nào chứng minh nó an toàn hơn
- vì sao fixed weighting nên hoặc không nên chấp nhận

### I. Progressive Disclosure Stance

Item: Chưa coi `Progressive Disclosure` là doctrine mới; mặc định xem là tên gọi mới cho hành vi Context Builder hiện có

Phải phản biện:

1. Đây có phải kết luận đúng không
2. Có gap cụ thể nào trong current Context Builder Policy mà khái niệm này thực sự lấp vào không
3. Nếu có gap, gap đó nằm ở contract hay docs hay implementation

Không đồng ý thì phải nói rõ:

- gap cụ thể là gì
- file canon nào hiện đang thiếu
- có cần tài liệu mới hay chỉ cần sửa tài liệu cũ

### J. Promotion Shortlist

Item: Chia file thành 3 nhóm:

- light edit / near-direct adoption
- medium/heavy edit
- reference only

Phải phản biện:

1. File nào đang được xếp sai nhóm
2. Có file nào trong nhóm `reference only` thực ra nên được promote không
3. Có file nào trong nhóm `light edit` thực ra cần siết mạnh hơn không

Không đồng ý thì phải nói rõ:

- file cụ thể
- nhóm hiện tại
- nhóm đúng đề xuất
- lý do di chuyển nhóm

### K. Hard Stops

Item: Giữ nguyên các hard stop:

1. không ADK runtime vào CVF
2. không SKILL.md chạy thẳng
3. không prompt/agent.md làm runtime source of truth
4. không free skill factory
5. không runtime song song
6. không bypass Governance Layer

Phải phản biện:

1. Có hard stop nào viết quá mạnh hoặc quá yếu không
2. Có ngoại lệ bounded nào vẫn hợp chuẩn CVF không

Không đồng ý thì phải nói rõ:

- hard stop nào cần chỉnh
- wording mới là gì
- invariant nào vẫn phải giữ

### L. Overall Status

Item: `ACCEPT IN PRINCIPLE / EXECUTION BLOCKED`

Phải phản biện:

1. Trạng thái này có đúng mức độ chưa
2. Có nên hạ xuống `CONDITIONAL ACCEPT (BLOCKED)` hoặc nâng lên mức khác không
3. Blocker hiện tại có đủ chưa

Không đồng ý thì phải nói rõ:

- status đúng phải là gì
- thiếu blocker nào hoặc blocker nào dư
- vì sao

## 4. Minimum Evidence Standard

Một phản biện chỉ được xem là hợp lệ nếu:

1. Chỉ ra ít nhất 1 file nguồn cụ thể cho mỗi `DISAGREE`
2. Chỉ ra ít nhất 1 tác động kiến trúc cụ thể cho mỗi `DISAGREE`
3. Có `Required correction` rõ ràng cho mỗi `PARTIAL AGREE` hoặc `DISAGREE`

Một phản biện bị xem là yếu nếu:

- chỉ nói “không thuyết phục”
- chỉ lặp lại ý cũ mà không chỉ ra file
- chỉ tranh luận wording mà không nói tác động tới CVF

## 5. Final Output Template for the Next Agent

Agent phản biện nên kết thúc bằng đúng 1 trong 3 kết luận:

1. `AGREE WITH CURRENT DOCUMENTS`
2. `AGREE WITH REQUIRED CORRECTIONS`
3. `DISAGREE — REWRITE REQUIRED`

Nếu chọn (2) hoặc (3), bắt buộc phải có:

- danh sách correction items
- lý do ưu tiên
- khuyến nghị file nào phải sửa trước

## 6. Review Objective

Mục tiêu của vòng phản biện tiếp theo không phải là tranh luận mở rộng vô hạn.

Mục tiêu là chốt rõ 3 việc:

1. cái gì được giữ
2. cái gì phải sửa
3. cái gì tuyệt đối không được đưa vào CVF gốc

Nói ngắn gọn:

Nếu đồng ý thì phải nói đồng ý cái gì.
Nếu không đồng ý thì phải nói sai ở đâu và sửa thế nào.
