# Đề Xuất Chính Thức: Chuẩn hóa GEF Config & Bootstrap Script cho Foundation Packages

Memory class: SUMMARY_RECORD
Status: **IMPLEMENTED (PARTIAL ADOPTION)** — Review phụ đã được hấp thụ; scope workspaces/CI vẫn deferred
Ngày tạo: 2026-04-07
Tham chiếu nguồn: `docs/reviews/CVF_FOUNDATION_STANDARDIZATION_PROPOSAL_ORIGINAL_2026-04-07.md`

---

## 0. Cập nhật thực thi

Proposal này đã được thực thi theo hướng **partial adoption**:

- ✅ Chuẩn hóa GEF `package.json`
- ✅ Làm cho `GEF npm run check` pass thật, không chỉ thêm script trên giấy
- ✅ Tạo `scripts/bootstrap_foundations.ps1`
- ✅ Tạo thêm `scripts/bootstrap_foundations.sh`
- ✅ Track `package-lock.json` cho 4 foundation packages
- ✅ Cập nhật `docs/reference/CVF_NEW_MACHINE_SETUP_CHECKLIST.md`
- ✅ Bổ sung pointer bootstrap tối thiểu vào `AGENT_HANDOFF.md`
- ✅ Thêm `New Machine Quick Start` vào front-door docs
- ❌ Không áp dụng root npm workspaces
- ❌ Không sửa CI trong wave này

Điều chỉnh quan trọng so với draft ban đầu:

- 4 foundation `package-lock.json` hiện đã được đưa vào repo để fresh clone có thể dùng `npm ci` nhất quán hơn
- với các extension khác, rule chung vẫn là:
  - `npm ci` khi package đã có `package-lock.json`
  - `npm install` khi package chưa có lockfile

---

## 1. Bối cảnh

### 1.1. Pain point xác nhận bởi người dùng

Khi chuyển qua máy tính khác làm việc, clone repo từ GitHub, sẽ bị thiếu các thư viện cần thiết vì:

- `node_modules/` bị `.gitignore` (đúng chuẩn)
- trước đây `EXTENSIONS/**/package-lock.json` cũng bị `.gitignore`, nên fresh clone thiếu deterministic install path
- Phải `cd` vào từng extension và biết package nào có lockfile, package nào không
- `AGENT_HANDOFF.md` mục Test Commands cũng yêu cầu `cd` vào từng package

### 1.2. Proposal gốc & điểm bất đồng

Proposal gốc (`CVF_FOUNDATION_STANDARDIZATION_PROPOSAL_ORIGINAL_2026-04-07.md`) đề xuất 3 giai đoạn:

| Giai đoạn | Nội dung | Kết luận |
|-----------|----------|----------|
| GĐ 1: NPM Workspaces ở root | Thêm `"workspaces"` vào root `package.json` | ❌ **DEFERRED** — xung đột với policy install-per-extension tại `CVF_NEW_MACHINE_SETUP_CHECKLIST.md` |
| GĐ 2: Chuẩn hóa GEF | Bổ sung scripts + deps cho GEF | ✅ **ADOPTED** |
| GĐ 3: CI + Docs | Sửa AGENT_HANDOFF, CI | ⏸️ **DEFERRED** — phụ thuộc GĐ 1 |

### 1.3. Giải pháp thay thế cho GĐ 1

Thay vì workspaces, tạo script bootstrap convenience ở root. Giữ nguyên install-per-extension policy.

---

## 2. Phạm vi thay đổi đề xuất

### Thay đổi A: Chuẩn hóa GEF `package.json`

**File**: `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/package.json`

**Hiện tại** (16 dòng, thiếu nhiều chuẩn):
```json
{
  "name": "cvf-governance-expansion-foundation",
  "version": "0.1.0",
  "description": "CVF W3-T1 Governance Expansion Foundation — coordination package for unconsolidated governance modules",
  "main": "src/index.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.6.0"
  }
}
```

