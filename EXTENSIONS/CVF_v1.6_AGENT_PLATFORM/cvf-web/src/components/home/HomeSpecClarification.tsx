'use client';
// Text Encoding Exception: these are the Vietnamese and English result labels.

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
    homeClarificationTitle, type HomeClarification, type HomeClarificationAvailability, type HomeClarificationInput,
} from '@/lib/home-spec-clarification';

export const HomeSpecClarificationAvailability = createContext<HomeClarificationAvailability>('missing_key');

export function HomeSpecClarificationProvider({ availability, children }: { availability: HomeClarificationAvailability; children: ReactNode }) {
    return <HomeSpecClarificationAvailability.Provider value={availability}>{children}</HomeSpecClarificationAvailability.Provider>;
}

const copy = {
    vi: {
        action: 'Nhờ AI làm rõ', pending: 'AI đang làm rõ…',
        missing_key: 'Trang này chưa có khóa để dùng AI. Bạn vẫn có thể tải bản đặc tả.',
        sign_in: 'Đăng nhập để nhờ AI làm rõ. Bạn vẫn có thể tải bản đặc tả.',
        unavailable: 'Hiện chưa dùng được AI để làm rõ. Bạn vẫn có thể tải bản đặc tả.',
        limit: 'Tính năng làm rõ đã hết lượt hôm nay. Bạn vẫn có thể tải bản đặc tả.',
        timeout: 'AI mất quá nhiều thời gian. Bạn vẫn có thể tải bản đặc tả.',
        provider_error: 'Chưa kết nối được với AI. Bạn vẫn có thể tải bản đặc tả.',
        format_error: 'Chưa dùng được câu trả lời của AI. Bạn vẫn có thể tải bản đặc tả.',
        outside_scope: 'Yêu cầu này nằm ngoài phần AI làm rõ. Bạn vẫn có thể tải bản đặc tả.',
        invalid_input: 'Nội dung quá dài hoặc còn thiếu. Bạn vẫn có thể tải bản đặc tả.',
    },
    en: {
        action: 'Ask AI to clarify', pending: 'AI is clarifying…',
        missing_key: 'This site has no key for AI yet. You can still download the specification.',
        sign_in: 'Sign in to ask AI to clarify. You can still download the specification.',
        unavailable: 'AI clarification is temporarily unavailable. You can still download the specification.',
        limit: "AI clarification has reached today's limit. You can still download the specification.",
        timeout: 'AI took too long to respond. You can still download the specification.',
        provider_error: 'Could not connect to AI. You can still download the specification.',
        format_error: 'Could not use the answer from AI. You can still download the specification.',
        outside_scope: 'AI clarification cannot help with this request. You can still download the specification.',
        invalid_input: 'Your text is too long or incomplete. You can still download the specification.',
    },
} as const;

type Label = keyof typeof copy.en;
type State = { input: string; status: Label | 'ready'; result?: HomeClarification };

function isClarification(value: unknown): value is HomeClarification {
    if (!value || typeof value !== 'object') return false;
    const { summary, questions } = value as Partial<HomeClarification>;
    return Array.isArray(summary) && summary.every(paragraph => typeof paragraph === 'string')
        && Array.isArray(questions) && questions.length <= 5 && questions.every(question => typeof question === 'string')
        && summary.length + questions.length > 0;
}

export function useHomeSpecClarification(input: HomeClarificationInput, active: boolean, signedIn: boolean) {
    const configured = useContext(HomeSpecClarificationAvailability);
    const availability = signedIn ? configured : 'sign_in';
    const labels = copy[input.language];
    const body = JSON.stringify(input);
    const inflight = useRef<AbortController | null>(null);
    const [state, setState] = useState<State | null>(null);
    const current = active && state?.input === body ? state : null;

    useEffect(() => () => {
        inflight.current?.abort();
        inflight.current = null;
    }, [body, active]);

    function clear() {
        inflight.current?.abort();
        inflight.current = null;
        setState(null);
    }

    async function clarify() {
        if (!active || availability !== 'ready' || inflight.current) return;
        const controller = new AbortController();
        inflight.current = controller;
        setState({ input: body, status: 'pending' });
        try {
            const response = await fetch('/api/intent-spec/home-clarification', {
                method: 'POST', headers: { 'content-type': 'application/json' }, body, signal: controller.signal,
            });
            const result = await response.json();
            if (controller.signal.aborted) return;
            if (response.ok && result.status === 'ready' && isClarification(result.clarification)) {
                setState({ input: body, status: 'ready', result: result.clarification });
            } else {
                const status = typeof result.status === 'string' && Object.hasOwn(labels, result.status)
                    ? result.status as Label : 'unavailable';
                setState({ input: body, status });
            }
        } catch {
            if (!controller.signal.aborted) setState({ input: body, status: 'unavailable' });
        } finally {
            if (inflight.current === controller) inflight.current = null;
        }
    }

    const message = availability !== 'ready' ? labels[availability]
        : current && current.status !== 'ready' ? labels[current.status] : '';
    return { clarify, clear, message, result: current?.result ?? null, label: labels.action,
        disabled: availability !== 'ready' || current?.status === 'pending' };
}

export function HomeSpecClarificationPanel({ language, result }: { language: HomeClarificationInput['language']; result: HomeClarification }) {
    return <section aria-labelledby="home-clarification-title" className="space-y-2 break-words rounded-xl border border-slate-300 p-3 text-sm dark:border-white/15">
        <h3 id="home-clarification-title" className="font-semibold">{homeClarificationTitle[language]}</h3>
        {result.summary.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        {result.questions.length > 0 && <ol className="list-decimal space-y-1 pl-5">
            {result.questions.map((question, index) => <li key={index}>{question}</li>)}
        </ol>}
    </section>;
}
