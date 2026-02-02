# SaaS App

> **Domain:** Web Development  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Source:** Vibecode Kit v4.0

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Ứng dụng web có đăng nhập/đăng ký
- Có user accounts và quản lý profile
- Có subscription/payment
- Nhiều tính năng, nhiều trang

**Không phù hợp khi:**
- Chỉ cần 1 trang giới thiệu → Dùng Landing Page
- Chỉ cần quản lý data → Dùng Dashboard
- Website tĩnh/blog → Dùng Blog/Docs

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Tên app** | App làm gì? | ✅ | "TaskFlow - quản lý công việc cho team" |
| **Core features** | 3 tính năng chính | ✅ | "Task board, Time tracking, Team chat" |
| **User roles** | Có mấy loại user? | ✅ | "Admin, Team lead, Member" |
| **Đối tượng** | Ai sẽ dùng? | ✅ | "Startup team 5-20 người" |
| **Auth method** | Đăng nhập bằng gì? | ❌ | "Email + Google OAuth" |
| **Payment** | Có thu phí không? | ❌ | "Có - 3 gói: Free, Pro, Enterprise" |
| **Tham khảo** | App mẫu yêu thích? | ❌ | "Notion, Trello" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**
- App structure hoàn chỉnh
- Public pages (landing, pricing, login)
- Authenticated area với core features
- Responsive design

**Cấu trúc tiêu chuẩn:**
```
┌─────────────────────────────────────────┐
│ PUBLIC PAGES                            │
│  ├── Landing Page                       │
│  ├── Pricing Page                       │
│  ├── Login / Register                   │
│  └── Forgot Password                    │
├─────────────────────────────────────────┤
│ AUTHENTICATED AREA                      │
│  ├── Dashboard (overview)               │
│  ├── [Core Feature 1]                   │
│  ├── [Core Feature 2]                   │
│  ├── [Core Feature 3]                   │
│  ├── Settings                           │
│  └── Profile                            │
├─────────────────────────────────────────┤
│ ADMIN (nếu có)                          │
│  ├── User Management                    │
│  └── Analytics                          │
└─────────────────────────────────────────┘
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Có đủ auth flow (login/register/forgot)
- [ ] Dashboard overview rõ ràng
- [ ] 3 core features đầy đủ
- [ ] User roles phân quyền đúng
- [ ] Settings/Profile có đủ options
- [ ] Responsive trên mobile

**Red flags (cần Reject):**
- ⚠️ Auth flow không an toàn
- ⚠️ Core features thiếu/không đúng
- ⚠️ UX phức tạp, khó dùng
- ⚠️ Không có error handling

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Feature creep (quá nhiều) | Stick với 3 core features |
| Auth quá phức tạp | Dùng OAuth + email đơn giản |
| Không phân quyền | Define roles trước khi build |
| Quên empty states | Yêu cầu UI cho trường hợp không có data |
| Mobile không tốt | Test mobile từ đầu |

---

## 💡 Tips

1. **Start với 3 core features** — Thêm sau, đừng làm hết ngay
2. **Auth đơn giản trước** — Email + 1 OAuth là đủ
3. **Dashboard = Overview** — Không cần quá nhiều data
4. **Empty states quan trọng** — User mới thấy gì?
5. **Onboarding flow** — Giúp user hiểu app

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
Tên app: TaskFlow - quản lý công việc cho team nhỏ
Core features: 
  1. Task board (Kanban style)
  2. Time tracking cho mỗi task
  3. Team chat trong context task
User roles: Admin (quản lý team), Member (làm task)
Đối tượng: Startup team 5-15 người
Auth: Email + Google
Payment: Free (3 users), Pro $10/user/month
Tham khảo: Notion, Linear
```

### Output mẫu:
```
SaaS App với:
- Landing page giới thiệu TaskFlow
- Pricing: Free/Pro comparison
- Auth: Email + Google OAuth
- Dashboard: Tasks overview, team activity
- Task Board: Kanban với drag-drop
- Time Tracking: Timer + manual entry
- Chat: Thread-style trong task
- Settings: Team, billing, integrations
- Admin: User management, analytics
```

### Đánh giá:
- ✅ Auth: Email + Google OK
- ✅ 3 core features đầy đủ
- ✅ Pricing clear
- ✅ Admin panel có
- **Kết quả: ACCEPT**

---

*SaaS App Skill — CVF v1.5.2 Skill Library*
