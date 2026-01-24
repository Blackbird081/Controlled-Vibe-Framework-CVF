# PUBLISH_CHECKLIST — CVF v1.1 FINAL
Version: 1.1 | Status: STABLE

## Trước khi tag
- [ ] Đảm bảo tất cả file v1.1 mang Status: STABLE (đã cập nhật).
- [ ] Đảm bảo FRAMEWORK_FREEZE.md ghi rõ v1.1 freeze, thay đổi mới → v1.2.
- [ ] LICENSE đã là MIT (khớp v1.0).
- [ ] README nêu compatibility note v1.0 baseline, v1.1 mở rộng.

## Tạo gói phát hành
- [ ] Đóng gói thư mục `Controlled-Vibe-Framework-CVF v1.1 FINAL/` thành zip/tar nếu cần đính kèm.
- [ ] Kiểm tra có đủ mẫu: templates/INPUT_SPEC.sample.md, OUTPUT_SPEC.sample.md, AU_trace.sample.md.

## Tag & Release (gợi ý)
- Tag đề xuất: `v1.1.0`
- Release title: `CVF v1.1 FINAL`
- Release notes tóm tắt:
  - Thêm hợp đồng INPUT/OUTPUT, FAST_TRACK.
  - Preset chi tiết per archetype; binding Command → Archetype → Preset → AU.
  - Execution spine có AU template, trace checklist, ví dụ đơn/multi-agent.
  - Extension register hợp nhất; giữ v1.0 làm baseline.

## Sau khi phát hành
- [ ] Nếu cần thay đổi tiếp, mở nhánh/issue cho v1.2 (không sửa trực tiếp v1.1).
- [ ] Cập nhật CHANGELOG/ROADMAP ở v1.2 cho mọi thay đổi mới.
