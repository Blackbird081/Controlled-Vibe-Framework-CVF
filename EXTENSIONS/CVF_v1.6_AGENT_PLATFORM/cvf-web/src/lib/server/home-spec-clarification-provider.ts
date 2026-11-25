import { calculateTokenCost } from '@/lib/model-pricing';
import { normalizeRequestText } from '@/lib/physical-safety';
import { dedupeHomeOpenQuestions, normalizeHomeOpenQuestion } from '@/components/home/home-spec-open-questions';
import type { HomeClarification, HomeClarificationInput } from '@/lib/home-spec-clarification';

export const HOME_CLARIFICATION_MODEL = 'gpt-6-luna';
const cachedInputDiscount = 0.09;
const maxOutputTokens = 8192;
const timeoutMs = 25_000;

// Text Encoding Exception: prompts are the exact VI and EN prompts measured in Wave 7(b).
export const HOME_CLARIFICATION_PROMPT = {
    vi: 'Làm rõ mục tiêu, kết quả và phạm vi từ đúng lời người dùng. Đánh dấu điều chưa biết. Không thêm tiêu chí nghiệm thu, con số, tên, giới hạn hay loại kết quả mà người dùng không nói. Nêu tối đa năm câu hỏi quan trọng, mỗi câu gắn với một khoảng trống thật trong lời người dùng. Chỉ trả nội dung làm rõ bằng tiếng Việt.',
    en: 'Clarify the goal, requested result, and scope using only the user’s words. Mark unknowns. Do not add an acceptance criterion, number, name, constraint, or kind of deliverable the user did not state. Ask at most five important questions, each tied to a real gap in what the user said. Return only the clarification in English.',
} as const;

type Usage = { inputTokens: number; outputTokens: number; microUsd: number };
type Outcome = { status: 'ready'; clarification: HomeClarification; usage: Usage }
    | { status: 'format_error' | 'timeout' | 'provider_error'; usage?: Usage };

function costMicroUsd(input: number, output: number, cached = 0) {
    return Math.ceil(calculateTokenCost(HOME_CLARIFICATION_MODEL, input, output) * 1_000_000 - cached * cachedInputDiscount);
}

export function buildHomeClarificationCall(input: HomeClarificationInput) {
    const userWords = [...new Set([input.goal, input.extra, ...input.answers].map(value => value.trim()).filter(Boolean))].join('\n');
    const body = JSON.stringify({
        model: HOME_CLARIFICATION_MODEL, reasoning_effort: 'high', max_completion_tokens: maxOutputTokens,
        stream: false, store: false, service_tier: 'default',
        messages: [{ role: 'system', content: HOME_CLARIFICATION_PROMPT[input.language] }, { role: 'user', content: userWords }],
    });
    // An input byte per token plus space for chat framing is a conservative bound at this size.
    const inputTokens = Buffer.byteLength(body, 'utf8') + 4096;
    return { body, bound: { inputTokens, outputTokens: maxOutputTokens, microUsd: costMicroUsd(inputTokens, maxOutputTokens) } };
}

function tokenCount(value: unknown, cap: number): value is number {
    return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= cap;
}

const questionLabel = /^(?:open questions?|questions?(?: to (?:ask|clarify|resolve))?|clarifying questions?|unknowns?(?: to clarify)?|(?:nhung )?(?:dieu|diem) (?:can lam ro|chua ro)|(?:cac )?cau hoi(?: can lam ro)?|can lam ro|chua ro|chua biet)$/;
const listMarker = /^(?:\d+[.)]|[-*+])\s+/;
const headingMarker = /^#{1,6}\s+/;

function nearClarificationQuestion(left: string, right: string): boolean {
    const [short, long] = left.length <= right.length ? [left, right] : [right, left];
    if (short === long) return true;
    if (!long.startsWith(`${short} `) || short.split(' ').length < 5) return false;
    const qualifier = long.slice(short.length + 1);
    return qualifier.split(' ').length <= 2
        && !/\d|\b(?:sang|chieu|thu|ngay|luc|khi|neu|sau|truoc|thang|nam|before|after|when|if|unless|except)\b/.test(qualifier);
}

