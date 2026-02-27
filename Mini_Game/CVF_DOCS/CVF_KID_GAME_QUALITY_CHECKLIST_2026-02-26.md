# CVF Kid Game Quality Checklist - Mini Game

**Date:** 2026-02-26  
**Version:** v1.0  
**Scope:** `Mini_Game/webapp`  
**Goal:** Dam bao game dep, vui, an toan, du hap dan cho tre em truoc khi public.

---

## 1) Target users va success criteria

- [x] Xac dinh ro 3 nhom tuoi: 5-6, 7-8, 9-10.
- [x] Moi nhom tuoi co muc do kho rieng (khong dung 1 bo cau hoi cho tat ca).
- [x] Moi nhom tuoi co KPI rieng (completion rate, avg session, wrong streak).
- [x] Da viet ro "khong nam trong scope" (vi du chat online, link ngoai, ads).

---

## 2) Visual direction (Kid-friendly UI/UX)

- [x] Co 1 visual direction duy nhat (palette, typography, icon style, motion style).
- [x] Button va vung touch du lon tren mobile.
- [x] Mau co tuong phan tot, text de doc, khong roi mat.
- [x] Trang thai game ro rang: dang choi, sap het gio, dung, sai, win.
- [x] Co "wow moment" nhe o cac moc quan trong (win/combo/badge).
- [x] Layout responsive tot cho desktop + mobile.

---

## 3) Learning design (Pedagogy)

- [x] Do kho tang dan theo scaffold, khong tang dot ngot.
- [x] Cau hoi ngau nhien nhung "vua suc" theo level.
- [x] Neu sai thi feedback tich cuc + goi y don gian.
- [x] Neu sai lien tiep thi co co che giam ap luc (hint, reset round, thong diep de hieu).
- [x] Co huong dan bat dau trong <= 30 giay.

---

## 4) Game feel va motivation loop

- [x] Reward loop day du: diem, combo, badge, rank.
- [x] Muc tieu ngan han ro rang cho moi session (3-7 phut).
- [x] Co cam giac tien bo qua tung luot choi.
- [x] Co trigger celebration cho moc combo hoac pha ky luc.
- [x] Restart nhanh, khong lam mat dong luc nguoi choi.

---

## 5) Audio va accessibility

- [x] Co sfx co ban: hover/click/correct/wrong/celebration.
- [x] Co nut bat/tat am thanh de phu huynh kiem soat.
- [x] Volume mac dinh o muc nhe (khong gay giat minh).
- [x] Co phuong an cho tre yeu doc chu (TTS la muc uu tien tiep theo).
- [x] Khong chi dung mau de truyen dat thong tin (co text/shape ho tro).

---

## 6) Parent safety va child-safe policy

- [x] Parent Mode co PIN, lock/unlock dung.
- [x] Gioi han phut choi moi ngay hoat dong dung.
- [x] Het quota thi khong choi tiep duoc.
- [x] Khong ads, khong link ngoai, khong script ben thu 3 khong can thiet.
- [x] Khong thu thap PII cua tre.
- [x] Co thong bao ro pham vi telemetry local/anonymous.

---

## 7) Performance va reliability

- [x] First load o mang binh thuong dat muc chap nhan duoc.
- [x] Choi lien tuc 20 phut khong crash.
- [x] FPS on dinh tren mobile tam trung.
- [x] Hieu ung (animation/confetti/audio) khong lam giat gameplay.
- [x] Co reduced motion fallback cho thiet bi can han che chuyen dong.

---

## 8) Telemetry va measurement

- [x] Co event cho start round, answer correct/wrong, timeout, restart, celebration.
- [x] Co do completion rate theo mini game.
- [x] Co do drop-off point (nguoi choi bo o dau).
- [x] Co do wrong streak de tim muc kho qua cao.
- [x] Co bao cao tong hop de quyet dinh gate.

---

## 9) Test coverage gate (mandatory)

- [x] Co script coverage (vi du: `npm run test:coverage`).
- [x] Co file baseline coverage report co ngay thang.
- [x] Co threshold coverage duoc enforce trong test config/CI.
- [x] Coverage report duoc dinh kem khi mo gate release.
- [x] Neu threshold con thap, co roadmap nang threshold theo sprint.

