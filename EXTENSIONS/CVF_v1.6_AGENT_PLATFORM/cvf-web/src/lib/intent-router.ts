/**
 * CVF Intent Router
 * =================
 * Facade and source of truth for intent-first routing in W122.
 *
 * Delegates to:
 *   - intent-detector.ts  → phase / risk / suggestedTemplates classifier
 *   - governed-starter-path.ts → wizard-family handoff serializer
 *
 * Hard contract (§8.A4 + §8.A5 from W122 roadmap):
 *   - Routing target MUST exist in STARTER_TEMPLATE_MAP (wizard-family, 9 entries)
 *   - No phase/risk regex is duplicated here; all classification delegated to intent-detector
 *   - Non-VN/non-EN input triggers weak-confidence fallback
 *   - Feature flag NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR controls activation
 *
 * W122-T1 — CP1
 *
 * @module lib/intent-router
 */

import { detectIntent, type DetectedPhase, type DetectedRisk } from '@/lib/intent-detector';
import { resolveGovernedStarterTemplate } from '@/lib/governed-starter-path';

export type IntentRouteConfidence = 'strong' | 'weak';

/**
 * IntentRouteResult.
 *
 * Hard contract (W122 §8.A4): when `confidence === 'weak'`, the routing target
 * fields (`starterKey`, `recommendedTemplateId`, `recommendedTemplateLabel`)
 * MUST be `null`. The router must NOT guess a wizard target on weak input.
 * Consumers should degrade to clarification or guided browse.
 */
export interface IntentRouteResult {
  starterKey: string | null;
  recommendedTemplateId: string | null;
  recommendedTemplateLabel: string | null;
  rationale: string;
  phase: DetectedPhase;
  riskLevel: DetectedRisk;
  friendlyPhase: string;
  friendlyRisk: string;
  confidence: IntentRouteConfidence;
  fallback: IntentRouteFallback | null;
  intentRoutedAt: string;
}

export interface IntentRouteFallback {
  reason: 'weak_confidence' | 'unsupported_language' | 'empty_input';
  suggestion: string;
}

const NON_VN_EN_PATTERN = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u0600-\u06ff]/;

function detectLanguage(input: string): 'vn' | 'en' | 'other' {
  if (!input.trim()) return 'en';
  if (NON_VN_EN_PATTERN.test(input)) return 'other';
  const vnPattern = /[\u00c0-\u024f\u1e00-\u1eff]|[àáâãăạảấầẩẫậắằẳẵặèéêẹẻẽếềểễệ]/i;
  if (vnPattern.test(input)) return 'vn';
  return 'en';
}

/**
 * Route a plain-language user input to a governed wizard-family starter path.
 *
 * Returns `null` when the feature flag is off (current behavior unchanged).
 */
export function routeIntent(userInput: string): IntentRouteResult | null {
  if (process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR !== 'true') {
    return null;
  }

  const intentRoutedAt = new Date().toISOString();

  // Empty input — weak: no target, suggest user provides description.
  if (!userInput.trim()) {
    return {
      starterKey: null,
      recommendedTemplateId: null,
      recommendedTemplateLabel: null,
      rationale: 'No input provided. Describe your goal in plain language to get a personalized governed starter path, or browse the template library directly.',
      phase: 'INTAKE',
      riskLevel: 'R0',
      friendlyPhase: '🧭 Tiếp nhận & Làm rõ',
      friendlyRisk: '⚪ Không rủi ro',
      confidence: 'weak',
      fallback: { reason: 'empty_input', suggestion: 'Describe your goal in plain language to get a personalized recommendation.' },
      intentRoutedAt,
    };
  }

  // Unsupported language — weak: no target, ask user to use VN or EN.
  const lang = detectLanguage(userInput);
  if (lang === 'other') {
    return {
      starterKey: null,
      recommendedTemplateId: null,
      recommendedTemplateLabel: null,
      rationale: 'Language not recognized as Vietnamese or English. Please rephrase, or browse the template library directly.',
      phase: 'INTAKE',
      riskLevel: 'R1',
      friendlyPhase: '🧭 Tiếp nhận & Làm rõ',
      friendlyRisk: '🟢 Rủi ro thấp',
      confidence: 'weak',
      fallback: { reason: 'unsupported_language', suggestion: 'Please describe your goal in Vietnamese or English.' },
      intentRoutedAt,
    };
  }

  const detected = detectIntent(userInput);
  const isWeak = detected.suggestedTemplates.length === 0;

  // Low confidence — weak: no target, point user to library or refinement.
  if (isWeak) {
    return {
      starterKey: null,
      recommendedTemplateId: null,
      recommendedTemplateLabel: null,
      rationale: `Intent classified as ${detected.friendlyPhase} (${detected.friendlyRisk}), but no governed wizard target matched with confidence. Refine your description or browse the library.`,
      phase: detected.phase,
      riskLevel: detected.riskLevel,
      friendlyPhase: detected.friendlyPhase,
      friendlyRisk: detected.friendlyRisk,
      confidence: 'weak',
      fallback: { reason: 'weak_confidence', suggestion: 'Browse the skill library or try a more specific description.' },
      intentRoutedAt,
    };
  }

  // Strong confidence — resolve a wizard target.
  const resolved = resolveGovernedStarterTemplate(detected.suggestedTemplates);
  const starterKey = detected.suggestedTemplates[0];

  return {
    starterKey,
    recommendedTemplateId: resolved.id,
    recommendedTemplateLabel: resolved.label,
    rationale: `Detected ${detected.friendlyPhase} intent with ${detected.friendlyRisk}. Routing to the best-fit governed wizard starter path.`,
    phase: detected.phase,
    riskLevel: detected.riskLevel,
    friendlyPhase: detected.friendlyPhase,
    friendlyRisk: detected.friendlyRisk,
    confidence: 'strong',
    fallback: null,
    intentRoutedAt,
  };
}

/**
 * Returns true when the intent-first front door is enabled via feature flag.
 */
export function isIntentFirstEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR === 'true';
}
