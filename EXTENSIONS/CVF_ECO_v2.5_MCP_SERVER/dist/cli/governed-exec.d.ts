#!/usr/bin/env node
/** Thin Delta-T3 `cvf-governed-exec` binary. */
export interface GovernedExecCliArgs {
    profileId: string;
    workspaceRoot: string;
    cwd?: string;
    json: boolean;
}
export declare function parseGovernedExecArgs(argv: string[]): GovernedExecCliArgs;
export declare function runGovernedExecCli(argv: string[]): Promise<number>;
//# sourceMappingURL=governed-exec.d.ts.map