/**
 * MCP Tool Audit — Gamma
 *
 * Secret-safe in-process audit trail for MCP tool calls. This is intentionally
 * read-only from the repository perspective: it records only tool metadata,
 * argument keys, duration, and success/failure classification.
 */
const auditEntries = [];
let auditSequence = 0;
export function recordMcpToolCall(input) {
    const entry = {
        sequence: ++auditSequence,
        timestamp: new Date().toISOString(),
        toolName: input.toolName,
        argumentKeys: Object.keys(input.args ?? {}).sort(),
        success: input.success,
        durationMs: Math.max(0, Math.round(input.durationMs)),
        diagnosticClass: input.success ? 'none' : 'tool_error',
        safeMessage: input.safeMessage ?? (input.success ? 'Tool call completed.' : 'Tool call failed.'),
    };
    auditEntries.push(entry);
    return entry;
}
export async function withMcpToolAudit(toolName, args, handler) {
    const start = Date.now();
    try {
        const result = await handler();
        recordMcpToolCall({
            toolName,
            args,
            success: true,
            durationMs: Date.now() - start,
        });
        return result;
    }
    catch (error) {
        recordMcpToolCall({
            toolName,
            args,
            success: false,
            durationMs: Date.now() - start,
            safeMessage: error instanceof Error ? error.message : 'Unknown MCP tool error.',
        });
        throw error;
    }
}
export function getMcpToolAuditSnapshot(limit = 50) {
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 50;
    const entries = auditEntries.slice(-safeLimit);
    return {
        totalEntries: auditEntries.length,
        returnedEntries: entries.length,
        entries,
    };
}
export function clearMcpToolAuditForTest() {
    auditEntries.splice(0, auditEntries.length);
    auditSequence = 0;
}
//# sourceMappingURL=mcp-tool-audit.js.map