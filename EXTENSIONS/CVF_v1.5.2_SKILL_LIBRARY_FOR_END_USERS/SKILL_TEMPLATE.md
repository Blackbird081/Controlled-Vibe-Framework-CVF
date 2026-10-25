# CVF Skill Template

> Dùng template này để tạo skill mới cho Skill Library

---

## Cấu trúc file

Tên file: `[số thứ tự]_[tên_skill].skill.md`  
Ví dụ: `01_app_requirements_spec.skill.md`

---

## 📄 Template

```markdown
# [Tên Skill]

> **Domain:** [Domain name]  
> **Difficulty:** [⭐ Easy / ⭐⭐ Medium / ⭐⭐⭐ Advanced] — [Xem criteria](./DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** YYYY-MM-DD

---

## 📌 Prerequisites

> Hoàn thành các skills sau trước khi dùng skill này:
> - [Tên Skill](./path_to_skill.md) — Lý do cần
> 
> *Nếu không có prerequisites, ghi: "Không yêu cầu"*

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- [Trường hợp 1]
- [Trường hợp 2]

**Không phù hợp khi:**
- [Trường hợp không nên dùng]

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| Mục tiêu | Bạn muốn đạt được gì? | ✅ | "Trang giới thiệu khóa học" |
| Đối tượng | Ai sẽ sử dụng? | ✅ | "Nhân viên văn phòng 25-35" |
| Ràng buộc | Giới hạn nếu có | ❌ | "Budget < 500tr" |
| Tham khảo | Link/mẫu tham khảo | ❌ | "https://example.com" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- [Output 1]
- [Output 2]

**Format output:**
- [Mô tả format]

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] [Tiêu chí 1]
- [ ] [Tiêu chí 2]
- [ ] [Tiêu chí 3]

**Red flags (cần Reject):**
- ⚠️ [Warning sign 1]
- ⚠️ [Warning sign 2]

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| [Lỗi 1] | [Cách tránh] |
| [Lỗi 2] | [Cách tránh] |

---

## 💡 Tips

1. **Tip 1:** [Nội dung]
2. **Tip 2:** [Nội dung]

---

## 📊 Ví dụ thực tế

### Input mẫu:
```

Mục tiêu: [...]
Đối tượng: [...]
Ràng buộc: [...]

```

### Output mẫu:
```

[Tóm tắt output]

```

### Đánh giá:
- ✅ Tiêu chí 1: Đạt
- ✅ Tiêu chí 2: Đạt
- **Kết quả: ACCEPT**

---

## 🔗 Related Skills

- [Tên Skill](./path_to_skill.md) — Vì sao liên quan

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | YYYY-MM-DD | Initial release |

---

## 🔗 Next Step

> Sau khi hoàn thành skill này → [Tên Skill Tiếp Theo](./path_to_next.md)

---

*[Tên Skill] — CVF v1.5.2 Skill Library*
```

---

## ✅ Checklist khi tạo skill mới

### Metadata

- [ ] Tên skill rõ ràng, dễ hiểu
- [ ] Difficulty phù hợp (xem [DIFFICULTY_GUIDE.md](./DIFFICULTY_GUIDE.md))
- [ ] Skill Version bắt đầu từ 1.0.0
- [ ] Last Updated là ngày tạo/cập nhật

### Prerequisites

- [ ] Liệt kê skills cần hoàn thành trước (nếu có)
- [ ] Link đúng path đến skill đó

### Content

- [ ] Mục đích cụ thể (khi nào dùng / không dùng)
- [ ] Form input đầy đủ với ví dụ
- [ ] Tiêu chí đánh giá rõ ràng
- [ ] Common failures có cách phòng tránh
- [ ] Có ví dụ thực tế (input + output + evaluation)

### Language

- [ ] Ngôn ngữ: **Tiếng Việt** là chính
- [ ] Technical terms: English trong `backticks`
- [ ] Code examples: English

### Navigation

- [ ] Có Next Step link (nếu là part of workflow)
- [ ] File name có số thứ tự đúng
- [ ] Có Related Skills section (nếu liên quan)

---

## 📝 Versioning Guide

| Version | Khi nào tăng |
|---------|--------------|
| 1.0.0 | Initial release |
| 1.0.x | Bug fixes, typos, minor clarifications |
| 1.x.0 | New sections, examples, or content additions |
| x.0.0 | Major restructure hoặc breaking changes |

---

*CVF Skill Template v1.1 | Last Updated: 2026-02-04*
