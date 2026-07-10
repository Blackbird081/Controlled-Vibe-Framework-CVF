# Huong Dan Phan Loai Va Su Dung CVF Workspace

Status: ACTIVE_GUIDE

Date: 2026-07-10

Memory class: ACTIVE_REFERENCE

## Purpose

Tai lieu nay giup operator, agent va nguoi dung downstream tra loi bon cau hoi
truoc khi lam viec trong mot CVF Workspace:

1. Workspace nay danh cho ai?
2. Profile nao duoc phep cai?
3. Workspace dang khoe, can cap nhat, bi drift hay can sua?
4. Project ben trong la project moi, project da adopt hay project legacy-exempt?

Phan loai dung giup CVF dua dung rules va guards vao dung noi ma khong copy
toan bo provenance repository, private history hoac governance ceremony khong
can thiet vao moi project.

## Scope / Applies To

Ap dung cho Windows CVF Workspace, public distribution profiles, private
operator rule-pack selection va cac downstream project nam trong workspace.
Tai lieu nay khong phan loai provenance repository nhu mot downstream project.

## Owner And Source

Owner: CVF Workspace productization lane.

Nguon dieu khien la profile tiers, workspace distribution manifest va cac
PowerShell command surfaces duoc liet ke trong `## Related Artifacts`.

## Requirements And Protocol

Phan loai workspace theo cac muc 1-4 truoc khi dung quy trinh cai dat, cap
nhat, repair hoac project onboarding tai cac muc sau.

## 1. Mo Hinh Ba Lop

CVF Workspace khong phai la mot repository ung dung. No la container local gom:

```text
CVF-Workspace/
  .Controlled-Vibe-Framework-CVF/   # hidden public core
  CVF_RULE_PACKS/                   # profile da materialize
  <Project-A>/                      # downstream project rieng
  <Project-B>/
  WORKSPACE_RULES.md
  CVF_WORKSPACE_MEMORY.md
  AGENT_HANDOFF.md
  Manage-CVF-Workspace.ps1
  New-CVF-Governed-Project.ps1
  Run-CVF-NewProject-Enforcement.ps1
```

Ba lop phai duoc giu tach biet:

| Lop | Vai tro | Duoc chua | Khong duoc chua |
|---|---|---|---|
| Provenance repository | Nguon noi bo day du cua CVF | internal evidence, session state, private source mirrors, full governance | code ung dung downstream |
| Hidden public core | Nguon public-safe cho workspace | installer, public rules, public profiles, project bootstrap | private provenance state, credentials |
| Downstream projects | Noi lam san pham | source, tests, project `AGENTS.md`, `.cvf/`, project handoff | thay doi CVF core truc tiep |

## 2. Truc Phan Loai A: Profile Theo Nguoi Dung

### `public-free`

Chon khi:

- workspace chi can public core va bo huong dan gon;
- du an public, thu nghiem hoac free-user;
- khong can private operator history;
- uu tien chi phi governance thap.

Profile nay co workspace rules, boundary guidance, memory va handoff template
public-safe. Cac template la file local rong/an toan, khong phai ban sao private
session state.

### `paid-user-safe`

Chon khi:

- workspace danh cho paid user hoac team downstream;
- can them authoring guidance va repository-boundary reference;
- workspace co the duoc chia se cho nguoi khac;
- khong duoc phep mang theo private operator continuity.

Day la profile mac dinh de productize cho customer. Khong truyen
`-AllowProvenanceContinuity` khi cai hoac cap nhat profile nay.

### `operator-local`

Chon khi:

- workspace nam tren may rieng cua operator;
- operator can continuity day du giua Codex, Claude hoac agent khac;
- can dung `CVF_WORKSPACE_MEMORY.md`, `AGENT_HANDOFF.md` va bo reference local
  da chon loc;
- workspace khong duoc export nguyen trang cho public hoac customer.

Profile nay chi co trong provenance-side rule-pack flow va can flag chap thuan
ro rang. Public installer khong cung cap profile nay.

Lenh chon profile tren may operator:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Update-CVF-Workspace-RulePack.ps1" `
  -ProfileName "operator-local" `
  -AllowProvenanceContinuity
```

### Cay Quyet Dinh Nhanh

```text
Workspace co the chia se public/customer?
  |
  +-- Co --> Can authoring + boundary mo rong?
  |           +-- Khong --> public-free
  |           +-- Co ----> paid-user-safe
  |
  +-- Khong --> Co can private operator continuity?
              +-- Khong --> paid-user-safe
              +-- Co ----> operator-local
```

Khong chon profile theo tieu chi "profile nao nhieu file nhat". Chon profile
nho nhat van bao ve duoc risk va boundary cua workspace.

## 3. Truc Phan Loai B: Tinh Trang Ky Thuat

Public distribution status tra ve mot trong bon verdict:

