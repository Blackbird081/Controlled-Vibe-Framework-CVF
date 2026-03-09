/**
 * Vibe Parser — M4.1
 *
 * Extracts structured intent, entities, and constraints from natural language input.
 * This is the "Vibe-to-Action" translator core from Non-coder.md:
 * User says "Vibe" → CVF extracts Goal + Constraints → Guards enforce.
 *
 * @module vibe-translator/vibe-parser
 */

export interface ParsedVibe {
  /** The raw user input */
  rawInput: string;
  /** Extracted goal/intent */
  goal: string;
  /** Extracted action type */
  actionType: VibeActionType;
  /** Extracted entities (people, files, services) */
  entities: VibeEntity[];
  /** Extracted constraints (budget, time, scope) */
  constraints: VibeConstraint[];
  /** Confidence score 0-1 */
  confidence: number;
  /** Missing information that needs clarification */
  missingSlots: string[];
  /** Suggested CVF phase for this vibe */
  suggestedPhase: string;
  /** Suggested risk level */
  suggestedRisk: string;
}

export type VibeActionType =
  | 'create'
  | 'modify'
  | 'delete'
  | 'send'
  | 'analyze'
  | 'review'
  | 'deploy'
  | 'search'
  | 'report'
  | 'unknown';

export interface VibeEntity {
  type: 'person' | 'file' | 'service' | 'data' | 'money' | 'time' | 'location';
  value: string;
  raw: string;
  confidence: number;
}

export interface VibeConstraint {
  type: 'budget' | 'time' | 'scope' | 'security' | 'quality' | 'permission';
  description: string;
  raw: string;
  severity: 'hard' | 'soft';
}

// ─── Action Detection ─────────────────────────────────────────────────

const ACTION_PATTERNS: { type: VibeActionType; patterns: RegExp[] }[] = [
  {
    type: 'deploy',
    patterns: [
      /\b(deploy|triển khai|phát hành|release|publish|launch|ship)\b/i,
    ],
  },
  {
    type: 'delete',
    patterns: [
      /\b(xóa|loại bỏ|dọn dẹp|remove|delete|clean|purge|drop)\b/i,
    ],
  },
  {
    type: 'send',
    patterns: [
      /\b(gửi|chuyển|forward|send|deliver|email|notify|share)\b/i,
    ],
  },
  {
    type: 'review',
    patterns: [
      /\b(review|duyệt|xem lại|rà soát|approve|verify)\b/i,
    ],
  },
  {
    type: 'modify',
    patterns: [
      /\b(sửa|chỉnh|cập nhật|thay đổi|nâng cấp|modify|edit|update|change|refactor|fix)\b/i,
    ],
  },
  {
    type: 'analyze',
    patterns: [
      /\b(phân tích|đánh giá|kiểm tra|analyze|evaluate|check|assess|audit|inspect)\b/i,
    ],
  },
  {
    type: 'search',
    patterns: [
      /\b(tìm|search|find|look|scan|query|filter|lọc|quét)\b/i,
    ],
  },
  {
    type: 'report',
    patterns: [
      /\b(báo cáo|tóm tắt|summary|summarize|tổng hợp)\b/i,
      /\breport\b(?!.*\b(?:send|gửi|to)\b)/i,
    ],
  },
  {
    type: 'create',
    patterns: [
      /\b(tạo|xây dựng|viết|soạn|thiết kế|create|build|write|make|generate|draft)\b/i,
    ],
  },
];

// ─── Entity Extraction ────────────────────────────────────────────────

