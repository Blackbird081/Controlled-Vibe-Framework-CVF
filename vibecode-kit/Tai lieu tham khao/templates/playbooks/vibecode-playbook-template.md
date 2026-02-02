# Vibecode Playbook – Template

## 1. Nguyên tắc chung

<!-- Điền các nguyên tắc làm việc của team/cá nhân -->

- AI là công cụ, không phải người ra quyết định
- Mọi thay đổi scope phải được Chủ duyệt
- Không commit code chưa qua GATE

## 2. Quy ước đặt tên JOB

<!-- Định nghĩa format tên JOB -->

**Format:** `JOB-<số thứ tự>` hoặc `JOB-<mã dự án>-<số>`

**Ví dụ:**
- `JOB-001` – Job đầu tiên
- `JOB-API-001` – Job cho module API

## 3. Quy trình mở JOB mới

1. Chạy `vibe.py new <job_id>`
2. Điền Intake đầy đủ
3. Dùng AI Architect để tạo Blueprint
4. Review Blueprint, chỉnh sửa nếu cần
5. Dùng AI Architect để tạo Contracts
6. Review Contracts, thêm/bớt STEP nếu cần
7. Bắt đầu execute từng STEP

## 4. Checklist khi làm việc với AI Kiến trúc sư

- [ ] Intake đã rõ ràng, đủ thông tin
- [ ] Đã cung cấp context về tech stack hiện tại
- [ ] Đã nêu rõ constraints (thời gian, nguồn lực)
- [ ] Đã review Blueprint trước khi chuyển sang Contracts

## 5. Checklist khi làm việc với AI Thợ

- [ ] STEP có mục tiêu rõ ràng
- [ ] File liên quan được liệt kê đủ
- [ ] Tiêu chí nghiệm thu cụ thể, đo được
- [ ] Đã test/review sau khi AI hoàn thành

## 6. Quy tắc log & retro

**Log:**
- Ghi log sau mỗi STEP hoàn thành
- Ghi log khi có vấn đề phát sinh
- Ghi log khi thay đổi scope

**Retro:**
- Cuối mỗi JOB, viết 3 điều:
  1. Điều gì hoạt động tốt?
  2. Điều gì cần cải thiện?
  3. Bài học rút ra?
