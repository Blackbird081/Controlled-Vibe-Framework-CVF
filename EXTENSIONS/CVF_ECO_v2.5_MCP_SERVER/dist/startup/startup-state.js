/**
 * CVF Startup State Tools — Gamma
 *
 * Read-only helpers for MCP startup memory bootstrap. These helpers resolve
 * repo state from disk and return secret-redacted payloads for agents.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
export const STARTUP_STATE_CONTRACT_VERSION = 'cvf.mcpStartupState.gamma.v1';
const SECRET_PATTERNS = [
    /\b([A-Z0-9_]*(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*)\s*[:=]\s*["']?[^"'\s]+/gi,
    /\b(sk-[A-Za-z0-9_-]{12,})\b/g,
    /\b(xox[baprs]-[A-Za-z0-9-]{12,})\b/g,
];
const GOVERNANCE_RULE_FILES = {
    startup: ['AGENTS.md', 'CVF_SESSION_MEMORY.md', 'CVF_SESSION/ACTIVE_SESSION_STATE.json'],
    live_run: [
        'docs/reference/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md',
        'AGENTS.md',
    ],
    blindspot: [
        'docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-05-24.md',
        'AGENTS.md',
    ],
    public_sync: ['AGENTS.md'],
    mcp_gamma: [
        'docs/roadmaps/CVF_CROSS_AGENT_MEMORY_PROGRESSION_ROADMAP_2026-05-26.md',
        'docs/reviews/CVF_GAMMA_T0_MCP_SERVER_READINESS_AUDIT_COMPLETION_2026-05-26.md',
    ],
    f1_stop_rule: ['AGENTS.md', 'docs/reviews/CVF_F1_DIMINISHING_RETURNS_STOP_RULE_2026-05-15.md'],
};
export function resolveCvfRepo(startDir = process.cwd()) {
    let current = path.resolve(startDir);
    for (let i = 0; i < 12; i++) {
        const sessionMemoryPath = path.join(current, 'CVF_SESSION_MEMORY.md');
        const activeStatePath = path.join(current, 'CVF_SESSION', 'ACTIVE_SESSION_STATE.json');
        if (existsSync(sessionMemoryPath) && existsSync(activeStatePath)) {
            return {
                repoRoot: current,
                sessionMemoryPath,
                activeStatePath,
            };
        }
        const parent = path.dirname(current);
        if (parent === current)
            break;
        current = parent;
    }
    throw new Error('CVF repo root not found from current process directory.');
}
export function redactSensitiveText(input) {
    return SECRET_PATTERNS.reduce((value, pattern) => value.replace(pattern, (match, key) => {
        if (typeof key === 'string' && key !== match)
            return `${key}=<redacted>`;
        return '<redacted-secret>';
    }), input);
}
export function readRedactedFile(repoRoot, relativePath, maxChars = 12000) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (!existsSync(absolutePath)) {
        return {
            path: relativePath,
            exists: false,
            sha256: null,
            bytes: 0,
            truncated: false,
            content: '',
        };
    }
    const raw = readFileSync(absolutePath, 'utf8');
    const redacted = redactSensitiveText(raw);
    const safeMax = Number.isFinite(maxChars) && maxChars > 0 ? Math.min(Math.floor(maxChars), 100000) : 12000;
    return {
        path: relativePath,
        exists: true,
        sha256: createHash('sha256').update(raw).digest('hex'),
        bytes: Buffer.byteLength(raw, 'utf8'),
        truncated: redacted.length > safeMax,
        content: redacted.slice(0, safeMax),
    };
}
export function getSessionMemory(maxChars = 12000, startDir) {
    const repo = resolveCvfRepo(startDir);
    return readRedactedFile(repo.repoRoot, 'CVF_SESSION_MEMORY.md', maxChars);
}
export function getSessionState(maxChars = 12000, startDir) {
    const repo = resolveCvfRepo(startDir);
    return readRedactedFile(repo.repoRoot, 'CVF_SESSION/ACTIVE_SESSION_STATE.json', maxChars);
}
export function getActiveHandoff(maxChars = 12000, startDir) {
    const repo = resolveCvfRepo(startDir);
    const state = readActiveState(repo.repoRoot);
    const activeHandoff = stringOrNull(state.activeHandoff);
    if (!activeHandoff) {
        return {
            path: '<unresolved-active-handoff>',
            exists: false,
            sha256: null,
            bytes: 0,
            truncated: false,
            content: 'ACTIVE_SESSION_STATE.json does not define a valid activeHandoff. Resolve the state registry before reading a handoff.',
        };
    }
    return readRedactedFile(repo.repoRoot, activeHandoff, maxChars);
}
export function buildStartupAcknowledgment(startDir) {
    const repo = resolveCvfRepo(startDir);
    const state = readActiveState(repo.repoRoot);
    const currentMode = stringOrNull(state.currentMode);
    const activeHandoff = stringOrNull(state.activeHandoff);
    const nextAllowedMove = stringOrNull(state.nextAllowedMove);
    const parkedCheckpoint = extractParkedCheckpoint(nextAllowedMove);
    return {
        contractVersion: STARTUP_STATE_CONTRACT_VERSION,
        currentMode,
        activeHandoff,
        nextAllowedMove,
        parkedCheckpoint,
        acknowledgment: `Startup acknowledged: current mode=${currentMode ?? 'unknown'}; active handoff=${activeHandoff ?? 'unknown'}; next allowed move=${nextAllowedMove ?? 'unknown'}; parked checkpoint=${parkedCheckpoint}.`,
        repoRoot: repo.repoRoot,
    };
}
export function getGovernanceRules(topic = 'startup', maxChars = 12000, startDir) {
    const repo = resolveCvfRepo(startDir);
    const normalizedTopic = normalizeTopic(topic);
    const files = GOVERNANCE_RULE_FILES[normalizedTopic] ?? GOVERNANCE_RULE_FILES.startup;
    return {
        contractVersion: STARTUP_STATE_CONTRACT_VERSION,
        topic: normalizedTopic,
        files: files.map((file) => readRedactedFile(repo.repoRoot, file, maxChars)),
    };
}
export function checkGovernanceAction(action) {
    const normalized = action.trim().toLowerCase();
    const requiredRules = ['startup_acknowledgment'];
    const requiredArtifacts = ['CVF_SESSION_MEMORY.md', 'CVF_SESSION/ACTIVE_SESSION_STATE.json'];
    if (!normalized) {
        return {
            contractVersion: STARTUP_STATE_CONTRACT_VERSION,
            action,
            decision: 'CLARIFY',
            requiredRules,
            requiredArtifacts,
            safeMessage: 'Action is empty. Clarify the intended governed work before proceeding.',
        };
    }
    if (/\bf-?1\b|output-quality parity|prompt tuning|token cap/.test(normalized)) {
        return {
            contractVersion: STARTUP_STATE_CONTRACT_VERSION,
            action,
            decision: 'BLOCK',
            requiredRules: [...requiredRules, 'f1_diminishing_returns_stop_rule'],
            requiredArtifacts: [...requiredArtifacts, 'docs/reviews/CVF_F1_DIMINISHING_RETURNS_STOP_RULE_2026-05-15.md'],
            safeMessage: 'Broad F-1 output-quality parity tuning is closed and must not continue without fresh explicit authorization.',
        };
    }
    if (/live|api key|provider|browser proof|cli proof|mcp proof|service-token/.test(normalized)) {
        requiredRules.push('mandatory_live_run_diagnostics', 'mandatory_live_governance_proof_when_claiming_governance_behavior');
        requiredArtifacts.push('docs/reference/CVF_LIVE_RUN_DIAGNOSTIC_STANDARD_2026-05-24.md');
    }
    if (/memory|graph|intelligence|legacy|external skill|knowledge absorption|mcp|tool/.test(normalized)) {
        requiredRules.push('knowledge_absorption_blindspot_control_block');
        requiredArtifacts.push('docs/reference/CVF_KNOWLEDGE_ABSORPTION_BLINDSPOT_PREVENTION_STANDARD_2026-05-24.md');
    }
    if (/public|github|push|catalog|public-sync/.test(normalized)) {
        requiredRules.push('public_repository_boundary');
        requiredArtifacts.push('AGENTS.md', 'd:\\UNG DUNG AI\\TOOL AI 2026\\Controlled-Vibe-Framework-CVF-public-sync');
    }
    return {
        contractVersion: STARTUP_STATE_CONTRACT_VERSION,
        action,
        decision: 'ALLOW_WITH_GUARDS',
        requiredRules: Array.from(new Set(requiredRules)),
        requiredArtifacts: Array.from(new Set(requiredArtifacts)),
        safeMessage: 'Action may proceed only after satisfying the listed CVF guards and artifact requirements.',
    };
}
function readActiveState(repoRoot) {
    const raw = readFileSync(path.join(repoRoot, 'CVF_SESSION', 'ACTIVE_SESSION_STATE.json'), 'utf8');
    return JSON.parse(raw);
}
function stringOrNull(value) {
    return typeof value === 'string' && value.trim() ? value : null;
}
function extractParkedCheckpoint(nextAllowedMove) {
    if (!nextAllowedMove)
        return 'none';
    const marker = 'Parked checkpoint remains ';
    const index = nextAllowedMove.indexOf(marker);
    if (index < 0)
        return 'none';
    return nextAllowedMove.slice(index + marker.length).trim();
}
function normalizeTopic(topic) {
    const normalized = topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (normalized === 'live' || normalized === 'live_run_diagnostics')
        return 'live_run';
    if (normalized === 'knowledge' || normalized === 'knowledge_absorption')
        return 'blindspot';
    if (normalized === 'public')
        return 'public_sync';
    if (normalized === 'mcp' || normalized === 'gamma')
        return 'mcp_gamma';
    if (normalized === 'f1')
        return 'f1_stop_rule';
    return normalized || 'startup';
}
//# sourceMappingURL=startup-state.js.map