function distinctClarificationQuestions(questions: string[]): string[] {
    const singleQuestionKeys: string[] = [];
    return dedupeHomeOpenQuestions(questions).filter(question => {
        // Compare short restatements. A multipart item can carry different follow-up questions.
        if (!/^[^?]+\?$/.test(question)) return true;
        const key = normalizeHomeOpenQuestion(question)
            .replace(/\b(?:la nguoi|viec|is the person (?:who|that))\b/g, ' ').replace(/\s+/g, ' ').trim();
        if (singleQuestionKeys.some(previous => nearClarificationQuestion(previous, key))) return false;
        singleQuestionKeys.push(key);
        return true;
    });
}

function stripQuestionLabel(text: string): { text: string; heading: boolean } {
    const colon = text.indexOf(':');
    const label = colon < 0 ? text : text.slice(0, colon);
    if (!questionLabel.test(normalizeRequestText(label))) return { text, heading: false };
    return { text: colon < 0 ? '' : text.slice(colon + 1).trim(), heading: true };
}

export function parseHomeClarification(reply: unknown): HomeClarification | null {
    if (typeof reply !== 'string' || !reply.trim() || reply.length > 12_000 || /```|~~~|[\u0000]/u.test(reply)) return null;
    const summary: string[] = [];
    const questions: string[] = [];
    let inQuestions = false;
    let item: string | undefined;

    function finishItem() {
        if (!item) return;
        const { text } = stripQuestionLabel(item);
        if (text) (inQuestions || text.includes('?') ? questions : summary).push(text);
        item = undefined;
    }

    for (const line of reply.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || /^[-*_]{3,}$/.test(trimmed)) continue;
        const marker = listMarker.test(trimmed);
        const heading = headingMarker.test(trimmed);
        const cleaned = trimmed.replace(listMarker, '').replace(headingMarker, '').replaceAll('**', '').trim();
        if (item && !marker && !heading && /^(?: {2,}|\t)/.test(line)) {
            item += ` ${cleaned}`;
            continue;
        }
        finishItem();
        if (marker) {
            item = cleaned;
            continue;
        }
        const content = stripQuestionLabel(cleaned);
        if (heading || (content.heading && !content.text)) inQuestions = content.heading;
        if (content.text && /[\p{L}\p{N}]/u.test(content.text)) {
            (content.text.includes('?') ? questions : summary).push(content.text);
        }
    }
    finishItem();
    if (!summary.length && !questions.length) return null;
    const distinctQuestions = distinctClarificationQuestions(questions).slice(0, 5);
    return { summary, questions: distinctQuestions.map(question => question.replace(
        /^([^\p{L}\p{N}]*)(\p{L})/u, (_match, prefix: string, first: string) => prefix + first.toUpperCase(),
    )) };
}

export async function runHomeClarificationCall(
    call: ReturnType<typeof buildHomeClarificationCall>, key: string, requestSignal: AbortSignal,
): Promise<Outcome> {
    const timeout = AbortSignal.timeout(timeoutMs);
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', redirect: 'error', cache: 'no-store', signal: AbortSignal.any([requestSignal, timeout]),
            headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: call.body,
        });
        if (!response.ok) {
            // Keep diagnostic metadata small without logging the provider's body or request.
            console.warn('[Home clarification] Provider rejected request', response.status);
            return { status: 'provider_error' };
        }
        const reply = await response.json();
        const { prompt_tokens: input, completion_tokens: output, prompt_tokens_details: details } = reply?.usage ?? {};
        const cached = details?.cached_tokens ?? 0;
        if (!/^gpt-6-luna(?:-20\d{2}-\d{2}-\d{2})?$/.test(reply?.model)
            || !tokenCount(input, call.bound.inputTokens) || !tokenCount(output, maxOutputTokens) || !tokenCount(cached, input)) {
            return { status: 'provider_error' };
        }
        const usage = { inputTokens: input, outputTokens: output, microUsd: costMicroUsd(input, output, cached) };
        const choice = reply.choices?.[0];
        const clarification = choice?.finish_reason === 'stop' ? parseHomeClarification(choice?.message?.content) : null;
        return clarification ? { status: 'ready', clarification, usage } : { status: 'format_error', usage };
    } catch (error) {
        const timedOut = timeout.aborted || (error && typeof error === 'object' && 'name' in error && error.name === 'TimeoutError');
        return { status: timedOut ? 'timeout' : 'provider_error' };
    }
}
