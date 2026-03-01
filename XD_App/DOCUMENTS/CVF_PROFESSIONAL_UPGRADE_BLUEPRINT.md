# CVF Professional Upgrade Blueprint (V2)

## 1) Muc tieu nang cap

Nang cap tu "tool nhap lieu + tinh luong co ban" thanh **Operational Control & Internal Governance System** dung nghia:

- Kiem soat quy trinh, khong chi luu du lieu.
- Co co che phan quyen, phe duyet, khoa ky, truy vet bien dong.
- Co canh bao sai lech van hanh theo nguong rui ro.
- Co dashboard dieu hanh va bo bang chung audit de kiem tra noi bo.

## 2) Khoang cach hien tai vs muc tieu

### Hien tai (V1)
- Da co 3 module nghiep vu + doi chieu + payroll + audit log.
- Chua co workflow quan tri (maker-checker-approver).
- Chua co engine chinh sach luong versioned.
- Chua co quan ly exception va SLA xu ly sai lech.
- Chua co khoa ky du lieu, chot so, tai tinh co kiem soat.

### Muc tieu V2
- Dinh nghia ro lifecycle du lieu: Draft -> Submitted -> Approved -> Locked.
- Segregation of Duties (SoD): nguoi nhap khong duoc tu duyet/chot.
- Doi chieu da tang + phan loai nguyen nhan sai lech.
- Payroll co policy versioning + mo phong truoc khi chot.
- Audit co tinh "forensic-ready" (truy vet duoc nguon goc + ly do thay doi).

## 3) Thiet ke he thong muc tieu

## 3.1 Domain model chinh

1. Governance Core
- User, Role, Permission
- Approval Workflow, Approval Step, Approval Decision
- Period Lock, Reopen Request
- Exception Case, SLA, Resolution

2. Operations
- Production Ticket (Khai thac)
- Commercial Confirmation (Thuong vu)
- Contract + Price Rule

3. Workforce & Payroll
- Employee, Position, Team, Coefficient Profile
- Attendance Sheet
- Payroll Policy (versioned)
- Payroll Run, Payroll Line, Payroll Adjustment

4. Audit & Evidence
- Immutable Audit Ledger
- Attachment Evidence (hoa don, bien ban, file doi chieu)
- Decision Note (ly do phe duyet/sua so)

## 3.2 Kien truc ky thuat de xuat

- UI: Electron desktop (giu offline-first), tach "workflow center" rieng.
- App layer: service-oriented modules (production/commercial/hr/governance/reconciliation).
- Rules engine: policy interpreter cho payroll + threshold + approval rule.
- Data:
  - Local SQLite cho don vi van hanh.
  - Co kha nang mo rong dong bo trung tam sau nay (event outbox + sync worker).
- Audit:
  - Append-only ledger table.
  - Hash chain cho ban ghi audit de phat hien sua trai phep.

## 4) Nang cap nghiep vu trong tam

## 4.1 Governance Workflow (bat buoc)

Muc tieu: khong cho du lieu "nhay thang" tu nhap lieu sang thanh toan/luong.

Luong xu ly:
1. Maker nhap du lieu -> `DRAFT`
2. Checker doi chieu -> `SUBMITTED`
3. Approver duyet -> `APPROVED`
4. He thong khoa ky -> `LOCKED`

Quy tac:
- Nguoi tao khong duoc phe duyet cung ban ghi.
- Ban ghi da `LOCKED` chi mo lai qua Reopen Request + ly do + nguoi duyet.

## 4.2 Reconciliation Control Tower

Nang cap doi chieu tu 1 chieu thanh 3 chieu:
- Khai thac vs Thuong vu
- Khai thac vs Nhan cong truc tiep
- Thuong vu vs Tong quy luong bien doi

Bo sung:
- Tolerance policy theo loai hang/hop dong (nguong cho phep).
- Auto classify variance:
  - Missing source
  - Unit mismatch
  - Pricing mismatch
  - Late attendance cutoff
