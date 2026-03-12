/**
 * CVF Auto Intent Detector
 * =========================
 * Detects Phase, Risk level, and suggested template from natural language input.
 * Non-coders don't need to know CVF concepts — they just describe what they want.
 *
 * Sprint 7 — Task 7.1
 *
 * @module lib/intent-detector
 */

export type DetectedPhase = 'DISCOVERY' | 'DESIGN' | 'BUILD' | 'REVIEW';
export type DetectedRisk = 'R0' | 'R1' | 'R2' | 'R3';

export interface DetectedIntent {
  phase: DetectedPhase;
  riskLevel: DetectedRisk;
  suggestedTemplates: string[];
  confidence: number;
  friendlyPhase: string;
  friendlyRisk: string;
}

// ─── Phase Detection Rules ───────────────────────────────────────────

const PHASE_PATTERNS: { phase: DetectedPhase; patterns: RegExp[]; friendly: string }[] = [
  {
    phase: 'DISCOVERY',
    friendly: '🔍 Khám phá & Phân tích',
    patterns: [
      /\b(tìm hiểu|research|explore|analyze|phân tích|khám phá|discover|tìm|survey|investigate|what is|là gì|cách nào|how to)\b/i,
      /\b(market research|competitive analysis|feasibility|khảo sát|đánh giá)\b/i,
    ],
  },
  {
    phase: 'DESIGN',
    friendly: '📐 Thiết kế & Lên kế hoạch',
    patterns: [
      /\b(design|thiết kế|plan|lên kế hoạch|architect|blueprint|wireframe|prototype|mockup|layout|schema)\b/i,
      /\b(strategy|chiến lược|proposal|đề xuất|outline|draft|bản nháp|template)\b/i,
    ],
  },
  {
    phase: 'BUILD',
    friendly: '🔨 Xây dựng & Thực thi',
    patterns: [
      /\b(build|create|code|develop|implement|write|generate|make|tạo|viết|xây dựng|phát triển|triển khai|deploy)\b/i,
      /\b(fix|sửa|update|refactor|optimize|tối ưu|install|cài đặt|configure|cấu hình)\b/i,
    ],
  },
  {
    phase: 'REVIEW',
    friendly: '✅ Kiểm tra & Đánh giá',
    patterns: [
      /\b(review|kiểm tra|test|check|verify|validate|audit|inspect|evaluate|đánh giá|rà soát|QA)\b/i,
      /\b(security review|code review|performance test|báo cáo|report|summary)\b/i,
    ],
  },
];

// ─── Risk Detection Rules ────────────────────────────────────────────

const RISK_PATTERNS: { risk: DetectedRisk; patterns: RegExp[]; friendly: string }[] = [
  {
    risk: 'R3',
    friendly: '🔴 Rủi ro cao',
    patterns: [
      /\b(delete|xóa|remove|drop|destroy|production|deploy to prod|security|credentials|password|secret|payment|billing|database migration)\b/i,
      /\b(critical|nghiêm trọng|khẩn cấp|urgent|không thể hoàn tác|irreversible)\b/i,
    ],
  },
  {
    risk: 'R2',
    friendly: '🟡 Rủi ro trung bình',
    patterns: [
      /\b(modify|update|change|install|configure|api|integration|thay đổi|cập nhật|staging|refactor)\b/i,
      /\b(database|server|endpoint|authentication|authorization|permission)\b/i,
    ],
  },
  {
    risk: 'R1',
    friendly: '🟢 Rủi ro thấp',
    patterns: [
      /\b(read|view|list|search|analyze|generate text|write doc|draft|brainstorm|suggest|recommend)\b/i,
      /\b(document|tài liệu|báo cáo|report|presentation|email|nội dung|content)\b/i,
    ],
  },
  {
    risk: 'R0',
    friendly: '⚪ Không rủi ro',
    patterns: [
      /\b(hello|hi|help|hướng dẫn|explain|giải thích|what|how|why|khi nào|where)\b/i,
    ],
  },
];

// ─── Template Suggestion Rules ───────────────────────────────────────