const ENTITY_PATTERNS: { type: VibeEntity['type']; patterns: RegExp[] }[] = [
  {
    type: 'person',
    patterns: [
      /\b(?:cho|gửi|from|to|for)\s+(?:anh|chị|ông|bà|mr|mrs|ms)?\s*([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)*)/g,
      /\b(sếp|boss|manager|đồng nghiệp|colleague|khách hàng|client|đối tác|partner)\b/gi,
    ],
  },
  {
    type: 'money',
    patterns: [
      /(\d+(?:\.\d+)?)\s*\$|(\$\s*\d+(?:\.\d+)?)/g,
      /(\d+(?:\.\d+)?)\s*(?:đồng|VND|USD|triệu|tỷ|k\b)/gi,
    ],
  },
  {
    type: 'time',
    patterns: [
      /\b(\d{1,2}[h:]\d{0,2})\b/g,
      /\b(hàng ngày|hàng tuần|mỗi ngày|mỗi tuần|daily|weekly|monthly|hàng tháng)\b/gi,
      /\b(sáng|chiều|tối|morning|afternoon|evening)\b/gi,
      /\b(thứ\s+\d|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    ],
  },
  {
    type: 'file',
    patterns: [
      /\b(file|tệp|tài liệu|document|báo cáo|report)\s+(\w[\w\s.-]*)/gi,
    ],
  },
  {
    type: 'service',
    patterns: [
      /\b(LinkedIn|Telegram|Zalo|Email|Slack|Discord|WhatsApp|Facebook|Twitter|GitHub)\b/gi,
    ],
  },
];

// ─── Constraint Extraction ────────────────────────────────────────────

const CONSTRAINT_PATTERNS: { type: VibeConstraint['type']; patterns: RegExp[]; severity: 'hard' | 'soft' }[] = [
  {
    type: 'budget',
    patterns: [
      /(?:không|đừng|don'?t)\s+(?:quá|exceed|vượt|tốn)\s+(\d+(?:\.\d+)?)\s*\$/gi,
      /(?:dưới|under|below|max|tối đa|giới hạn)\s*(\d+(?:\.\d+)?)\s*\$/gi,
      /\$\s*(\d+(?:\.\d+)?)\s*(?:\/(?:tuần|tháng|ngày|week|month|day))/gi,
    ],
    severity: 'hard',
  },
  {
    type: 'time',
    patterns: [
      /(?:vào|at|lúc)\s+(\d{1,2}[h:]\d{0,2})\s*(?:sáng|chiều|tối|am|pm)?/gi,
      /(?:trước|before|deadline)\s+(.+?)(?:\.|$)/gi,
    ],
    severity: 'soft',
  },
  {
    type: 'security',
    patterns: [
      /(?:đừng|không|don'?t|never)\s+(?:gửi|send|share|chia sẻ|lộ|expose)/gi,
      /(?:bảo mật|confidential|private|secret|nhạy cảm|sensitive)/gi,
    ],
    severity: 'hard',
  },
  {
    type: 'scope',
    patterns: [
      /(?:chỉ|only|just)\s+(.+?)(?:\.|,|$)/gi,
      /(?:không|đừng|don'?t)\s+(?:làm|do|touch|chạm)/gi,
    ],
    severity: 'soft',
  },
  {
    type: 'permission',
    patterns: [
      /(?:hỏi|ask)\s+(?:tôi|me|trước|before|first)/gi,
      /(?:phải|must)\s+(?:được|be)\s+(?:duyệt|approved)/gi,
    ],
    severity: 'hard',
  },
];

// ─── Main Parser ──────────────────────────────────────────────────────

export function parseVibe(input: string): ParsedVibe {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      rawInput: input,
      goal: '',
      actionType: 'unknown',
      entities: [],
      constraints: [],
      confidence: 0,
      missingSlots: ['goal'],
      suggestedPhase: 'DISCOVERY',
      suggestedRisk: 'R0',
    };
  }

  const actionType = detectAction(trimmed);
  const entities = extractEntities(trimmed);
  const constraints = extractConstraints(trimmed);
  const goal = extractGoal(trimmed, actionType);
  const missingSlots = detectMissingSlots(actionType, entities, constraints, trimmed);
  const confidence = calculateConfidence(actionType, entities, constraints, missingSlots);
  const suggestedPhase = suggestPhase(actionType);
  const suggestedRisk = suggestRisk(actionType, constraints, entities);

  return {
    rawInput: input,
    goal,
    actionType,
    entities,
    constraints,
    confidence,
    missingSlots,
    suggestedPhase,
    suggestedRisk,
  };
}

function detectAction(input: string): VibeActionType {
  for (const { type, patterns } of ACTION_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return type;
      }
    }
  }
  return 'unknown';
}

