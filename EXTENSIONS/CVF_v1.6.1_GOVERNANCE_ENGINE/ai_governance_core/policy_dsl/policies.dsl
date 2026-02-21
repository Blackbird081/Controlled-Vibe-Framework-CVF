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