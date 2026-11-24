'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SettingsData } from '@/components/Settings';
import { AIProvider, ExecutionResponse, ProviderStatus, ExecutionRequest } from '@/lib/ai';

interface UseExecuteOptions {
    onSuccess?: (result: ExecutionResponse) => void;
    onError?: (error: string) => void;
}

export function useExecute(options?: UseExecuteOptions) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ExecutionResponse | null>(null);

    const execute = useCallback(async (
        templateId: string,
        templateName: string,
        inputs: Record<string, string>,
        intent: string,
        provider?: AIProvider,
        mode?: 'simple' | 'governance' | 'full'
    ) => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId,
                    templateName,
                    inputs,
                    intent,
                    provider,
                    mode,
                }),
            });

            if (response.status === 401) {
                router.push(`/login?from=${encodeURIComponent(window.location.pathname)}`);
                return null;
            }

            const data: ExecutionResponse = await response.json();

            setResult(data);

            if (data.success) {
                options?.onSuccess?.(data);
            } else {
                setError(data.error || 'Unknown error');
                options?.onError?.(data.error || 'Unknown error');
            }

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Network error';
            setError(errorMessage);
            options?.onError?.(errorMessage);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [options, router]);

    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setResult(null);
    }, []);

    return {
        execute,
        reset,
        isLoading,
        error,
        result,
    };
}

// Hook to check provider status
export function useProviders() {
    const [providers, setProviders] = useState<ProviderStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [anyConfigured, setAnyConfigured] = useState(false);

    const fetchProviders = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/providers', { cache: 'no-store' });
            if (!response.ok) throw new Error('Provider status unavailable');
            const data = await response.json();
            if (!Array.isArray(data.providers)) throw new Error('Invalid provider status');
            setProviders(data.providers);
            setAnyConfigured(data.anyConfigured || false);
        } catch {
            setProviders([]);
            setAnyConfigured(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        providers,
        isLoading,
        anyConfigured,
        fetchProviders,
    };
}


export function mapSettingsProviderToExecutionProvider(provider?: string): ExecutionRequest['provider'] | undefined {
    if (!provider) {
        return undefined;
    }

    if (provider === 'anthropic') {
        return 'claude';
    }

    return provider as ExecutionRequest['provider'];
}

export function selectExecutionProviderModel(settings: SettingsData) {
    const executionProvider = mapSettingsProviderToExecutionProvider(settings.preferences?.defaultProvider);
    const selectedModel = settings.preferences?.defaultProvider
        ? settings.providers?.[settings.preferences.defaultProvider]?.selectedModel
        : undefined;
    return { executionProvider, selectedModel };
}

/** Pure selection only; callers retain their original fetch/json awaits and active check. */
export function resolveClaudeReadinessModel(status: { providers?: unknown }, selectedModel?: string): string | undefined {
    if (!Array.isArray(status.providers)) throw new Error('Claude readiness is unknown.');
    const lane = status.providers.find((p: { provider: string }) => p.provider === 'claude');
    if (lane?.executionSurface === 'claude_cli_subscription') {
        if (lane.nativeAuthState !== 'available' || lane.readiness !== 'live_task_ready' || lane.model !== 'sonnet') throw new Error('Claude subscription is not ready. Inspect native sign-in before another run.');
        return 'sonnet';
    }
    return selectedModel;
}

// Text Encoding Exception: Vietnamese model readout preserves its native characters.
export function nativeModelReadout(evidence: { executionSurface?: string; observedModelId?: string } | null, isVi: boolean): string | undefined {
    if (evidence?.executionSurface !== 'claude_cli_subscription') return undefined;
    const label = isVi ? 'Bí danh: sonnet; model quan sát:' : 'Alias: sonnet; observed model:';
    return `${label} ${evidence.observedModelId || (isVi ? 'chưa rõ' : 'unknown')}`;
}
