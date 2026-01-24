# RELEASE NOTES — CVF v1.1 (STABLE)

## Tại sao v1.1?

CVF v1.0 là baseline tốt nhưng có 4 hạn chế khi áp dụng vào project phức tạp:

| Hạn chế v1.0 | Vấn đề gặp phải | v1.1 giải quyết |
|--------------|-----------------|-----------------|
| **Thiếu ràng buộc I/O** | Không có spec chuẩn hóa đầu vào/ra → dễ mơ hồ ở task nhỏ, khó review | INPUT_SPEC, OUTPUT_SPEC với field bắt buộc, validation checklist |
| **Không phân vai agent** | Chỉ nêu "AI là executor" nhưng không định nghĩa loại agent, quyền hạn, stop condition → AI dễ vượt quyền | Agent Archetype (6 loại), Lifecycle (6 trạng thái), Preset Library với allowed/forbidden/stop |
| **Không có command taxonomy** | Hành động không được chuẩn hóa → khó audit, khó trace | CVF_COMMANDS với 7 command chuẩn + binding Archetype → Preset → AU |
| **Trace yếu** | Ghi decision nhưng không có Action Unit, không liên kết artifact → khó truy vết | Execution Spine + AU template + trace checklist + ví dụ đơn/multi-agent |

**Kết luận:** v1.1 không thay đổi triết lý v1.0, chỉ bổ sung ràng buộc kiểm soát chi tiết hơn cho project cần audit, multi-agent, hoặc trace đầy đủ.

---

## Mục tiêu
- Gộp ưu điểm của các biến thể v1.1, bổ sung ràng buộc Input/Output, Command, Preset, Execution Spine.
- Giữ v1.0 làm baseline bất biến; v1.1 là mở rộng opt-in, không thay triết lý/cấu trúc core.

## Phạm vi mới
- Input/Output contract: INPUT_SPEC, OUTPUT_SPEC.
- Fast Track flow (nhiệm vụ nhỏ, audit tối thiểu nhưng không phá spine).
- EGL Preset Library + Archetype binding.
- Command taxonomy (intent chuẩn hóa) → Execution mapping.
- Execution Spine v1.1 với Action Unit template & trace checklist.
- Extension Register hợp nhất.

## So sánh v1.0 vs v1.1
- v1.0: chỉ khung core, phase, governance tối thiểu; chưa có ràng buộc input/output, preset, command mapping chi tiết.
- v1.1: thêm hợp đồng INPUT/OUTPUT, FAST_TRACK, preset chi tiết per archetype, binding Command → Archetype → Preset → AU, execution spine có ví dụ và trace checklist, extension register hợp nhất. Triết lý/structure gốc giữ nguyên.

## Không thay đổi
- Triết lý core, layering rules, freeze rule v1.0.
- Quyền lực ưu tiên: Manifesto → Decisions → Compliance → Execution.

## Trạng thái
- STABLE. v1.1 đã freeze; thay đổi tiếp theo sẽ là v1.2.
