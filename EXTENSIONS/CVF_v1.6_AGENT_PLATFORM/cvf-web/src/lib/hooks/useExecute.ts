'use client';

import { useState, useCallback } from 'react';
import { AIProvider, ExecutionResponse } from '@/lib/ai';

interface UseExecuteOptions {
    onSuccess?: (result: ExecutionResponse) => void;
    onError?: (error: string) => void;
}

export function useExecute(options?: UseExecuteOptions) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ExecutionResponse | null>(null);

    const execute = useCallback(async (
        templateId: string,
        templateName: string,
        inputs: Record<string, string>,
        intent: string,
        provider?: AIProvider
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
                }),
            });

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
    }, [options]);

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
    const [providers, setProviders] = useState<{
        provider: AIProvider;
        configured: boolean;
        model: string;
    }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [anyConfigured, setAnyConfigured] = useState(false);

    const fetchProviders = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/providers');
            const data = await response.json();
            setProviders(data.providers || []);
            setAnyConfigured(data.anyConfigured || false);
        } catch (err) {
            console.error('Failed to fetch providers:', err);
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