---

## 10) Pilot UAT readiness

- [x] Co tai lieu pilot: `PILOT_UAT_REAL_USERS_v1.0.md`.
- [x] Co file ghi ket qua that te: `PILOT_UAT_RESULTS_YYYY-MM-DD.md`.
- [ ] Co toi thieu 5-10 tre + phu huynh tham gia test.
- [ ] Co danh sach bug voi severity va owner.
- [ ] Khong con bug Critical/High truoc khi public.

---

## 11) CVF release gates (Must / Should / Later)

### MUST (bat buoc truoc public)
- [x] Safety + Parent Mode + no-ads + no-external-link.
- [x] Performance/stability pass (khong crash, khong lag nghiem trong).
- [ ] UAT pilot pass va khong co Critical/High bug.
- [x] Coverage gate pass (co evidence baseline + threshold).

### SHOULD (nen co o ban public dau)
- [x] Reward loop day du va dep mat.
- [x] Audio system co toggle va can bang volume.
- [x] Telemetry du de theo doi hanh vi nguoi choi.
- [x] Coverage threshold duoc nang theo roadmap sau moi sprint.

### LATER (sau public v1)
- [x] TTS cho cau hoi va huong dan.
- [ ] Theme 3D toy-like/advanced animation.
- [x] Content pack mo rong theo do tuoi va chu de.

---

## 12) KPI target de qua gate

| Metric | Target de Pass |
|---|---|
| Child flow completion | >= 80% |
| Parent flow completion | >= 90% |
| Crash rate trong pilot | = 0 |
| Critical/High bugs | = 0 |
| Avg session duration | >= 3 phut |

---

## 13) Gate decision

- [ ] PASS - Ready for controlled public release.
- [x] FAIL - Quay lai CVF Phase C de fix.

**Decision owner:** CVF Engineering  
**Decision date:** 2026-02-27  
**Notes:** Hoan tat toan bo nang cap ky thuat theo roadmap 8 upgrades. Gate public van pending vi chua co UAT real-users da dien ket qua.

---

## 14) Evidence mapping (dien link thuc te truoc khi gate)

| Checklist area | Evidence file | Status | Owner | Last update |
|---|---|---|---|---|
| UAT pilot readiness | `PILOT_UAT_REAL_USERS_v1.0.md` | READY | QA | 2026-02-27 |
| UAT real results | `PILOT_UAT_RESULTS_2026-02-26.md` | TEMPLATE_ONLY | QA | 2026-02-27 |
| Coverage baseline | `TEST_COVERAGE_BASELINE_2026-02-27.md` | PASS | Engineering | 2026-02-27 |
| Release gate summary | `PRE_PUBLIC_RELEASE_GATE_v1.0.md` | NOT_READY_PUBLIC | Product | 2026-02-27 |
| Risk tracking | `RISK_LOG.md` | ACTIVE | Engineering | 2026-02-27 |
| Go-live rollback readiness | `GO_LIVE_ROLLBACK_CHECKLIST_v1.0.md` | PARTIAL | Operations | 2026-02-27 |

---

## 15) Remediation tracker (chi dien neu FAIL)

| ID | Severity | Checklist item | Root cause | Action | Owner | ETA | Status |
|---|---|---|---|---|---|---|---|
| R-01 | High | 10) Pilot UAT readiness | Chua co session UAT real-users da dien du lieu | To chuc pilot 5-10 tre + phu huynh va dien full `PILOT_UAT_RESULTS_2026-02-26.md` | QA/UAT | 2026-03-01 | In Progress |
| R-02 | Medium | 12) KPI target de qua gate | Chua co so do KPI thuc te sau pilot | Chot child/parent completion + crash + bug severity tu pilot data | Product + QA | 2026-03-01 | Open |
| R-03 | Medium | 16) Sign-off matrix | Chua co chu ky owner | Chot PO/Eng/QA/Parent safety sign-off sau pilot | PMO | 2026-03-02 | Open |

---

## 16) Sign-off matrix

- [ ] Product Owner sign-off
- [ ] Engineering Lead sign-off
- [ ] QA Lead sign-off
- [ ] Parent safety reviewer sign-off

**Sign-off date:**  
**Release scope:** Controlled pilot  
