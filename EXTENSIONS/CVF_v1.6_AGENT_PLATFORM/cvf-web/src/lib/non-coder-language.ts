/**
 * Non-Coder Language Adapter — v1.6 Enhancement Track 2
 *
 * Translates all CVF governance terminology into friendly, non-technical
 * language for non-coder users. Supports Vietnamese and English.
 *
 * Core principle: "Users don't need to know CVF to use CVF"
 *
 * @module lib/non-coder-language
 */

'use client';

type Lang = 'vi' | 'en';

// ─── Risk Level Labels ────────────────────────────────────────────────

export interface FriendlyRiskLabel {
  label: string;
  emoji: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
  description: string;
}

const RISK_LABELS: Record<string, Record<Lang, FriendlyRiskLabel>> = {
  R0: {
    vi: { label: 'An toàn', emoji: '🟢', color: 'green', description: 'Mọi thứ đang hoạt động tốt' },
    en: { label: 'Safe', emoji: '🟢', color: 'green', description: 'Everything is running smoothly' },
  },
  R1: {
    vi: { label: 'Bình thường', emoji: '🟡', color: 'yellow', description: 'Đang theo dõi để đảm bảo chất lượng' },
    en: { label: 'Normal', emoji: '🟡', color: 'yellow', description: 'Monitoring to ensure quality' },
  },
  R2: {
    vi: { label: 'Cần kiểm tra', emoji: '🟠', color: 'orange', description: 'Tôi sẽ kiểm tra kỹ hơn trước khi tiếp tục' },
    en: { label: 'Extra check needed', emoji: '🟠', color: 'orange', description: "I'll double-check before proceeding" },
  },
  R3: {
    vi: { label: 'Cần xác nhận', emoji: '🔴', color: 'red', description: 'Cần xác nhận của bạn trước khi tiếp tục' },
    en: { label: 'Needs your confirmation', emoji: '🔴', color: 'red', description: 'Needs your confirmation before proceeding' },
  },
};

export function getFriendlyRiskLabel(riskLevel: string, lang: Lang): FriendlyRiskLabel {
  const normalized = riskLevel?.toUpperCase?.() || 'R0';
  return RISK_LABELS[normalized]?.[lang] || RISK_LABELS.R0[lang];
}

// ─── Phase Labels ─────────────────────────────────────────────────────

export interface FriendlyPhaseLabel {
  label: string;
  emoji: string;
  description: string;
}

const PHASE_LABELS: Record<string, Record<Lang, FriendlyPhaseLabel>> = {
  DISCOVERY: {
    vi: { label: 'Tìm hiểu yêu cầu', emoji: '🔍', description: 'Đang tìm hiểu những gì bạn cần' },
    en: { label: 'Understanding your needs', emoji: '🔍', description: 'Learning about what you need' },
  },
  DESIGN: {
    vi: { label: 'Lên kế hoạch', emoji: '📐', description: 'Đang thiết kế giải pháp phù hợp' },
    en: { label: 'Planning the solution', emoji: '📐', description: 'Designing the right approach' },
  },
  BUILD: {
    vi: { label: 'Đang thực hiện', emoji: '🔨', description: 'Đang xây dựng kết quả cho bạn' },
    en: { label: 'Working on it', emoji: '🔨', description: 'Building your results' },
  },
  REVIEW: {
    vi: { label: 'Kiểm tra chất lượng', emoji: '✅', description: 'Đang kiểm tra để đảm bảo kết quả tốt nhất' },
    en: { label: 'Quality check', emoji: '✅', description: 'Reviewing to ensure the best results' },
  },
};

export function getFriendlyPhaseLabel(phase: string, lang: Lang): FriendlyPhaseLabel {
  const normalized = phase?.toUpperCase?.().trim() || 'BUILD';
  // Handle "Phase A/B/C/D" and "A/B/C/D" aliases
  const aliasMap: Record<string, string> = {
    'PHASE A': 'DISCOVERY', A: 'DISCOVERY',
    'PHASE B': 'DESIGN', B: 'DESIGN',
    'PHASE C': 'BUILD', C: 'BUILD',
    'PHASE D': 'REVIEW', D: 'REVIEW',
  };
  const key = aliasMap[normalized] || normalized;
  return PHASE_LABELS[key]?.[lang] || PHASE_LABELS.BUILD[lang];
}

// ─── Enforcement Status Labels ────────────────────────────────────────

export interface FriendlyEnforcementLabel {
  label: string;
  emoji: string;
  visible: boolean;
  description: string;
}

const ENFORCEMENT_LABELS: Record<string, Record<Lang, FriendlyEnforcementLabel>> = {
  ALLOW: {
    vi: { label: '', emoji: '', visible: false, description: '' },
    en: { label: '', emoji: '', visible: false, description: '' },
  },
  BLOCK: {
    vi: { label: 'Đang điều chỉnh', emoji: '⏳', visible: true, description: 'Tôi đang điều chỉnh để cho kết quả tốt hơn' },
    en: { label: 'Adjusting', emoji: '⏳', visible: true, description: "I'm adjusting for better results" },
  },
  CLARIFY: {
    vi: { label: 'Cần thêm thông tin', emoji: '💬', visible: true, description: 'Thêm vài chi tiết sẽ giúp kết quả tốt hơn' },
    en: { label: 'More details needed', emoji: '💬', visible: true, description: 'A few more details would improve results' },
  },
  NEEDS_APPROVAL: {
    vi: { label: 'Cần xác nhận nhanh', emoji: '👋', visible: true, description: 'Cần xác nhận nhanh trước khi tiếp tục' },
    en: { label: 'Quick check needed', emoji: '👋', visible: true, description: 'A quick check is needed before proceeding' },
  },
  ESCALATE: {
    vi: { label: 'Cần xác nhận', emoji: '👋', visible: true, description: 'Cần xác nhận của bạn' },
    en: { label: 'Needs confirmation', emoji: '👋', visible: true, description: 'Needs your confirmation' },
  },
};

