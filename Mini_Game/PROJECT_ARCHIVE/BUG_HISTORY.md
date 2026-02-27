# BUG_HISTORY - Mini Game

## Template record
| Date | Bug ID | Severity | Area | Symptom | Root Cause | Fix | Status |
|---|---|---|---|---|---|---|---|
| 2026-02-26 | MG-001 | Medium | Legacy Prototype | `wrong.mp3` missing in Streamlit app | Asset not included | Switched to generated WebAudio tone in web app | Closed |
| 2026-02-26 | MG-002 | Low | Webapp Lint | `color.ts` had unused function warning | Leftover helper not used after refactor | Removed unused function and reran lint | Closed |
