#!/usr/bin/env node
/**
 * CVF CLI Wrapper — M2.2
 *
 * Provides command-line access to CVF guard evaluation for:
 * - Non-IDE environments (terminals, CI/CD)
 * - Python/shell script integration
 * - Quick manual checks
 *
 * Usage:
 *   cvf check-phase --phase BUILD --role AI_AGENT --action "write code"
 *   cvf check-risk --risk R2 --role AI_AGENT --action "modify database"
 *   cvf check-authority --role AI_AGENT --action "deploy"
 *   cvf evaluate --phase BUILD --risk R1 --role AI_AGENT --action "refactor"
 *   cvf prompt --phase BUILD --risk R1 --role AI_AGENT
 *   cvf audit --limit 10
 *   cvf advance --evidence "All tests passing"
 *   cvf status
 *
 * @module cli/cli
 */
export interface CliResult {
    success: boolean;
    command: string;
    output: Record<string, unknown>;
    exitCode: number;
}
export declare function parseArgs(argv: string[]): {
    command: string;
    flags: Record<string, string>;
};
export declare function executeCommand(command: string, flags: Record<string, string>): CliResult;
export declare function runCli(argv: string[]): CliResult;
export declare function formatOutput(result: CliResult, format?: 'json' | 'text'): string;
//# sourceMappingURL=cli.d.ts.map