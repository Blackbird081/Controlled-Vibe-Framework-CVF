# Local Deployment Spec

> **Domain:** App Development  
> **Difficulty:** ⭐⭐ Medium — [Xem criteria](../DIFFICULTY_GUIDE.md)  
> **CVF Version:** v1.5.2  
> **Skill Version:** 1.1.1  
> **Last Updated:** 2026-02-07

---

## 📌 Prerequisites

> Hoàn thành app development workflow trước khi dùng skill này:
> - App đã build và test xong
> - [Desktop App Spec](./06_desktop_app_spec.skill.md) hoặc [CLI Tool Spec](./07_cli_tool_spec.skill.md)

---

## 🎯 Mục đích

**Khi nào dùng skill này:**
- App đã build xong, cần đóng gói để distribute
- Cần tạo installer cho users
- Cần packaging cho different platforms

**Không phù hợp khi:**
- Still in development phase
- Cloud deployment (khác bài)
- Internal tool không cần distribute

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

- UAT Record: [08_local_deployment](../../../governance/skill-library/uat/results/UAT-08_local_deployment.md)
- UAT Objective: Skill phải đạt chuẩn output theo CVF + không vượt quyền

---
## 📋 Form Input

| Field | Mô tả | Bắt buộc | Ví dụ |
|-------|-------|:--------:|-------|
| **App Name** | Tên app | ✅ | "TaskFlow" |
| **App Type** | Desktop / CLI / Service | ✅ | "Desktop (Tauri)" |
| **Target Platforms** | Platforms cần hỗ trợ | ✅ | "Windows, macOS, Linux" |
| **Distribution Method** | Cách distribute? | ✅ | "GitHub Releases / Website" |
| **Auto-Update** | Cần tự update? | ❌ | "Yes / No" |
| **Signing Required** | Cần code signing? | ❌ | "Yes (for macOS notarization)" |
| **Install Location** | Cài ở đâu? | ❌ | "Standard app location" |
| **Uninstaller** | Cần uninstaller? | ❌ | "Yes with data cleanup option" |
| **Dependencies** | Runtime dependencies? | ❌ | "None / .NET / Python" |

---

## ✅ Expected Output

**Kết quả bạn sẽ nhận được:**

```markdown
# Deployment Specification

## Build Artifacts

| Platform | Format | Size (approx) |
|----------|--------|---------------|
| Windows | .exe, .msi | XX MB |
| macOS | .dmg, .app | XX MB |
| Linux | .AppImage, .deb | XX MB |

## Build Process

### Prerequisites
- [List required tools]

### Build Commands
\`\`\`bash
# Windows
[command]

# macOS
[command]

# Linux
[command]
\`\`\`

## Installer Configuration

### Windows
- Installer type: NSIS / MSI
- Install path: %LOCALAPPDATA%/AppName
- Shortcuts: Desktop, Start Menu
- Uninstaller: Yes

### macOS
- Format: .dmg with .app
- Signing: Developer ID
- Notarization: Required
- Location: /Applications

### Linux
- Formats: .AppImage (universal), .deb (Debian)
- Location: /opt or ~/.local

## Auto-Update Strategy
[If applicable]

## Code Signing

| Platform | Certificate Type |
|----------|-----------------|
| Windows | Code Signing Cert |
| macOS | Developer ID + Notarization |

## Distribution

### GitHub Releases
- Create release with tag
- Attach all platform binaries
- Update changelog

### Website
- Download links
- SHA256 checksums
- Version history
```

---

## 🔍 Cách đánh giá

**Checklist Accept/Reject:**

- [ ] All platforms covered
- [ ] Build commands documented
- [ ] Installer config complete
- [ ] Distribution method clear
- [ ] Signing requirements noted

**Red flags (cần Reject):**
- ⚠️ Missing platform
- ⚠️ No build commands
- ⚠️ Unsigned for production
- ⚠️ No uninstall plan

