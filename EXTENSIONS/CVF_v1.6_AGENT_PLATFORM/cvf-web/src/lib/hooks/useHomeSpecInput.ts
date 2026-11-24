'use client';

import { createContext, useCallback, useState, useSyncExternalStore } from 'react';

export const HomeSpecAccountScope = createContext<{ accountScope: string | undefined; canUseSettings: boolean } | null>(null);

type HomeSpecDraft = {
    goal: string;
    extra: string;
    values: Record<string, string>;
    draft: string;
    templateId?: string;
    downloadedTemplate?: string;
};

type HomeSpecInput = HomeSpecDraft & { unfinishedDrafts: HomeSpecDraft[] };
const blankDraft: HomeSpecDraft = { goal: '', extra: '', values: {}, draft: '' };
const empty: HomeSpecInput = { ...blankDraft, unfinishedDrafts: [] };
const cache = new Map<string, { raw: string; input: HomeSpecInput; onlyInMemory?: boolean }>();
const changed = 'cvf:homeSpecInputChanged';

function parseDraft(input: Partial<HomeSpecDraft> | null): HomeSpecDraft | null {
    if (!input || typeof input.goal !== 'string' || typeof input.extra !== 'string' || typeof input.draft !== 'string'
        || !input.values || Array.isArray(input.values) || typeof input.values !== 'object'
        || Object.values(input.values).some(value => typeof value !== 'string')) return null;
    return {
        goal: input.goal, extra: input.extra, draft: input.draft, values: input.values,
        templateId: typeof input.templateId === 'string' ? input.templateId : undefined,
        downloadedTemplate: typeof input.downloadedTemplate === 'string' ? input.downloadedTemplate : undefined,
    };
}

function readInput(key: string | undefined): HomeSpecInput {
    if (!key || typeof window === 'undefined') return empty;
    const cached = cache.get(key);
    if (cached?.onlyInMemory) return cached.input;
    try {
        const raw = window.sessionStorage.getItem(key);
        if (cached && raw === cached.raw) return cached.input;
        if (!raw) return empty;
        const input = JSON.parse(raw) as Partial<HomeSpecInput> | null;
        const active = parseDraft(input);
        if (!active) return empty;
        const drafts = Array.isArray(input?.unfinishedDrafts) ? input.unfinishedDrafts : [];
        const validated = {
            ...active,
            unfinishedDrafts: drafts.map(parseDraft).filter((draft): draft is HomeSpecDraft => draft !== null),
        };
        cache.set(key, { raw, input: validated });
        return validated;
    } catch {
        return cached?.input ?? empty;
    }
}

function writeInput(key: string, input: HomeSpecInput): boolean {
    const raw = JSON.stringify(input);
    cache.set(key, { raw, input });
    let saved = false;
    try {
        window.sessionStorage.setItem(key, raw);
        saved = true;
    } catch {
        // Keep the mounted editor usable even when browser storage is unavailable.
        cache.set(key, { raw, input, onlyInMemory: true });
    }
    window.dispatchEvent(new CustomEvent(changed, { detail: key }));
    return saved;
}

export function useHomeSpecInput(accountScope: string | undefined) {
    const key = accountScope ? `cvf:home-spec-input:v1:${accountScope}` : undefined;
    const subscribe = useCallback((listener: () => void) => {
        const onChange = (event: Event) => {
            if ((event as CustomEvent).detail === key) listener();
        };
        window.addEventListener(changed, onChange);
        return () => window.removeEventListener(changed, onChange);
    }, [key]);
    const getSnapshot = useCallback(() => readInput(key), [key]);
    const stored = useSyncExternalStore(subscribe, getSnapshot, () => empty);
    const [temporary, setTemporary] = useState(empty);

    const setInput = useCallback(<K extends keyof HomeSpecInput>(
        field: K,
        change: HomeSpecInput[K] | ((previous: HomeSpecInput[K]) => HomeSpecInput[K]),
    ) => {
        const update = (previous: HomeSpecInput) => {
            const next = typeof change === 'function' ? change(previous[field]) : change;
            if (next === previous[field]) return previous;
            return { ...previous, downloadedTemplate: undefined, [field]: next };
        };
        if (key) return writeInput(key, update(readInput(key)));
        setTemporary(update);
        return false;
    }, [key]);

    function updateInput(update: (previous: HomeSpecInput) => HomeSpecInput) {
        if (key) writeInput(key, update(readInput(key)));
        else setTemporary(update);
    }

    function resetInput() {
        updateInput(previous => ({ ...blankDraft, unfinishedDrafts: previous.unfinishedDrafts }));
    }

    function swapDraft(next: HomeSpecDraft, restoredIndex?: number) {
        updateInput(previous => {
            const { unfinishedDrafts, ...current } = previous;
            const remaining = unfinishedDrafts.filter((_, index) => index !== restoredIndex);
            if (current.goal.trim() && !current.downloadedTemplate) remaining.unshift(current);
            return { ...next, unfinishedDrafts: remaining };
        });
    }

    return {
        input: key ? stored : temporary,
        setInput,
        resetInput,
        startSeparateTask: (goal: string) => swapDraft({ ...blankDraft, goal }),
        restoreDraft: swapDraft,
    };
}
