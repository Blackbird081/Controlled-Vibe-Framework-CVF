# INPUT_SPEC - CVF Mini Game Web App

## 1. Muc tieu
- Xay dung web app mini game cho tre em 6-10 tuoi.
- Uu tien vua hoc vua choi, session ngan, de quay lai hang ngay.
- Co parent mode de gioi han thoi gian choi.

## 2. Functional Scope (MVP)
- Mini Game 1: Toan Nhanh (add/sub multiple choice).
- Mini Game 2: Nho Hinh (nho chuoi ky hieu, chon ky hieu xuat hien nhieu nhat).
- Mini Game 3: Phan Xa Mau (chon mau chu dang hien thi).
- Luu progress local: score, combo, high score, streak, badges.
- Luu report ngay cho parent: rounds/correct/wrong/accuracy theo game.
- Parent mode: bat/tat + dat gioi han phut choi moi ngay + khoa PIN.
- Onboarding lan dau cho nguoi choi moi.
- UI responsive mobile first.
- Telemetry co ban qua API route noi bo.

## 3. Out of Scope (MVP)
- Dang nhap tai khoan.
- Thanh toan/in-app purchase.
- Chat, social feed, UGC.
- Leaderboard online.

## 4. Constraints
- Stack: Next.js + TypeScript + Phaser.
- Data layer: local storage cho MVP.
- Khong su dung tai san IP co ban quyen de phat hanh cong khai.

## 5. Acceptance Criteria
- [x] Choi duoc day du 3 mini game tren desktop/mobile browser.
- [x] Co combo scoring + high score theo level.
- [x] Parent mode gioi han duoc thoi gian choi theo ngay + co report trong ngay.
- [x] `npm run lint` PASS.
- [x] `npm run test:run` PASS.
- [x] `npm run build` PASS.