---

## ⚠️ Common Failures

| Lỗi thường gặp | Cách phòng tránh |
|----------------|------------------|
| Large bundle size | Analyze và optimize |
| Missing runtime | Bundle dependencies hoặc document |
| No uninstaller | Always provide clean uninstall |
| Unsigned app | Users will see warnings |
| No auto-update | V2 is hard to push |

---

## 💡 Tips

1. **Bundle Size Matters** — Users care about download size
2. **Sign Everything** — Avoid "unknown developer" warnings
3. **Test Fresh Install** — On clean VMs
4. **Checksums** — Provide SHA256 for downloads
5. **Auto-Update Early** — Implement from v1

---

## 📊 Ví dụ thực tế

### Input mẫu:
```
App Name: TaskFlow
App Type: Desktop (Tauri)
Platforms: Windows, macOS, Linux
Distribution: GitHub Releases
Auto-Update: Yes (Tauri built-in)
Signing: Yes (Windows, macOS)
Dependencies: None (single binary)
```

### Output mẫu:
```markdown
# TaskFlow - Deployment Specification

## Build Artifacts

| Platform | Format | Size | Notes |
|----------|--------|------|-------|
| Windows | TaskFlow_x64.msi | ~8 MB | Installer |
| Windows | TaskFlow_x64.exe | ~7 MB | Portable |
| macOS | TaskFlow.dmg | ~12 MB | Universal (Intel+ARM) |
| macOS | TaskFlow.app.tar.gz | ~11 MB | For auto-update |
| Linux | TaskFlow.AppImage | ~15 MB | Universal |
| Linux | taskflow_amd64.deb | ~10 MB | Debian/Ubuntu |

## Build Environment

### Prerequisites
\`\`\`bash
# All platforms
rustc >= 1.70
node >= 18
npm >= 9

# Windows
- Visual Studio Build Tools 2022
- WiX Toolset (for .msi)

# macOS
- Xcode Command Line Tools
- create-dmg

# Linux
- build-essential
- libwebkit2gtk-4.1-dev
\`\`\`

## Build Commands

### Development Build
\`\`\`bash
npm run tauri dev
\`\`\`

### Production Build

**Windows:**
\`\`\`bash
npm run tauri build
# Output: src-tauri/target/release/bundle/msi/TaskFlow_x64.msi
\`\`\`

**macOS:**
\`\`\`bash
npm run tauri build -- --target universal-apple-darwin
# Output: src-tauri/target/universal-apple-darwin/release/bundle/dmg/
\`\`\`

**Linux:**
\`\`\`bash
npm run tauri build
# Output: src-tauri/target/release/bundle/appimage/
# Output: src-tauri/target/release/bundle/deb/
\`\`\`

## CI/CD (GitHub Actions)

\`\`\`yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: windows-latest
            target: x86_64-pc-windows-msvc
          - os: macos-latest
            target: universal-apple-darwin
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu

    runs-on: \${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: actions/setup-node@v4
      
      - name: Build
        run: npm run tauri build
        
      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
\`\`\`

## Installer Configuration

### Windows MSI
\`\`\`json
// tauri.conf.json
{
  "bundle": {
    "windows": {
      "wix": {
        "language": "en-US",
        "template": null,
        "upgradeCode": "YOUR-GUID-HERE"
      }
    }
  }
}
\`\`\`

**Install Behavior:**
- Location: C:\Program Files\TaskFlow
- Start Menu: TaskFlow
- Desktop shortcut: Optional (checked by default)
- Uninstaller: Add/Remove Programs

### macOS DMG
\`\`\`json
{
  "bundle": {
    "macOS": {
      "minimumSystemVersion": "10.15",
      "exceptionDomain": null,
      "signingIdentity": "Developer ID Application: Your Name",
      "entitlements": "entitlements.plist"
    }
  }
}
\`\`\`

**Install Experience:**
1. User downloads .dmg
2. Opens, drags to Applications
3. First launch: Gatekeeper check passes
4. App runs normally

### Linux AppImage
- Self-contained, no install needed
- User downloads, chmod +x, run
- Optional: AppImageLauncher integration

### Linux DEB
\`\`\`
Package: taskflow
Version: 1.0.0
Section: utils
Architecture: amd64
Depends: libwebkit2gtk-4.1-0
Maintainer: Your Name <email>
Description: Task management from your desktop
\`\`\`

## Code Signing

### Windows
1. Obtain EV Code Signing Certificate
2. Configure in tauri.conf.json:
\`\`\`json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_THUMBPRINT"
    }
  }
}
\`\`\`

### macOS
1. Apple Developer Program ($99/year)
2. Create Developer ID certificate
3. Enable Hardened Runtime
4. Notarize:
\`\`\`bash
xcrun notarytool submit TaskFlow.dmg \\
  --apple-id your@email.com \\
  --team-id TEAM_ID \\
  --password @keychain:AC_PASSWORD
\`\`\`

## Auto-Update

### Configuration
\`\`\`json
// tauri.conf.json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/yourname/taskflow/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
\`\`\`

### Update Flow
1. App checks endpoint on launch
2. If new version → prompt user
3. Download in background
4. Restart to apply

### Update Server Response (latest.json)
\`\`\`json
{
  "version": "1.1.0",
  "notes": "Bug fixes and improvements",
  "pub_date": "2024-02-01T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/.../TaskFlow_1.1.0_x64.msi.zip",
      "signature": "..."
    },
    "darwin-universal": {
      "url": "https://github.com/.../TaskFlow.app.tar.gz",
      "signature": "..."
    },
    "linux-x86_64": {
      "url": "https://github.com/.../TaskFlow_1.1.0.AppImage.tar.gz",
      "signature": "..."
    }
  }
}
\`\`\`

## Distribution (GitHub Releases)

### Release Checklist
- [ ] Update version in package.json, Cargo.toml
- [ ] Update CHANGELOG.md
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] CI builds and uploads
- [ ] Verify all artifacts
- [ ] Update latest.json for auto-update
- [ ] Announce release

### Release Assets
\`\`\`
TaskFlow_1.0.0_x64.msi
TaskFlow_1.0.0_x64.exe (portable)
TaskFlow_1.0.0_universal.dmg
TaskFlow_1.0.0.AppImage
taskflow_1.0.0_amd64.deb
SHA256SUMS.txt
latest.json
\`\`\`

### SHA256 Checksums
\`\`\`bash
sha256sum TaskFlow_* > SHA256SUMS.txt
\`\`\`

## Testing Checklist

- [ ] Fresh Windows install (clean VM)
- [ ] Fresh macOS install (clean VM)
- [ ] Ubuntu 22.04 LTS
- [ ] Upgrade from previous version
- [ ] Uninstall cleans up properly
- [ ] Auto-update works
```

### Đánh giá:
- ✅ All platforms covered
- ✅ Build commands documented
- ✅ CI/CD included
- ✅ Signing documented
- **Kết quả: ACCEPT ✅**


## 🔗 Related Skills
- [Desktop App Spec](./06_desktop_app_spec.skill.md)
- [CLI Tool Spec](./07_cli_tool_spec.skill.md)

## 📜 Version History

| Version | Date | Changes |
|---|---|---|
| 1.1.1 | 2026-02-07 | Domain refinement: metadata + flow alignment |
| 1.1.0 | 2026-02-07 | Initial standardized metadata + example/related sections |

## 🔗 Next Step

Sau khi hoàn thành **Local Deployment Spec**, chuyển sang Build & Release:
- Test trên tất cả target platforms
- Code signing configured
- Auto-update working (nếu có)
- Distribution channel ready


---

*Local Deployment Spec Skill — CVF v1.5.2 Skill Library*