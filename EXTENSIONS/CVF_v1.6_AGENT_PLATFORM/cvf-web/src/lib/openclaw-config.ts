/**
 * OpenClaw Configuration — Client-side state management for OpenClaw integration.
 * 
 * Ported from: CVF_v1.7.1_SAFETY_RUNTIME/adapters/openclaw/openclaw.config.ts
 * Integrated into cvf-web Settings system.
 * 
 * Principle: AI can propose. Only CVF can execute.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';

// ==================== TYPES ====================

export type OpenClawMode = 'disabled' | 'proposal-only' | 'full';

export interface OpenClawConfig {
    enabled: boolean;
    mode: OpenClawMode;
}

export interface OpenClawProposal {
    id: string;
    action: string;
    source: 'openclaw' | 'api' | 'structured';
    riskLevel: 'low' | 'medium' | 'high';
    state: 'approved' | 'pending' | 'rejected' | 'blocked';
    time: string;
    confidence?: number;
}

// ==================== CONSTANTS ====================

const STORAGE_KEY = 'cvf_openclaw_config';

const DEFAULT_CONFIG: OpenClawConfig = {
    enabled: false,
    mode: 'disabled',
};

// ==================== MODE METADATA ====================

export const OPENCLAW_MODE_INFO: Record<OpenClawMode, {
    vi: { label: string; desc: string };
    en: { label: string; desc: string };
    emoji: string;
    color: string;
}> = {
    disabled: {
        vi: { label: 'Tắt', desc: 'OpenClaw không được sử dụng. CVF hoạt động ở chế độ structured only.' },
        en: { label: 'Disabled', desc: 'OpenClaw is not used. CVF works in structured mode only.' },
        emoji: '⛔',
        color: 'gray',
    },
    'proposal-only': {
        vi: { label: 'Chỉ đề xuất', desc: 'AI chỉ có thể đề xuất (propose). CVF quyết định thực thi.' },
        en: { label: 'Proposal Only', desc: 'AI can only propose. CVF decides execution.' },
        emoji: '📝',
        color: 'amber',
    },
    full: {
        vi: { label: 'Đầy đủ', desc: 'AI đề xuất + CVF xác nhận + tự động thực thi nếu risk thấp.' },
        en: { label: 'Full', desc: 'AI proposes + CVF validates + auto-execute if low risk.' },
        emoji: '🚀',
        color: 'emerald',
    },
};

// ==================== PERSISTENCE ====================

function loadConfig(): OpenClawConfig {
    if (typeof window === 'undefined') return DEFAULT_CONFIG;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return DEFAULT_CONFIG;
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_CONFIG, ...parsed };
    } catch {
        return DEFAULT_CONFIG;
    }
}

function saveConfig(config: OpenClawConfig): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// ==================== HOOK ====================

export function useOpenClawConfig() {
    const [config, setConfigState] = useState<OpenClawConfig>(() => loadConfig());

    const updateConfig = useCallback((updates: Partial<OpenClawConfig>) => {
        setConfigState(prev => {
            const next = { ...prev, ...updates };
            // Sync mode with enabled state
            if (updates.enabled === false) {
                next.mode = 'disabled';
            } else if (updates.enabled === true && next.mode === 'disabled') {
                next.mode = 'proposal-only';
            }
            saveConfig(next);
            return next;
        });
    }, []);

    const toggleEnabled = useCallback(() => {
        updateConfig({ enabled: !config.enabled });
    }, [config.enabled, updateConfig]);

    const setMode = useCallback((mode: OpenClawMode) => {
        updateConfig({
            mode,
            enabled: mode !== 'disabled',
        });
    }, [updateConfig]);

    const statusBadge = useMemo(() => {
        const info = OPENCLAW_MODE_INFO[config.mode];
        return {
            ...info,
            isActive: config.enabled,
        };
    }, [config.mode, config.enabled]);

    return {
        config,
        updateConfig,
        toggleEnabled,
        setMode,
        statusBadge,
    };
}

// ==================== API HELPERS ====================

export async function submitToOpenClaw(
    message: string,
    providerSettings?: { provider: string; apiKey: string; model: string },
): Promise<Record<string, unknown>> {
    const res = await fetch('/api/openclaw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message,
            provider: providerSettings?.provider,
            apiKey: providerSettings?.apiKey,
            model: providerSettings?.model,
        }),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
}

export async function fetchProposals(): Promise<OpenClawProposal[]> {
    try {
        const res = await fetch('/api/openclaw');
        if (!res.ok) return [];
        const data = await res.json();
        return data.proposals || [];
    } catch {
        return [];
    }
}
