# CVF v1.4 – Usage Layer

> **User chỉ khai báo ý định – hệ thống chịu trách nhiệm kiểm soát**

---

## Đây là gì?

CVF v1.4 là **lớp sử dụng (Usage / UX Layer)** đặt *trên* CVF v1.3.1 (CORE – đã freeze).

| CVF v1.3.1 | CVF v1.4 |
|------------|----------|
| Cho **Operator** | Cho **End-user** |
| Cần hiểu execution rules | Không cần hiểu framework |
| Access trace & audit | Chỉ thấy kết quả |
| Full control | Guided experience |

CVF v1.4 **không phải framework mới** và **không thay đổi bất kỳ rule nào** của CVF core.

---

## Bạn CẦN làm gì (3 việc)

```
┌─────────────────┐
│ 1. Nêu Intent   │  "Tôi muốn..."
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. Chọn Preset  │  analysis / decision / content / technical
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. Accept/Reject│  Chấp nhận hoặc từ chối kết quả
└─────────────────┘
```

Bạn **không chỉnh AI**, **không tối ưu prompt**, **không ép kết quả**.

---

## Bạn KHÔNG cần biết

Để dùng CVF v1.4, bạn **không cần**:

- ❌ Hiểu execution rules
- ❌ Biết audit / trace là gì
- ❌ Can thiệp vào cách AI làm việc
- ❌ Học CVF framework

Tất cả những phần đó đã được **CVF core xử lý sẵn**.

---

## Flow hoạt động

```
[User Intent]
     ↓
[Validate + Map to Preset]  ← CVF v1.4
     ↓
[Execute via CVF Core]      ← CVF v1.3.1
     ↓
[Format Output]             ← CVF v1.4
     ↓
[User receives result]
```

---

## Cấu trúc thư mục

```
CVF_v1.4_USAGE_LAYER/
├── README.md                    ← Bạn đang đọc file này
├── CHANGELOG.md
│
├── 10_USER_LAYER/               ← Cách khai báo intent
│   ├── user_intent_templates.md
│   ├── do_and_dont_for_users.md
│   └── expectation_management.md
│
├── 11_PRESET_USE_CASES/         ← Các preset có sẵn
│   ├── analysis_mode.md         📊 Phân tích
│   ├── decision_support.md      🎯 Hỗ trợ quyết định
│   ├── content_generation.md    ✍️ Tạo nội dung
│   └── technical_review.md      🔍 Review kỹ thuật
│
├── 12_TOOLING/                  ← CLI, Web UI, API
│   ├── cvf_cli_user_mode.md
│   ├── web_ui_concept.md
│   └── api_wrapper_contract.md
│
├── 13_FAILURE_UX/               ← Cách xử lý lỗi thân thiện
│   ├── user_facing_error_messages.md
│   ├── retry_vs_reject_policy.md
│   └── explain_failure_without_trace.md
│
└── 14_LIGHT_GOVERNANCE/         ← Quản lý nhẹ cho team
    ├── role_matrix.md
    ├── escalation_flow.md
    └── freeze_and_upgrade_policy.md
```

---

## Preset nhanh

| Preset | Dùng khi | Intent pattern |
|--------|----------|----------------|
| 📊 **Analysis** | Hiểu vấn đề | "Tôi muốn hiểu..." |
| 🎯 **Decision** | Cần khuyến nghị | "Tôi cần chọn..." |
| ✍️ **Content** | Tạo nội dung | "Tôi cần tạo..." |
| 🔍 **Technical** | Review code/arch | "Tôi cần review..." |

---

## Cam kết bất biến

✅ Không sửa rule core  
✅ Không lộ trace nội bộ  
✅ Không yêu cầu người dùng học CVF  
✅ Kế thừa toàn bộ CVF v1.3.1  

---

## Khi nào KHÔNG dùng CVF v1.4

- ⚠️ Khi bạn muốn can thiệp sâu vào cách AI suy luận
- ⚠️ Khi bạn cần thử nghiệm prompt tự do
- ⚠️ Khi bạn cần access trace và audit

→ Trong các trường hợp này, dùng **[CVF v1.3.1 Operator Edition](../CVF_v1.3.1_OPERATOR_EDITION/)**

---

## Status

| Layer | Version | Status |
|-------|:-------:|:------:|
| Core | v1.3.1 | ✅ Frozen |
| Operator Edition | v1.3.1 | ✅ Frozen |
| **Usage Layer** | **v1.4** | ✅ **Frozen** |

---

*CVF v1.4 Usage Layer — Powered by CVF v1.3.1 Core*
