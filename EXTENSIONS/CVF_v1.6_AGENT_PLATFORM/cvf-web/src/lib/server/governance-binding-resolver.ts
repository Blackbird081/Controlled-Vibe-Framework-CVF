import fs from 'node:fs';
import path from 'node:path';
import type {
    GovernanceRegistryBindingInput,
    GovernanceUatBindingInput,
} from '@/lib/governance-state-contract';

const REGISTRY_PATH = path.resolve(
    process.cwd(),
    '../../../governance/toolkit/03_CONTROL/CVF_AGENT_REGISTRY.md',
);
const SELF_UAT_LOG_PATH = path.resolve(
    process.cwd(),
    '../../../governance/toolkit/04_TESTING/CVF_SELF_UAT_DECISION_LOG.md',
);
const STATE_REGISTRY_PATH = path.resolve(
    process.cwd(),
    '../../../docs/reference/CVF_GOVERNANCE_STATE_REGISTRY.json',
);

export interface GovernanceBindingsResolution {
    registryBinding?: GovernanceRegistryBindingInput;
    uatBinding?: GovernanceUatBindingInput;
}

export interface GovernanceStateRegistryDocument {
    schemaVersion: string;
    generatedAt: string;
    sources: {
        agentRegistry?: string;
        selfUatDecisionLog?: string;
    };
    agents: Record<string, GovernanceBindingsResolution>;
}

type EntryMap = Record<string, string>;

function extractOperationalSection(markdown: string, title: string): string {
    const pattern = new RegExp(`^##+\\s+(?:\\d+\\.\\s+)?${title}\\s*$`, 'im');
    const match = pattern.exec(markdown);
    if (!match) {
        return markdown;
    }
    return markdown.slice(match.index + match[0].length);
}

function splitMarkdownEntries(markdown: string): string[] {
    return markdown
        .split(/^---$/m)
        .map((block) => block.trim())
        .filter(Boolean);
}

function parseEntry(block: string): EntryMap {
    const entry: EntryMap = {};
    for (const rawLine of block.split(/\r?\n/)) {
        const line = rawLine.trim();
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (!match) continue;
        entry[match[1].trim()] = match[2].trim();
    }
    return entry;
}

function splitCsvField(value?: string): string[] | undefined {
    if (!value) return undefined;
    const items = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return items.length > 0 ? items : undefined;
}

function normalizeAgentId(agentId: string): string {
    return agentId.trim().toUpperCase();
}

export function parseRegistryBindings(markdown: string): GovernanceRegistryBindingInput[] {
    return splitMarkdownEntries(extractOperationalSection(markdown, 'ACTIVE REGISTRY ENTRIES'))
        .map(parseEntry)
        .filter((entry) => entry['Agent ID'])
        .map((entry) => ({
            agentId: entry['Agent ID'],
            certificationStatus: entry['Certification Status'],
            approvedPhases: splitCsvField(entry['Approved Phases']),
            approvedSkills: splitCsvField(entry['Approved Skills']),
            lastSelfUatDate: entry['Last Self-UAT Date'],
        }));
}

export function parseSelfUatBindings(markdown: string): Array<GovernanceUatBindingInput & { agentId: string }> {
    return splitMarkdownEntries(extractOperationalSection(markdown, 'OPERATIONAL LOG ENTRIES'))
        .map(parseEntry)
        .filter((entry) => entry['Agent Identifier'])
        .map((entry) => ({
            agentId: entry['Agent Identifier'],
            status: entry['FINAL RESULT'] === 'PASS'
                ? 'PASS'
                : entry['FINAL RESULT'] === 'FAIL'
                    ? 'FAIL'
                    : 'NOT_TESTED',
            lastRunAt: entry['Timestamp'],
        }));
}

export function parseGovernanceStateRegistry(jsonText: string): GovernanceStateRegistryDocument {
    const raw = JSON.parse(jsonText) as Partial<GovernanceStateRegistryDocument>;
    return {
        schemaVersion: raw.schemaVersion ?? 'unknown',
        generatedAt: raw.generatedAt ?? '',
        sources: raw.sources ?? {},
        agents: raw.agents ?? {},
    };
}

function pickLatestUatBinding(
    agentId: string,
    entries: Array<GovernanceUatBindingInput & { agentId: string }>
): GovernanceUatBindingInput | undefined {
    const matching = entries.filter(
        (entry) => entry.agentId.trim().toUpperCase() === agentId.trim().toUpperCase()
    );
    if (matching.length === 0) return undefined;

    const sorted = [...matching].sort((left, right) => {
        const leftTime = new Date(left.lastRunAt || '').getTime();
        const rightTime = new Date(right.lastRunAt || '').getTime();
        return rightTime - leftTime;
    });

    const latest = sorted[0];
    return {
        status: latest.status,
        lastRunAt: latest.lastRunAt,
    };
}

export function resolveGovernanceBindingsFromMarkdown(
    agentId: string,
    registryMarkdown: string,
    selfUatMarkdown: string
): GovernanceBindingsResolution {
    const registryBinding = parseRegistryBindings(registryMarkdown).find(
        (entry) => entry.agentId && normalizeAgentId(entry.agentId) === normalizeAgentId(agentId)
    );
    const uatBinding = pickLatestUatBinding(agentId, parseSelfUatBindings(selfUatMarkdown));

    return {
        registryBinding,
        uatBinding,
    };
}

export function resolveGovernanceBindingsFromStateRegistry(
    agentId: string,
    stateRegistry: GovernanceStateRegistryDocument
): GovernanceBindingsResolution {
    return stateRegistry.agents[normalizeAgentId(agentId)] ?? {};
}

export function resolveGovernanceBindingsForAgent(agentId?: string): GovernanceBindingsResolution {
    if (!agentId) {
        return {};
    }

    if (fs.existsSync(STATE_REGISTRY_PATH)) {
        try {
            const stateRegistry = parseGovernanceStateRegistry(
                fs.readFileSync(STATE_REGISTRY_PATH, 'utf-8')
            );
            const resolved = resolveGovernanceBindingsFromStateRegistry(agentId, stateRegistry);
            if (resolved.registryBinding || resolved.uatBinding) {
                return resolved;
            }
        } catch {
            // Fall through to markdown parsing for local resilience.
        }
    }

    const registryMarkdown = fs.existsSync(REGISTRY_PATH)
        ? fs.readFileSync(REGISTRY_PATH, 'utf-8')
        : '';
    const selfUatMarkdown = fs.existsSync(SELF_UAT_LOG_PATH)
        ? fs.readFileSync(SELF_UAT_LOG_PATH, 'utf-8')
        : '';

    return resolveGovernanceBindingsFromMarkdown(agentId, registryMarkdown, selfUatMarkdown);
}
