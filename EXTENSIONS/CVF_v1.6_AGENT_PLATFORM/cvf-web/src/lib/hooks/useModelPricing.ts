'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_MODEL_PRICING } from '@/lib/model-pricing';
import { setModelPricing } from '@/lib/quota-manager';

export type PricingStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useModelPricing() {
    const [pricing, setPricing] = useState(DEFAULT_MODEL_PRICING);
    const [status, setStatus] = useState<PricingStatus>('idle');
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadPricing = async () => {
            setStatus('loading');
            try {
                const response = await fetch('/api/pricing');
                if (!response.ok) {
                    throw new Error(`Pricing API error: ${response.status}`);
                }
                const data = await response.json();
                if (!active) return;
                if (data?.pricing) {
                    const merged = { ...DEFAULT_MODEL_PRICING, ...data.pricing };
                    setPricing(merged);
                    setModelPricing(merged);
                }
                setUpdatedAt(data?.updatedAt || null);
                setStatus('ready');
            } catch (error) {
                if (!active) return;
                console.warn('Failed to load model pricing, using defaults.', error);
                setStatus('error');
            }
        };

        loadPricing();

        return () => {
            active = false;
        };
    }, []);

    return {
        pricing,
        status,
        updatedAt,
    };
}
