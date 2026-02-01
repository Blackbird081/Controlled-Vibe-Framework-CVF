# CVF v1.4.1 – Operator Extension Pack

> **Extension Pack cho người dùng cuối (operator / user-facing)**
> *Additive – Optional – Non‑breaking*

---

## 1. Extension Pack này là gì?

`Operator Extension Pack` là **tập hợp các tài liệu hướng dẫn mở rộng**, được thiết kế để:

* Giảm tải nhận thức cho **người dùng mới** của CVF
* Cung cấp **đường đi gợi ý** cho các tình huống thường gặp
* Giúp operator **tự phát hiện sai lệch sớm** trước khi gây lỗi lớn

⚠️ Extension Pack **KHÔNG thay đổi**:

* Core rules của CVF
* Input / Output Contract
* Trace, Logging, Enforcement

Nếu bỏ toàn bộ Extension Pack → **CVF v1.4 vẫn hoạt động hoàn chỉnh**.

---

## 2. Ai NÊN / KHÔNG NÊN dùng Extension Pack?

### ✅ NÊN dùng nếu bạn:

* Mới tiếp cận CVF
* Chưa quen với tư duy “AI tự chịu trách nhiệm trong boundary”
* Hay mắc lỗi ở bước input, expectation, hoặc review output
* Cần tốc độ, ít suy nghĩ lại mỗi lần dùng

### ❌ KHÔNG cần dùng nếu bạn:

* Đã vận hành CVF ổn định
* Hiểu rõ scope / boundary / audit
* Có checklist và thói quen kiểm soát riêng

> Extension Pack **không dành để huấn luyện AI** – mà để **giữ operator không làm sai**.

---

## 3. Nguyên tắc thiết kế (Design Principles)

Extension Pack tuân thủ 4 nguyên tắc bất biến:

1. **Không mở thêm quyền cho operator**
2. **Không cho phép override core rules**
3. **Không tạo cảm giác CVF là “framework phức tạp”**
4. **Có thể bỏ qua từng phần mà không gây lỗi hệ thống**

Mọi nội dung trong pack này đều là:

* Gợi ý (guided)
* Nhận diện sớm (early signal)
* Kịch bản tham chiếu (scenario)

---

## 4. Cấu trúc Extension Pack

```
CVF_v1.4.1_OPERATOR_EXTENSION_PACK/
│
├── README.md                ← (file này)
│
├── GUIDED_MODE/
│   ├── guided_entry.md
│   ├── decision_flow.md
│   └── fallback_paths.md
│
├── SCENARIO_PACKS/
│   ├── happy_path.md
│   ├── partial_failure.md
│   ├── operator_error.md
│   └── boundary_violation.md
│
└── SELF_CHECK/
    ├── misuse_patterns.md
    ├── early_warning_signals.md
    └── corrective_actions.md
```

---

## 5. Cách sử dụng khuyến nghị

### Lộ trình tối giản cho người mới:

1. Đọc `guided_entry.md`
2. Tham khảo `decision_flow.md`
3. Khi có vấn đề → tra `SCENARIO_PACKS/`
4. Nếu lặp lỗi → dùng `SELF_CHECK/`

⛔ **Không đọc Extension Pack theo kiểu từ trên xuống**.

Đây là **toolbox**, không phải manual.

---

## 6. Ranh giới trách nhiệm

* Extension Pack **không chịu trách nhiệm** cho output AI
* Mọi kết quả vẫn phải được:

  * Đối chiếu Output Contract
  * Review theo Audit Checklist

Nếu operator làm sai dù đã đọc Extension Pack → **lỗi vẫn thuộc operator**.

---

## 7. Mapping với CVF Core

| Thành phần       | Ảnh hưởng         |
| ---------------- | ----------------- |
| Scope / Boundary | ❌ Không ảnh hưởng |
| Input Contract   | ❌ Không thay đổi  |
| Execution Rules  | ❌ Không can thiệp |
| Output & Audit   | ❌ Không override  |

Extension Pack **chỉ hỗ trợ nhận thức**, không tham gia thực thi.

---

## 8. Trạng thái & Versioning

* Thuộc nhánh: **CVF v1.4.1**
* Tính chất: **Additive**
* Có thể mở rộng thêm mà không đổi version core

---

> Nếu bạn cảm thấy CVF đang “dễ hơn” khi dùng Extension Pack – nghĩa là nó đang làm đúng việc.
