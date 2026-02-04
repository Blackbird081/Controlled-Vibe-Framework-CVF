# Desktop App Spec

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.1.0  
> **Last Updated:** 2026-02-04

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
App Name: TaskFlow Desktop
Framework: Tauri
Platforms: Windows, macOS
Window: Single, 1024x768, resizable
Menu: File (New, Save, Exit), Edit (standard), Help (About)
Tray: Yes - quick add task
Shortcuts: Ctrl+N new, Ctrl+S save, Ctrl+Q quit
Native: Notifications, File dialog
Startup: No auto-start
```

### Output mẫu:
```markdown
# TaskFlow Desktop Specification

## App Identity
- **Name:** TaskFlow
- **Bundle ID:** com.taskflow.desktop
- **Version:** 1.0.0
- **Framework:** Tauri 2.0

## Window Configuration

### Main Window
| Property | Value |
|----------|-------|
| Default Size | 1024 x 768 |
| Min Size | 800 x 600 |
| Max Size | None (unlimited) |
| Resizable | Yes |
| Title Bar | Native |
| Always on Top | No (optional in settings) |

### Window State Persistence
- Remember last position and size
- Save on close, restore on launch

## Menu Structure

\`\`\`
┌─ File ──────────────────────────────┐
│  📝 New Task              Ctrl+N    │
│  ─────────────────────────────      │
│  💾 Save                  Ctrl+S    │
│  📤 Export...             Ctrl+E    │
│  ─────────────────────────────      │
│  ⚙️  Settings...          Ctrl+,    │
│  ─────────────────────────────      │
│  🚪 Exit                  Ctrl+Q    │
└─────────────────────────────────────┘

┌─ Edit ──────────────────────────────┐
│  ↩️  Undo                 Ctrl+Z    │
│  ↪️  Redo                 Ctrl+Y    │
│  ─────────────────────────────      │
│  ✂️  Cut                  Ctrl+X    │
│  📋 Copy                  Ctrl+C    │
│  📥 Paste                 Ctrl+V    │
│  ─────────────────────────────      │
│  🔍 Find                  Ctrl+F    │
└─────────────────────────────────────┘

┌─ View ──────────────────────────────┐
│  📋 All Tasks                       │
│  ⏳ Pending                         │
│  ✅ Completed                       │
│  ─────────────────────────────      │
│  🔄 Refresh               F5        │
│  ─────────────────────────────      │
│  🌙 Dark Mode             Ctrl+D    │
└─────────────────────────────────────┘

┌─ Help ──────────────────────────────┐
│  📚 Documentation         F1        │
│  🐛 Report Bug                      │
│  ─────────────────────────────      │
│  ℹ️  About TaskFlow                 │
└─────────────────────────────────────┘
\`\`\`

## System Tray

| Property | Value |
|----------|-------|
| Icon | TaskFlow logo (16x16, 32x32) |
| Tooltip | "TaskFlow - X pending tasks" |

**Context Menu:**
\`\`\`
┌────────────────────────────────┐
│  ➕ Quick Add Task              │
│  ─────────────────────────      │
│  📋 Show TaskFlow               │
│  🙈 Hide TaskFlow               │
│  ─────────────────────────      │
│  🚪 Quit                        │
└────────────────────────────────┘
\`\`\`

**Tray Click Behavior:**
- Left click: Show/focus window
- Right click: Context menu

## Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|---------------|-------|
| New Task | Ctrl+N | Cmd+N |
| Save | Ctrl+S | Cmd+S |
| Find | Ctrl+F | Cmd+F |
| Settings | Ctrl+, | Cmd+, |
| Quit | Ctrl+Q | Cmd+Q |
| Toggle Dark Mode | Ctrl+D | Cmd+D |
| Refresh | F5 | Cmd+R |

**Global Hotkey:**
- Ctrl+Shift+T: Quick add task from anywhere

## Native Features

### Notifications
- Task due reminders
- Permission: Request on first task with due date

### File Dialogs
- Export tasks (JSON, CSV)
- Native save dialog

### Clipboard
- Copy task title/details
- Paste content into task

### Auto-Update
- Check on launch (silent)
- Prompt before install
- Background download

## Platform-Specific

### Windows
| Property | Value |
|----------|-------|
| Installer | NSIS |
| Install Location | %LOCALAPPDATA%/TaskFlow |
| Data Location | %APPDATA%/TaskFlow |
| Registry | HKCU\Software\TaskFlow |
| Autostart | Registry entry (optional) |

### macOS
| Property | Value |
|----------|-------|
| Format | .dmg with .app |
| Install Location | /Applications |
| Data Location | ~/Library/Application Support/TaskFlow |
| Autostart | Login Items (optional) |

## Application Lifecycle

### First Launch
1. Show onboarding (3 slides)
2. Request notification permission
3. Create default category

### Normal Launch
1. Check for updates (background)
2. Load data from local DB
3. Restore window state
4. Ready

### Close Behavior
- X button: Minimize to tray
- Ctrl+Q / Quit: Actually quit

### Data Persistence
- Auto-save on every change
- Backup to .bak every 24h
```

### Đánh giá:
- ✅ Window config complete
- ✅ Menu structure detailed
- ✅ Shortcuts with Mac variants
- ✅ Platform behavior defined
- **Kết quả: ACCEPT ✅**

---

## 🔗 Next Step

Sau khi có Desktop Spec → Build Phase (Phase C)

---

*Desktop App Spec Skill — CVF v1.5.2 Skill Library*
