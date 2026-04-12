# CVF Windows Skill Normalization — Rebuttal Checklist

Checklist phản biện cho:

- `docs/assessments/CVF_WINDOWS_SKILL_NORMALIZATION_INDEPENDENT_EVALUATION_2026-04-12.md`

Nguồn cần đọc nằm tại:

- `.private_reference/legacy/CVF ADDING NEW/Windows_Skill_Normalization`

> **Date**: 2026-04-12
> **Purpose**: buộc vòng phản biện tiếp theo trả lời rõ ràng, có căn cứ, và bám đúng canon hiện tại của CVF
> **Rule**: không được phản biện chung chung. Nếu không đồng ý, bắt buộc phải chỉ ra:
> - không đồng ý điểm nào
> - vì sao không đồng ý
> - dựa trên file nguồn nào
> - mâu thuẫn với file canon nào của CVF
> - tác động kiến trúc là gì
> - cần sửa cụ thể ra sao

## 1. Response Format Bắt Buộc

Mỗi mục phản biện phải trả lời theo đúng mẫu sau:

```text
Item:
Verdict: AGREE | PARTIAL AGREE | DISAGREE
Why:
Source evidence:
Canon check:
Architectural impact:
Required correction:
```

Quy tắc:

- `AGREE` chỉ dùng khi đồng ý thực chất, không cần sửa nội dung
- `PARTIAL AGREE` dùng khi hướng đúng nhưng scope, wording, authority level, hoặc promotion level chưa chuẩn
- `DISAGREE` dùng khi kết luận hiện tại sai hoặc quá mạnh/yếu so với evidence
- `Source evidence` phải trỏ tới file cụ thể trong folder `Windows_Skill_Normalization`
- `Canon check` phải trỏ tới ít nhất 1 file canon CVF nếu verdict là `PARTIAL AGREE` hoặc `DISAGREE`
- `Required correction` không được bỏ trống nếu verdict là `PARTIAL AGREE` hoặc `DISAGREE`

## 2. Gate Zero — Kiểm tra phạm vi đọc

Phải xác nhận trước:

1. Đã đọc toàn bộ 7 file `.md` trong `Windows_Skill_Normalization` chưa
2. Đã đọc file assessment đích chưa
3. Đã đọc các canon files dùng để đối chiếu chưa
4. Có file nào chưa đọc nhưng vẫn dùng để kết luận không

Tối thiểu các canon files phải đọc:

- `docs/reference/CVF_MASTER_ARCHITECTURE_WHITEPAPER.md`
- `docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md`
- `docs/reference/CVF_W7_CLI_GOVERNANCE_BINDINGS.md`
- `governance/skill-library/specs/EXTERNAL_SKILL_INTAKE.md`
- `governance/toolkit/05_OPERATION/SKILL_INTAKE_GOVERNANCE.md`
- `docs/assessments/CVF_TRACK5_DEFERRED_ARCHITECTURE_READINESS_ASSESSMENT_2026-04-08.md`
- `AGENT_HANDOFF.md`

Nếu câu trả lời cho (1), (2), hoặc (3) là `chưa`, phản biện bị xem là chưa hợp lệ.

## 3. Checklist Phản Biện Chính

### A. Completeness Claim

Item: Claim rằng full sweep toàn bộ `Windows_Skill_Normalization` đã hoàn tất

Phải phản biện:

1. Claim này có đúng không
2. Có file `.md` nào trong folder bị bỏ sót không
3. Có file nào ngoài folder nhưng đáng ra phải đọc để kết luận chính xác hơn không

Không đồng ý thì phải nói rõ:

- file nào bị bỏ sót
- bỏ sót đó làm sai phần kết luận nào

### B. Overall Verdict

Item: `ACCEPT IN PRINCIPLE / PARTIAL INTEGRATION ONLY`

Phải phản biện:

