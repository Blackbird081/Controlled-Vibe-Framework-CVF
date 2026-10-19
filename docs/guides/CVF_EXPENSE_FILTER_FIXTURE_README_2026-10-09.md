# Fixture đơn vị: lọc chi tiêu theo tháng (NCR)

Memory class: governed-worker-guide
Status: LOCAL_UNIT_FIXTURE_ONLY
Date: 2026-10-09
Batch ID: CVF-NCR-EXPENSE-FIXTURE-20261009

Text Encoding Exception: Vietnamese letters with diacritics throughout; no other non-ASCII symbol class is added.

## Mục đích

Fixture đơn vị độc lập cho các hành vi lọc chi tiêu theo tháng trong kịch bản S05-S06
(`docs/reference/CVF_NCR_GENERAL_VIDEO_DESIGN_2026-10-02.md`). Dữ liệu là dữ liệu giả,
nhập trực tiếp trong test.

## Scope / Target / Owner

- Tệp: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/expenses/ExpenseList.tsx` và
  `ExpenseList.test.tsx`.
- Target: hành vi lọc theo tháng, không phải ứng dụng hoàn chỉnh.
- Owner: Local quyết định mọi bước tích hợp, export hoặc deploy.
- Component chưa được gắn vào route, trang hay import ở nơi nào khác.

## Source

- Kịch bản S05-S06 trong tài liệu nêu trên.
- Baseline: `docs/baselines/CVF_GC018_NCR_EXPENSE_FILTER_FIXTURE_2026-10-09.md`.

## Requirements

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `expenses` | `ReadonlyArray<ExpenseRecord>` | Không bị thay đổi; giữ thứ tự và `id` |
| `date` | string | Chỉ `YYYY-MM-DD` là ngày lịch Gregorian thật |
| `label`, `amount` | string, number | Hiển thị thô, không định dạng theo locale |

Ô lọc là `<input type="month">`, nhãn "Lọc theo tháng". Màu dùng token `--cvf-*`
trong `DESIGN.md`, không dùng mã màu thô.

| Tình huống | Kết quả |
|---|---|
| Chọn `2026-03` | Chỉ dòng tháng 3 năm 2026, giữ thứ tự gốc |
| Tháng không có dòng | Hiện "Không có khoản chi nào..." |
| Để trống bộ lọc | Hiện mọi dòng có ngày hợp lệ |
| Sai định dạng, như `05/03/2026` | Bỏ qua, không làm lỗi |
| Không tồn tại, như `2026-02-30` hoặc `2026-02-29` (năm không nhuận) | Bỏ qua |
| Năm nhuận, như `2024-02-29` | Hợp lệ, chỉ hiện khi lọc `2024-02` |
| Cùng tháng khác năm, như `2025-03-21` khi lọc `2026-03` | Không hiện |
| Sai định dạng tháng, như `2026-3` | Không khớp dòng nào (fail closed) |

Năm nhuận: chia hết cho 400, hoặc chia hết cho 4 nhưng không chia hết cho 100.
Tháng được đọc trực tiếp từ chuỗi; không dùng bộ phân tích theo locale hay múi giờ.

## Dữ liệu thử

Năm dòng trong test ("Chi phí thử A" đến "Chi phí thử E"): hai dòng tháng 2 năm
2026, hai dòng tháng 3 năm 2026, và một dòng `05/03/2026` (sai định dạng). Bộ phân
tích kiểu dd/mm/yyyy sẽ đọc dòng này thành tháng 3, đó là bẫy cần tránh. Các trường
hợp phủ định đổi một trường của cùng bộ dữ liệu này.

## Verification

Chạy từ `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web`, không cài đặt thêm:

```text
node node_modules/vitest/vitest.mjs run src/expenses/ExpenseList.test.tsx --reporter=verbose
```

Kết quả, thời gian và mã thoát nằm trong evidence JSON, không nằm trong tài liệu này.

## Claim Boundary

- Chỉ là fixture đơn vị. Không phải bằng chứng ứng dụng chạy thật, E2E, trình duyệt,
  responsive, hay hành vi quản trị AI của CVF.
- Không lưu trữ, không gọi mạng, không gọi nhà cung cấp mô hình, không thêm thư viện,
  không dùng dữ liệu thật, không sửa kịch bản, huy hiệu hay trạng thái claim.
- Không có số liệu token, chi phí hay so sánh giữa các mô hình.
- Chưa tích hợp, chưa export, chưa deploy; các việc đó cần quyết định riêng của Local.

## Related artifacts

- Work order: `docs/work_orders/CVF_AGENT_WORK_ORDER_NCR_EXPENSE_FILTER_FIXTURE_2026-10-09.md`
- Evidence: `docs/reviews/evidence/cvf-expense-filter-worker-2026-10-09.json`
- Return: `docs/reviews/CVF_NCR_EXPENSE_FILTER_FIXTURE_WORKER_RETURN_2026-10-09.md`
