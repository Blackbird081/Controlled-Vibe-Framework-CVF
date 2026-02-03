# Tech Stack Selection

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium  
> **CVF Version:** v1.5.2  
> **Phase:** Design (Phase B)

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

### Input mẫu:
```
App Type: Desktop app
Performance Priority: Medium
Development Speed: High
Team Experience: Python, JavaScript
Platform: Windows, macOS
Data Storage: Local database
Offline Required: Yes
Bundle Size: < 100MB preferred
```

### Output mẫu:
```markdown
# Tech Stack Recommendation

## Summary
**Recommended Stack:** Tauri + Vue 3 + SQLite

## Language/Runtime
| Option | Pros | Cons | Fit Score |
|--------|------|------|:---------:|
| Tauri (Rust+JS) | Small bundle, fast, cross-platform | Learning curve | ⭐⭐⭐⭐⭐ |
| Electron (JS) | Easy dev, rich ecosystem | Large bundle (~150MB) | ⭐⭐⭐⭐ |
| PyQt (Python) | Python familiar | Bundle size, packaging | ⭐⭐⭐ |

**Recommendation:** Tauri — Team knows JS, bundle size matters

## UI Framework
| Option | Pros | Cons | Fit Score |
|--------|------|------|:---------:|
| Vue 3 | Simple, fast to learn | Smaller ecosystem | ⭐⭐⭐⭐⭐ |
| React | Large ecosystem | More complex | ⭐⭐⭐⭐ |
| Svelte | Minimal bundle | Less resources | ⭐⭐⭐⭐ |

**Recommendation:** Vue 3 — Simple, team can learn fast

## Database
| Option | Pros | Cons | Fit Score |
|--------|------|------|:---------:|
| SQLite | Robust, SQL, zero config | Embedded only | ⭐⭐⭐⭐⭐ |
| IndexedDB | Browser-native | Limited queries | ⭐⭐⭐ |

**Recommendation:** SQLite — Robust, offline-first

## Final Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Tauri | v2.0 |
| Backend | Rust | 1.75 |
| Frontend | Vue 3 | 3.4 |
| Styling | Tailwind | 3.4 |
| Database | SQLite | 3.45 |
| Build | Vite | 5.0 |

## Trade-offs
- Learning curve for Rust (mitigated: minimal Rust needed)
- Vue smaller ecosystem vs React (acceptable for this scope)

## Setup Commands
\`\`\`bash
npm create tauri-app@latest my-app -- --template vue
cd my-app
npm install
npm run tauri dev
\`\`\`
```

### Đánh giá:
- ✅ Multiple options compared
- ✅ Clear reasoning
- ✅ Trade-offs acknowledged
- ✅ Matches requirements
- **Kết quả: ACCEPT ✅**

---

## 🔗 Next Step

Sau khi có Tech Stack → [Architecture Design](./03_architecture_design.skill.md)

---

*Tech Stack Selection Skill — CVF v1.5.2 Skill Library*
