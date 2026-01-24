# CVF_EXECUTION_LAYER — v1.1
Version: 1.1 | Status: STABLE | Layer: Execution | Compatible: v1.0 baseline (additive)

Purpose: Chuẩn hóa thực thi dưới CVF với Execution Spine có truy vết.

## Execution Spine
INPUT CONTRACT → SCOPE DEFINITION → SCOPE FREEZE → ACTION UNIT → CONTROLLED EXECUTION → OUTPUT + TRACE LOG

## Action Unit (AU) Template
- Objective:
- Command:
- Inputs (link INPUT_SPEC):
- Outputs (link OUTPUT_SPEC):
- Responsible Role / Archetype / Preset:
- Constraints:
- Stop Conditions:
- Trace Path (file/link):

## Rules
- Không AU nếu không có Input Contract.
- Scope freeze trước khi thực thi; mở rộng phải quyết định lại.
- Mỗi AU chạy cô lập (branch/folder/snapshot) tới khi review.
- Output chưa review = non-authoritative.
- AU phải gắn Command → Archetype → Preset đúng bảng binding interface.

## Trace Checklist
- [ ] Command chỉ định
- [ ] Archetype + Preset gán
- [ ] INPUT/OUTPUT spec link
- [ ] AU log đầy đủ (start/end, assumptions, issues)
- [ ] Review kết thúc AU

## Ví dụ AU đơn (Execution)
- Command: CVF:EXECUTE
- Objective: Viết checklist QA trang đích Q1
- Inputs: INPUT_SPEC/AU-001
- Outputs: OUTPUT_SPEC/AU-001
- Role: Execution Agent | Preset: Execution Policy
- Constraints: 1 ngày, không sửa design
- Stop: thiếu input, scope đổi, reviewer không sẵn
- Trace: /traces/AU-001/execution.md; output: /deliverables/checklist.md

## Ví dụ flow multi-agent
1) Exploration/Analysis (CVF:PROPOSE) tạo proposal + findings → AU-010
2) Decision (CVF:DECIDE) ra quyết định, freeze scope → AU-011
3) Planning (CVF:DESIGN) viết plan → AU-012
4) Execution (CVF:EXECUTE) thực thi theo plan → AU-013
5) Review (CVF:REVIEW) kiểm tra OUTPUT_SPEC → AU-014
6) Audit (CVF:AUDIT) tùy chọn trước release → AU-015