| Verdict | Y nghia | Hanh dong |
|---|---|---|
| `CURRENT` | Core, root artifacts va active public profile dong bo | Tiep tuc lam viec |
| `UPDATE_AVAILABLE` | Public `main` co revision moi | Chay update, sau do test lai |
| `DRIFTED` | Profile version, source commit hoac artifact hash khong khop | Update neu core cu; repair neu root/profile bi drift |
| `REPAIR_REQUIRED` | Thieu core, sai remote, thieu artifact hoac manifest hong | Dung project work va chay repair/diagnostic |

Kiem tra local, khong goi remote:

```powershell
.\Manage-CVF-Workspace.ps1 -Action Status
```

Kiem tra co doi chieu public `origin/main`:

```powershell
.\Manage-CVF-Workspace.ps1 -Action Status -CheckRemote
```

Lay JSON de agent hoac automation doc:

```powershell
.\Manage-CVF-Workspace.ps1 -Action Status -CheckRemote -Json
```

Luu y: command surface tren chi quan ly public distribution profiles
`public-free` va `paid-user-safe`. Workspace dang dung `operator-local` phai
kiem tra active rule-pack manifest va cap nhat qua provenance-side wrapper;
khong ep public repair flow xu ly private operator profile.

## 4. Truc Phan Loai C: Trang Thai Project

### Project moi

Project chua ton tai trong workspace. Tao moi:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<project-name>"
```

Hoac clone repo co san vao mot project moi:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<project-name>" `
  -ProjectRepo "<git-url>"
```

### Project da adopt

Project cu da duoc bootstrap/refresh, project doctor pass va khong con nam trong
`WORKSPACE_PROJECT_ENFORCEMENT_BASELINE.json`. Project nay phai vuot workspace
enforcement gate nhu project moi.

### Project legacy-exempt

Project co san tu truoc va dang duoc operator cho phep tam thoi nam trong
baseline. Exemption khong co nghia project da governed day du.

Adopt project legacy vao enforcement hien tai:

```powershell
powershell -ExecutionPolicy Bypass -File ".\New-CVF-Governed-Project.ps1" `
  -ProjectName "<existing-project>"
```

Chi dung `-KeepLegacyExemption` khi operator co ly do cu the de chua promote
project do.

## 5. Quy Trinh Khoi Tao Workspace Moi

Public installer ho tro `public-free` va `paid-user-safe`:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\install_cvf_workspace.ps1" `
  -WorkspaceRoot "D:\Path\To\CVF-Workspace" `
  -ProfileName "paid-user-safe"
```

Sau khi cai:

```powershell
Set-Location "D:\Path\To\CVF-Workspace"
.\Manage-CVF-Workspace.ps1 -Action Status -CheckRemote
Get-Content ".\CVF_RULE_PACKS\ACTIVE_RULE_PACK.json"
.\Run-CVF-NewProject-Enforcement.ps1
```

Dieu kien dat:

- hidden core remote la public CVF repository;
- active profile dung voi muc dich workspace;
- status la `CURRENT`;
- workspace root khong phai git repository;
- application projects nam ngang hang voi hidden core.

## 6. Quy Trinh Dau Moi Session Agent

Agent lam viec tai workspace root doc theo thu tu:

1. `WORKSPACE_RULES.md`
2. `CVF_WORKSPACE_CLASSIFICATION_GUIDE.md`
3. `CVF_WORKSPACE_USER_GUIDE.md` hoac
   `CVF_WORKSPACE_HUONG_DAN_SU_DUNG.md`
4. `CVF_RULE_PACKS/ACTIVE_RULE_PACK.json`
5. `CVF_WORKSPACE_RULE_PACKS.md` neu co
6. `CVF_WORKSPACE_MEMORY.md` va `AGENT_HANDOFF.md` neu co
7. `AGENTS.md`, policy, manifest va handoff cua project dang lam

Workspace memory luu context chung cua workspace. Project memory/handoff luu
context rieng cua project. Khong dung workspace memory de thay the source truth
hoac acceptance evidence cua project.

## 7. Cap Nhat, Sua Va Doi Profile

### Cap nhat public core

Voi `public-free` hoac `paid-user-safe`:

```powershell
.\Manage-CVF-Workspace.ps1 -Action Update -RunGate
```

Hoac dung wrapper tuong duong:

```powershell
.\Update-CVF-Workspace.ps1 -RunGate
```

Voi `operator-local`, khong giao private profile cho public manager. Cap nhat
hidden public core bang fast-forward, sau do materialize lai operator rule pack
tu provenance repository da duoc operator chap thuan:

```powershell
git -C ".\.Controlled-Vibe-Framework-CVF" status --short
git -C ".\.Controlled-Vibe-Framework-CVF" pull --ff-only

powershell -ExecutionPolicy Bypass `
  -File "<provenance-root>\scripts\install_cvf_workspace_root_wrappers_public.ps1" `
  -WorkspaceRoot (Get-Location).Path

powershell -ExecutionPolicy Bypass `
  -File "<provenance-root>\scripts\sync_cvf_workspace_rule_pack.ps1" `
  -WorkspaceRoot (Get-Location).Path `
  -ProfileName "operator-local" `
  -AllowProvenanceContinuity
```

