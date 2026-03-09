# CVF Logs Archive

Trạng thái: archive taxonomy cho append-only operational logs đã rollover khỏi active window.

## Purpose

- giữ lịch sử log dài hạn ở vị trí chuẩn, dễ tra soát
- giảm kích thước của active log đang được dùng hằng ngày
- bảo toàn append-only evidence chain mà không làm active file quá dài

## What Belongs Here

- archived windows của `CVF_INCREMENTAL_TEST_LOG.md`
- các log chain dài hạn khác khi đã có rule rotation chính thức

## Naming Rule

Archive log files trong folder này phải tuân thủ naming guard của CVF.

Ví dụ:

- `CVF_INCREMENTAL_TEST_LOG_ARCHIVE_2026_PART_01.md`

## Current Scope

Hiện tại folder này được chuẩn hóa trước hết cho:

- `CVF_INCREMENTAL_TEST_LOG.md`

Các trace/review logs theo scope vẫn tiếp tục ở `docs/reviews/<scope>/` cho đến khi CVF ban hành rotation guard riêng cho từng trace chain đó.
