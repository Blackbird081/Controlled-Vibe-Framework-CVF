/**
 * Output Validator — v1.6 Enhancement Track 1.2
 *
 * Post-response validation for AI outputs before showing to non-coder users.
 * Checks structure, length, safety, and intent alignment.
 * Triggers auto-retry when validation fails (max 2 retries).
 *
 * The user NEVER sees validation internals — only:
 *   - Slightly longer processing (retry happening)
 *   - Better quality result (retry succeeded)
 *   - Friendly "needs improvement" label (all retries exhausted)
 *
 * @module lib/output-validator
 */

// ─── Types ────────────────────────────────────────────────────────────

export type ValidationDecision = 'PASS' | 'RETRY' | 'WARN';

export type ValidationIssue =
  | 'EMPTY_OUTPUT'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'MISSING_STRUCTURE'
  | 'UNSAFE_CONTENT'
  | 'INTENT_MISMATCH'
  | 'REPETITIVE_CONTENT'
  | 'LANGUAGE_MISMATCH';

export interface ValidationResult {
  decision: ValidationDecision;
  issues: ValidationIssue[];
  reasons: string[];
  qualityHint: 'excellent' | 'good' | 'decent' | 'needs_improvement';
  retryable: boolean;
  /** Suggested prompt adjustment for retry */
  retryHint?: string;
}

export interface OutputValidationInput {
  output: string;
  intent: string;
  templateName?: string;
  templateCategory?: string;
  expectedMinLength?: number;
  expectedMaxLength?: number;
  language?: 'vi' | 'en';
}

// ─── Constants ────────────────────────────────────────────────────────

const DEFAULT_MIN_LENGTH = 50;
const DEFAULT_MAX_LENGTH = 50000;
const REPETITION_THRESHOLD = 0.4;

