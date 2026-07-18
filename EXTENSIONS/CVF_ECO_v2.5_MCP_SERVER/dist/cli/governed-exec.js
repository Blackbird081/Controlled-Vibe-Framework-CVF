#!/usr/bin/env node
/** Thin Delta-T3 `cvf-governed-exec` binary. */
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createGuardEngine } from '../guards/index.js';
import { JsonFileAdapter } from '../persistence/json-file.adapter.js';
import { JsonReceiptConsumptionStore } from '../persistence/json-receipt-consumption.store.js';
import { JsonGovernedExecutionStore } from '../persistence/json-governed-execution.store.js';
import { serializePreflightPersistence } from '../tools/governance-action-preflight.js';
import { DirectGovernedCommandRunner, GOVERNED_COMMAND_PROFILE_IDS, launchGovernedCommand, } from './governed-command-launcher.js';
import { JsonMutatingProfileApprovalPolicy } from './mutating-profile-approval.js';
export function parseGovernedExecArgs(argv) {
    const allowed = new Set(['--profile', '--workspace', '--cwd', '--json']);
    const values = new Map();
    let json = false;
    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (!allowed.has(token))
            throw new Error(`Unsupported argument: ${token}`);
        if (token === '--json') {
            json = true;
            continue;
        }
        const value = argv[index + 1];
        if (!value || value.startsWith('--'))
            throw new Error(`Missing value for ${token}`);
        if (values.has(token))
            throw new Error(`Duplicate argument: ${token}`);
        values.set(token, value);
        index += 1;
    }
    const profileId = values.get('--profile');
    if (!profileId) {
        throw new Error(`--profile is required (${GOVERNED_COMMAND_PROFILE_IDS.join(', ')})`);
    }
    return {
        profileId,
        workspaceRoot: values.get('--workspace') ?? process.cwd(),
        cwd: values.get('--cwd'),
        json,
    };
}
function resolveAuditDir() {
    const configured = process.env.CVF_MCP_DELTA_AUDIT_DIR?.trim();
    return configured ? resolve(configured) : join(homedir(), '.cvf', 'mcp', 'delta-audit');
}
export async function runGovernedExecCli(argv) {
    let args;
    try {
        args = parseGovernedExecArgs(argv);
    }
    catch (error) {
        process.stderr.write(`${error instanceof Error ? error.message : 'Invalid arguments.'}\n`);
        return 2;
    }
    const dataDir = resolveAuditDir();
    const auditAdapter = new JsonFileAdapter({ dataDir });
    const response = await launchGovernedCommand({
        profileId: args.profileId,
        workspaceRoot: args.workspaceRoot,
        cwd: args.cwd,
        agentId: 'cvf-governed-exec',
    }, {
        engine: createGuardEngine(),
        preflightPersistence: serializePreflightPersistence(auditAdapter),
        receiptStore: new JsonReceiptConsumptionStore({ dataDir, auditReader: auditAdapter }),
        executionStore: new JsonGovernedExecutionStore(dataDir),
        runner: new DirectGovernedCommandRunner(),
        approvalPolicy: new JsonMutatingProfileApprovalPolicy(dataDir),
    });
    const output = args.json
        ? JSON.stringify(response, null, 2)
        : `[CVF] ${response.profileId ?? args.profileId}: ${response.accepted ? 'COMPLETED' : 'FAILED'} (exit=${response.exitCode ?? 'N/A'})`;
    (response.accepted ? process.stdout : process.stderr).write(`${output}\n`);
    return response.accepted ? 0 : 1;
}
const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
    runGovernedExecCli(process.argv.slice(2))
        .then((exitCode) => {
        process.exitCode = exitCode;
    })
        .catch(() => {
        process.stderr.write('Governed command launcher failed closed.\n');
        process.exitCode = 1;
    });
}
//# sourceMappingURL=governed-exec.js.map