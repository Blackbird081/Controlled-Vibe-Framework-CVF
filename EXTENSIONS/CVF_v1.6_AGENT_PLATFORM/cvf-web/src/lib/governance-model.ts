// Text Encoding Exception: localized Vietnamese labels and established UI symbols.
import { GENERATED_GOVERNANCE_MODEL } from './generated/governance-model.generated';

const { phaseOrder, roles, riskOrder, riskLabels, phaseRoleMatrix, authorityMatrix } = GENERATED_GOVERNANCE_MODEL;

export type CVFPhaseToolkit = typeof phaseOrder[number];
export type CVFRole = typeof roles[number];
export type RuntimeRisk = typeof riskOrder[number];
export type CVFRiskLevel = keyof typeof riskLabels;

const PHASE_PRESENTATION = {
    INTAKE: { label: 'Thu thập', icon: '📥', color: 'bg-blue-500' },
    DESIGN: { label: 'Thiết kế', icon: '✏️', color: 'bg-purple-500' },
    BUILD: { label: 'Thực thi', icon: '🔨', color: 'bg-green-500' },
    REVIEW: { label: 'Đánh giá', icon: '✅', color: 'bg-orange-500' },
    FREEZE: { label: 'Khóa', icon: '🔒', color: 'bg-red-500' },
} satisfies Record<CVFPhaseToolkit, { label: string; icon: string; color: string }>;

// The persona picker exposes the five toolkit roles. Authenticated execution
// identities use the full runtime role set and come from the server.
const PERSONA_PRESENTATION: Partial<Record<CVFRole, { label: string; icon: string }>> = {
    OBSERVER: { label: 'Quan sát', icon: '👁️' },
    ANALYST: { label: 'Phân tích', icon: '🔍' },
    BUILDER: { label: 'Xây dựng', icon: '🛠️' },
    REVIEWER: { label: 'Đánh giá', icon: '📋' },
    GOVERNOR: { label: 'Quản trị', icon: '🏛️' },
};

const RISK_PRESENTATION: Record<CVFRiskLevel, { label: string; labelEn?: string; icon: string; color: string }> = {
    R0: { label: 'Rất thấp', labelEn: 'Minimal', icon: '⚪', color: 'bg-gray-400' },
    R1: { label: 'Có kiểm soát', icon: '🟢', color: 'bg-green-500' },
    R2: { label: 'Cần xem xét', icon: '🟡', color: 'bg-yellow-500' },
    R3: { label: 'Nghiêm trọng', icon: '🔴', color: 'bg-red-500' },
    R4: { label: 'Bị chặn', icon: '🛑', color: 'bg-red-900' },
};

function titleCase(name: string) {
    return name[0] + name.slice(1).toLowerCase();
}

export const PHASE_OPTIONS = phaseOrder.map(value => ({
    value,
    labelEn: titleCase(value),
    ...PHASE_PRESENTATION[value],
}));

export const ROLE_OPTIONS = roles.flatMap(value => {
    const presentation = PERSONA_PRESENTATION[value];
    return presentation ? [{ value, labelEn: titleCase(value), ...presentation }] : [];
});

function presentRisk<Risk extends CVFRiskLevel>(value: Risk) {
    const presentation = RISK_PRESENTATION[value];
    return { value, ...presentation, labelEn: presentation.labelEn ?? riskLabels[value] };
}

export function getRiskOption(value: string) {
    return Object.hasOwn(riskLabels, value) ? presentRisk(value as CVFRiskLevel) : undefined;
}

export const RISK_OPTIONS = riskOrder.map(presentRisk);

export function isRuntimeRisk(value: CVFRiskLevel): value is RuntimeRisk {
    return (riskOrder as readonly CVFRiskLevel[]).includes(value);
}

export function getRolePhaseAuthority(phase: CVFPhaseToolkit, role: CVFRole) {
    const cell = authorityMatrix[role]?.[phase];
    const phaseRoles: readonly CVFRole[] | undefined = phaseRoleMatrix[phase];
    if (!cell?.allowed || !phaseRoles?.includes(role)) return undefined;
    return cell;
}

export function isRiskAllowed(requested: CVFRiskLevel, phase: CVFPhaseToolkit, role: CVFRole): boolean {
    const authority = getRolePhaseAuthority(phase, role);
    return Boolean(authority && isRuntimeRisk(requested) && riskOrder.indexOf(requested) <= riskOrder.indexOf(authority.maxRisk));
}

export function getAllowedActions(phase: CVFPhaseToolkit, role: CVFRole): readonly string[] {
    return getRolePhaseAuthority(phase, role)?.allowedActions ?? [];
}

// Historical Web inputs retain A-E aliases. These do not add runtime phases.
const PHASE_ALIASES: ReadonlyMap<string, CVFPhaseToolkit> = new Map([
    ['DISCOVERY', 'INTAKE'],
    ['A', 'INTAKE'], ['PHASE A', 'INTAKE'],
    ['B', 'DESIGN'], ['PHASE B', 'DESIGN'],
    ['C', 'BUILD'], ['PHASE C', 'BUILD'],
    ['D', 'REVIEW'], ['PHASE D', 'REVIEW'],
    ['E', 'FREEZE'], ['PHASE E', 'FREEZE'],
]);

export function normalizeWebPhaseInput(value: unknown): CVFPhaseToolkit | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toUpperCase();
    return phaseOrder.find(phase => phase === normalized) ?? PHASE_ALIASES.get(normalized);
}

export function isBuildPhase(value: unknown): boolean {
    return normalizeWebPhaseInput(value) === 'BUILD';
}