const UNSAFE_PATTERNS: RegExp[] = [
  /\b(rm\s+-rf|drop\s+table|delete\s+from\s+\*|format\s+c:)\b/i,
  /\b(password|secret|api[_-]?key)\s*[:=]\s*["'][^"']{8,}/i,
  /\b(hack|exploit|inject|bypass\s+auth)\b/i,
];

const STRUCTURE_INDICATORS = [
  /^#{1,3}\s/m,           // Markdown headings
  /^\d+\.\s/m,            // Numbered lists
  /^[-*]\s/m,             // Bullet lists
  /```[\s\S]*?```/,       // Code blocks
  /\*\*[^*]+\*\*/,        // Bold text
  /^\|.+\|$/m,            // Tables
];

// ─── Core Validator ───────────────────────────────────────────────────

export function validateOutput(input: OutputValidationInput): ValidationResult {
  const issues: ValidationIssue[] = [];
  const reasons: string[] = [];
  const output = input.output ?? '';

  // 1. Empty check
  if (!output || output.trim().length === 0) {
    return {
      decision: 'RETRY',
      issues: ['EMPTY_OUTPUT'],
      reasons: ['AI returned empty response.'],
      qualityHint: 'needs_improvement',
      retryable: true,
      retryHint: 'Please provide a complete, detailed response.',
    };
  }

  // 2. Length check
  const minLen = input.expectedMinLength ?? DEFAULT_MIN_LENGTH;
  const maxLen = input.expectedMaxLength ?? DEFAULT_MAX_LENGTH;

  if (output.length < minLen) {
    issues.push('TOO_SHORT');
    reasons.push(`Response is too short (${output.length} chars, minimum: ${minLen}).`);
  }

  if (output.length > maxLen) {
    issues.push('TOO_LONG');
    reasons.push(`Response exceeds maximum length (${output.length} chars, max: ${maxLen}).`);
  }

  // 3. Structure check (for non-trivial responses)
  if (output.length > 200) {
    const hasStructure = STRUCTURE_INDICATORS.some((pattern) => pattern.test(output));
    if (!hasStructure) {
      issues.push('MISSING_STRUCTURE');
      reasons.push('Response lacks structured formatting (headings, lists, etc.).');
    }
  }

  // 4. Safety check
  for (const pattern of UNSAFE_PATTERNS) {
    if (pattern.test(output)) {
      issues.push('UNSAFE_CONTENT');
      reasons.push('Response contains potentially unsafe content patterns.');
      break;
    }
  }

  // 5. Intent alignment (basic keyword check)
  if (input.intent && output.length > 100) {
    const intentKeywords = extractKeywords(input.intent);
    const outputLower = output.toLowerCase();
    const matchCount = intentKeywords.filter((kw) => outputLower.includes(kw)).length;
    const matchRatio = intentKeywords.length > 0 ? matchCount / intentKeywords.length : 1;

    if (matchRatio < 0.2 && intentKeywords.length >= 3) {
      issues.push('INTENT_MISMATCH');
      reasons.push('Response may not address the original intent.');
    }
  }

  // 6. Repetition detection
  if (detectRepetition(output) > REPETITION_THRESHOLD) {
    issues.push('REPETITIVE_CONTENT');
    reasons.push('Response contains excessive repetition.');
  }

  // 7. Decide outcome
  const decision = computeDecision(issues);
  const qualityHint = computeQualityHint(issues, output.length, minLen);
  const retryable = decision === 'RETRY';
  const retryHint = retryable ? buildRetryHint(issues, input) : undefined;

  return {
    decision,
    issues,
    reasons,
    qualityHint,
    retryable,
    retryHint,
  };
}

// ─── Auto-Retry Logic ─────────────────────────────────────────────────

export const MAX_RETRIES = 2;

export interface RetryState {
  attempt: number;
  previousIssues: ValidationIssue[];
}

/**
 * Determines if another retry should be attempted.
 * Returns adjusted prompt hint or null if retries are exhausted.
 */
export function shouldRetry(
  validation: ValidationResult,
  state: RetryState,
): { retry: boolean; adjustedHint?: string } {
  if (!validation.retryable) {
    return { retry: false };
  }

  if (state.attempt >= MAX_RETRIES) {
    return { retry: false };
  }

  // Don't retry for same issues repeatedly
  const newIssues = validation.issues.filter(
    (i) => !state.previousIssues.includes(i)
  );

  if (newIssues.length === 0 && state.attempt > 0) {
    return { retry: false };
  }

  return {
    retry: true,
    adjustedHint: validation.retryHint,
  };
}

// ─── Internals ────────────────────────────────────────────────────────

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'i', 'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
    'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'and',
    'or', 'not', 'no', 'this', 'that', 'it', 'my', 'your', 'we', 'they',
    'want', 'need', 'please', 'can', 'will', 'would', 'should', 'do',
    'tôi', 'của', 'và', 'cho', 'với', 'trong', 'là', 'có', 'không',
    'một', 'này', 'đó', 'được', 'từ', 'các', 'những', 'về', 'đến',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

function detectRepetition(text: string): number {
  const sentences = text.split(/[.!?\n]+/).filter((s) => s.trim().length > 10);
  if (sentences.length < 4) return 0;

  const seen = new Map<string, number>();
  for (const s of sentences) {
    const normalized = s.trim().toLowerCase().slice(0, 80);
    seen.set(normalized, (seen.get(normalized) || 0) + 1);
  }

  const totalSentences = sentences.length;
  const duplicates = Array.from(seen.values()).filter((c) => c > 1).reduce((a, b) => a + b - 1, 0);
  return totalSentences > 0 ? duplicates / totalSentences : 0;
}

function computeDecision(issues: ValidationIssue[]): ValidationDecision {
  if (issues.includes('EMPTY_OUTPUT')) return 'RETRY';
  if (issues.includes('UNSAFE_CONTENT')) return 'RETRY';

  const retryIssues: ValidationIssue[] = ['TOO_SHORT', 'REPETITIVE_CONTENT'];
  if (issues.some((i) => retryIssues.includes(i))) return 'RETRY';

  if (issues.length > 0) return 'WARN';
  return 'PASS';
}

function computeQualityHint(
  issues: ValidationIssue[],
  outputLen: number,
  minLen: number,
): ValidationResult['qualityHint'] {
  if (issues.includes('EMPTY_OUTPUT') || issues.includes('UNSAFE_CONTENT')) {
    return 'needs_improvement';
  }
  if (issues.length >= 2) return 'needs_improvement';
  if (issues.length === 1) return 'decent';
  if (outputLen > minLen * 3) return 'excellent';
  return 'good';
}

function buildRetryHint(issues: ValidationIssue[], input: OutputValidationInput): string {
  const hints: string[] = [];

  if (issues.includes('EMPTY_OUTPUT') || issues.includes('TOO_SHORT')) {
    hints.push('Please provide a more detailed and comprehensive response.');
  }
  if (issues.includes('UNSAFE_CONTENT')) {
    hints.push('Please avoid including sensitive data, credentials, or destructive commands.');
  }
  if (issues.includes('REPETITIVE_CONTENT')) {
    hints.push('Please vary your response and avoid repeating the same points.');
  }
  if (issues.includes('MISSING_STRUCTURE')) {
    hints.push('Please use headings, bullet points, or numbered lists to structure the response.');
  }
  if (issues.includes('INTENT_MISMATCH')) {
    hints.push(`Please focus on the original request: "${input.intent}".`);
  }

  return hints.join(' ');
}
