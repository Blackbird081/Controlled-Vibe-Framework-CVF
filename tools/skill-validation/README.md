# CVF Skill Validation (Shared Tooling)

This folder is the shared validation toolkit used by both v1.5.2 Skill Library and v1.6 Agent Platform.

## Scripts

- `validate_skills.py` — Validate skill structure & metadata.
- `fix_skill_warnings.py` — Auto-fix common validation warnings.
- `run_validation.py` — Consolidated pipeline wrapper (skills + optional governance checks).

## Usage

```bash
python tools/skill-validation/validate_skills.py --root EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS
python tools/skill-validation/validate_skills.py --root EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS --json reports/skill_validation.json
python tools/skill-validation/run_validation.py --with-spec-metrics --with-governance
```

## Notes

- `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/scripts/validate_skills.py` and
  `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/scripts/validate_skills.py` delegate to this folder.
- Keep this tooling stable to avoid breaking both platforms.
