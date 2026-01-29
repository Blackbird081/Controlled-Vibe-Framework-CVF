// Sample data for CVF Dashboard
// In production, this would be loaded from registry.json and audit_logs.json

const sampleCapabilities = [
    {
        capability_id: "CODE_REVIEW_v1",
        domain: "development",
        description: "Review code for quality, security, and best practices",
        risk_level: "R1",
        version: "1.0",
        state: "ACTIVE",
        owner: "dev-team",
        registered_by: "admin@example.com",
        last_audit: "2026-01-29T10:00:00Z",
        transitions: [
            { from: "PROPOSED", to: "APPROVED", actor: "reviewer@example.com", timestamp: "2026-01-28T14:00:00Z" },
            { from: "APPROVED", to: "ACTIVE", actor: "admin@example.com", timestamp: "2026-01-28T15:00:00Z" }
        ]
    },
    {
        capability_id: "DATABASE_QUERY_v1",
        domain: "data",
        description: "Execute read-only SQL queries against configured databases",
        risk_level: "R2",
        version: "1.0",
        state: "ACTIVE",
        owner: "data-team",
        registered_by: "dba@example.com",
        last_audit: "2026-01-29T09:30:00Z",
        transitions: [
            { from: "PROPOSED", to: "APPROVED", actor: "security@example.com", timestamp: "2026-01-27T10:00:00Z" },
            { from: "APPROVED", to: "ACTIVE", actor: "admin@example.com", timestamp: "2026-01-27T11:00:00Z" }
        ]
    },
    {
        capability_id: "FILE_WRITE_v1",
        domain: "devops",
        description: "Write content to files in designated directories",
        risk_level: "R3",
        version: "1.0",
        state: "ACTIVE",
        owner: "devops-team",
        registered_by: "ops@example.com",
        last_audit: "2026-01-29T08:00:00Z",
        transitions: [
            { from: "PROPOSED", to: "APPROVED", actor: "security@example.com", timestamp: "2026-01-25T14:00:00Z" },
            { from: "APPROVED", to: "ACTIVE", actor: "cto@example.com", timestamp: "2026-01-26T09:00:00Z" }
        ]
    },
    {
        capability_id: "TEXT_ANALYSIS_v1",
        domain: "nlp",
        description: "Analyze text for sentiment and key phrases",
        risk_level: "R0",
        version: "1.0",
        state: "ACTIVE",
        owner: "ai-team",
        registered_by: "ml@example.com",
        last_audit: "2026-01-29T11:00:00Z",
        transitions: [
            { from: "PROPOSED", to: "APPROVED", actor: "reviewer@example.com", timestamp: "2026-01-20T10:00:00Z" },
            { from: "APPROVED", to: "ACTIVE", actor: "admin@example.com", timestamp: "2026-01-20T11:00:00Z" }
        ]
    },
    {
        capability_id: "LEGACY_REPORT_v1",
        domain: "reporting",
        description: "Generate legacy format reports",
        risk_level: "R1",
        version: "1.0",
        state: "DEPRECATED",
        owner: "reporting-team",
        registered_by: "report@example.com",
        last_audit: "2026-01-15T10:00:00Z",
        deprecation_reason: "Replaced by REPORT_GENERATOR_v2",
        transitions: [
            { from: "PROPOSED", to: "APPROVED", actor: "reviewer@example.com", timestamp: "2025-06-01T10:00:00Z" },
            { from: "APPROVED", to: "ACTIVE", actor: "admin@example.com", timestamp: "2025-06-02T10:00:00Z" },
            { from: "ACTIVE", to: "DEPRECATED", actor: "owner@example.com", timestamp: "2026-01-15T10:00:00Z" }
        ]
    },
    {
        capability_id: "OLD_AUTH_v1",
        domain: "security",
        description: "Legacy authentication method",
        risk_level: "R2",
        version: "1.0",
        state: "RETIRED",
        owner: "security-team",
        registered_by: "sec@example.com",
        last_audit: "2025-12-01T10:00:00Z",
        transitions: [
            { from: "PROPOSED", to: "APPROVED", actor: "reviewer@example.com", timestamp: "2025-01-01T10:00:00Z" },
            { from: "APPROVED", to: "ACTIVE", actor: "admin@example.com", timestamp: "2025-01-02T10:00:00Z" },
            { from: "ACTIVE", to: "DEPRECATED", actor: "owner@example.com", timestamp: "2025-10-01T10:00:00Z" },
            { from: "DEPRECATED", to: "RETIRED", actor: "admin@example.com", timestamp: "2025-12-01T10:00:00Z" }
        ]
    },
    {
        capability_id: "EMAIL_SENDER_v1",
        domain: "communication",
        description: "Send emails via configured SMTP",
        risk_level: "R2",
        version: "1.0",
        state: "PROPOSED",
        owner: "comm-team",
        registered_by: "comm@example.com",
        last_audit: null,
        transitions: []
    }
];

