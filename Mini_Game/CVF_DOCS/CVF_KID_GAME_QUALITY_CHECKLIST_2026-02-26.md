# CVF Kid Game Quality Checklist - Mini Game

**Date:** 2026-02-26  
**Version:** v1.0  
**Scope:** `Mini_Game/webapp`  
**Goal:** Dam bao game dep, vui, an toan, du hap dan cho tre em truoc khi public.

---

## 1) Target users va success criteria

- [ ] Xac dinh ro 3 nhom tuoi: 5-6, 7-8, 9-10.
- [ ] Moi nhom tuoi co muc do kho rieng (khong dung 1 bo cau hoi cho tat ca).
- [ ] Moi nhom tuoi co KPI rieng (completion rate, avg session, wrong streak).
- [ ] Da viet ro "khong nam trong scope" (vi du chat online, link ngoai, ads).

---

## 2) Visual direction (Kid-friendly UI/UX)

- [ ] Co 1 visual direction duy nhat (palette, typography, icon style, motion style).
- [ ] Button va vung touch du lon tren mobile.
- [ ] Mau co tuong phan tot, text de doc, khong roi mat.
- [ ] Trang thai game ro rang: dang choi, sap het gio, dung, sai, win.
- [ ] Co "wow moment" nhe o cac moc quan trong (win/combo/badge).
- [ ] Layout responsive tot cho desktop + mobile.

---

## 3) Learning design (Pedagogy)

- [ ] Do kho tang dan theo scaffold, khong tang dot ngot.
- [ ] Cau hoi ngau nhien nhung "vua suc" theo level.
- [ ] Neu sai thi feedback tich cuc + goi y don gian.
- [ ] Neu sai lien tiep thi co co che giam ap luc (hint, reset round, thong diep de hieu).
- [ ] Co huong dan bat dau trong <= 30 giay.

---

## 4) Game feel va motivation loop

- [ ] Reward loop day du: diem, combo, badge, rank.
- [ ] Muc tieu ngan han ro rang cho moi session (3-7 phut).
- [ ] Co cam giac tien bo qua tung luot choi.
- [ ] Co trigger celebration cho moc combo hoac pha ky luc.
- [ ] Restart nhanh, khong lam mat dong luc nguoi choi.

---

## 5) Audio va accessibility

- [ ] Co sfx co ban: hover/click/correct/wrong/celebration.
- [ ] Co nut bat/tat am thanh de phu huynh kiem soat.
- [ ] Volume mac dinh o muc nhe (khong gay giat minh).
- [ ] Co phuong an cho tre yeu doc chu (TTS la muc uu tien tiep theo).
- [ ] Khong chi dung mau de truyen dat thong tin (co text/shape ho tro).

---

## 6) Parent safety va child-safe policy

- [ ] Parent Mode co PIN, lock/unlock dung.
- [ ] Gioi han phut choi moi ngay hoat dong dung.
- [ ] Het quota thi khong choi tiep duoc.
- [ ] Khong ads, khong link ngoai, khong script ben thu 3 khong can thiet.
- [ ] Khong thu thap PII cua tre.
- [ ] Co thong bao ro pham vi telemetry local/anonymous.

---

## 7) Performance va reliability

- [ ] First load o mang binh thuong dat muc chap nhan duoc.
- [ ] Choi lien tuc 20 phut khong crash.
- [ ] FPS on dinh tren mobile tam trung.
- [ ] Hieu ung (animation/confetti/audio) khong lam giat gameplay.
- [ ] Co reduced motion fallback cho thiet bi can han che chuyen dong.

---

## 8) Telemetry va measurement

- [ ] Co event cho start round, answer correct/wrong, timeout, restart, celebration.
- [ ] Co do completion rate theo mini game.
- [ ] Co do drop-off point (nguoi choi bo o dau).
- [ ] Co do wrong streak de tim muc kho qua cao.
- [ ] Co bao cao tong hop de quyet dinh gate.

---

## 9) Test coverage gate (mandatory)

- [ ] Co script coverage (vi du: `npm run test:coverage`).
- [ ] Co file baseline coverage report co ngay thang.
- [ ] Co threshold coverage duoc enforce trong test config/CI.
- [ ] Coverage report duoc dinh kem khi mo gate release.
- [ ] Neu threshold con thap, co roadmap nang threshold theo sprint.

---

## 10) Pilot UAT readiness

- [ ] Co tai lieu pilot: `PILOT_UAT_REAL_USERS_v1.0.md`.
- [ ] Co file ghi ket qua that te: `PILOT_UAT_RESULTS_YYYY-MM-DD.md`.
- [ ] Co toi thieu 5-10 tre + phu huynh tham gia test.
- [ ] Co danh sach bug voi severity va owner.
- [ ] Khong con bug Critical/High truoc khi public.

---

## 11) CVF release gates (Must / Should / Later)

### MUST (bat buoc truoc public)
- [ ] Safety + Parent Mode + no-ads + no-external-link.
- [ ] Performance/stability pass (khong crash, khong lag nghiem trong).
- [ ] UAT pilot pass va khong co Critical/High bug.
- [ ] Coverage gate pass (co evidence baseline + threshold).

### SHOULD (nen co o ban public dau)
- [ ] Reward loop day du va dep mat.
- [ ] Audio system co toggle va can bang volume.
- [ ] Telemetry du de theo doi hanh vi nguoi choi.
- [ ] Coverage threshold duoc nang theo roadmap sau moi sprint.

### LATER (sau public v1)
- [ ] TTS cho cau hoi va huong dan.
- [ ] Theme 3D toy-like/advanced animation.
- [ ] Content pack mo rong theo do tuoi va chu de.

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
- [ ] FAIL - Quay lai CVF Phase C de fix.

**Decision owner:**  
**Decision date:**  
**Notes:**  