Dung lai neu hidden core dirty; khong pull de de len local edits.

### Sua root artifacts/public profile

```powershell
.\Manage-CVF-Workspace.ps1 -Action Repair
```

Repair khong doi hidden-core HEAD va khong tu chon profile khac.

### Doi public profile

```powershell
.\Update-CVF-Workspace-Public-Profile.ps1 -ProfileName "public-free"
```

Hoac:

```powershell
.\Update-CVF-Workspace-Public-Profile.ps1 -ProfileName "paid-user-safe"
```

### Doi operator profile

```powershell
.\Update-CVF-Workspace-RulePack.ps1 `
  -ProfileName "operator-local" `
  -AllowProvenanceContinuity
```

Sau moi lan update, repair hoac doi profile:

```powershell
Get-Content ".\CVF_RULE_PACKS\ACTIVE_RULE_PACK.json"
.\Run-CVF-NewProject-Enforcement.ps1
```

## Enforcement And Verification

## 8. Bang Kiem Phan Loai

Truoc khi bat dau mot project, ghi nhan ngan gon:

```text
Workspace audience: public | paid/shared | private-operator
Selected profile: public-free | paid-user-safe | operator-local
Health verdict: CURRENT | UPDATE_AVAILABLE | DRIFTED | REPAIR_REQUIRED
Project state: NEW | ADOPTED | LEGACY_EXEMPT
Active project: <folder-name>
Boundary exception: none | <operator-approved reason>
```

Agent nen dua block nay vao handoff khi profile, health verdict hoac active
project thay doi.

## 9. Xu Ly Su Co Thuong Gap

| Dau hieu | Nguyen nhan thuong gap | Xu ly |
|---|---|---|
| Khong co `Manage-CVF-Workspace.ps1` | Root wrappers cu | Chay `Update-CVF-Workspace.ps1`; neu wrapper cung thieu, dung reconciler trong hidden core |
| `UPDATE_AVAILABLE` | Public core chua theo remote | Update voi `-RunGate` |
| `PROFILE_SOURCE_DRIFT` | Profile tao tu core commit cu | Update hoac materialize lai active profile |
| `PROFILE_ARTIFACT_DRIFT` | File trong rule pack bi sua tay | Repair/rematerialize; khong sua generated pack truc tiep |
| `ROOT_ARTIFACT_MISSING` | Root wrapper/guide bi xoa | Repair public workspace hoac chay installer wrapper phu hop |
| Repair tu choi `operator-local` | Public repair chi ho tro public profiles | Dung operator rule-pack wrapper tu provenance source |
| Project gate fail | Project thieu bootstrap artifact/policy | Chay project bootstrap/doctor, sua project-local finding |
| Core dirty | Hidden core bi sua tay | Dung lai; khong overwrite. Review va dua thay doi ve dung repository |

## 10. Boundary Bat Buoc

- Khong dat application source trong `.Controlled-Vibe-Framework-CVF/`.
- Khong init git tai workspace root.
- Khong copy private session state, source mirrors hoac credential vao public
  hay paid-user workspace.
- Khong coi rule pack la bang chung project da governed.
- Khong sua generated profile artifact truc tiep; sua source profile roi
  materialize lai.
- Khong dung `operator-local` cho workspace se giao customer hoac publish.
- Khong chay repair/update khi hidden core dirty ma chua review nguyen nhan.

## 11. Cau Hinh De Xuat Cho Operator Hien Tai

Voi workspace rieng cua operator, cau hinh de xuat la:

```text
Workspace audience: private-operator
Selected profile: operator-local
Project state: phan loai rieng tung project
Continuity: CVF_WORKSPACE_MEMORY.md + AGENT_HANDOFF.md
Core source: hidden public CVF core
Rule-pack source: operator-approved provenance repository
```

Profile nay giu duoc ky nang nho va ban giao giua agent, trong khi application
projects van tach khoi CVF core va private provenance data khong bi day sang
public/customer workspace.

## Related Artifacts

Huong dan nay dua tren:

- `docs/reference/CVF_WORKSPACE_PROFILE_TIERS.md`
- `docs/reference/CVF_WORKSPACE_RULES.md`
- `docs/reference/workspace_distribution/README.md`
- `docs/reference/workspace_distribution/CVF_WORKSPACE_DISTRIBUTION_MANIFEST.json`
- `workspace_overlay_profiles/`
- `scripts/manage_cvf_workspace.ps1`
- `scripts/get_cvf_workspace_status.ps1`
- `scripts/sync_cvf_workspace_rule_pack.ps1`

## Claim Boundary

Day la huong dan Windows workspace productization. No khong claim hosted,
cross-platform, provider-live, SLA hoac production readiness.
