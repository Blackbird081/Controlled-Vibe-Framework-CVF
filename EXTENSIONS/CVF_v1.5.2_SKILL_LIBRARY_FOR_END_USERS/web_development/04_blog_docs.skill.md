# Blog / Documentation

> **Domain:** Web Development  
> **Difficulty:** ⭐ Easy  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.0.0  
> **Last Updated:** 2026-02-07
> **Source:** Vibecode Kit v4.0

---

## 📌 Prerequisites

Không yêu cầu.

---

## 🎯 Mục đích

**Khi nào dùng skill này:**

- Blog cá nhân hoặc công ty
- Documentation cho sản phẩm
- Knowledge base / Wiki
- Tutorial / Guide website

**Không phù hợp khi:**

- Cần bán hàng → Dùng Landing Page
- Cần app phức tạp → Dùng SaaS App
- Portfolio showcase → Dùng Portfolio

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Design, Build |
| Authority Scope | Tactical |
| Autonomy | Auto + Audit |
| Audit Hooks | Input completeness, Output structure, Scope guard |

---

## ⛔ Execution Constraints

- Không thực thi ngoài phạm vi được khai báo
- Tự động dừng nếu thiếu input bắt buộc
- Với rủi ro R1: auto + audit
- Không ghi/đổi dữ liệu hệ thống nếu chưa được xác nhận

---

## ✅ Validation Hooks

- Check đủ input bắt buộc trước khi bắt đầu
- Check output đúng format đã định nghĩa
- Check không vượt scope và không tạo hành động ngoài yêu cầu
- Check output có bước tiếp theo cụ thể

---

## 🧪 UAT Binding

- UAT Record: [04_blog_docs](../../../governance/skill-library/uat/results/UAT-04_blog_docs.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **Loại** | Blog hay Documentation? | ✅ | "Blog về AI và công nghệ" |
| **Nội dung** | Viết về gì? | ✅ | "Tutorials, news, reviews" |
| **Tần suất** | Bao lâu publish 1 bài? | ❌ | "2 bài/tuần" |
| **Authors** | Có nhiều tác giả không? | ❌ | "1 tác giả chính" |
| **Categories** | Phân loại nội dung? | ❌ | "Tutorials, News, Reviews" |
| **Tham khảo** | Blog mẫu yêu thích? | ❌ | "blog.vercel.com" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

- Blog/Docs website hoàn chỉnh
- Homepage với featured + recent posts
- Post page với TOC
- Category/Tag pages
- Search functionality
- SEO optimized

**Cấu trúc tiêu chuẩn:**

### Blog Pattern

```
┌─────────────────────────────────────────┐
│ Homepage                                │
│  ├── Featured posts (hero)              │
│  ├── Recent posts (grid/list)           │
│  └── Categories sidebar                 │
├─────────────────────────────────────────┤
│ Post Page                               │
│  ├── Title + Meta (date, author, time)  │
│  ├── Featured image                     │
│  ├── Content (MDX)                      │
│  ├── Author bio                         │
│  └── Related posts                      │
├─────────────────────────────────────────┤
│ Category / Tag Pages                    │
│ Author Pages                            │
└─────────────────────────────────────────┘
```

### Docs Pattern

```
┌───────────────────────────────────────────────────────────┐
│  ┌────────────┐ ┌─────────────────────┐ ┌────────────┐   │
│  │  Sidebar   │ │    Main Content     │ │    TOC     │   │
│  │   (nav)    │ │       (MDX)         │ │  (right)   │   │
│  │            │ │                     │ │            │   │
│  │  • Guide   │ │  # Heading          │ │  • H2      │   │
│  │    • P1    │ │                     │ │  • H2      │   │
│  │    • P2    │ │  Content here...    │ │    • H3    │   │
│  │  • API     │ │                     │ │  • H2      │   │
│  │    • P1    │ │  ```code```         │ │            │   │
│  └────────────┘ └─────────────────────┘ └────────────┘   │
│  + Search (global)                                        │
└───────────────────────────────────────────────────────────┘
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Typography dễ đọc (18px+, line-height 1.6+)
- [ ] TOC hoạt động (click scroll)
- [ ] Search tìm được content
- [ ] Mobile responsive
- [ ] Code blocks có syntax highlighting
- [ ] SEO meta tags đầy đủ

**Red flags (cần Reject):**

- ⚠️ Font quá nhỏ / line-height quá sát
- ⚠️ Không có TOC cho bài dài
- ⚠️ Search không hoạt động
- ⚠️ Mobile bị vỡ layout

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Typography không tối ưu | 18px body, 1.6-1.8 line-height |
| Không có TOC | Bắt buộc cho bài >500 từ |
| Search chậm/không chính xác | Dùng search indexing |
| Code blocks xấu | Syntax highlighting + copy button |
| SEO yếu | Meta tags, structured data |

---

## 💡 Tips

1. **Typography là #1** — Người đọc phải thoải mái
2. **TOC cho navigation** — Đặc biệt quan trọng cho docs
3. **Code blocks phải đẹp** — Syntax highlight + copy button
4. **SEO từ đầu** — Title, description, OG images
5. **MDX > Markdown** — Cho phép components trong content

---

## 📊 Ví dụ thực tế

### Input mẫu

```
Loại: Blog về AI và Machine Learning
Nội dung: Tutorials, news, case studies
Tần suất: 2 bài/tuần
Authors: 1 tác giả chính + guest posts
Categories: Tutorials, News, Case Studies, Tools
Tham khảo: blog.vercel.com, overreacted.io
```

### Output mẫu

```
Blog với:
- Homepage: Featured + Recent grid
- Post page: Full content + TOC + Related
- Category pages: Tutorials, News, Case Studies
- Author page: Bio + all posts
- Search: Full-text search
- SEO: Auto-generated meta tags
- RSS feed
- Dark mode
```

### Đánh giá

- ✅ Typography: 18px, 1.7 line-height
- ✅ TOC sticky sidebar
- ✅ Search working
- ✅ Categories organized
- ✅ SEO meta tags OK
- **Kết quả: ACCEPT**

---

---

## 🔗 Related Skills

- [Dashboard](./03_dashboard.skill.md)
- [Portfolio](./05_portfolio.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.0.1 | 2026-02-07 | Domain refinement: flow alignment + metadata |
| 1.0.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Blog / Documentation**, tiếp tục với:
→ [Portfolio](./05_portfolio.skill.md)

---

*CVF Skill Library v1.5.2 | Web Development Domain*
