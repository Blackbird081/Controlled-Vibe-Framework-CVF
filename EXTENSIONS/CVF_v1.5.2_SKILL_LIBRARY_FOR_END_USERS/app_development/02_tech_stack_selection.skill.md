# Tech Stack Selection

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.1.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành skill sau trước khi dùng skill này:
>
> - [App Requirements Spec](./01_app_requirements_spec.skill.md) — Cần có requirements rõ ràng

---

## 🎯 Mục đích

**Khi nào dùng skill này:**

- Đã có requirements, cần chọn công nghệ
- Muốn AI Agent suggest stack phù hợp
- Cần so sánh các options

**Không phù hợp khi:**

- Chưa có requirements rõ ràng
- Stack đã được quy định sẵn

---

## 🛡️ Governance Summary (CVF Autonomous)

| Field | Value |
|-------|-------|
| Risk Level | R1 |
| Allowed Roles | User, Reviewer |
| Allowed Phases | Discovery, Design, Build |
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

- UAT Record: [02_tech_stack_selection](../../../governance/skill-library/uat/results/UAT-02_tech_stack_selection.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **App Type** | Loại app cần build | ✅ | "Desktop / CLI / Mobile / Web / API" |
| **Primary Language Preference** | Ngôn ngữ ưu tiên (nếu có) | ❌ | "Python / JavaScript / Rust / Go" |
| **Performance Priority** | Cần nhanh cỡ nào? | ✅ | "Low / Medium / High / Critical" |
| **Development Speed Priority** | Cần ship nhanh không? | ✅ | "Low / Medium / High" |
| **Team Experience** | Team quen với gì? | ❌ | "Python, JavaScript" |
| **Platform Targets** | Chạy trên đâu? | ✅ | "Windows, macOS, Linux" |
| **Data Storage Needs** | Cần database không? | ✅ | "None / Local / Cloud / Both" |
| **Offline Required** | Cần chạy offline? | ✅ | "Yes / No / Partial" |
| **Bundle Size Constraint** | Có giới hạn size? | ❌ | "< 50MB" |
| **Existing Codebase** | Có code sẵn không? | ❌ | "Python Flask backend" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# Tech Stack Recommendation

## Summary
**Recommended Stack:** [Primary recommendation]

## Detailed Breakdown

### Language/Runtime
| Option | Pros | Cons | Fit Score |
|--------|------|------|:---------:|
| [Option 1] | ... | ... | ⭐⭐⭐⭐⭐ |
| [Option 2] | ... | ... | ⭐⭐⭐⭐ |

**Recommendation:** [Choice] because [reason]

### Framework
| Option | Pros | Cons | Fit Score |
|--------|------|------|:---------:|
| [Option 1] | ... | ... | ⭐⭐⭐⭐⭐ |
| [Option 2] | ... | ... | ⭐⭐⭐⭐ |

**Recommendation:** [Choice] because [reason]

### Database
[Same table format]

### UI Framework (if applicable)
[Same table format]

### Build/Package Tool
[Same table format]

## Final Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Language | [Lang] | [Version] |
| Framework | [Framework] | [Version] |
| Database | [DB] | [Version] |
| UI | [UI Framework] | [Version] |
| Build | [Tool] | [Version] |

## Trade-offs Acknowledged
- [Trade-off 1]
- [Trade-off 2]

## Dependencies to Install
\`\`\`bash
[Installation commands]
\`\`\`
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Mỗi layer có ít nhất 2 options được so sánh
- [ ] Có reasoning rõ ràng cho mỗi choice
- [ ] Trade-offs được acknowledged
- [ ] Final stack consistent với requirements
- [ ] Có install commands

**Red flags (cần Reject):**

- ⚠️ Chọn tech chỉ vì "popular"
- ⚠️ Không có alternatives comparison
- ⚠️ Ignore constraints (như offline requirement)
- ⚠️ Stack quá phức tạp cho nhu cầu

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Over-engineering | Match complexity với requirements |
| Chọn vì trendy | Đánh giá dựa trên fit, không popularity |
| Ignore team skills | Factor team experience vào decision |
| Quên offline needs | Check offline requirement trước |
| Too many dependencies | Prefer fewer, well-maintained deps |

---

## 💡 Tips

1. **Match Complexity** — Simple app = Simple stack
2. **Team > Trend** — Stack team biết > Stack mới cool
3. **Fewer Dependencies** — Less is more
4. **LTS Versions** — Prefer stable over bleeding edge
5. **Check Offline** — Offline apps cần local storage

---

## 📊 Common Stack Patterns

### Desktop Apps (Cross-platform)

| Approach | Stack | Best for |
|----------|-------|----------|
| Native feel, small bundle | **Tauri** (Rust + Web) | Performance-critical |
| Easy development | **Electron** (JS) | Complex UI, web skills |
| Native UI | **Wails** (Go + Web) | Go developers |
| Python-based | **PyQt/PySide** | Data-heavy apps |

### CLI Tools

| Language | Framework | Best for |
|----------|-----------|----------|
| **Python** | Click, Typer | Rapid development |
| **Rust** | Clap | Performance, single binary |
| **Go** | Cobra | Cross-platform, fast |
| **Node.js** | Commander | JS ecosystem |

### Mobile Apps

| Approach | Stack | Best for |
|----------|-------|----------|
| Cross-platform | **React Native** | JS team, rapid dev |
| Cross-platform | **Flutter** | Beautiful UI, Dart |
| iOS native | **Swift** | iOS-only, performance |
| Android native | **Kotlin** | Android-only |

### Local Database

| Type | Technology | Best for |
|------|------------|----------|
| Embedded SQL | **SQLite** | Structured data |
| Key-Value | **LevelDB** | Simple storage |
| Document | **TinyDB** (Python) | JSON-like data |
| File-based | **JSON/YAML** | Config, small data |

---

## 📊 Ví dụ thực tế

### Input mẫu

```
App Name: StockFlow
App Type: Web + Desktop (kho)
Performance Priority: High
Development Speed: Medium
Team Experience: TypeScript, React, Node.js
Platform: Windows, macOS, Web
Data Storage: Central DB + local cache
Offline Required: Yes
Budget: Moderate
```

### Output mẫu

```markdown
# Tech Stack Recommendation

## Summary
- Backend: Node.js + NestJS
- Database: PostgreSQL
- Web UI: Next.js + Tailwind
- Desktop: Tauri + React
- Sync: Background job (BullMQ + Redis)

## Rationale
- TS stack đồng nhất → giảm learning curve
- PostgreSQL mạnh cho báo cáo tồn kho
- Tauri nhẹ, chạy ổn cho desktop kho

## Alternatives
- Electron: dễ dev hơn nhưng bundle lớn
- Django: team không quen Python
```

### Đánh giá

- ✅ Cân bằng performance và tốc độ dev
- ✅ Có lý do chọn/loại
- ✅ Phù hợp offline + cross-platform
- **Kết quả: ACCEPT**

## 🔗 Related Skills

- [App Requirements Spec](./01_app_requirements_spec.skill.md)
- [Architecture Design](./03_architecture_design.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.1.1 | 2026-02-07 | Domain refinement: metadata + flow alignment |
| 1.1.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi có Tech Stack → [Architecture Design](./03_architecture_design.skill.md)

---

*Tech Stack Selection Skill — CVF v1.5.2 Skill Library*
