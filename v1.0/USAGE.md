# HƯỚNG DẪN SỬ DỤNG CVF  

## Controlled Vibe Framework — v1.0 FINAL

---

## 🚀 Cách áp dụng CVF vào project mới

### Phương pháp 1: Clone trực tiếp (Khuyến nghị)

```bash
# Clone CVF làm base cho project mới
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git my-new-project

# Xóa git history cũ và tạo mới
cd my-new-project
rm -rf .git
git init
git add .
git commit -m "init: khởi tạo project từ CVF v1.0"
```

### Phương pháp 2: Download ZIP

1. Vào GitHub repo → **Code** → **Download ZIP**
2. Giải nén vào thư mục project
3. Khởi tạo git mới

### Phương pháp 3: Git Submodule (Nâng cao)

```bash
# Thêm CVF như submodule (giữ liên kết với upstream)
git submodule add https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git cvf
```

---

## 📋 Bước tiếp theo sau khi clone

1. ✅ Mở và hoàn thành [`governance/PROJECT_INIT_CHECKLIST.md`](governance/PROJECT_INIT_CHECKLIST.md)
2. ✅ Cập nhật thông tin project trong [`project/README.md`](project/README.md)
3. ✅ Bắt đầu **Phase A — Discovery**

---

## 📁 Những file CẦN chỉnh sửa (project-level)

| File | Hành động |
|------|-----------|
| `project/README.md` | Mô tả project của bạn |
| `DECISIONS.md` | Ghi nhận quyết định của project |
| `CHANGELOG.md` | Lịch sử thay đổi của project |
| `phases/PHASE_STATUS.md` | Cập nhật trạng thái phase |
| `ai/AI_USAGE_LOG.md` | Ghi log sử dụng AI |

---

## 🔒 Những file KHÔNG được chỉnh sửa (framework-level)

| File | Lý do |
|------|-------|
| `CVF_MANIFESTO.md` | Triết lý core - FREEZE |
| `FRAMEWORK_FREEZE.md` | Quy định freeze - FREEZE |
| `phases/PHASE_*.md` | Logic phase - FREEZE |
| `governance/*.md` | Quy tắc governance - FREEZE |
| `ai/AI_AGENT_ROLE_SPEC.md` | Định nghĩa vai trò AI - FREEZE |
| `ai/AI_PROJECT_PROMPT.md` | Prompt chuẩn - FREEZE |

---

## 🔄 Cập nhật từ upstream (nếu dùng submodule)

```bash
cd cvf
git pull origin main
cd ..
git add cvf
git commit -m "chore: update CVF to latest version"
```

---

## ❓ FAQ

### Q: Tôi có thể thêm file mới vào framework không?

**A:** Có thể thêm vào `project/` hoặc `docs/`, nhưng không được thêm vào `governance/`, `phases/`, `ai/`.

### Q: Nếu phát hiện lỗi trong framework thì sao?

**A:** Mở Issue trên GitHub repo chính. Không tự sửa.

### Q: Khi nào cần upgrade lên v1.1?

**A:** Khi v1.1 được release và bạn cần các tính năng mới (ví dụ: INPUT/OUTPUT spec).

---

## 📌 Liên kết quan trọng

- [README.md](README.md) — Tổng quan framework
- [CVF_MANIFESTO.md](CVF_MANIFESTO.md) — Triết lý
- [governance/PROJECT_INIT_CHECKLIST.md](governance/PROJECT_INIT_CHECKLIST.md) — Checklist khởi tạo

---

**Happy Vibe Coding! 🎯**
