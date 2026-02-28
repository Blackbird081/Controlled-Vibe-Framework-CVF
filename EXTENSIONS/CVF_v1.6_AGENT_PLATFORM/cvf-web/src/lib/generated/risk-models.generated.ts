/**
 * AUTO-GENERATED FILE. DO NOT EDIT.
 * Source of truth:
 * - ../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/risk.matrix.json
 * - ../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/destructive.rules.json
 * - ../../CVF_v1.7.3_RUNTIME_ADAPTER_HUB/risk_models/escalation.thresholds.json
 */

export const GENERATED_RISK_MATRIX = [
    {
        "intent": "FILE_READ",
        "label": {
            "vi": "Doc tep",
            "en": "File Read"
        },
        "baseScore": 20,
        "category": "safe"
    },
    {
        "intent": "FILE_WRITE",
        "label": {
            "vi": "Ghi tep",
            "en": "File Write"
        },
        "baseScore": 60,
        "category": "caution"
    },
    {
        "intent": "FILE_DELETE",
        "label": {
            "vi": "Xoa tep",
            "en": "File Delete"
        },
        "baseScore": 85,
        "category": "dangerous"
    },
    {
        "intent": "EMAIL_SEND",
        "label": {
            "vi": "Gui email",
            "en": "Email Send"
        },
        "baseScore": 55,
        "category": "caution"
    },
    {
        "intent": "API_CALL",
        "label": {
            "vi": "Goi API ngoai",
            "en": "External API Call"
        },
        "baseScore": 70,
        "category": "dangerous"
    },
    {
        "intent": "CODE_EXECUTION",
        "label": {
            "vi": "Thuc thi shell",
            "en": "Shell Execution"
        },
        "baseScore": 95,
        "category": "critical"
    },
    {
        "intent": "DATA_EXPORT",
        "label": {
            "vi": "Xuat du lieu",
            "en": "Data Export"
        },
        "baseScore": 50,
        "category": "caution"
    },
    {
        "intent": "SHELL_COMMAND",
        "label": {
            "vi": "Lenh shell",
            "en": "Shell Command"
        },
        "baseScore": 95,
        "category": "critical"
    },
    {
        "intent": "DB_WRITE",
        "label": {
            "vi": "Ghi co so du lieu",
            "en": "Database Write"
        },
        "baseScore": 75,
        "category": "dangerous"
    },
    {
        "intent": "DB_DELETE",
        "label": {
            "vi": "Xoa co so du lieu",
            "en": "Database Drop/Delete"
        },
        "baseScore": 98,
        "category": "critical"
    }
];

export const GENERATED_DESTRUCTIVE_RULES = [
    {
        "pattern": "rm -rf",
        "label": {
            "vi": "Mau nguy hiem: rm -rf",
            "en": "Destructive pattern: rm -rf"
        },
        "riskBoost": 30
    },
    {
        "pattern": "del /f /q",
        "label": {
            "vi": "Mau nguy hiem: del /f /q",
            "en": "Destructive pattern: del /f /q"
        },
        "riskBoost": 30
    },
    {
        "pattern": "format c:",
        "label": {
            "vi": "Mau nguy hiem: format c:",
            "en": "Destructive pattern: format c:"
        },
        "riskBoost": 30
    },
    {
        "pattern": "drop table",
        "label": {
            "vi": "Mau nguy hiem: drop table",
            "en": "Destructive pattern: drop table"
        },
        "riskBoost": 25
    },
    {
        "pattern": "truncate table",
        "label": {
            "vi": "Mau nguy hiem: truncate table",
            "en": "Destructive pattern: truncate table"
        },
        "riskBoost": 25
    },
    {
        "pattern": "delete *",
        "label": {
            "vi": "Mau nguy hiem: delete *",
            "en": "Destructive pattern: delete *"
        },
        "riskBoost": 20
    },
    {
        "pattern": "recursive delete",
        "label": {
            "vi": "Mau nguy hiem: recursive delete",
            "en": "Destructive pattern: recursive delete"
        },
        "riskBoost": 20
    }
];

export const GENERATED_ESCALATION_THRESHOLDS = [
    {
        "level": "ALLOW",
        "minScore": 0,
        "maxScore": 39,
        "action": "EXECUTE",
        "color": "bg-emerald-500",
        "label": {
            "vi": "Cho phep",
            "en": "Allow"
        }
    },
    {
        "level": "REVIEW",
        "minScore": 40,
        "maxScore": 69,
        "action": "REVIEW",
        "color": "bg-amber-500",
        "label": {
            "vi": "Can duyet",
            "en": "Review"
        }
    },
    {
        "level": "SANDBOX",
        "minScore": 70,
        "maxScore": 89,
        "action": "SANDBOX",
        "color": "bg-orange-500",
        "label": {
            "vi": "Chay sandbox",
            "en": "Sandbox"
        }
    },
    {
        "level": "DENY",
        "minScore": 90,
        "maxScore": 100,
        "action": "BLOCK",
        "color": "bg-red-500",
        "label": {
            "vi": "Tu choi",
            "en": "Deny"
        }
    }
];
