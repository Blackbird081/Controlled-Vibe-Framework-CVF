## Tech Stack Decision
- Runtime: Electron (desktop Windows)
- UI: HTML/CSS/Vanilla JS (dark theme)
- Local DB: SQLite (`better-sqlite3`)
- Excel ingest: `exceljs`
- Packaging: `electron-builder` (portable + NSIS)

## Architecture Diagram
- Xem chi tiết: `XD_App/DOCUMENTS/ARCHITECTURE.md`

## Database Schema (if needed)
- Xem chi tiết: `XD_App/DOCUMENTS/DATABASE_SCHEMA.md`

## Complete Source Code
- Toàn bộ source code app nằm trong:
  - `XD_App/main.js`
  - `XD_App/preload.js`
  - `XD_App/src/db/*`
  - `XD_App/src/services/*`
  - `XD_App/renderer/*`
- Governance V2 đã tích hợp:
  - RBAC user roles
  - Workflow `DRAFT -> SUBMITTED -> APPROVED`
  - Period lock / reopen request
  - SoD rule cho approve
  - Skill Preflight trace: `XD_App/DOCUMENTS/SKILL_PREFLIGHT_RECORD.md`

## Setup & Run Instructions
```bash
cd XD_App
npm install
npm run dev
```

## Packaging Guide
```bash
cd XD_App
npm install
npm run package
```

Artifact đóng gói sinh ra trong `XD_App/dist/`.
