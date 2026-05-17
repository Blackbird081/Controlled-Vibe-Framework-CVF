RULE RejectPromptInjection
WHEN violation == "PROMPT_INJECTION"
THEN action = "REJECT"

RULE RejectPIIExposure
WHEN violation == "PII_EXPOSURE"
THEN action = "REJECT"

RULE ReviewDataLeak
WHEN violation == "DATA_LEAK_RISK"
THEN action = "MANUAL_REVIEW"

RULE HighRiskScoreBlock
WHEN risk_score > 75
THEN action = "REJECT"

RULE OverrideAddsRisk
WHEN override_used == true AND risk_score > 60
THEN action = "EXECUTIVE_REVIEW"

# =============================================
# CVF PHASE AUTHORITY RULES
# =============================================

RULE CVFPhaseANoApproval
WHEN cvf_phase == "A" AND risk_score > 20
THEN action = "REJECT"

RULE CVFPhaseBReviewHigh
WHEN cvf_phase == "B" AND risk_score > 60
THEN action = "MANUAL_REVIEW"

RULE CVFPhaseCEscalate
WHEN cvf_phase == "C" AND risk_score > 80
THEN action = "EXECUTIVE_REVIEW"

RULE CVFPhaseDFullAuth
WHEN cvf_phase == "D" AND risk_score > 90
THEN action = "MANUAL_REVIEW"

RULE CVFPhaseEReadOnly
WHEN cvf_phase == "E" AND risk_score > 20
THEN action = "REJECT"

# =============================================
# CVF RISK TIER ENFORCEMENT
# =============================================

RULE CVFRiskR4Block
WHEN cvf_risk_level == "R4"
THEN action = "REJECT"

RULE CVFRiskR3Review
WHEN cvf_risk_level == "R3"
THEN action = "MANUAL_REVIEW"