const sampleAuditLogs = [
    {
        id: "audit-001",
        timestamp: "2026-01-29T12:15:00Z",
        capability_id: "CODE_REVIEW_v1",
        version: "1.0",
        actor: "claude_adapter",
        inputs: { code: "def hello(): pass", language: "python" },
        outputs: { issues: [], score: 95 },
        success: true,
        duration_ms: 1250,
        context: { user: "developer@example.com" }
    },
    {
        id: "audit-002",
        timestamp: "2026-01-29T12:10:00Z",
        capability_id: "DATABASE_QUERY_v1",
        version: "1.0",
        actor: "openai_adapter",
        inputs: { query: "SELECT * FROM users LIMIT 10", database: "prod" },
        outputs: { row_count: 10, columns: ["id", "name", "email"] },
        success: true,
        duration_ms: 850,
        context: { user: "analyst@example.com" }
    },
    {
        id: "audit-003",
        timestamp: "2026-01-29T12:05:00Z",
        capability_id: "FILE_WRITE_v1",
        version: "1.0",
        actor: "claude_adapter",
        inputs: { path: "/app/config.json", content: "{}" },
        outputs: { success: true, bytes_written: 2 },
        success: true,
        duration_ms: 320,
        context: { user: "devops@example.com", approval: "APPROVED" }
    },
    {
        id: "audit-004",
        timestamp: "2026-01-29T11:58:00Z",
        capability_id: "CODE_REVIEW_v1",
        version: "1.0",
        actor: "claude_adapter",
        inputs: { code: "eval(user_input)", language: "python" },
        outputs: { issues: ["Critical: eval() with user input is dangerous"], score: 20 },
        success: true,
        duration_ms: 980,
        context: { user: "junior@example.com" }
    },
    {
        id: "audit-005",
        timestamp: "2026-01-29T11:50:00Z",
        capability_id: "DATABASE_QUERY_v1",
        version: "1.0",
        actor: "openai_adapter",
        inputs: { query: "DROP TABLE users", database: "prod" },
        outputs: null,
        success: false,
        error: "Query rejected: not a SELECT statement",
        duration_ms: 50,
        context: { user: "attacker@example.com" }
    },
    {
        id: "audit-006",
        timestamp: "2026-01-29T11:45:00Z",
        capability_id: "TEXT_ANALYSIS_v1",
        version: "1.0",
        actor: "generic_adapter",
        inputs: { text: "This product is amazing!" },
        outputs: { sentiment: "positive", confidence: 0.95 },
        success: true,
        duration_ms: 450,
        context: { user: "marketing@example.com" }
    },
    {
        id: "audit-007",
        timestamp: "2026-01-29T11:30:00Z",
        capability_id: "CODE_REVIEW_v1",
        version: "1.0",
        actor: "claude_adapter",
        inputs: { code: "class User: ...", language: "python" },
        outputs: { issues: ["Missing docstring"], score: 85 },
        success: true,
        duration_ms: 1100,
        context: { user: "developer@example.com" }
    }
];

// Export for use in app.js
window.cvfData = {
    capabilities: sampleCapabilities,
    auditLogs: sampleAuditLogs
};
