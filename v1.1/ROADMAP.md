# CVF v1.1 — Roadmap Hợp Nhất

## Mục tiêu tổng
Hoàn thiện bản v1.1 chuẩn bằng cách hợp nhất các biến thể, bổ sung artefact ràng buộc Input/Output, Preset, và luồng Command → Execution, đồng thời giữ v1.0 làm baseline.

## Mốc & Deliverable chính
1) **Chuẩn hóa version & README các layer**
   - Cập nhật tất cả file v1.1 với header Version: 1.1, Status: Draft/Stable.
   - Viết README riêng cho từng layer (architecture/governance/agents/interface/execution) nêu rõ phạm vi, không lặp nội dung core.

2) **Input/Output Contract**
   - Điền chi tiết INPUT_SPEC.md (field tối thiểu, validation, ownership, format).
   - Điền chi tiết OUTPUT_SPEC.md (acceptance, quality bar, format, reviewer role).

3) **Fast Track**
   - Xác định tiêu chí đủ nhỏ, luồng rút gọn (không phá Execution Spine), giới hạn phạm vi và audit tối thiểu.

4) **Preset Library (EGL)**
   - Hoàn thiện EGL_PRESET_LIBRARY.md: policy cho Analysis/Decision/Planning/Execution/Supervisor/Exploration.
   - Map Archetype → Preset → Stop rules.

5) **Command → Execution binding**
   - Chuẩn hóa CVF_COMMANDS.md với artifact bắt buộc.
   - Thêm bảng mapping Command → Archetype phù hợp → Preset → loại Action Unit mẫu.

6) **Execution Spine**
   - Cập nhật CVF_EXECUTION_LAYER.md về version v1.1, thêm template Action Unit + Trace checklist.
   - Thêm ví dụ 1 AU tối thiểu và 1 flow multi-agent.

7) **Extension Register**
   - Rà soát/điền EXTENSION_REGISTER.md (Active/Deprecated/Experimental), ghi rõ phạm vi Input/Process/Output.

8) **Release & Change Log**
   - Hoàn thiện RELEASE_NOTES.md (so sánh v1.0 vs v1.1, backward-compat).
   - Hoàn thiện CHANGELOG.md (ngày, nội dung thêm/sửa, trạng thái freeze).

## Quy tắc thực hiện
- Không sửa nội dung core v1.0; mọi thay đổi mới chỉ áp dụng v1.1.
- Mọi file mới phải chỉ rõ nguồn gốc (từ biến thể nào) hoặc rationale.
- Giữ ASCII tên file; nội dung có thể dùng tiếng Việt.
- Sau khi hoàn tất, đổi Status các file chính sang STABLE và freeze.

## Trạng thái hiện tại
- Folder v1.1 mới tạo, chứa skeleton file.
- Chưa điền chi tiết spec/preset/command mapping.