1. Verdict này có đúng mức độ chưa
2. Có quá chặt hoặc quá lỏng không
3. Mức tích hợp đúng phải là gì theo CVF canon hiện tại

Không đồng ý thì phải nói rõ:

- verdict đúng phải là gì
- vì sao
- correction nào kéo theo thay đổi verdict

### C. Environment Metadata Value

Item: execution-environment metadata là giá trị mạnh nhất của packet

Phải phản biện:

1. Kết luận này có đúng không
2. Metadata đề xuất `os / shell / shell_version / script_type / compatibility` có phù hợp CVF không
3. Nó nên vào intake profile, registry metadata, hay evaluation output

Không đồng ý thì phải nói rõ:

- field nào không phù hợp
- field nào còn thiếu
- owner CVF nào phải nhận phần này

### D. Cross-Platform Normalization Policy

Item: policy chuẩn hóa đa nền tảng nên được chấp nhận ở mức design candidate, chưa được promote thẳng

Phải phản biện:

1. Đánh giá này có đúng không
2. File `CVF_W7_Cross_Platform_Normalization_Policy.md` có đủ chín để promote mạnh hơn không
3. Nó có thực sự bổ sung cho intake/governance hiện tại hay chỉ lặp lại

Không đồng ý thì phải nói rõ:

- file này nên vào nhóm nào
- vì sao
- cần sửa câu chữ hoặc mapping nào

### E. PowerShell Command Catalog

Item: `CVF_W7_PowerShell_Command_Catalog.md` chỉ nên là Windows appendix/reference, không phải CVF-wide runtime doctrine

Phải phản biện:

1. Kết luận này có quá chặt không
2. Mapping Bash -> PowerShell có phần nào đủ mạnh để đưa lên canon không
3. File này có đụng chạm hoặc xung đột với current tool/runtime instructions không

Không đồng ý thì phải nói rõ:

- phần nào nên giữ nguyên/promote
- phần nào phải bỏ
- mức authority đúng của command catalog là gì

### F. Skill Evaluation Checklist

Item: `CVF_W7_Skill_Evaluation_Checklist.md` là file promotable nhất nhưng phải merge với skill-intake governance hiện có

Phải phản biện:

1. Nhận định này có đúng không
2. Checklist có đang lấn sang domain/UAT/governance fit hay không
3. Compatibility scoring có được phép đứng như admission gate riêng không

Không đồng ý thì phải nói rõ:

- tiêu chí nào đang sai hoặc thiếu
- nó nên augment pipeline nào
- correction cụ thể cho scoring/decision model

### G. Main Normalization Document

Item: `CVF_W7_Windows_Skill_Normalization.md` là synthesis doc tốt nhất nhưng overclaims authority

Phải phản biện:

1. Đánh giá này có đúng không
2. Các claim `Canonical` và `Approved for Integration` có thực sự quá mạnh không
3. Doc này có thể promote sau medium edit hay cần heavy rewrite

Không đồng ý thì phải nói rõ:

- overclaim nào thực ra chấp nhận được
- overclaim nào chắc chắn phải sửa
- nhóm promotion đúng phải là gì

### H. Sandbox Posture

Item: packet này không được dùng để mở rộng sandbox posture sang Windows Sandbox / Docker Windows Containers / WSL

Phải phản biện:

1. Kết luận này có đúng với whitepaper và handoff không
2. Có dòng nào trong source packet đang ngầm overclaim sandbox support không
3. Có phần nào của packet vẫn giữ được nếu loại bỏ sandbox overreach

Không đồng ý thì phải nói rõ:

- canon file nào cho phép claim mạnh hơn
- vì sao packet này được phép nói tới platform expansion
- tác động lên Track 5 / sandbox doctrine là gì

### I. Guard / Policy Enforcement Model

Item: không được biến environment enforcement thành raw string blacklist doctrine

Phải phản biện:

