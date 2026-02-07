# Desktop App Spec

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.1.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành các skills sau trước khi dùng skill này:
> - [Tech Stack Selection](./02_tech_stack_selection.skill.md) — Cần biết framework sẽ dùng
> - [Architecture Design](./03_architecture_design.skill.md) — Cần hiểu cấu trúc app

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- Xây dựng desktop application (Windows/macOS/Linux)
- Dùng Electron, Tauri, hoặc native frameworks
- Cần define windowing, menus, shortcuts

**Không phù hợp khi:**
- Web app only
- CLI tool → Dùng [CLI Tool Spec](./07_cli_tool_spec.skill.md)
- Mobile app

---

## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **App Name** | Tên app | ✅ | "TaskFlow Desktop" |
| **Framework** | Tech framework | ✅ | "Electron / Tauri / PyQt" |
| **Target Platforms** | Chạy trên đâu? | ✅ | "Windows, macOS, Linux" |
| **Window Type** | Single/Multi window? | ✅ | "Single window / Multi-window" |
| **Default Size** | Kích thước mặc định | ✅ | "1024x768" |
| **Menu Bar** | Cần menu? | ✅ | "Yes - File, Edit, View, Help" |
| **System Tray** | Cần tray icon? | ❌ | "Yes - with quick actions" |
| **Keyboard Shortcuts** | Hotkeys chính | ❌ | "Ctrl+N new, Ctrl+S save" |
| **Native Features** | Cần native APIs? | ❌ | "Notifications, File dialogs" |
| **Startup Behavior** | Launch on boot? | ❌ | "Optional in settings" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# Desktop App Specification

## App Identity
- **Name:** [App Name]
- **Bundle ID:** com.company.appname
- **Version:** 1.0.0

## Window Configuration

### Main Window
- **Size:** [width] x [height]
- **Min Size:** [min width] x [min height]
- **Resizable:** Yes/No
- **Title Bar:** Native / Custom
- **Frame:** Standard / Frameless

## Menu Structure

\`\`\`
┌─ File ──────────────────────────────┐
│  New                    Ctrl+N      │
│  Open...                Ctrl+O      │
│  ─────────────────────────────      │
│  Save                   Ctrl+S      │
│  Export...              Ctrl+E      │
│  ─────────────────────────────      │
│  Exit                   Alt+F4      │
└─────────────────────────────────────┘

┌─ Edit ──────────────────────────────┐
│  Undo                   Ctrl+Z      │
│  Redo                   Ctrl+Y      │
│  ─────────────────────────────      │
│  Cut                    Ctrl+X      │
│  Copy                   Ctrl+C      │
│  Paste                  Ctrl+V      │
└─────────────────────────────────────┘

[More menus...]
\`\`\`

## System Tray
- **Icon:** [description]
- **Tooltip:** [text]
- **Context Menu:**
  - Show/Hide Window
  - [Quick actions]
  - Quit

## Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| New | Ctrl+N | Cmd+N |
| Save | Ctrl+S | Cmd+S |
| [etc.] | ... | ... |

## Native Features
- [ ] File dialogs
- [ ] Notifications
- [ ] Clipboard
- [ ] Auto-update

## Platform-Specific Behavior

### Windows
- Installer: NSIS / MSI
- Location: %LOCALAPPDATA%

### macOS
- Format: .dmg / .app
- Location: /Applications

### Linux
- Formats: .AppImage, .deb
- Location: /opt or ~/.local

## Startup & Lifecycle
- **First Launch:** [What happens]
- **Subsequent:** [What happens]
- **Minimize:** To tray / taskbar
- **Close:** Exit / Minimize to tray
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] Window config đầy đủ
- [ ] Menu structure defined
- [ ] Shortcuts documented
- [ ] Platform-specific noted
- [ ] Lifecycle behavior clear

**Red flags (cần Reject):**
- ⚠️ No menu structure
- ⚠️ Missing shortcuts
- ⚠️ Platform behavior ignored
- ⚠️ Window config vague

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Forgot min size | Always set minWidth/minHeight |
| No tray behavior | Define close vs minimize |
| Platform inconsistency | Test on all target platforms |
| Missing Cmd key | Remap Ctrl to Cmd on macOS |
| No auto-update | Plan update mechanism |

---

## 💡 Tips

1. **Min Size Matters** — Prevent layout breaks
2. **Tray is Optional** — Don't force it
3. **Follow Platform Conventions** — Cmd on Mac, Ctrl on Windows
4. **Graceful Close** — Save state before exit
5. **First Launch UX** — Onboarding matters

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
App Name: StockFlow Warehouse
Platforms: Windows 10+, macOS
Primary Users: Warehouse staff
Offline Required: Yes
Devices: USB barcode scanner
```

### Output mẫu:
```markdown
# Desktop App Spec

## Core Screens
- Login
- Scan In/Out
- Inventory Lookup
- Sync Status

## UX Flow
- Mặc định focus ô scan
- Khi offline: lưu local, hiển thị banner
- Sync tự động mỗi 5 phút

## Non-Functional
- Launch < 3s
- Hoạt động ổn định với 5.000 sản phẩm
```

### Đánh giá:
- ✅ Flow rõ cho warehouse
- ✅ Có offline + sync
- ✅ Nêu performance mục tiêu
- **Kết quả: ACCEPT**

## 🔗 Related Skills
- [API Design Spec](./05_api_design_spec.skill.md)
- [CLI Tool Spec](./07_cli_tool_spec.skill.md)
- [Local Deployment Spec](./08_local_deployment.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.1.1 | 2026-02-07 | Domain refinement: metadata + flow alignment |
| 1.1.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi có Desktop Spec → [Local Deployment Spec](./08_local_deployment.skill.md) (nếu cần đóng gói) hoặc → Build Phase (Phase C)


---

*Desktop App Spec Skill — CVF v1.5.2 Skill Library*
