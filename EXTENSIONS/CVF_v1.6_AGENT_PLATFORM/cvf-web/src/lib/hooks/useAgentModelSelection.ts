'use client';

import { useEffect, useState } from 'react';
import { parseAgentModelSelection, type AgentModelSelection } from '@/lib/agent-model-catalog';

export function useAgentModelSelection(accountScope?: string) {
    const [preference, setPreference] = useState<{ accountScope: string; model: AgentModelSelection | null }>();
    const storageKey = accountScope ? `cvf_agent_model:${accountScope}` : undefined;

    useEffect(() => {
        if (!accountScope || !storageKey) return;
        let active = true;
        queueMicrotask(() => {
            if (!active) return;
            let model: AgentModelSelection | null = null;
            try {
                model = parseAgentModelSelection(localStorage.getItem(storageKey) ?? '');
            } catch {
                // An account can still select a model when browser storage is unavailable.
            }
            setPreference({ accountScope, model });
        });
        return () => { active = false; };
    }, [accountScope, storageKey]);

    function selectModel(value: string) {
        if (!accountScope || !storageKey) return;
        const model = parseAgentModelSelection(value);
        if (value && !model) return;
        setPreference({ accountScope, model });
        try {
            if (model) localStorage.setItem(storageKey, value);
            else localStorage.removeItem(storageKey);
        } catch {
            // Keep the choice for the open chat.
        }
    }

    const activePreference = accountScope && preference?.accountScope === accountScope ? preference : undefined;
    return {
        model: activePreference?.model ?? null,
        ready: !accountScope || !!activePreference,
        selectModel,
    };
}