**Đề xuất sửa thành**:
```json
{
  "name": "cvf-governance-expansion-foundation",
  "version": "0.1.0",
  "description": "CVF W3-T1 Governance Expansion Foundation — coordination package for unconsolidated governance modules",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "private": true,
  "scripts": {
    "test": "vitest run --config vitest.config.ts",
    "test:coverage": "vitest run --coverage --config vitest.config.ts",
    "test:watch": "vitest",
    "check": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@vitest/coverage-v8": "^1.6.1",
    "typescript": "^5.4.0",
    "vitest": "^1.6.1"
  }
}
```

**Chi tiết thay đổi**:

| Thuộc tính | Trước | Sau | Lý do |
|-----------|-------|-----|-------|
| `types` | ❌ thiếu | `"src/index.ts"` | Khớp CPF/EPF/LPF |
| `private` | ❌ thiếu | `true` | Khớp CPF/EPF/LPF, ngăn publish nhầm |
| `test` script | `vitest run` | `vitest run --config vitest.config.ts` | Chỉ định rõ config file, khớp chuẩn |
| `test:coverage` | ❌ thiếu | `vitest run --coverage --config vitest.config.ts` | Khớp CPF/EPF/LPF |
| `check` | ❌ thiếu | `tsc -p tsconfig.json --noEmit` | TypeScript validation, khớp chuẩn |
| `dependencies` | `{}` (rỗng) | ❌ xóa | Không cần key rỗng |
| `@types/node` | ❌ thiếu | `^22.0.0` | Khớp CPF/EPF/LPF |
| `@vitest/coverage-v8` | ❌ thiếu | `^1.6.1` | Coverage support, khớp chuẩn |
| `typescript` | `^5.0.0` | `^5.4.0` | Align version range với CPF/EPF/LPF |
| `vitest` | `^1.6.0` | `^1.6.1` | Align version range |

**Điều kiện tiên quyết**: Xác nhận GEF đã có `vitest.config.ts` và `tsconfig.json`. Nếu thiếu, phải tạo theo chuẩn CPF.

---

### Thay đổi B: Tạo Bootstrap Script

**File mới**: `scripts/bootstrap_foundations.ps1`

```powershell
#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Bootstrap all 4 CVF Foundation packages on a fresh clone.
.DESCRIPTION
    Installs dependencies in each foundation extension directory.

    When a local package-lock.json exists, use `npm ci`.
    If a package does not ship a lockfile, fall back to `npm install`.

    This is a convenience wrapper. The canonical install policy remains
    "install per extension only when needed" as documented in
    docs/reference/CVF_NEW_MACHINE_SETUP_CHECKLIST.md.
.EXAMPLE
    .\scripts\bootstrap_foundations.ps1
#>

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot
$foundations = @(
    "EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION",
    "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION",
    "EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION",
    "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION"
)

$failed = @()

foreach ($pkg in $foundations) {
    $fullPath = Join-Path $repoRoot $pkg
    $packageJsonPath = Join-Path $fullPath "package.json"
    $packageLockPath = Join-Path $fullPath "package-lock.json"

    if (-not (Test-Path -LiteralPath $packageJsonPath)) {
        Write-Host "SKIP: $pkg - no package.json found" -ForegroundColor Yellow
        continue
    }

    $installCommand = if (Test-Path -LiteralPath $packageLockPath) { "ci" } else { "install" }

    Write-Host ""
    Write-Host "=== Installing $pkg (npm $installCommand) ===" -ForegroundColor Cyan
    Push-Location $fullPath
    try {
        & npm $installCommand
        if ($LASTEXITCODE -ne 0) { throw "npm $installCommand failed" }
        Write-Host "OK: $pkg" -ForegroundColor Green
    }
    catch {
        Write-Host "FAIL: $pkg - $($_.Exception.Message)" -ForegroundColor Red
        $failed += $pkg
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "All 4 foundations bootstrapped successfully." -ForegroundColor Green
}
else {
    Write-Host "Failed packages: $($failed -join ', ')" -ForegroundColor Red
    exit 1
}
```

