# Asset & License Audit - Mini Game

**Ngay audit:** 2026-02-26  
**Pham vi:** `Mini_Game/` + `Mini_Game/webapp/package-lock.json`

---

## 1) Dependency license check

### Runtime dependencies
| Package | License | Status |
|---|---|---|
| next | MIT | OK |
| react | MIT | OK |
| react-dom | MIT | OK |
| phaser | MIT | OK |
| zustand | MIT | OK |

### Dev dependencies (chinh)
| Package | License | Status |
|---|---|---|
| typescript | Apache-2.0 | OK |
| playwright | Apache-2.0 | OK |
| vitest | MIT | OK |
| eslint / eslint-config-next | MIT | OK |
| tailwindcss | MIT | OK |

## 2) Media asset audit

| Asset | Path | License Source | Status | Note |
|---|---|---|---|---|
| background.jpg | `Mini_Game/legacy/streamlit_assets/background.jpg` | Legacy-only | EXCLUDED | Khong dung trong webapp release package |
| win.mp3 | `Mini_Game/legacy/streamlit_assets/win.mp3` | Legacy-only | EXCLUDED | Khong dung trong webapp release package |
| favicon.ico | `Mini_Game/webapp/src/app/favicon.ico` | Tu scaffold | OK | Scaffold file |

## 3) Ket luan audit

- Dependency licenses: **PASS** (khong thay xung dot chinh voi scope du an).
- Media assets cho webapp release: **PASS** (2 file legacy da duoc tach va exclude).

## 4) Dieu kien de public release

Truoc khi cong bo cho nguoi dung cuoi:
- [x] Tach asset legacy khoi release scope.
- [x] Xac nhan webapp khong phu thuoc 2 asset legacy.
- [ ] Neu muon giu Streamlit lau dai: bo sung attribution license rieng cho asset legacy.