function extractEntities(input: string): VibeEntity[] {
  const entities: VibeEntity[] = [];
  const seen = new Set<string>();

  for (const { type, patterns } of ENTITY_PATTERNS) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(input)) !== null) {
        const value = (match[1] || match[0]).trim();
        const key = `${type}:${value.toLowerCase()}`;
        if (!seen.has(key) && value.length > 1) {
          seen.add(key);
          entities.push({
            type,
            value,
            raw: match[0],
            confidence: 0.8,
          });
        }
      }
    }
  }

  return entities;
}

function extractConstraints(input: string): VibeConstraint[] {
  const constraints: VibeConstraint[] = [];

  for (const { type, patterns, severity } of CONSTRAINT_PATTERNS) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(input)) !== null) {
        constraints.push({
          type,
          description: match[0].trim(),
          raw: match[0],
          severity,
        });
      }
    }
  }

  return constraints;
}

function extractGoal(input: string, actionType: VibeActionType): string {
  // Simple extraction: take the main sentence, strip constraints
  let goal = input;
  // Remove constraint phrases
  goal = goal.replace(/(?:đừng|không|don'?t|never)\s+.+?(?:\.|,|$)/gi, '').trim();
  // Remove budget mentions
  goal = goal.replace(/(?:dưới|under|max|tối đa)\s*\d+\s*\$/gi, '').trim();
  // Clean up
  goal = goal.replace(/\s+/g, ' ').trim();
  if (goal.length > 200) goal = goal.slice(0, 200) + '...';
  return goal || input.slice(0, 100);
}

function detectMissingSlots(
  actionType: VibeActionType,
  entities: VibeEntity[],
  constraints: VibeConstraint[],
  input: string,
): string[] {
  const missing: string[] = [];

  if (actionType === 'unknown') {
    missing.push('action_type');
  }

  if (actionType === 'send') {
    if (!entities.some((e) => e.type === 'person')) {
      missing.push('recipient');
    }
    if (!entities.some((e) => e.type === 'service')) {
      missing.push('channel');
    }
  }

  if (actionType === 'report' || actionType === 'analyze') {
    if (!entities.some((e) => e.type === 'data' || e.type === 'file')) {
      // Check if there's something to analyze in the text
      if (input.length < 30) {
        missing.push('subject');
      }
    }
  }

  if (actionType === 'deploy') {
    if (!entities.some((e) => e.type === 'service')) {
      missing.push('target_environment');
    }
  }

  if (entities.some((e) => e.type === 'money') && constraints.filter((c) => c.type === 'budget').length === 0) {
    missing.push('budget_confirmation');
  }

  return missing;
}

function calculateConfidence(
  actionType: VibeActionType,
  entities: VibeEntity[],
  constraints: VibeConstraint[],
  missingSlots: string[],
): number {
  let score = 0.3; // Base

  if (actionType !== 'unknown') score += 0.25;
  if (entities.length > 0) score += 0.15;
  if (entities.length > 2) score += 0.1;
  if (constraints.length > 0) score += 0.1;

  // Penalize missing slots
  score -= missingSlots.length * 0.1;

  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}

function suggestPhase(actionType: VibeActionType): string {
  switch (actionType) {
    case 'analyze':
    case 'search':
      return 'DISCOVERY';
    case 'create':
      return 'DESIGN';
    case 'modify':
    case 'send':
    case 'report':
      return 'BUILD';
    case 'review':
    case 'deploy':
    case 'delete':
      return 'REVIEW';
    default:
      return 'DISCOVERY';
  }
}

function suggestRisk(
  actionType: VibeActionType,
  constraints: VibeConstraint[],
  entities: VibeEntity[],
): string {
  if (actionType === 'deploy') return 'R3';
  if (actionType === 'delete') return 'R2';
  if (actionType === 'send' && entities.some((e) => e.type === 'money')) return 'R2';
  if (constraints.some((c) => c.type === 'security' && c.severity === 'hard')) return 'R2';
  if (actionType === 'send') return 'R1';
  if (actionType === 'modify') return 'R1';
  return 'R0';
}
