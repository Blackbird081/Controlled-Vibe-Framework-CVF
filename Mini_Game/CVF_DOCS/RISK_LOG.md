# RISK_LOG - Mini Game Web App

## R-001: Ban quyen hinh anh/nhan vat
- **Level:** HIGH
- **Mo ta:** Neu dung IP thuong mai khong duoc phep, rui ro phap ly cao.
- **Mitigation:** Dung art original/royalty-free, log nguon asset.
- **Owner:** Product + Design

## R-002: Overplay tre em
- **Level:** MEDIUM
- **Mo ta:** Session qua dai anh huong thoi gian sinh hoat cua tre.
- **Mitigation:** Parent mode + daily limit + thong bao con lai.
- **Owner:** Product

## R-003: Mat du lieu local
- **Level:** LOW
- **Mo ta:** Xoa browser cache se mat progress.
- **Mitigation:** Thong bao ro local-only trong MVP; xem xet cloud save o P1.
- **Owner:** Engineering

## R-004: Hieu nang tren mobile yeu
- **Level:** MEDIUM
- **Mo ta:** Animation/game loop co the drop FPS.
- **Mitigation:** Toi uu canvas scene, giam particles, lazy-load assets.
- **Owner:** Frontend

## R-005: Telemetry khong an danh dung cach
- **Level:** MEDIUM
- **Mo ta:** Thu thap du lieu nhay cam khong can thiet.
- **Mitigation:** Chi gui event an danh; khong gui PII.
- **Owner:** Engineering + Governance

## R-006: Do kho Memory/Color khong phu hop mot so nhom tuoi
- **Level:** MEDIUM
- **Mo ta:** Neu do kho tang qua nhanh, tre nho de bo cuoc.
- **Mitigation:** Dieu chinh do phuc tap theo level, them anti-frustration hint.
- **Owner:** Product + QA

## R-007: Parent mode co the bi reset khi nguoi dung xoa browser data
- **Level:** LOW
- **Mo ta:** Local storage bi clear se mat thiet lap gioi han choi.
- **Mitigation:** Ghi ro gioi han local-only trong MVP; P1 xem xet cloud profile.
- **Owner:** Engineering

## R-008: Qua tai cam giac (am thanh/hieu ung) voi mot so tre em
- **Level:** MEDIUM
- **Mo ta:** SFX va hieu ung manh co the gay phan tam hoac kho chiu.
- **Mitigation:** Bo sung mute/volume/ui-sfx toggle + reduced motion fallback.
- **Owner:** Product + Frontend

## R-009: Do kho khong dong deu giua nhom tuoi
- **Level:** MEDIUM
- **Mo ta:** Cung mot cau hinh cho tre 5-6 va 9-10 de gay chan hoac bo cuoc.
- **Mitigation:** Them age profile (5-6, 7-8, 9-10) de can chinh time-limit va do kho.
- **Owner:** Product + QA

## R-010: Cache stale khi dung service worker
- **Level:** MEDIUM
- **Mo ta:** Ban moi co the bi cache boi service worker tren mot so thiet bi.
- **Mitigation:** Version cache theo release (`CACHE_NAME`) + xoa cache cu trong activate + huong dan hard refresh neu can.
- **Owner:** Frontend
