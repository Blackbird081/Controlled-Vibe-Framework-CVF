# Certification Schema

Each certified skill must include:

- skillId
- version
- riskLevel (R1 | R2 | R3 | R4)
- uatPassed (true/false)
- reviewer
- approvalDate
- freezeApplied (true/false)
- certificationId (UUID)

Certification Levels:

Level 1 → R1 (Low Risk)
Level 2 → R2 (Medium Risk)
Level 3 → R3 (High Risk)
Level 4 → R4 (Critical Risk)

Certification expires if:
- Skill logic changes
- Risk profile changes
- Model provider changes
- Major version increment