const TEMPLATE_PATTERNS: { templateId: string; name: string; patterns: RegExp[] }[] = [
  { templateId: 'app-builder', name: 'App Builder', patterns: [/\b(app|application|web app|mobile|software|ứng dụng)\b/i] },
  { templateId: 'business-strategy', name: 'Business Strategy', patterns: [/\b(business|strategy|startup|company|doanh nghiệp|kinh doanh)\b/i] },
  { templateId: 'marketing-campaign', name: 'Marketing Campaign', patterns: [/\b(marketing|campaign|ads|quảng cáo|brand|thương hiệu|social media)\b/i] },
  { templateId: 'content-strategy', name: 'Content Strategy', patterns: [/\b(content|blog|article|bài viết|nội dung|SEO|copywriting)\b/i] },
  { templateId: 'data-analysis', name: 'Data Analysis', patterns: [/\b(data|analytics|phân tích dữ liệu|statistics|dashboard|metric|chart)\b/i] },
  { templateId: 'system-design', name: 'System Design', patterns: [/\b(system|architecture|infrastructure|hệ thống|kiến trúc|microservice|API)\b/i] },
  { templateId: 'security-assessment', name: 'Security Assessment', patterns: [/\b(security|bảo mật|vulnerability|penetration|audit|compliance)\b/i] },
  { templateId: 'product-design', name: 'Product Design', patterns: [/\b(product|UX|UI|design|sản phẩm|thiết kế|wireframe|prototype)\b/i] },
  { templateId: 'research-project', name: 'Research Project', patterns: [/\b(research|nghiên cứu|study|paper|thesis|survey)\b/i] },
];

// ─── Main Detection Function ─────────────────────────────────────────

/**
 * Detect intent from natural language input.
 * Returns detected phase, risk level, and suggested templates.
 */
export function detectIntent(userInput: string): DetectedIntent {
  const input = userInput.trim();
  if (!input) {
    return {
      phase: 'DISCOVERY',
      riskLevel: 'R0',
      suggestedTemplates: [],
      confidence: 0,
      friendlyPhase: '🔍 Khám phá & Phân tích',
      friendlyRisk: '⚪ Không rủi ro',
    };
  }

  // Detect phase
  let detectedPhase: DetectedPhase = 'DISCOVERY';
  let phaseConfidence = 0.3;
  let friendlyPhase = '🔍 Khám phá & Phân tích';

  for (const rule of PHASE_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(input)) {
        detectedPhase = rule.phase;
        phaseConfidence = 0.8;
        friendlyPhase = rule.friendly;
        break;
      }
    }
    if (phaseConfidence > 0.5) break;
  }

  // Detect risk
  let detectedRisk: DetectedRisk = 'R1';
  let riskConfidence = 0.3;
  let friendlyRisk = '🟢 Rủi ro thấp';

  for (const rule of RISK_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(input)) {
        detectedRisk = rule.risk;
        riskConfidence = 0.8;
        friendlyRisk = rule.friendly;
        break;
      }
    }
    if (riskConfidence > 0.5) break;
  }

  // Suggest templates
  const suggestedTemplates: string[] = [];
  for (const rule of TEMPLATE_PATTERNS) {
    for (const pattern of rule.patterns) {
      if (pattern.test(input)) {
        suggestedTemplates.push(rule.templateId);
        break;
      }
    }
  }

  // Overall confidence = average of phase and risk confidence
  const confidence = (phaseConfidence + riskConfidence) / 2;

  return {
    phase: detectedPhase,
    riskLevel: detectedRisk,
    suggestedTemplates: suggestedTemplates.slice(0, 3), // Top 3
    confidence,
    friendlyPhase,
    friendlyRisk,
  };
}

/**
 * Get friendly label for any phase.
 */
export function getPhaseLabel(phase: string): string {
  const rule = PHASE_PATTERNS.find(r => r.phase === phase);
  return rule?.friendly ?? phase;
}

/**
 * Get friendly label for any risk level.
 */
export function getRiskLabel(risk: string): string {
  const rule = RISK_PATTERNS.find(r => r.risk === risk);
  return rule?.friendly ?? risk;
}