**Đặc điểm**:
- Không thay đổi install policy — chỉ là convenience wrapper
- Tự chọn `npm install` hay `npm ci` theo trạng thái lockfile local
- Error handling riêng cho từng package (1 fail không chặn 3 còn lại báo cáo)
- Tài liệu rõ ràng trong header (`.SYNOPSIS`, `.DESCRIPTION`)
- Tham chiếu ngược về `CVF_NEW_MACHINE_SETUP_CHECKLIST.md` để giữ policy alignment

---

### Thay đổi C: Cập nhật `CVF_NEW_MACHINE_SETUP_CHECKLIST.md`

Đã cập nhật checklist theo 3 ý:

- rule chung: package có `package-lock.json` thì dùng `npm ci`
- package chưa ship lockfile thì dùng `npm install`
- thêm mục tham chiếu tới bootstrap script trong phần §7 ("When Full Preinstall Is Reasonable")

```markdown
### Convenience Script

If you need all 4 foundations installed at once:

```powershell
.\scripts\bootstrap_foundations.ps1
```

This script uses `npm ci` when the package already has `package-lock.json`, otherwise `npm install`. The canonical install policy (per-extension) remains unchanged.
```

### Thay đổi D: Cập nhật `AGENT_HANDOFF.md`

Thêm mục `New Machine Minimum Bootstrap` ngay trước `Test Commands` để agent nhìn vào handoff là biết:

- đọc `docs/reference/CVF_NEW_MACHINE_SETUP_CHECKLIST.md`
- fresh clone một package thì ưu tiên `npm ci` nếu package đã ship `package-lock.json`
- cần đủ 4 foundation thì chạy `.\scripts\bootstrap_foundations.ps1` hoặc `./scripts/bootstrap_foundations.sh`

### Thay đổi E: Tạo bản shell script + front-door quick start

Đã bổ sung:

- `scripts/bootstrap_foundations.sh` cho Linux/macOS/container
- `README.md` mục `New Machine Quick Start`
- `START_HERE.md` mục `New Machine Quick Start`

### Thay đổi F: Track `package-lock.json` cho 4 foundation packages

Đã cập nhật `.gitignore` để unignore:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/package-lock.json`
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/package-lock.json`
- `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/package-lock.json`
- `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/package-lock.json`

Mục tiêu:

- fresh clone của public user có thể chạy `npm ci` ngay trên 4 foundations
- giảm ambiguity giữa `npm ci` và `npm install`
- làm cho bootstrap script và docs đồng nhất hơn với public onboarding

---

## 3. Các file bị ảnh hưởng

| File | Hành động | Loại thay đổi |
|------|-----------|---------------|
| `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/package.json` | MODIFY | Config standardization |
| `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/tsconfig.json` | MODIFY | Align compiler posture để `scripts.check` chạy được |
| `EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/src/*.ts` + `tests/*.test.ts` | MODIFY | Vá latent type/export mismatch để `npm run check` pass |
| `scripts/bootstrap_foundations.ps1` | NEW | Convenience script |
| `scripts/bootstrap_foundations.sh` | NEW | Shell convenience script |
| `.gitignore` | MODIFY | Unignore foundation lockfiles for public bootstrap stability |
| `EXTENSIONS/CVF_*FOUNDATION/package-lock.json` | NEW (tracked) | Deterministic installs for fresh clones |
| `docs/reference/CVF_NEW_MACHINE_SETUP_CHECKLIST.md` | MODIFY | Fresh-clone install guidance + bootstrap reference |
| `AGENT_HANDOFF.md` | MODIFY | Pointer bootstrap tối thiểu cho agent trên máy mới |
| `README.md` | MODIFY | Front-door quick start cho máy mới |
| `START_HERE.md` | MODIFY | Entry quick start cho máy mới |
| `docs/reviews/CVF_FOUNDATION_STANDARDIZATION_PROPOSAL_ORIGINAL_2026-04-07.md` | NEW (moved) | Bằng chứng proposal gốc |
| `docs/reviews/CVF_FOUNDATION_BOOTSTRAP_STANDARDIZATION_PROPOSAL_2026-04-07.md` | NEW | File này |

