# Tong Hop CVF Desktop App (Case Study)

Ung dung desktop offline (Windows) de quan ly 3 module:

- Khai thac: nhap san luong (tay/Excel)
- Thuong vu: hop dong + xac nhan thanh toan
- Nhan su: cham cong + tinh luong

Du lieu local luu tren SQLite, co audit log toan bo thao tac.

## Chay local

```bash
cd XD_App
npm install
npm run dev
```

## Dong goi ban phat hanh Windows

```bash
cd XD_App
npm install
npm run package
```

Output nam trong `XD_App/dist/` (portable + NSIS installer).

## Vi tri database

SQLite duoc tao trong thu muc `userData` cua Electron:

- Windows: `%APPDATA%/TongHopCVF/tonghop-cvf.db`

## Governance V2 (seed users)

- `admin` (ADMIN)
- `maker01` (MAKER)
- `checker01` (CHECKER)
- `approver01` (APPROVER)

## Tai lieu CVF cho case nay

- `XD_App/DOCUMENTS/CVF_INPUT_SPEC.md`
- `XD_App/DOCUMENTS/CVF_PHASE_A_DISCOVERY.md`
- `XD_App/DOCUMENTS/CVF_PHASE_B_DESIGN.md`
- `XD_App/DOCUMENTS/CVF_PHASE_C_BUILD.md`
- `XD_App/DOCUMENTS/CVF_PHASE_D_REVIEW.md`
- `XD_App/DOCUMENTS/CVF_PROFESSIONAL_UPGRADE_BLUEPRINT.md`
- `XD_App/DOCUMENTS/CVF_SELF_AUDIT_V2.md`
- `XD_App/DOCUMENTS/DECISIONS.md`
- `XD_App/DOCUMENTS/SKILL_PREFLIGHT_RECORD.md`
- `XD_App/DOCUMENTS/ARCHITECTURE.md`
- `XD_App/DOCUMENTS/DATABASE_SCHEMA.md`