- Exception queue + SLA xu ly.

## 4.3 Payroll Professional Engine

Bo sung:
- Policy versioning (`effective_from`, `effective_to`, `version_code`).
- Simulation mode: chay thu bang luong truoc khi chot.
- Delta recalculation: ghi ro chenhlech giua run cu vs run moi.
- Chot ky luong + freeze toan bo input lien quan.
- Bang giai trinh luong theo nguoi (explainability line-by-line).

## 4.4 HR & Workforce governance

Bo sung:
- Ho so nhan su day du (hop dong lao dong, trang thai, bo phan, cap bac).
- Quan ly ca lam/cham cong theo lich.
- Quan ly he so to doi theo thoi gian (khong hardcode 1 he so).
- Rule kiem tra du lieu cham cong bat thuong (qua gio, trung lap, vang dot bien).

## 5) De xuat UI/UX cap quan tri

Bo sung 4 man hinh chien luoc:

1. Command Center
- KPI theo ngay/thang
- Heatmap sai lech theo phong ban
- Trang thai queue phe duyet

2. Reconciliation Workbench
- Danh sach exception co filter theo muc do rui ro
- Side-by-side record compare + nut tao bien ban

3. Payroll Control Panel
- Chon policy version
- Chay simulation
- So sanh delta truoc khi publish

4. Governance Ledger Explorer
- Timeline hanh dong theo entity
- Loc theo user/action/date
- Xem ly do thay doi va file chung minh

## 6) Data schema nang cap (bo sung)

Them cac bang:
- `users`, `roles`, `role_permissions`
- `approval_workflows`, `approval_steps`, `approval_decisions`
- `period_locks`, `reopen_requests`
- `payroll_policies`, `payroll_policy_rules`, `payroll_runs`, `payroll_adjustments`
- `reconciliation_cases`, `reconciliation_findings`, `exception_sla`
- `audit_ledger` (append-only), `audit_hash_chain`
- `attachments`, `decision_notes`

## 7) Lo trinh trien khai de xuat

## Phase 1 (2-3 tuan): Governance foundation
- RBAC + SoD
- Record status lifecycle
- Approval workflow co ban
- Period lock/reopen

## Phase 2 (2-3 tuan): Reconciliation & exception management
- Reconciliation 3 chieu
- Tolerance policy
- Exception queue + SLA

## Phase 3 (2-3 tuan): Payroll v2
- Policy versioning
- Simulation + delta recalculation
- Ky luong freeze + explainability

## Phase 4 (1-2 tuan): Executive cockpit & audit hardening
- Command center
- Ledger explorer
- Audit hash chain
- Internal control report export

## 8) Tieu chi nghiem thu "xung tam Governance System"

- 100% giao dich nhay qua workflow, khong bypass.
- Moi sua doi du lieu nhay cam deu co ly do + nguoi phe duyet.
- Co the truy vet "so luong/luong thay doi vi sao, boi ai, luc nao" trong <= 2 phut.
- Co bao cao sai lech va SLA xu ly theo phong ban.
- Chot ky xong khong the sua du lieu neu khong co reopen workflow.

## 9) Uu tien thuc thi ngay

Backlog uu tien cao:
1. RBAC + SoD + Approval lifecycle
2. Period lock/reopen
3. Reconciliation exception queue
4. Payroll policy versioning + simulation

Neu can chon 1 MVP nang cap de vao san xuat noi bo som:
- Chon "Governance foundation + Period lock + Reconciliation queue" truoc.

## 10) CVF Skill Preflight Constraint (2026-03-01)

- Truoc moi Build/Execute action co sua artifact, bat buoc phai co Skill Preflight PASS.
- Record preflight cua project dat tai:
  - `XD_App/DOCUMENTS/SKILL_PREFLIGHT_RECORD.md`
- Neu khong co skill hop le hoac mapping record:
  - Dung thuc thi
  - Tao intake/escalation record theo CVF
