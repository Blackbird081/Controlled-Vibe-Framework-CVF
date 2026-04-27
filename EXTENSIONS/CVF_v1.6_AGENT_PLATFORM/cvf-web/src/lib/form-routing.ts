/**
 * CVF Trusted Form Router
 * =======================
 * W126-T1 CP1 — Explicit intent-to-form mapping for the trusted form subset.
 *
 * Hard contracts:
 *   - Only 8 explicitly audited forms are eligible (see W126_TRUSTED_FORM_SUBSET_AUDIT.md)
 *   - This module is called ONLY when no wizard target matched (wizard-first precedence)
 *   - Activation is pattern-based; ambiguity boundaries are documented per form
 *   - Any addition to TRUSTED_FORM_MAP requires a new audit entry + commit
 *
 * W126-T1 CP1
 *
 * @module lib/form-routing
 */

export interface TrustedFormEntry {
  id: string;
  label: string;
  /** Patterns that activate this form from plain-language input */
  activationPatterns: RegExp[];
  /** Human-readable note on when the wizard family should win instead */
  wizardWinsWhen: string;
}

export interface TrustedFormMatch {
  formKey: string;
  id: string;
  label: string;
}

/**
 * W126 trusted form subset — 8 explicitly audited forms.
 * Do not add entries without a matching audit row in W126_TRUSTED_FORM_SUBSET_AUDIT.md.
 */
export const TRUSTED_FORM_MAP: Record<string, TrustedFormEntry> = {
  'email_template': {
    id: 'email_template',
    label: '📧 Email Template',
    activationPatterns: [
      /\b(draft|write|compose|send|follow.?up)\s+(an?\s+)?email\b/i,
      /\bemail\s+(to|template|draft)\b/i,
      /\bmẫu email\b/i,
      /viết email|soạn email|thư điện tử/i,
    ],
    wizardWinsWhen: 'user describes a full content or marketing strategy, not a specific email task',
  },
  'documentation': {
    id: 'documentation',
    label: '📄 Documentation',
    activationPatterns: [
      /\bdocument(ation)?\s+(this|a|my|the|for)\b/i,
      /\b(SOP|how.?to guide|process doc|handoff doc)\b/i,
      /viết tài liệu|tài liệu quy trình|bàn giao tài liệu/i,
      /quy trình\s+(làm việc|tiếp nhận|onboard)/i,
    ],
    wizardWinsWhen: 'user asks for content strategy, research report, or a marketing campaign',
  },
  'competitor_review': {
    id: 'competitor_review',
    label: '🔍 Competitor Review',
    activationPatterns: [
      /\bcompetitors?\b/i,
      /\b(competitive analysis|competitive landscape|compare competitors?)\b/i,
      /\brival(s)?\b/i,
      /đối thủ/i,
      /phân tích đối thủ/i,
    ],
    wizardWinsWhen: 'user says "business strategy" broadly without specific competitor focus',
  },
  'risk_assessment': {
    id: 'risk_assessment',
    label: '⚠️ Risk Assessment',
    activationPatterns: [
      /\brisk assessment\b/i,
      /\bassess\s+(the\s+)?risks?\b/i,
      /\bidentify\s+(the\s+)?risks?\b/i,
      /\brisk analysis\b/i,
      /rủi ro/i,
      /phân tích rủi ro/i,
      /đánh giá rủi ro/i,
    ],
    wizardWinsWhen: 'user says "security assessment" or "penetration test" (security-assessment wizard wins)',
  },
  'user_persona': {
    id: 'user_persona',
    label: '👤 User Persona',
    activationPatterns: [
      /\buser persona\b/i,
      /\bbuyer persona\b/i,
      /\btarget audience\b/i,
      /\bcustomer profile\b/i,
      /\bideal customer\b/i,
      /người dùng mục tiêu/i,
    ],
    wizardWinsWhen: 'user says "product design" broadly or "design my app"',
  },
  'feature_prioritization': {
    id: 'feature_prioritization',
    label: '📋 Feature Prioritization',
    activationPatterns: [
      /\bprioritize\s+features?\b/i,
      /\bfeature prioritization\b/i,
      /\bwhich features?\b/i,
      /\bfeature list\b/i,
      /\bwhat to build first\b/i,
      /ưu tiên tính năng/i,
      /\broadmap priorit/i,
    ],
    wizardWinsWhen: 'user says "build my app" or "design my product" (wizard wins)',
  },
  'pricing_strategy': {
    id: 'pricing_strategy',
    label: '💰 Pricing Strategy',
    activationPatterns: [
      /\bpricing model\b/i,
      /\bhow to price\b/i,
      /\bprice\s+(my|a|the)\s+(product|service|app|saas)\b/i,
      /giá bán/i,
      /chiến lược giá/i,
      /định giá/i,
    ],
    wizardWinsWhen: 'user says "business strategy" broadly without pricing-specific focus',
  },
  'strategy_analysis': {
    id: 'strategy_analysis',
    label: '📊 Strategy Analysis',
    activationPatterns: [
      /\banalyze\s+(this|a|my|the)\s+strategy\b/i,
      /\bstrategy (evaluation|analysis)\b/i,
      /\bevaluate\s+(a|this|my)?\s*(decision|strategy)\b/i,
      /phân tích chiến lược/i,
      /đánh giá chiến lược/i,
      /\banalyze a decision\b/i,
    ],
    wizardWinsWhen: 'user says "help me build a business strategy" (business-strategy wizard wins)',
  },
};

/**
 * Attempt to match a plain-language input to a trusted form target.
 *
 * Returns the first matching TrustedFormMatch, or null if no trusted form
 * matches. This is called ONLY after the wizard routing path has failed
 * (no wizard pattern matched the input).
 */
export function routeToTrustedForm(userInput: string): TrustedFormMatch | null {
  for (const [key, entry] of Object.entries(TRUSTED_FORM_MAP)) {
    for (const pattern of entry.activationPatterns) {
      if (pattern.test(userInput)) {
        return { formKey: key, id: entry.id, label: entry.label };
      }
    }
  }
  return null;
}

/**
 * Returns true when the trusted form front door flag is enabled.
 * W126 uses the same INTENT_FIRST flag — form routing is part of the same surface.
 */
export function isTrustedFormRoutingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CVF_INTENT_FIRST_FRONT_DOOR === 'true';
}