---

## 4. Verification Plan

### Sau khi thực thi Thay đổi A (GEF standardization):

```powershell
cd EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION
npm ci
npm run check    # phải pass — TypeScript validation
npm run test     # phải pass — 625 tests, 0 failures
```

### Sau khi thực thi Thay đổi B (Bootstrap script):

```powershell
# Xóa node_modules trong tất cả foundations trước
Remove-Item -Recurse -Force EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/node_modules
Remove-Item -Recurse -Force EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/node_modules
Remove-Item -Recurse -Force EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION/node_modules
Remove-Item -Recurse -Force EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/node_modules

# Chạy bootstrap
.\scripts\bootstrap_foundations.ps1

# Verify targeted gates
cd EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION && npm run check && npm run test
```

### Kết quả thực tế đã verify

- `cd EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION && npm install` — PASS
- `cd EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION && npm ci` — PASS
- `cd EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION && npm run check` — PASS
- `cd EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION && npm run test` — PASS (`625` tests, `0` failures)
- `.\scripts\bootstrap_foundations.ps1` — PASS cho cả 4 foundations
- `./scripts/bootstrap_foundations.sh` — đã tạo nhưng chưa verify runtime trong phiên này vì môi trường hiện tại không có `bash`
- lockfiles foundation hiện có mặt local và sẵn sàng được track bởi git sau khi bỏ ignore rule

---

## 5. Rủi ro & Mitigations

| Rủi ro | Mức | Mitigation |
|--------|-----|-----------|
| GEF chưa có `vitest.config.ts` | Trung bình | Kiểm tra trước khi sửa package.json; tạo nếu thiếu |
| GEF `tsc` fail do latent type/export mismatch | Trung bình | Đã vá và verify `npm run check` pass |
| Version bump nhỏ (vitest 1.6.0→1.6.1) gây break | Rất thấp | Semver compatible range |
| `bootstrap_foundations.sh` chưa được chạy thật trong session hiện tại | Trung bình | Đã tạo script shell; cần verify thêm trên môi trường có `sh` hoặc `bash` |
| Agent trên máy mới không nhìn thấy checklist | Trung bình | Đã thêm pointer trực tiếp vào `AGENT_HANDOFF.md` |

---

## 6. Trạng thái quyết định

- [x] **Agent reviewer xác nhận** phạm vi thay đổi hợp lý theo hướng partial adoption
- [x] **Xác nhận** GEF có `vitest.config.ts`
- [x] **Xác nhận** GEF có `tsconfig.json`
- [x] **Triển khai** root bootstrap script theo install-per-extension posture
- [x] **Cập nhật** checklist canonical cho fresh clone behavior
- [x] **Bổ sung** handoff pointer để agent mới biết minimum bootstrap

## 7. Cần làm gì tiếp để đạt mục tiêu tốt nhất

Để mục tiêu "clone từ GitHub xuống xong agent biết cài gì là đủ dùng" đạt trạng thái tốt nhất, phần còn lại nên làm theo thứ tự sau:

1. **Khuyến nghị cao còn lại**: verify `scripts/bootstrap_foundations.sh` trên môi trường có `bash`
   - Lý do: file đã có nhưng chưa được chạy thật trong session Windows hiện tại

2. **Khuyến nghị vừa**: thêm 1 lệnh focused smoke trong handoff cho từng foundation
   - Ví dụ: `npm run check` rồi `npm test` cho package đang chạm tới
   - Tác dụng: agent không chỉ cài xong mà còn tự biết cách verify package local đã usable

3. **Khuyến nghị vừa**: quyết định xem có mở rộng policy track lockfile sang extension nào khác ngoài 4 foundations hay không
   - hiện tại 4 foundations đã là public-friendly path chính
   - các extension khác vẫn có thể giữ rule `có lockfile thì npm ci, không có lockfile thì npm install`

---

*Proposal này đã được thực thi theo hướng partial adoption. Workspaces và CI vẫn intentionally deferred.*
