'use client';
// Text Encoding Exception: these are the Vietnamese and English result labels.

import { useEffect, useRef, useState } from 'react';
import { useSettings } from '@/components/Settings';
import {
    homeClarificationTitle, requestHomeClarification, type HomeClarification, type HomeClarificationInput,
} from '@/lib/home-spec-clarification';

const copy = {
    vi: {
        action: 'Nhờ AI làm rõ', pending: 'AI đang làm rõ…',
        missing_key: 'Cần khóa OpenAI của bạn để dùng nút này. Bạn vẫn có thể tải bản đặc tả.',
        invalid_key: 'OpenAI từ chối khóa này. Hãy kiểm tra khóa và quyền dùng AI trong Cài đặt. Bạn vẫn có thể tải bản đặc tả.',
        limit: 'OpenAI đang giới hạn lượt gọi. Hãy kiểm tra hạn mức của khóa hoặc thử lại sau. Bạn vẫn có thể tải bản đặc tả.',
        billing: 'Lượt làm rõ này được tính vào khóa OpenAI của bạn.',
        timeout: 'AI mất quá nhiều thời gian. Bạn vẫn có thể tải bản đặc tả.',
        provider_error: 'Chưa kết nối được với AI. Bạn vẫn có thể tải bản đặc tả.',
        format_error: 'Chưa dùng được câu trả lời của AI. Bạn vẫn có thể tải bản đặc tả.',
        outside_scope: 'Yêu cầu này nằm ngoài phần AI làm rõ. Bạn vẫn có thể tải bản đặc tả.',
        invalid_input: 'Nội dung quá dài hoặc còn thiếu. Bạn vẫn có thể tải bản đặc tả.',
    },
    en: {
        action: 'Ask AI to clarify', pending: 'AI is clarifying…',
        missing_key: 'You need your own OpenAI key to use this button. You can still download the specification.',
        invalid_key: 'Your OpenAI key was refused. Check the key and its access in Settings. You can still download the specification.',
        limit: 'OpenAI is limiting requests. Check your key’s usage limit or try again later. You can still download the specification.',
        billing: 'This clarification is billed to your OpenAI key.',
        timeout: 'AI took too long to respond. You can still download the specification.',
        provider_error: 'Could not connect to AI. You can still download the specification.',
        format_error: 'Could not use the answer from AI. You can still download the specification.',
        outside_scope: 'AI clarification cannot help with this request. You can still download the specification.',
        invalid_input: 'Your text is too long or incomplete. You can still download the specification.',
    },
} as const;

type State = { input: string; status: Exclude<keyof typeof copy.en, 'action' | 'billing'> | 'ready'; result?: HomeClarification };

export function useHomeSpecClarification(input: HomeClarificationInput, active: boolean, canUseSavedKey = true) {
    const { settings } = useSettings(true);
    const key = canUseSavedKey ? settings.providers?.openai?.apiKey?.trim() : undefined;
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
        if (!active || !key || inflight.current) return;
        const controller = new AbortController();
        inflight.current = controller;
        setState({ input: body, status: 'pending' });
        try {
            const reply = await requestHomeClarification(input, key, controller.signal);
            if (controller.signal.aborted) return;
            setState(reply.status === 'ready' ? { input: body, status: 'ready', result: reply.result } : { input: body, status: reply.status });
        } finally {
            if (inflight.current === controller) inflight.current = null;
        }
    }

    const message = !key ? labels.missing_key
        : current && current.status !== 'ready' ? labels[current.status] : '';
    return { clarify, clear, message, missingKey: !key, billing: labels.billing, result: current?.result ?? null,
        label: labels.action, disabled: !key || current?.status === 'pending' };
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
