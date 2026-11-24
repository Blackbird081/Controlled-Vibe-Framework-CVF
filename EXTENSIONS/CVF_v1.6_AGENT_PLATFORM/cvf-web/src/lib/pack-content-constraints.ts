// Text Encoding Exception: Vietnamese user-facing fixtures and language-matching literals require UTF-8.
import type { Execution } from '@/types';
import { unwrapWholeMarkdownFence } from '@/lib/markdown-output-normalize';

export interface ContentConstraintCheck {
  id: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'NOT_CHECKED';
  detail: string;
}

/** Joins the user's original string inputs; internal `_`-prefixed fields are excluded. */
export function originalBrief(inputs: Record<string, unknown> | undefined): string {
  return Object.entries(inputs ?? {}).filter(([key, value]) => !key.startsWith('_') && typeof value === 'string').map(([, value]) => value).join('\n');
}

/**
 * Single unambiguous explicit word maximum in the user's brief, or undefined.
 * Shared by the prompt builder and the mechanical readout so both read the same limit.
 */
export function parseExplicitWordLimit(brief: string): number | undefined {
  // Inclusive caps ("at most N") allow N words; strict caps ("under N", "dưới N") allow N - 1.
  const limitPattern = /(?:(tối\s*đa|không\s*quá|maximum(?:\s+of)?|max(?:\s+of)?|at\s+most|no\s+more\s+than|up\s+to)|(dưới|ít\s*hơn|under|less\s+than|fewer\s+than|below))\s*(\d+)\s*(?:từ|words?)(?![\p{L}])/giu;
  const matches = [...brief.matchAll(limitPattern)];
  const values = new Set(matches.map(match => Number(match[3]) - (match[2] ? 1 : 0)));
  // Different caps, a negation near any matched phrase, or an approximation word are ambiguous, so never assert a limit.
  // The same cap repeated across fields (for example subject and notes) is one limit, not an ambiguity.
  const negated = matches.some(match => /(?:\bnot\b|\bwithout\b|không\s+(?:phải|cần)|đừng)\s*$/iu.test(brief.slice(Math.max(0, (match.index ?? 0) - 30), match.index ?? 0)));
  const ambiguousLimit = values.size !== 1 || negated || /\b(?:unless|except|approximately|about|around)\b|trừ\s+khi|khoảng/iu.test(brief);
  const [limit] = [...values];
  return ambiguousLimit || !(limit > 0) ? undefined : limit;
}

/** Canonical visible-unit oracle shared by acceptance and pack readout. */
export function countVisibleWhitespaceUnits(output: string): number {
  // Count visible whitespace units, including heading text, excluding standalone Markdown markers.
  const visibleOutput = unwrapWholeMarkdownFence(output);
  return (visibleOutput.replace(/\[\s*[xX]?\s*\]/g, ' ').match(/\S+/gu) ?? []).filter(token =>
    !/^(?:#{1,6}|[-*+]|\d+[.)]|\[[ xX]\]|>{1,}|`{3,}|~{3,}|\|+|[-*_]{2,})$/.test(token)
  ).length;
}

const VI_DIACRITIC = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/giu;
const LETTER = /\p{L}/gu;
const countMatches = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;
/** User-facing body only: Markdown heading lines, fenced code and blank lines are excluded (template headings stay English). */
function bodyForLanguageCheck(output: string): string {
  let inFence = false;
  return unwrapWholeMarkdownFence(output).split(/\r?\n/).filter(line => {
    if (/^\s*(?:```|~~~)/.test(line)) { inFence = !inFence; return false; }
    return !inFence && line.trim() !== '' && !/^\s*#/.test(line);
  }).join('\n');
}

/**
 * Clear mismatch only: clearly Vietnamese original inputs without an explicit request for English, and a body with enough letters
 * but almost no Vietnamese diacritic letters. Never PASS: language quality always needs human review.
 */
function checkLanguageCorrectness(brief: string, output: string): ContentConstraintCheck {
  const row: ContentConstraintCheck = { id: 'language_correctness', label: 'Language correctness', status: 'NOT_CHECKED', detail: 'Language and quality require human review.' };
  const briefLetters = countMatches(brief, LETTER);
  const briefMarks = countMatches(brief, VI_DIACRITIC);
  if (briefMarks < 3 || briefMarks * 20 < briefLetters || /(?:tiếng\s+anh|tieng\s+anh|in\s+english)/iu.test(brief)) return row;
  const body = bodyForLanguageCheck(output);
  const bodyLetters = countMatches(body, LETTER);
  if (bodyLetters < 200 || countMatches(body, VI_DIACRITIC) * 100 >= bodyLetters) return row;
  return { ...row, status: 'FAIL', detail: 'The original inputs are Vietnamese but the body appears to be in another language; headings are excluded from this check.' };
}

/** Mechanical observations only. Original input fields, never the generated intent, define requests. */
export function checkDocumentationConstraints(execution: Execution): ContentConstraintCheck[] {
  const brief = originalBrief(execution.input);
  const output = execution.output ?? '';
  const words = countVisibleWhitespaceUnits(output);
  const limit = parseExplicitWordLimit(brief);
  const stepRequested = /(?:\b3\s*(?:bước|steps?)|(?:three|ba)\s*(?:bước|steps?))/iu.test(brief);
  const checklistRequested = /checklist|check\s*list|danh\s*sách\s*kiểm\s*tra/iu.test(brief);
  const numbered = [...output.matchAll(/^\s*(\d+)[.)]\s+\S/gm)].map(match => Number(match[1]));
  const sequentialThree = numbered.length === 3 && numbered.every((n, i) => n === i + 1);
  const checklistVisible = /^\s*[-*+]\s+\[[ xX]\]\s+\S/m.test(output) || /(?:checklist|check\s*list|danh\s*sách\s*kiểm\s*tra)/iu.test(output);
  return [
    { id: 'word_limit_150', label: limit === undefined ? 'Word maximum' : `${limit}-word maximum`, status: limit === undefined || !output.trim() ? 'NOT_CHECKED' : words <= limit ? 'PASS' : 'FAIL', detail: limit === undefined ? 'No unambiguous recognized numeric word limit in the original inputs.' : !output.trim() ? 'No output to count.' : `${words} visible whitespace-delimited units, including heading words and excluding standalone Markdown markers and the outer Markdown fence; limit ${limit}.` },
    { id: 'three_steps', label: 'Three procedure steps', status: !stepRequested || !output.trim() ? 'NOT_CHECKED' : sequentialThree ? 'PASS' : 'NOT_CHECKED', detail: !stepRequested ? 'No recognized three-step request in the original inputs.' : sequentialThree ? 'Exactly three numbered items (1–3) detected in the output; their meaning is not assessed.' : 'Numbered procedure steps could not be counted unambiguously; review manually.' },
    { id: 'checklist', label: 'Checklist marker', status: !checklistRequested || !output.trim() ? 'NOT_CHECKED' : checklistVisible ? 'PASS' : 'NOT_CHECKED', detail: !checklistRequested ? 'No recognized checklist request in the original inputs.' : checklistVisible ? 'A checklist label or checkbox marker was detected; its completeness is not assessed.' : 'No recognizable checklist marker; review manually.' },
    { id: 'business_accuracy', label: 'Business accuracy and unsupported assumptions', status: 'NOT_CHECKED', detail: 'Requires review by an accountable subject-matter expert.' },
    checkLanguageCorrectness(brief, output),
    { id: 'other_constraints', label: 'Other or unrecognized constraints', status: 'NOT_CHECKED', detail: 'Review the original inputs for constraints this mechanical readout does not recognize.' },
  ];
}