export function getFriendlyEnforcementLabel(status: string, lang: Lang): FriendlyEnforcementLabel {
  const normalized = status?.toUpperCase?.() || 'ALLOW';
  return ENFORCEMENT_LABELS[normalized]?.[lang] || ENFORCEMENT_LABELS.ALLOW[lang];
}

// ─── Error Message Humanization ───────────────────────────────────────

interface ErrorMapping {
  pattern: RegExp;
  friendly: Record<Lang, string>;
}

const ERROR_MAPPINGS: ErrorMapping[] = [
  {
    pattern: /budget exceeded/i,
    friendly: {
      vi: 'Tôi sẽ tìm cách tiếp cận hiệu quả hơn.',
      en: "Let me find a more efficient approach.",
    },
  },
  {
    pattern: /execution blocked by cvf policy/i,
    friendly: {
      vi: 'Tôi cần thêm một chút thông tin để tiếp tục.',
      en: 'I need a bit more information to proceed.',
    },
  },
  {
    pattern: /spec needs clarification/i,
    friendly: {
      vi: 'Bạn có thể thêm vài chi tiết không?',
      en: 'Could you add a few more details?',
    },
  },
  {
    pattern: /blocked by safety filters/i,
    friendly: {
      vi: 'Tôi sẽ điều chỉnh lại cho kết quả tốt hơn.',
      en: 'Let me rephrase that for better results.',
    },
  },
  {
    pattern: /too many requests|rate limit/i,
    friendly: {
      vi: 'Cho tôi một chút, tôi đang xử lý yêu cầu trước đó.',
      en: "Give me a moment, I'm working on your previous request.",
    },
  },
  {
    pattern: /human approval required/i,
    friendly: {
      vi: 'Cần xác nhận nhanh trước khi tiếp tục.',
      en: 'A quick check is needed before proceeding.',
    },
  },
  {
    pattern: /unauthorized|please login/i,
    friendly: {
      vi: 'Vui lòng đăng nhập để tiếp tục.',
      en: 'Please log in to continue.',
    },
  },
  {
    pattern: /api key not configured/i,
    friendly: {
      vi: 'Cần cấu hình API key trong phần Cài đặt.',
      en: 'Please configure your API key in Settings.',
    },
  },
  {
    pattern: /we need to adjust your request/i,
    friendly: {
      vi: 'Tôi đang điều chỉnh yêu cầu cho phù hợp hơn.',
      en: "I'm adjusting your request for better results.",
    },
  },
];

/**
 * Converts a technical error message into a friendly, non-coder message.
 * If no mapping found, returns a generic friendly message.
 */
export function humanizeError(errorMessage: string, lang: Lang): string {
  for (const mapping of ERROR_MAPPINGS) {
    if (mapping.pattern.test(errorMessage)) {
      return mapping.friendly[lang];
    }
  }
  // Generic fallback
  return lang === 'vi'
    ? 'Có lỗi xảy ra. Vui lòng thử lại.'
    : 'Something went wrong. Please try again.';
}

// ─── Quality Score Labels ─────────────────────────────────────────────

export interface FriendlyQualityLabel {
  label: string;
  emoji: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
}

export function getFriendlyQualityLabel(score: number, lang: Lang): FriendlyQualityLabel {
  if (score >= 90) {
    return {
      emoji: '⭐',
      color: 'green',
      label: lang === 'vi' ? 'Xuất sắc — Chất lượng chuyên nghiệp' : 'Excellent — Professional quality',
    };
  }
  if (score >= 75) {
    return {
      emoji: '✅',
      color: 'blue',
      label: lang === 'vi' ? 'Tốt — Sẵn sàng sử dụng' : 'Good — Ready to use',
    };
  }
  if (score >= 60) {
    return {
      emoji: '💡',
      color: 'yellow',
      label: lang === 'vi' ? 'Khá — Có thể cải thiện' : 'Decent — Could be improved',
    };
  }
  return {
    emoji: '🔄',
    color: 'red',
    label: lang === 'vi' ? 'Đang cải thiện kết quả...' : 'Improving results...',
  };
}

/**
 * Converts output-validator qualityHint to friendly label.
 */
export function getFriendlyQualityHint(
  hint: 'excellent' | 'good' | 'decent' | 'needs_improvement',
  lang: Lang,
): FriendlyQualityLabel {
  switch (hint) {
    case 'excellent':
      return getFriendlyQualityLabel(95, lang);
    case 'good':
      return getFriendlyQualityLabel(80, lang);
    case 'decent':
      return getFriendlyQualityLabel(65, lang);
    case 'needs_improvement':
      return getFriendlyQualityLabel(40, lang);
  }
}

// ─── Non-Coder Mode State ─────────────────────────────────────────────

const NON_CODER_MODE_KEY = 'cvf_non_coder_mode';

/**
 * Returns whether non-coder mode is enabled (default: true for v1.6).
 */
export function isNonCoderMode(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(NON_CODER_MODE_KEY);
    return stored === null ? true : stored === 'true';
  } catch {
    return true;
  }
}

export function setNonCoderMode(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NON_CODER_MODE_KEY, String(enabled));
  } catch {
    // Silent fail
  }
}
