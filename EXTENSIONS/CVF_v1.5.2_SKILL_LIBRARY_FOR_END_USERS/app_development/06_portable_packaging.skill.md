# Portable App Packaging

> **Domain:** App Development
> **Difficulty:** ⭐ Easy
> **CVF Version:** v1.5.2
> **Skill Version:** 1.0.0
> **Last Updated:** 2026-02-27

---

## 📌 Prerequisites

- [ ] App đã pass Phase D (Review) và có `HUONG_DAN.md`
- [ ] Tất cả dependencies được khai báo trong `requirements.txt` (Python) hoặc `package.json` (Node)

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Cuối Phase D, chuẩn bị bàn giao app cho người dùng khác
- Muốn người nhận có thể mở app chỉ bằng 1 cú click, không cần setup
- Muốn gửi app qua Zalo/email dưới dạng file ZIP

**Không phù hợp khi:**
- App web công khai (dùng AGT-030 Cloud Deployment thay thế)
- App cần tài khoản cloud hoặc database server bên ngoài

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Builder |
| Allowed Phases | Review |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Package structure verified, Launch script tested, Dependencies locked |

---

## ⛔ Execution Constraints

- Mọi thứ PHẢI nằm trong 1 folder duy nhất (không rải rác)
- PHẢI có file khởi động: `START.bat` (Windows) hoặc `start.sh` (Mac/Linux)
- File khởi động PHẢI tự kiểm tra và cài thư viện thiếu (`pip install -r requirements.txt`) lần đầu
- KHÔNG bao gồm file database có dữ liệu cá nhân vào package — chỉ database trống

---

## ✅ Validation Hooks

- Check tất cả files cần thiết có trong folder
- Check `START.bat` / `start.sh` chạy được trên máy sạch
- Check `requirements.txt` khớp với thư viện thực sự dùng trong code
- Check không có dữ liệu cá nhân trong database mẫu

---

## 🧪 UAT Binding

- UAT Record: `governance/skill-library/uat/results/UAT-non_coder_workflow-06_portable_packaging.md`
- UAT Objective: Người nhận có thể mở app thành công chỉ bằng 1 click vào `START.bat`, không cần hướng dẫn thêm

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Tên app** | Tên thư mục sẽ giao | ✅ | "FinanceTracker_v1.0" |
| **Tech stack** | Python + Streamlit / Node.js / khác | ✅ | "Python 3.11 + Streamlit" |
| **Hệ điều hành người nhận** | Windows / Mac / Linux | ✅ | "Windows 10/11" |
| **Có database không** | App có lưu dữ liệu local không | ✅ | "Có — SQLite" |

---

## ✅ Expected Output

**Cấu trúc thư mục được tạo:**

```
FinanceTracker_v1.0/
├── START.bat              ← Click đúp để mở (Windows)
├── start.sh               ← Cho Mac/Linux
├── app.py                 ← Code chính
├── requirements.txt       ← Danh sách thư viện
├── HUONG_DAN.md           ← Hướng dẫn sử dụng
├── data/
│   └── finance.db         ← Database trống (không có data cá nhân)
└── assets/
    └── logo.png           ← Logo/ảnh app (nếu có)
```

**Nội dung `START.bat`:**

```batch
@echo off
echo === Khoi dong FinanceTracker ===
echo Kiem tra thu vien...
pip install -r requirements.txt --quiet
echo Dang mo app...
streamlit run app.py
pause
```

**Hướng dẫn giao cho người dùng:**
```
1. Nén thư mục "FinanceTracker_v1.0" thành file ZIP
2. Gửi file ZIP
3. Người nhận giải nén và bấm đúp vào START.bat
```

---

## 🔍 Cách đánh giá

**Checklist Accept:**
- [ ] Tất cả files trong 1 folder duy nhất
- [ ] `START.bat` / `start.sh` tồn tại và chạy được
- [ ] `requirements.txt` đúng và đủ
- [ ] Database trống (không chứa dữ liệu cá nhân)
- [ ] `HUONG_DAN.md` có trong package

**Red flags (Reject):**
- ⚠️ App dùng đường dẫn tuyệt đối (`C:\Users\TenNguoiDung\...`) — sẽ lỗi ở máy khác
- ⚠️ `requirements.txt` thiếu thư viện
- ⚠️ Database có dữ liệu cá nhân của developer

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|-----------------|
| Đường dẫn tuyệt đối trong code | Dùng `os.path.dirname(__file__)` thay vì hardcode path |
| Thiếu thư viện trong requirements.txt | Chạy `pip freeze > requirements.txt` trước khi đóng gói |
| Database có dữ liệu test | Tạo script `reset_db.py` để tạo database trống |

---

## 💡 Tips

1. **Test trên máy khác** — Luôn thử mở package trên máy sạch trước khi giao
2. **Version trong tên folder** — `AppName_v1.0` giúp người dùng biết phiên bản
3. **README ngắn trong ZIP** — Thêm 1 file `ĐỌC_TRƯỚC.txt` cực ngắn ngay trong folder
4. **Không nén node_modules** — Với Node.js, chạy `npm install` trong `START.bat`

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Tên app: "SalesReport_v1.0"
Tech stack: Python 3.11 + Streamlit + pandas + plotly
Hệ điều hành: Windows 10/11
Có database: SQLite
```

### Output mẫu: được tạo:
- Folder `SalesReport_v1.0/` với cấu trúc chuẩn
- `START.bat` tự cài `pip install -r requirements.txt` lần đầu
- `data/sales.db` database trống với schema đúng

### Đánh giá:
- ✅ 1-click launch thành công
- ✅ Không đường dẫn tuyệt đối
- ✅ Database trống
- **Kết quả: ACCEPT**

---

## 🔗 Next Step

Sau khi đóng gói xong → Gửi file ZIP và `HUONG_DAN.md` cho người nhận

---

## 🔗 Related Skills — Cần có HUONG_DAN.md trước
- [Cloud Deployment Strategist](../../app_development/08_local_deployment.skill.md) — Nếu muốn deploy lên web

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-27 | Khởi tạo từ CVF-Compatible Skills intake |

---

*Portable App Packaging — CVF v1.5.2 Non-coder Workflow Skill Library*
