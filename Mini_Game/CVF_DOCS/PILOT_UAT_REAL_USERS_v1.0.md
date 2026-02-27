# Pilot UAT Real Users - Mini Game v1.1

**Muc tieu:** Xac nhan chat luong va KPI thuc te truoc khi public cho nguoi dung cuoi.  
**Phien ban:** v1.1.0-rc1  
**Ngay cap nhat:** 2026-02-27

---

## 1) Nhom pilot de xuat

- Tre 5-6 tuoi: 4 be
- Tre 7-8 tuoi: 4 be
- Tre 9-10 tuoi: 4 be
- Phu huynh/giao vien: 6 nguoi
- Tong: 18 nguoi tham gia

## 2) Moi truong test

- Mobile Android: 3 may
- Mobile iOS: 3 may
- Desktop Chrome/Edge: 2 may
- Network: Wi-Fi gia dinh + 4G
- Moi participant choi 2 phien/ngay trong 7 ngay

## 3) UAT checklist theo 8 de xuat

### A. Age differentiation (5-6 / 7-8 / 9-10)
- [ ] Chuyen profile tuoi thi noi dung prompt thay doi ro rang.
- [ ] Luat/pacing va feedback dung profile, khong bi "giong het moi tuoi".
- [ ] Tre nhom 5-6 van hoan thanh duoc vong dau ma khong can can thiep ky thuat.

### B. Adaptive difficulty engine
- [ ] Sau 5-10 luot sai lien tiep, do kho giam ve muc vua suc.
- [ ] Sau chuoi dung cao, do kho tang dan, khong nhay gap.
- [ ] Khong co vong "bat kha thi" sau khi adaptive cap nhat.

### C. Personal learning path
- [ ] Co goi y game yeu (learning suggestion) dung voi hien trang choi.
- [ ] Nut "choi game goi y" hoat dong dung.
- [ ] Skill profile cap nhat sau moi phien va giu duoc sau reload.

### D. Parent/Teacher dashboard
- [ ] Parent tab hien du weekly rounds, accuracy trend, weak game.
- [ ] Teacher summary de doc va su dung duoc cho bao cao nhanh.
- [ ] Du lieu report phu hop voi du lieu choi thuc te.

### E. Game loop expansion
- [ ] Mini-game Logic hoat dong on dinh o 3 nhom tuoi.
- [ ] Quest/progression co tinh Logic va cap nhat dung.
- [ ] Khong co runtime error khi doi qua lai giua 4 mini-game.

### F. Meta progression depth
- [ ] Daily chest -> sticker unlock hoat dong dung.
- [ ] Avatar/pet/tool unlock va equip duoc.
- [ ] Trang thai reward duoc luu sau reload.

### G. Accessibility & safety
- [ ] Color assist mode ho tro de nhin cho game mau.
- [ ] TTS va auto-read bat/tat duoc, khong gay overlap voice.
- [ ] Per-session limit hit -> game dung choi va hien thong diep break.

### H. A/B + telemetry baseline
- [ ] Co event `experiment_exposure` khi vao phien.
- [ ] Event telemetry moi khong bi reject boi allow-list API.
- [ ] Co the trich xuat du lieu completion/drop-off theo man.

## 4) KPI template (7 ngay pilot)

| KPI | Muc tieu pass | Mau ghi nhan |
|---|---|---|
| Child onboarding <= 60s | >= 85% | 16/18 participant |
| Completion rate (daily mission) | >= 70% |  |
| Drop-off truoc round 3 | <= 25% |  |
| Session trong gioi han an toan | >= 95% |  |
| Parent dashboard task success | >= 90% |  |
| Logic game participation | >= 60% be thu it nhat 1 lan/ngay |  |
| D1 retention | >= 45% |  |
| D7 retention | >= 25% |  |
| Crash-free sessions | 100% |  |
| Critical/High bugs | 0 |  |

## 5) Form ghi nhan ket qua tung nguoi

| Participant | Age group | Device | Completed core flow | Adaptive ok | Parent flow | Safety limit ok | Issues | Overall |
|---|---|---|---|---|---|---|---|---|
| P01 | 5-6 | Android | Yes/No | Yes/No | N/A | Yes/No | ... | Pass/Fail |

## 6) Mau tong hop KPI ngay/tuan

| Date | Sessions | Avg min/session | Mission completion | Early drop-off | D1 cohort | D7 cohort | Crash count | Note |
|---|---|---|---|---|---|---|---|---|
| 2026-03-01 |  |  |  |  |  |  |  |  |

## 7) Release decision rule sau pilot

- PASS khi:
  - Dat hoac vuot toan bo KPI mandatory: `D1`, `D7`, `drop-off`, `crash`, `critical bugs`.
  - Khong co blocker tren safety/accessibility.
- CONDITIONAL PASS khi:
  - Chi lech nhe 1 KPI khong critical va co action plan fix <= 7 ngay.
- FAIL khi:
  - Co Critical/High bug chua fix, hoac crash > 0, hoac khong dat D1/D7 toi thieu.

## 8) Next step mapping

- Neu PASS: cap nhat `PRE_PUBLIC_RELEASE_GATE_v1.0.md` -> `READY FOR PUBLIC RELEASE`.
- Neu CONDITIONAL PASS/FAIL: tao bug/action list, rerun pilot scope 3 ngay toi thieu.
