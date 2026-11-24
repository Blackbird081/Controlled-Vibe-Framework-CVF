// Text Encoding Exception: Vietnamese keyword input is part of the Home routing contract.
import { routeHomeSpecKeywords, type IntentRouteResult } from './intent-router';
import { resolveHomeOutcomeId, homeSpecOutcomeTitle } from './home-spec-jev-catalog';

/** Keep generic routing unchanged; Home offers only catalog-eligible outcomes. */
export function routeEligibleHomeKeywords(input: string): IntentRouteResult {
    const result = routeHomeSpecKeywords(input);
    const emailDraft = /\b(email|e-mail)\b/i.test(input) && /\b(write|draft|compose|reminder)\b|viết|soạn|nhắc/i.test(input)
        && !/\b(review|audit|campaign)\b/i.test(input);
    if (emailDraft) return { ...result, starterKey: null, recommendedTemplateId: 'email_template',
        recommendedTemplateLabel: homeSpecOutcomeTitle('email_template', 'en'), confidence: 'strong',
        routeType: 'form', fallback: null, rationale: 'The request explicitly asks for a draft email.' };
    const id = result.recommendedTemplateId && resolveHomeOutcomeId(result.recommendedTemplateId);
    if (id && result.confidence === 'strong') return { ...result, recommendedTemplateId: id,
        recommendedTemplateLabel: homeSpecOutcomeTitle(id, 'en'), routeType: 'form' };
    return { ...result, starterKey: null, recommendedTemplateId: null, recommendedTemplateLabel: null,
        confidence: 'weak', routeType: null,
        fallback: result.fallback ?? { reason: 'weak_confidence', suggestion: 'Describe the desired result or browse the available outcomes.' } };
}
