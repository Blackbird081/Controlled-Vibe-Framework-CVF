# CVF Skill Library v1.5.2

> **Controlled Vibe Framework - Skill Library for End Users**  
> Bộ sưu tập các CVF skills cho marketing, product, SEO, security, compliance, **HR**, **Legal**, và **AI/ML**.

**Policy Note:** v1.5 UX Platform đã **FROZEN** (maintenance-only). Skill Library v1.5.2 **tiếp tục mở rộng** và được **v1.6 thừa hưởng** để dùng chung.

**Portfolio Note:** Active skills should stay few, strong, and non-coder friendly.
Use `governance/skill-library/specs/SKILL_PORTFOLIO_CANONICALIZATION_POLICY.md`
before importing external skill packs or adding overlapping micro-skills.

## Danh mục hiện tại

Trên CVF Web, chọn mẫu kết quả ở Trang chủ để viết bản đặc tả. [Sổ nguồn v1.5.2](../../governance/skill-library/registry/user-skills/INDEX.md) ghi ứng viên tài chính đang chờ chứng nhận. [Danh mục gói dành cho agent](../../docs/reference/agent_system_skills/generated/skill-index.json) ghi tình trạng chứng nhận và phạm vi riêng của từng gói.

## 🚀 Bắt đầu nhanh

Mở Trang chủ CVF Web, chọn mẫu theo kết quả cần và điền thông tin để tạo bản đặc tả.

---

## 📝 Cấu trúc nguồn v1.5.2

### Cấu trúc skill file

```markdown
# Skill Name
> Metadata (Domain, Difficulty, CVF Version, Skill Version, Last Updated)

## 🎯 Mục đích        ← Khi nào dùng skill này
## 📋 Form Input      ← Điền gì vào đây
## ✅ Expected Output ← Kết quả mong đợi
## 🔍 Cách đánh giá   ← Checklist Accept/Reject
## ⚠️ Common Failures ← Lỗi cần tránh
## 💡 Tips            ← Mẹo sử dụng
## 📊 Ví dụ thực tế   ← Input/Output mẫu
## 🔗 Related Skills  ← Skills liên quan
## 📜 Version History ← Lịch sử phiên bản
```

## Ví dụ tạo đặc tả trên CVF Web

Cần tạo mô tả công việc cho vị trí mới. Mở Trang chủ CVF Web, tìm mẫu mô tả công việc, điền thông tin về vị trí, trách nhiệm và yêu cầu. Xuất bản đặc tả để xem lại hoặc giao cho agent.

---

## 🔗 Links

- **GitHub:** [Blackbird081/Controlled-Vibe-Framework-CVF](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF)
- **CVF Web UI:** [CVF Web](../CVF_v1.6_AGENT_PLATFORM/cvf-web/)
- **DIFFICULTY_GUIDE:** [DIFFICULTY_GUIDE.md](DIFFICULTY_GUIDE.md)
- **SKILL_TEMPLATE:** [SKILL_TEMPLATE.md](SKILL_TEMPLATE.md)

---

## 🧪 Automated Validation

Chạy script để kiểm tra metadata + section bắt buộc trong tất cả `.skill.md`:

```bash
cd EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS
python scripts/validate_skills.py
```

Xuất report JSON (tuỳ chọn):

```bash
python scripts/validate_skills.py --json reports/skill_validation.json
```

---

*CVF Skill Library v1.5.2 | Last Updated: 2026-02-22*

<!-- Text Encoding Exception: pre-existing localized text and symbols are retained; this repair changes only navigation or Markdown structure. -->
