import { existsSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';

const ACTIVE_STATE_PATH = 'CVF_SESSION/ACTIVE_SESSION_STATE.json';
const WORKSPACE_STATE_PATH = 'CVF_SESSION/agent_workspace/ACTIVE_AGENT_WORKSPACE_STATE.json';
const SESSION_MEMORY_PATH = 'CVF_SESSION_MEMORY.md';
const ROADMAP_PATH = 'docs/roadmaps/CVF_WEB_WORKSPACE_UPGRADE_ROADMAP_2026-06-18.md';
const WORK_ORDER_PATH = 'docs/work_orders/CVF_AGENT_WORK_ORDER_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_FOR_CODEX_2026-06-18.md';
const GC018_PATH = 'docs/baselines/CVF_GC018_WWU_T2_CVF_WEB_WORKSPACE_OPERATOR_DASHBOARD_READ_MODEL_2026-06-18.md';
const LANE_ORDER = [
    'intake',
    'dispatch',
    'execution',
    'worker_return',
    'review',
    'accepted_material',
    'session_sync',
    'parked',
    'blocked',
    'archive_ready',
];

interface ActiveSessionState {
    currentMode?: string;
    previousMode?: string;
    activeHandoff?: string;
    activeReviewQueue?: string;
    nextAllowedMove?: { value?: string } | string;
    wwuT2CvfWebWorkspaceOperatorDashboardReadModelDispatch20260618?: {
        status?: string;
        materialCommit?: string;
        workOrder?: string;
        gc018?: string;
        roadmap?: string;
        claimBoundary?: string;
    };
}

interface AgentWorkspaceStateItem {
    workspaceItemId?: string;
    lane?: string;
    itemKind?: string;
    status?: string;
    ownerRole?: string;
    phase?: string;
    sourceWorkOrder?: string;
    evidencePaths?: string[];
    claimBoundary?: string;
    nextMoveImpact?: string;
    resumeCondition?: string;
}

interface AgentWorkspaceState {
    status?: string;
    items?: AgentWorkspaceStateItem[];
}

export interface WorkspaceLink {
    label: string;
    href: string;
    description: string;
    kind: 'evidence' | 'guard' | 'workflow' | 'source';
}

export interface WorkspaceSourceStatus {
    label: string;
    path: string;
    status: string;
    exists: boolean;
}

export interface WorkspaceLaneSummaryItem {
    workspaceItemId: string;
    itemKind: string;
    status: string;
    ownerRole: string;
    phase: string;
    sourceWorkOrder: string;
    evidencePaths: string[];
    claimBoundary: string;
    nextMoveImpact: string;
    resumeCondition: string;
}

export interface WorkspaceLaneSummary {
    lane: string;
    count: number;
    statuses: string[];
    recentItems: WorkspaceLaneSummaryItem[];
}

export interface CvfWorkspaceReadModel {
    generatedAt: string;
    activeSessionMode: string;
    previousMode: string;
    activeHandoff: {
        path: string;
        exists: boolean;
        startupAcknowledgment: string;
        nextAllowedMove: string;
    };
    nextAllowedMove: string;
    parkedCheckpoints: string[];
    roadmap: WorkspaceSourceStatus;
    workOrder: WorkspaceSourceStatus;
    gc018: WorkspaceSourceStatus;
    workspaceState: WorkspaceSourceStatus;
    laneSummaries: WorkspaceLaneSummary[];
    dispatch: {
        status: string;
        materialCommit: string;
        claimBoundary: string;
    };
    links: WorkspaceLink[];
    sources: WorkspaceSourceStatus[];
    boundary: string;
}

export interface CvfWorkspaceReadModelOptions {
    repoRoot?: string;
    now?: Date;
}

function resolveRepoRoot(start = process.cwd()): string {
    let current = resolve(start);

    for (let depth = 0; depth < 8; depth += 1) {
        if (existsSync(resolve(current, ACTIVE_STATE_PATH))) {
            return current;
        }
        const parent = dirname(current);
        if (parent === current) break;
        current = parent;
    }

    return resolve(start, '..', '..', '..');
}

function readText(repoRoot: string, path: string): string | null {
    const absolutePath = resolve(repoRoot, path);
    if (!existsSync(absolutePath)) return null;
    return readFileSync(absolutePath, 'utf8');
}

function readJson<T>(repoRoot: string, path: string): T | null {
    const text = readText(repoRoot, path);
    if (text === null) return null;
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

function readStatus(content: string | null): string {
    if (content === null) return 'MISSING';
    const match = content?.match(/^Status:\s*`?([^`\r\n]+)`?/m);
    return match?.[1]?.trim() ?? 'PRESENT';
}

function readSection(content: string | null, heading: string): string {
    if (!content) return 'Source not found.';
    const pattern = new RegExp(`^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
    const match = pattern.exec(content);
    if (!match) return 'Section not found.';

    const rest = content.slice(match.index + match[0].length);
    const nextHeading = rest.search(/^## /m);
    return (nextHeading >= 0 ? rest.slice(0, nextHeading) : rest).trim();
}

function firstParagraph(text: string, maxLength = 520): string {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function nextAllowedMoveFromState(state: ActiveSessionState, sessionMemory: string | null): string {
    const entry = state.nextAllowedMove;
    if (typeof entry === 'string') return entry;
    if (entry?.value) return entry.value;
    return firstParagraph(readSection(sessionMemory, 'Next Allowed Move'));
}

function extractParkedCheckpoints(nextMove: string, handoffNextMove: string): string[] {
    const text = `${nextMove} ${handoffNextMove}`;
    const sentences = text
        .split(/(?<=\.)\s+/)
        .map(sentence => sentence.trim())
        .filter(Boolean);

    const matches = sentences.filter(sentence =>
        /\b(parked|held|not authorized|no Local Workspace Runtime|no Local Runtime|no provider|no public-sync|no readiness)\b/i.test(sentence),
    );

    const unique: string[] = [];
    const seen = new Set<string>();
    matches.forEach((sentence) => {
        const key = sentence.toLowerCase().replace(/[`.,]/g, '').replace(/\s+/g, ' ').trim();
        if (seen.has(key)) return;
        seen.add(key);
        unique.push(sentence);
    });

    return unique.slice(0, 6);
}

function sourceStatus(repoRoot: string, label: string, path: string): WorkspaceSourceStatus {
    const content = readText(repoRoot, path);
    return {
        label,
        path,
        status: readStatus(content),
        exists: content !== null,
    };
}

function sourceExists(repoRoot: string, path: string): boolean {
    return existsSync(resolve(repoRoot, path));
}

function normalizeLaneItem(item: AgentWorkspaceStateItem): WorkspaceLaneSummaryItem {
    return {
        workspaceItemId: item.workspaceItemId ?? 'UNKNOWN',
        itemKind: item.itemKind ?? 'UNKNOWN',
        status: item.status ?? 'UNKNOWN',
        ownerRole: item.ownerRole ?? 'UNKNOWN',
        phase: item.phase ?? 'UNKNOWN',
        sourceWorkOrder: item.sourceWorkOrder ?? 'N/A',
        evidencePaths: item.evidencePaths ?? [],
        claimBoundary: item.claimBoundary ?? 'N/A',
        nextMoveImpact: item.nextMoveImpact ?? 'N/A',
        resumeCondition: item.resumeCondition ?? 'N/A',
    };
}

function laneSortKey(lane: string): number {
    const index = LANE_ORDER.indexOf(lane);
    return index >= 0 ? index : LANE_ORDER.length;
}

function summarizeWorkspaceLanes(state: AgentWorkspaceState | null): WorkspaceLaneSummary[] {
    const groups = new Map<string, AgentWorkspaceStateItem[]>();
    for (const item of state?.items ?? []) {
        const lane = item.lane ?? 'unknown';
        groups.set(lane, [...(groups.get(lane) ?? []), item]);
    }

    return [...groups.entries()]
        .sort(([left], [right]) => laneSortKey(left) - laneSortKey(right) || left.localeCompare(right))
        .map(([lane, items]) => {
            const statuses = [...new Set(items.map(item => item.status ?? 'UNKNOWN'))].sort();
            return {
                lane,
                count: items.length,
                statuses,
                recentItems: items.slice(0, 3).map(normalizeLaneItem),
            };
        });
}

export function getCvfWorkspaceReadModel(options: CvfWorkspaceReadModelOptions = {}): CvfWorkspaceReadModel {
    const repoRoot = options.repoRoot ?? resolveRepoRoot();
    const stateRaw = readText(repoRoot, ACTIVE_STATE_PATH);
    const state = stateRaw ? JSON.parse(stateRaw) as ActiveSessionState : {};
    const sessionMemory = readText(repoRoot, SESSION_MEMORY_PATH);
    const activeHandoffPath = state.activeHandoff ?? 'AGENT_HANDOFF_V19_2026-06-15.md';
    const activeHandoff = readText(repoRoot, activeHandoffPath);
    const handoffStartup = readSection(activeHandoff, 'Startup Acknowledgment');
    const handoffNextMove = readSection(activeHandoff, 'Next Allowed Move');
    const nextAllowedMove = nextAllowedMoveFromState(state, sessionMemory);
    const dispatch = state.wwuT2CvfWebWorkspaceOperatorDashboardReadModelDispatch20260618 ?? {};
    const agentWorkspaceState = readJson<AgentWorkspaceState>(repoRoot, WORKSPACE_STATE_PATH);

    const roadmap = sourceStatus(repoRoot, 'WWU roadmap', dispatch.roadmap ?? ROADMAP_PATH);
    const workOrder = sourceStatus(repoRoot, 'WWU-T2 work order', dispatch.workOrder ?? WORK_ORDER_PATH);
    const gc018 = sourceStatus(repoRoot, 'WWU-T2 GC-018', dispatch.gc018 ?? GC018_PATH);
    const workspaceState = sourceStatus(repoRoot, 'Generated workspace state', WORKSPACE_STATE_PATH);

    const sources: WorkspaceSourceStatus[] = [
        sourceStatus(repoRoot, 'Active session state', ACTIVE_STATE_PATH),
        workspaceState,
        sourceStatus(repoRoot, 'Session memory front door', SESSION_MEMORY_PATH),
        sourceStatus(repoRoot, 'Active handoff', activeHandoffPath),
        roadmap,
        workOrder,
        gc018,
    ];

    return {
        generatedAt: (options.now ?? new Date()).toISOString(),
        activeSessionMode: state.currentMode ?? 'UNKNOWN',
        previousMode: state.previousMode ?? 'UNKNOWN',
        activeHandoff: {
            path: activeHandoffPath,
            exists: sourceExists(repoRoot, activeHandoffPath),
            startupAcknowledgment: firstParagraph(handoffStartup),
            nextAllowedMove: firstParagraph(handoffNextMove),
        },
        nextAllowedMove,
        parkedCheckpoints: extractParkedCheckpoints(nextAllowedMove, handoffNextMove),
        roadmap,
        workOrder,
        gc018,
        workspaceState,
        laneSummaries: summarizeWorkspaceLanes(agentWorkspaceState),
        dispatch: {
            status: dispatch.status ?? 'UNKNOWN',
            materialCommit: dispatch.materialCommit ?? 'UNKNOWN',
            claimBoundary: dispatch.claimBoundary ?? 'Read-only CVF Web Workspace projection only.',
        },
        links: [
            {
                label: 'Evidence State',
                href: '/governance/evidence',
                description: 'Recorded evidence, receipts, provider lanes, and policy references.',
                kind: 'evidence',
            },
            {
                label: 'System Health',
                href: '/governance/system-health',
                description: 'Read-only local install, provider-key presence, and release proof status.',
                kind: 'guard',
            },
            {
                label: 'Governance Operations',
                href: '/governance/operations',
                description: 'Existing governed job area. WWU-T2 links here instead of adding mutation controls.',
                kind: 'workflow',
            },
            {
                label: 'Approval Inbox',
                href: '/admin/approvals',
                description: 'Existing approval surface for later governed action flows.',
                kind: 'workflow',
            },
            {
                label: 'Work Transfer',
                href: '/work-transfer',
                description: 'Existing work-transfer context and audit readout.',
                kind: 'workflow',
            },
            {
                label: 'Runtime Monitor',
                href: '/runtime',
                description: 'Linked for inspection only; this dashboard does not claim runtime enforcement.',
                kind: 'guard',
            },
        ],
        sources,
        boundary: 'CVF_WEB_WORKSPACE read-only projection. No Local Runtime/MCP, provider/live call, public-sync, runtime mutation, or readiness claim.',
    };
}
