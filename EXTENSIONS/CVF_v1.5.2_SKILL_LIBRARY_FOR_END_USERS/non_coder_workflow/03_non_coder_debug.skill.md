# Non-coder Debug

> **Domain:** Non-coder Workflow
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

> Không yêu cầu — Skill này kích hoạt khi app bị lỗi, bất kể ở phase nào.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- App bị crash, không mở được, hiển thị màn hình trắng
- Kết quả tính toán hoặc hiển thị sai
- User thấy thông báo lỗi nhưng không hiểu nghĩa gì
- Phase C (Build) hoặc Phase D (Review) — khi phát sinh lỗi

**Không phù hợp khi:**
- Cần debug lỗi performance phức tạp (dùng AGT-023 Systematic Debugging Engine)
- Lỗi liên quan đến infrastructure/server

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R0 |
| Allowed Roles | User, Builder, Reviewer |
| Allowed Phases | Build, Review |
| Authority Scope | Informational |
| Autonomy | Auto |
| Audit Hooks | Error captured, Root cause identified, Fix verified by test run |

---

## ⛔ Execution Constraints

- AI KHÔNG ĐƯỢC ném mã lỗi kỹ thuật (Error Code, Stack Trace) cho User
- AI KHÔNG ĐƯỢC đổ lỗi cho môi trường máy tính trước khi kiểm tra lại logic
- AI PHẢI tự chạy test sau khi sửa để xác nhận lỗi đã biến mất
- Giải thích bằng ngôn ngữ dễ hiểu: "Hiện tượng → Nguyên nhân → Cách tôi sửa"

---

## ✅ Validation Hooks

- Check đã mô tả hiện tượng lỗi trước khi giải thích nguyên nhân
- Check giải thích nguyên nhân không dùng thuật ngữ kỹ thuật
- Check có bước Test run sau khi sửa để xác nhận
- Check output là ngôn ngữ thông thường, không phải code

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-non_coder_workflow-03_non_coder_debug.md`
- UAT Objective: Skill phải giải thích lỗi không dùng thuật ngữ kỹ thuật và xác nhận lỗi đã được sửa bằng test run

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Mô tả hiện tượng** | User thấy gì khi lỗi xảy ra | ✅ | "Bấm nút Lưu thì app trắng màn hình" |
| **Bước tái hiện** | Làm gì để lỗi xảy ra lại | ✅ | "Nhập số âm vào ô Thu nhập rồi bấm Lưu" |
| **Lỗi xuất hiện lần đầu khi** | Hoàn cảnh phát sinh | ❌ | "Sau khi tôi thêm cột Ghi chú" |

---

## ✅ Expected Output

**Kết quả bạn nhận được — Báo cáo lỗi dễ hiểu:**

```markdown
# Báo cáo lỗi

## Hiện tượng
Khi bạn nhập số âm vào ô Thu nhập và bấm Lưu, app bị trắng màn hình.

## Nguyên nhân (giải thích như đời thường)
App của bạn chỉ biết xử lý số dương. Khi nhận được số âm, nó bị
"bối rối" và dừng lại — giống như máy tính bỏ túi khi bạn chia cho 0.

## Tôi đã sửa như thế nào
Tôi thêm một "bộ lọc" ở cửa vào: nếu bạn nhập số âm, app sẽ hiện
thông báo "Vui lòng nhập số lớn hơn 0" thay vì bị trắng.

## Kết quả kiểm tra
✅ Đã thử nhập -100 → App hiện thông báo, không còn trắng màn hình.
✅ Đã thử nhập 0 → App cũng hiện thông báo hợp lệ.
✅ Đã thử nhập 5000 → App lưu bình thường như trước.
```

---

## 🔍 Cách đánh giá

**Checklist Accept:**
- [ ] Giải thích hiện tượng đúng với những gì User mô tả
- [ ] Nguyên nhân được giải thích không có code/thuật ngữ
- [ ] Có kết quả Test run cụ thể (ít nhất 3 trường hợp)
- [ ] Lỗi không xuất hiện lại sau khi sửa

**Red flags (Reject):**
- ⚠️ Giải thích có "TypeError", "NullPointerException", "500 error"
- ⚠️ Không có bước test sau khi sửa
- ⚠️ Đổ lỗi cho "máy tính thiếu RAM" mà không kiểm tra code trước

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|-----------------|
| Dùng stack trace trong giải thích | Dịch stack trace sang tiếng Việt thông thường |
| Không test sau sửa | Luôn chạy test với cả truờng hợp đúng lẫn sai input |
| Sửa được lỗi này tạo ra lỗi khác | Kiểm tra các trường hợp liên quan sau khi sửa |

---

## 💡 Tips

1. **Dùng ví dụ đời thực** — "Giống như chia cho 0 trên máy tính bỏ túi"
2. **3 trường hợp test tối thiểu** — Input đúng / Input sai / Edge case
3. **Hiện tượng trước, nguyên nhân sau** — User cần thấy bạn hiểu vấn đề trước khi giải thích
4. **Khi không chắc nguyên nhân** — Nói "Tôi chưa chắc chắn, đây là những gì tôi đã thử"

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Mô tả hiện tượng: "App hiện số lạ kiểu 1e+06 thay vì 1,000,000"
Bước tái hiện: "Nhập số tiền lớn hơn 1 triệu rồi bấm Tính"
```

### Output mẫu:
```markdown
## Hiện tượng
Khi bạn nhập số tiền lớn hơn 1 triệu, app hiện "1e+06" thay vì "1.000.000".

## Nguyên nhân
Đây là cách máy tính viết tắt số lớn — gọi là "ký hiệu khoa học". Nó
chính xác nhưng không thân thiện với người dùng. Giống như viết
"1×10⁶" thay vì "một triệu".

## Tôi đã sửa
Tôi thêm định dạng "tự động thêm dấu chấm phẩy" vào kết quả hiển thị.

## Kết quả test
✅ 1,500,000 → hiện "1.500.000 đ"
✅ 500 → hiện "500 đ" (số nhỏ không đổi)
✅ 0 → hiện "0 đ"
```

### Đánh giá:
- ✅ Không dùng thuật ngữ kỹ thuật
- ✅ Ví dụ đời thực dễ hiểu
- ✅ 3 test case đủ
- **Kết quả: ACCEPT**

---

## 🔗 Next Step

Sau khi sửa lỗi → [Grandma UX Test](./04_grandma_ux_test.skill.md) để kiểm tra UX toàn diện

---

## 🔗 Related Skills — Ngăn lỗi trước khi xảy ra

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-27 | Khởi tạo từ CVF-Compatible Skills intake |

---

*Non-coder Debug — CVF v1.5.2 Non-coder Workflow Skill Library*
