import { isAbsolute } from 'node:path';
import { probeClaudeCliSubscription, type ClaudeCliProbeOptions } from 'cvf-model-gateway';

export const CLAUDE_SUBSCRIPTION_SURFACE = 'claude_cli_subscription' as const;
export const CLAUDE_SUBSCRIPTION_MODEL = 'sonnet' as const;
export function isClaudeSubscriptionMode(env: NodeJS.ProcessEnv = process.env): boolean {
    return env.CVF_CLAUDE_EXECUTION_MODE === 'subscription_cli';
}
export function resolveClaudeSubscriptionModel(model?: string): 'sonnet' {
    if (model !== undefined && model !== CLAUDE_SUBSCRIPTION_MODEL) throw new Error('CLAUDE_NATIVE_MODEL_UNSUPPORTED');
    return CLAUDE_SUBSCRIPTION_MODEL;
}
export function claudeNativeOptions(signal?: AbortSignal, env: NodeJS.ProcessEnv = process.env, deadlineMonotonicMs?: number): ClaudeCliProbeOptions {
    if (!isClaudeSubscriptionMode(env) || env.CVF_WEB_CANONICAL_MAO_SINGLE_WORKER !== '1'
        || !env.CVF_MAO_DURABLE_RUN_PATH || !isAbsolute(env.CVF_MAO_DURABLE_RUN_PATH)) throw new Error('CLAUDE_NATIVE_NOT_READY');
    const executablePath = env.CVF_CLAUDE_CLI_PATH;
    const executableSha256 = env.CVF_CLAUDE_CLI_SHA256;
    if (!executablePath || !isAbsolute(executablePath) || !/\.exe$/i.test(executablePath)
        || !executableSha256 || !/^[a-f0-9]{64}$/i.test(executableSha256)) throw new Error('CLAUDE_NATIVE_NOT_READY');
    const safeEnv: Record<string, string | undefined> = {};
    for (const name of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'USERPROFILE', 'HOME', 'APPDATA', 'LOCALAPPDATA', 'PATH', 'PATHEXT']) {
        if (env[name] !== undefined) safeEnv[name] = env[name];
    }
    return { executablePath, executableSha256, env: safeEnv, signal, timeoutMs: 5000, ...(deadlineMonotonicMs !== undefined ? { deadlineMonotonicMs } : {}) };
}
export async function claudeSubscriptionReadiness(signal?: AbortSignal) {
    try {
        const status = await probeClaudeCliSubscription(claudeNativeOptions(signal));
        return { state: status.state === 'available' ? 'available' as const : status.state === 'unavailable' ? 'unavailable' as const : 'unknown' as const,
            checkedAt: status.checkedAt, executionSurface: CLAUDE_SUBSCRIPTION_SURFACE };
    } catch {
        return { state: 'unknown' as const, checkedAt: new Date().toISOString(), executionSurface: CLAUDE_SUBSCRIPTION_SURFACE };
    }
}
export async function prepareClaudeSubscription(signal?: AbortSignal) {
    // One absolute deadline covers all execution probes, bridge and adapter phases.
    const options = claudeNativeOptions(signal, process.env, performance.now() + 60000);
    const status = await probeClaudeCliSubscription(options);
    if (status.state !== 'available' || signal?.aborted || performance.now() >= options.deadlineMonotonicMs!) throw new Error('CLAUDE_NATIVE_NOT_READY');
    return options;
}
