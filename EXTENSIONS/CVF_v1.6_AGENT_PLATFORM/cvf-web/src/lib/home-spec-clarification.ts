import type { HomeSpecLocale } from './home-spec-jev-catalog';
import { normalizeRequestText } from './physical-safety';
import { dedupeHomeOpenQuestions, normalizeHomeOpenQuestion } from '@/components/home/home-spec-open-questions';
import { homeSpecExternalRequest } from '@/components/home/home-spec-external-request';

// Text Encoding Exception: displayed and exported titles match in both languages.
export const homeClarificationTitle = {
    vi: 'AI làm rõ — chỉ để tham khảo', en: 'AI clarification — for reference only',
} as const;

export type HomeClarification = { summary: string[]; questions: string[] };
export type HomeClarificationInput = { language: HomeSpecLocale; goal: string; extra: string; answers: string[] };

function markdownText(value: string) {
    return value.replace(/[\\`*_{}[\]<>#+|]/g, '\\$&');
}

export function appendHomeSpecClarification(markdown: string, result: HomeClarification | null, language: HomeSpecLocale): string {
    if (!result) return markdown;
    const paragraphs = result.summary.map(markdownText).join('\n\n');
    const questions = result.questions.map((question, index) => `${index + 1}. ${markdownText(question)}`).join('\n');
    const appendix = [paragraphs, questions].filter(Boolean).join('\n\n');
    return `${markdown}\n\n---\n\n## ${homeClarificationTitle[language]}\n\n${appendix}\n`;
}

export const HOME_CLARIFICATION_MODEL = 'gpt-6-luna';
export const HOME_CLARIFICATION_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const maxOutputTokens = 8192;
const timeoutMs = 25_000;

// Text Encoding Exception: prompts are the exact VI and EN prompts measured in Wave 7(b).
export const HOME_CLARIFICATION_PROMPT = {
    vi: 'Làm rõ mục tiêu, kết quả và phạm vi từ đúng lời người dùng. Đánh dấu điều chưa biết. Không thêm tiêu chí nghiệm thu, con số, tên, giới hạn hay loại kết quả mà người dùng không nói. Nêu tối đa năm câu hỏi quan trọng, mỗi câu gắn với một khoảng trống thật trong lời người dùng. Chỉ trả nội dung làm rõ bằng tiếng Việt.',
    en: 'Clarify the goal, requested result, and scope using only the user’s words. Mark unknowns. Do not add an acceptance criterion, number, name, constraint, or kind of deliverable the user did not state. Ask at most five important questions, each tied to a real gap in what the user said. Return only the clarification in English.',
} as const;

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

type ClarificationReply = { status: 'ready'; result: HomeClarification }
    | { status: 'invalid_input' | 'outside_scope' | 'invalid_key' | 'limit' | 'format_error' | 'timeout' | 'provider_error' };

export async function requestHomeClarification(
    input: HomeClarificationInput, key: string, requestSignal: AbortSignal,
): Promise<ClarificationReply> {
    if (!input.goal.trim() || input.answers.length > 30 || new TextEncoder().encode(JSON.stringify(input)).byteLength > 12_000) {
        return { status: 'invalid_input' };
    }
    if (homeSpecExternalRequest(input.goal, [input.extra, ...input.answers].join('\n'))) return { status: 'outside_scope' };
    const userWords = [...new Set([input.goal, input.extra, ...input.answers].map(value => value.trim()).filter(Boolean))].join('\n');
    const body = JSON.stringify({
        model: HOME_CLARIFICATION_MODEL, reasoning_effort: 'high', max_completion_tokens: maxOutputTokens,
        stream: false, store: false, service_tier: 'default',
        messages: [{ role: 'system', content: HOME_CLARIFICATION_PROMPT[input.language] }, { role: 'user', content: userWords }],
    });
    const useNativeSignals = typeof AbortSignal.any === 'function' && typeof AbortSignal.timeout === 'function';
    const controller = new AbortController();
    const abortFromRequest = () => controller.abort(requestSignal.reason);
    if (!useNativeSignals) {
        if (requestSignal.aborted) abortFromRequest();
        else requestSignal.addEventListener('abort', abortFromRequest, { once: true });
    }
    const deadline = useNativeSignals ? AbortSignal.timeout(timeoutMs) : controller.signal;
    const signal = useNativeSignals ? AbortSignal.any([requestSignal, deadline]) : controller.signal;
    let fallbackTimedOut = false;
    const timer = useNativeSignals ? undefined : setTimeout(() => {
        fallbackTimedOut = true;
        controller.abort();
    }, timeoutMs);
    const timedOut = () => useNativeSignals ? deadline.aborted : fallbackTimedOut;
    try {
        const response = await fetch(HOME_CLARIFICATION_ENDPOINT, {
            method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', redirect: 'error',
            signal,
            headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body,
        });
        if (response.status === 401 || response.status === 403) return { status: 'invalid_key' };
        if (response.status === 429) return { status: 'limit' };
        if (!response.ok) return { status: 'provider_error' };
        const reply = await response.json().catch(() => null);
        if (timedOut()) return { status: 'timeout' };
        const choice = reply?.choices?.[0];
        const content: unknown = choice?.message?.content;
        if (choice?.finish_reason !== 'stop' || typeof content !== 'string' || content.includes(key)
            || !/^gpt-6-luna(?:-20\d{2}-\d{2}-\d{2})?$/.test(reply?.model)) return { status: 'format_error' };
        const result = parseHomeClarification(content);
        return result && ![...result.summary, ...result.questions].some(value => value.includes(key))
            ? { status: 'ready', result } : { status: 'format_error' };
    } catch {
        return { status: timedOut() ? 'timeout' : 'provider_error' };
    } finally {
        clearTimeout(timer);
        if (!useNativeSignals) requestSignal.removeEventListener('abort', abortFromRequest);
    }
}
