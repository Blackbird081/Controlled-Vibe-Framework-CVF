import type { DLPPatternRecord } from '@/lib/policy-events';

export interface DLPMatch {
  patternId: string;
  label: string;
  matchCount: number;
}

export interface DLPResult {
  redacted: string;
  matches: DLPMatch[];
  wasRedacted: boolean;
}

export interface DLPPatternDefinition extends DLPPatternRecord {
  source: 'preset' | 'custom';
}

type PresetPatternDefinition = DLPPatternDefinition & {
  matcher: RegExp;
  validateMatch?: (value: string) => boolean;
};

const PRESET_PATTERNS: PresetPatternDefinition[] = [
  {
    id: 'preset-credit-card',
    label: 'Credit Card',
    regex: String.raw`\b(?:\d[ -]*?){13,19}\b`,
    enabled: true,
    source: 'preset',
    matcher: /\b(?:\d[ -]*?){13,19}\b/giu,
    validateMatch: isLuhnCompatibleCardNumber,
  },
  {
    id: 'preset-api-key-sk',
    label: 'API Key',
    regex: String.raw`\bsk-[a-zA-Z0-9_-]{16,}\b`,
    enabled: true,
    source: 'preset',
    matcher: /\bsk-[a-zA-Z0-9_-]{16,}\b/giu,
  },
  {
    id: 'preset-api-key-bearer',
    label: 'Bearer Token',
    regex: String.raw`\bBearer\s+[A-Za-z0-9._=-]{16,}\b`,
    enabled: true,
    source: 'preset',
    matcher: /\bBearer\s+[A-Za-z0-9._=-]{16,}\b/giu,
  },
  {
    id: 'preset-api-key-aws',
    label: 'AWS Access Key',
    regex: String.raw`\bAKIA[0-9A-Z]{16}\b`,
    enabled: true,
    source: 'preset',
    matcher: /\bAKIA[0-9A-Z]{16}\b/gu,
  },
  {
    id: 'preset-cccd',
    label: 'CCCD',
    regex: String.raw`\b\d{12}\b`,
    enabled: true,
    source: 'preset',
    matcher: /\b\d{12}\b/gu,
  },
  {
    id: 'preset-email',
    label: 'Email',
    regex: String.raw`\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b`,
    enabled: true,
    source: 'preset',
    matcher: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
  },
];

const ALLOWLIST_PATTERNS: RegExp[] = [
  /\b(?:gpt-[\w.-]+|claude[\w.-]*|gemini[\w.-]*|qwen[\w.-]*|qvq[\w.-]*|openrouter)\b/iu,
  /\bCVF_[A-Z0-9_]+\b/u,
  /\b[\w.+-]+@cvf\.local\b/iu,
];

function normalizeMatcher(pattern: string): RegExp | null {
  try {
    return new RegExp(pattern, 'giu');
  } catch {
    return null;
  }
}

function isAllowlisted(value: string): boolean {
  return ALLOWLIST_PATTERNS.some(pattern => pattern.test(value));
}

function isLuhnCompatibleCardNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (Number.isNaN(digit)) return false;

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function applySinglePattern(
  text: string,
  pattern: {
    id: string;
    label: string;
    matcher: RegExp;
    validateMatch?: (value: string) => boolean;
  },
): { redacted: string; matchCount: number } {
  let matchCount = 0;

  const redacted = text.replace(pattern.matcher, match => {
    if (isAllowlisted(match)) return match;
    if (pattern.validateMatch && !pattern.validateMatch(match)) return match;

    matchCount += 1;
    return `[REDACTED:${pattern.label}]`;
  });

  return { redacted, matchCount };
}

export function getPresetDLPPatterns(): DLPPatternDefinition[] {
  return PRESET_PATTERNS.map(pattern => ({
    id: pattern.id,
    label: pattern.label,
    regex: pattern.regex,
    enabled: pattern.enabled,
    source: pattern.source,
  }));
}

export function applyDLPPatterns(text: string, customPatterns: DLPPatternRecord[] = []): DLPResult {
  let workingText = text;
  const matches: DLPMatch[] = [];

  for (const presetPattern of PRESET_PATTERNS) {
    const result = applySinglePattern(workingText, presetPattern);
    workingText = result.redacted;

    if (result.matchCount > 0) {
      matches.push({
        patternId: presetPattern.id,
        label: presetPattern.label,
        matchCount: result.matchCount,
      });
    }
  }

  for (const customPattern of customPatterns.filter(pattern => pattern.enabled)) {
    const matcher = normalizeMatcher(customPattern.regex);
    if (!matcher) continue;

    const result = applySinglePattern(workingText, {
      id: customPattern.id,
      label: customPattern.label,
      matcher,
    });
    workingText = result.redacted;

    if (result.matchCount > 0) {
      matches.push({
        patternId: customPattern.id,
        label: customPattern.label,
        matchCount: result.matchCount,
      });
    }
  }

  return {
    redacted: workingText,
    matches,
    wasRedacted: matches.length > 0,
  };
}
