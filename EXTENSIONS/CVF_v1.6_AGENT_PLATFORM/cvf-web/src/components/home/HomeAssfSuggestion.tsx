// Text Encoding Exception: operator-facing Vietnamese copy.
'use client';

import { useEffect, useRef, useState } from 'react';
import { ASSF_PACKAGE_CATEGORY, isAssfPackageId } from '@/lib/assf-template-recommendations';
import { requestHomeSpecJev, type HomeSpecSkill } from '@/lib/home-spec-jev-client';

const copy = {
    en: {
        request: 'Suggest a skill for the assistant doing the work',
        loading: 'Looking for a suitable package...',
        empty: 'No additional package was suggested.',
        result: 'Suggested for the assistant doing the work',
    },
    vi: {
        request: 'Gợi ý kỹ năng cho trợ lý nhận việc',
        loading: 'Đang tìm gói kỹ năng phù hợp...',
        empty: 'Chưa có gợi ý thêm về gói kỹ năng.',
        result: 'Gợi ý cho trợ lý nhận việc',
    },
};

type Props = {
    runId: string;
    goal: string;
    language: keyof typeof copy;
    onSuggestion: (skillId: string) => void;
};

export function HomeAssfSuggestion({ runId, goal, language, onSuggestion }: Props) {
    const labels = copy[language];
    const active = useRef(true);
    const inFlight = useRef(false);
    const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
    const [suggestion, setSuggestion] = useState<HomeSpecSkill | null>(null);

    useEffect(() => {
        active.current = true;
        return () => { active.current = false; };
    }, []);

    async function requestSuggestion() {
        if (inFlight.current || state === 'done') return;
        inFlight.current = true;
        setState('loading');
        const response = await requestHomeSpecJev<{ skill?: HomeSpecSkill | null }>({ action: 'skills', runId, goal });
        if (!active.current) return;
        const candidate = response?.skill;
        const prefix = `/skills/${ASSF_PACKAGE_CATEGORY}/`;
        const skillId = typeof candidate?.href === 'string' && candidate.href.startsWith(prefix)
            ? candidate.href.slice(prefix.length)
            : '';
        if (candidate && typeof candidate.title === 'string' && candidate.title.trim() && isAssfPackageId(skillId)) {
            setSuggestion({ title: candidate.title, href: `${prefix}${skillId}` });
            onSuggestion(skillId);
        }
        setState('done');
    }

    return (
        <div className="space-y-2 text-sm">
            {state === 'idle' && (
                <button
                    type="button"
                    onClick={() => void requestSuggestion()}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:border-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-gray-600"
                >
                    {labels.request}
                </button>
            )}
            <div role="status">
                {state === 'loading' && labels.loading}
                {state === 'done' && (suggestion ? (
                    <p>
                        {labels.result}{' '}
                        <a href={suggestion.href} className="font-medium text-indigo-700 underline dark:text-indigo-300">
                            {suggestion.title}
                        </a>
                    </p>
                ) : labels.empty)}
            </div>
        </div>
    );
}
