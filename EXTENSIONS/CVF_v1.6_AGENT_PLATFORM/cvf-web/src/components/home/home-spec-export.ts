// Text Encoding Exception: titles belong to the Vietnamese and English Home export.
import { generateSpec } from '@/components/SpecExport';
import { getHomeExportTemplate, getHomeOutcomeAuthority, getLegacyHomeSpecFields, type HomeSpecLocale } from '@/lib/home-spec-jev-catalog';
import { getHomeCommonQuestions, isHomeCommonQuestion } from '@/lib/home-spec-common-questions';
import { inferRiskLevelFromText } from '@/lib/risk-check';
import type { Template } from '@/types';
import { collectHomeOpenQuestions, dedupeHomeOpenQuestions } from './home-spec-open-questions';

export function prepareHomeSpec(
    template: Template,
    enteredValues: Record<string, string>,
    coverageValues: Record<string, string>,
    language: HomeSpecLocale,
    context: string,
    userText: string,
    suggestedAssfPackageId?: string,
    genericFieldLabels?: Record<string, string>,
): { markdown: string; openQuestions: string[] } {
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
    const questionTemplate = language === 'en' ? localized : getHomeExportTemplate(template.id, language) ?? template;
    const questionLabels = new Map([
        ...[...getLegacyHomeSpecFields(template.id, language), ...questionTemplate.fields]
            .map(field => [field.id, genericFieldLabels?.[field.id] ?? field.label] as const),
        ...getHomeCommonQuestions(language).map(field => [field.id, language === 'vi' ? field.label : field.exportLabel] as const),
    ]);
    const requiredFields = localized.fields.filter(field => field.required && !isHomeCommonQuestion(field.id));
    const requiredIds = new Set(requiredFields.map(field => field.id));
    const unknownAnswerLabel = language === 'vi' ? 'bạn chưa biết' : 'user does not know';
    const openQuestions = dedupeHomeOpenQuestions([
        ...collectHomeOpenQuestions(userText, enteredValues, questionLabels, requiredIds, unknownAnswerLabel),
        ...requiredFields.filter(field => !coverageValues[field.id]?.trim()).map(field => questionLabels.get(field.id) ?? field.label),
    ]).slice(0, 5);
    const markdown = generateSpec(localized, coverageValues, 'en', 'governance', context, undefined, {
        task: userText,
        userLanguage: language,
        riskLevel,
        certifiedBoundaries,
        suggestedAssfPackageId,
        openQuestions,
    });
    return { markdown, openQuestions };
}

export function generateHomeSpec(...args: Parameters<typeof prepareHomeSpec>): string {
    return prepareHomeSpec(...args).markdown;
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

type ExportReceipt = { runId?: string; tier: 'local' };

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
