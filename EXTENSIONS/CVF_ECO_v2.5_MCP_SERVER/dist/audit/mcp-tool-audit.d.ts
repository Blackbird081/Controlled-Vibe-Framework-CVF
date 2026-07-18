/**
 * MCP Tool Audit — Gamma
 *
 * Secret-safe in-process audit trail for MCP tool calls. This is intentionally
 * read-only from the repository perspective: it records only tool metadata,
 * argument keys, duration, and success/failure classification.
 */
export interface McpToolAuditEntry {
    sequence: number;
    timestamp: string;
    toolName: string;
    argumentKeys: string[];
    success: boolean;
    durationMs: number;
    diagnosticClass: 'none' | 'tool_error';
    safeMessage: string;
}
export interface McpToolAuditSnapshot {
    totalEntries: number;
    returnedEntries: number;
    entries: McpToolAuditEntry[];
}
export declare function recordMcpToolCall(input: {
    toolName: string;
    args?: Record<string, unknown>;
    success: boolean;
    durationMs: number;
    safeMessage?: string;
}): McpToolAuditEntry;
export declare function withMcpToolAudit<T>(toolName: string, args: Record<string, unknown> | undefined, handler: () => Promise<T> | T): Promise<T>;
export declare function getMcpToolAuditSnapshot(limit?: number): McpToolAuditSnapshot;
export declare function clearMcpToolAuditForTest(): void;
//# sourceMappingURL=mcp-tool-audit.d.ts.map