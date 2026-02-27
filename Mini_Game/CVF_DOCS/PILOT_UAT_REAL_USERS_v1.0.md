# Pilot UAT Real Users - Mini Game v1.0

**Muc tieu:** Xac nhan chat luong truoc khi public cho nguoi dung cuoi.  
**Phien ban:** v1.0.0-rc1  
**Ngay tao:** 2026-02-26

---

## 1) Nhom pilot de xuat

- Tre 6-7 tuoi: 3 be
- Tre 8-10 tuoi: 3 be
- Phu huynh: 4 nguoi
- Tong: 10 nguoi tham gia

## 2) Moi truong test

- Mobile Android tieu bieu: 2 may
- Mobile iOS tieu bieu: 2 may
- Desktop Chrome/Edge: 2 may
- Network: Wi-Fi gia dinh + 4G

## 3) Bai test bat buoc

### A. Child flow (tre em)
- [ ] Mo game va bat dau choi duoc trong <= 1 phut.
- [ ] Choi duoc 3 mini game khong can huong dan ky thuat.
- [ ] Tre hieu thong diep feedback (dung/sai/goi y).
- [ ] Tre chuyen doi game tab khong bi roi.

### B. Parent flow (phu huynh)
- [ ] Dat PIN thanh cong.
- [ ] Mo khoa Parent Mode bang PIN dung.
- [ ] PIN sai khong thay doi duoc setting.
- [ ] Dat gioi han phut/ngay va thay doi duoc.
- [ ] Reset du lieu choi hoat dong dung.

### C. Safety & stability
- [ ] Het quota thi tre khong choi tiep duoc.
- [ ] Khong co link ngoai/ads.
- [ ] Khong crash trong session 20 phut.

## 4) Tieu chi pass pilot

- >= 80% tre hoan thanh child flow khong can can thiep.
- >= 90% phu huynh hoan thanh parent flow.
- 0 bug Critical/High.
- Ty le crash = 0 trong buoi pilot.

## 5) Form ghi nhan ket qua tung nguoi

| Participant | Group | Device | Passed Flow A | Passed Flow B | Issues | Overall |
|---|---|---|---|---|---|---|
| P01 | Child 6-7 | Android | Yes/No | N/A | ... | Pass/Fail |

## 6) Rule sau pilot

- Neu PASS: cho phep buoc vao release prep final.
- Neu FAIL: quay lai CVF Phase C de fix, cap nhat bug log, test lai.