1. Kết luận này có đúng không
2. Ví dụ kiểu `Reject-Bash-On-Windows` có thể giữ ở mức illustration hay không
3. Enforcement model đúng phải là environment declaration -> compatibility evaluation -> policy/guard consequence hay mô hình khác

Không đồng ý thì phải nói rõ:

- enforcement surface đúng là gì
- blacklist logic có vai trò gì
- file canon nào hỗ trợ cách hiểu đó

### J. Skill-Intake Supersession

Item: packet này không thay thế `EXTERNAL_SKILL_INTAKE.md` và `SKILL_INTAKE_GOVERNANCE.md`

Phải phản biện:

1. Kết luận này có đúng không
2. Packet có phần nào thực sự supersede intake policy cũ không
3. Phần environment compatibility nên nằm ở đâu trong pipeline hiện hành

Không đồng ý thì phải nói rõ:

- file policy nào cần bị sửa hoặc thay thế
- căn cứ cho việc supersede
- governance consequence nếu supersede xảy ra

### K. Promotion Shortlist

Item: chia file thành:

- promote candidate / medium edit
- promote candidate / heavy edit or appendix only
- synthesis source only
- reference only

Phải phản biện:

1. File nào đang được xếp sai nhóm
2. Có file nào trong nhóm `reference only` thực ra nên được promote không
3. Có file nào trong nhóm `medium edit` thực ra phải hạ xuống `heavy edit`

Không đồng ý thì phải nói rõ:

- file cụ thể
- nhóm hiện tại
- nhóm đúng đề xuất
- lý do di chuyển nhóm

### L. Quality Claim Boundary

Item: refactor 86 skills chỉ là bounded evidence, không phải proof của CVF-wide quality uplift

Phải phản biện:

1. Kết luận này có quá chặt không
2. Có loại quality claim nào packet này thực sự support được không
3. Ranh giới giữa local Windows execution improvement và CVF-wide quality claim nên viết thế nào

Không đồng ý thì phải nói rõ:

- claim nào được phép mạnh hơn
- bằng chứng nào support claim đó
- correction wording cụ thể

## 4. Minimum Evidence Standard

Một phản biện chỉ được xem là hợp lệ nếu:

1. Chỉ ra ít nhất 1 file nguồn cụ thể cho mỗi `DISAGREE`
2. Chỉ ra ít nhất 1 file canon cụ thể cho mỗi `PARTIAL AGREE` hoặc `DISAGREE`
3. Chỉ ra ít nhất 1 tác động kiến trúc cụ thể cho mỗi `DISAGREE`
4. Có `Required correction` rõ ràng cho mỗi `PARTIAL AGREE` hoặc `DISAGREE`

Một phản biện bị xem là yếu nếu:

- chỉ nói “không thuyết phục”
- chỉ lặp lại nhận định mà không dẫn file
- chỉ tranh luận wording mà không nói tác động tới CVF
- dùng `Thong_tin.md` như căn cứ canon chính

## 5. Final Output Template for the Next Agent

Agent phản biện nên kết thúc bằng đúng 1 trong 3 kết luận:

1. `AGREE WITH CURRENT EVALUATION`
2. `AGREE WITH REQUIRED CORRECTIONS`
3. `DISAGREE — REWRITE REQUIRED`

Nếu chọn (2) hoặc (3), bắt buộc phải có:

- danh sách correction items
- lý do ưu tiên
- file nào phải sửa trước

## 6. Review Objective

Mục tiêu của vòng phản biện tiếp theo là chốt rõ 3 việc:

1. phần nào của `Windows_Skill_Normalization` thực sự có giá trị cho CVF
2. phần nào chỉ nên giữ làm tham khảo/provenance
3. mức tích hợp chính xác vào CVF là gì

Nói ngắn gọn:

Nếu đồng ý thì phải nói đồng ý phần nào.
Nếu không đồng ý thì phải nói sai ở đâu, căn cứ là gì, và sửa thế nào.
