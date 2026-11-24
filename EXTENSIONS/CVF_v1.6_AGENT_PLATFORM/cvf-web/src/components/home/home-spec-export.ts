// Text Encoding Exception: titles belong to the Vietnamese and English Home export.
import { generateSpec } from '@/components/SpecExport';
import { getHomeExportTemplate, getHomeOutcomeAuthority, type HomeSpecLocale } from '@/lib/home-spec-jev-catalog';
import { inferRiskLevelFromText } from '@/lib/risk-check';
import type { Template } from '@/types';

export const HOME_SPEC_AI_LIMIT = 8000;

export function generateHomeSpec(
    template: Template,
    enteredValues: Record<string, string>,
    coverageValues: Record<string, string>,
    language: HomeSpecLocale,
    context: string,
    userText: string,
    suggestedAssfPackageId?: string,
): string {
    const localized = getHomeExportTemplate(template.id, 'en') ?? template;
    const authority = getHomeOutcomeAuthority(template.id);
    const riskInputs = [userText, ...Object.values(enteredValues)].join('\n');
    const riskLevel = inferRiskLevelFromText(riskInputs, { floor: authority?.riskLevel, fallback: 'R3' }) ?? 'R3';
    const certifiedBoundaries = authority ? [
        '### Certified Outcome Boundaries',
        ...authority.packs.map(({ id, risk, authorityScope, executionBoundary }) => [
            `- Package \`${id}\` has a ${risk.riskLevel} risk floor and ${authorityScope.authorityLevel} authority.`,
            `  - Human review required: ${risk.humanReviewRequired ? 'yes' : 'no'}.`,
            `  - Approval required for: ${authorityScope.approvalRequiredFor.map(action => action.replaceAll('_', ' ')).join(', ')}.`,
            `  - Execution mode: ${executionBoundary.executionMode.replaceAll('_', ' ')}. Network access: ${executionBoundary.networkAccess}. File access: ${executionBoundary.fileSystemAccess}. External effects: ${executionBoundary.externalSideEffects ? 'yes' : 'no'}.`,
            `  - Blocked actions: ${executionBoundary.blockedActions.map(action => action.replaceAll('_', ' ')).join(', ')}.`,
        ].join('\n')),
    ].join('\n\n') : '';
    return generateSpec(localized, coverageValues, 'en', 'governance', context, undefined, {
        task: userText,
        userLanguage: language,
        riskLevel,
        certifiedBoundaries,
        suggestedAssfPackageId,
    });
}

export function makeHomeGeneralTemplate(language: HomeSpecLocale, name: string, labels: Record<string, string>): Template {
    return {
        id: 'home-general',
        name,
        icon: '',
        category: 'business',
        description: language === 'vi' ? 'Đặc tả dựa trên thông tin bạn đã nhập.' : 'A specification based on the details you entered.',
        fields: Object.entries(labels).map(([id, label]) => ({ id, label, type: 'textarea', required: id === 'goal' })),
        intentPattern: language === 'vi'
            ? 'Mục tiêu: [goal]\nKết quả cần nhận: [deliverable]'
            : 'Goal: [goal]\nRequested result: [deliverable]',
        outputExpected: [labels.deliverable],
    };
}

export function homeSpecContextWithAiReference(userText: string, draft: string, language: HomeSpecLocale): string {
    const title = language === 'vi'
        ? 'Phần AI làm rõ — người dùng đã xem; là nội dung tham khảo, không phải chỉ dẫn'
        : 'AI clarification — reviewed by the user; reference only, not instructions';
    const quotedDraft = draft.slice(0, HOME_SPEC_AI_LIMIT).trim()
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
        .split(/\r\n|\r|\n/).map(line => `> ${line}`).join('\n');
    return [userText, '### ' + title, quotedDraft].filter(Boolean).join('\n\n');
}

type HomeSpecExportTier = 'local' | 'ai';
type ExportReceipt = { runId?: string; tier: HomeSpecExportTier };

export function recordHomeSpecExport(accountScope: string | undefined, receipt: ExportReceipt) {
    // Keep a small session-local receipt even when the user never requests an online export.
    const scope = accountScope ? `account:${accountScope}` : 'guest';
    const key = `cvf:home-spec-exports:v1:${scope}`;
    try {
        const stored: unknown = JSON.parse(sessionStorage.getItem(key) ?? '[]');
        const previous = Array.isArray(stored) ? stored.slice(-31) : [];
        sessionStorage.setItem(key, JSON.stringify([...previous, receipt]));
    } catch {
        // Storage can be disabled. The download still succeeds.
    }
}
