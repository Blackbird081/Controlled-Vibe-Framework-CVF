import { NextResponse } from 'next/server';
import { DEFAULT_MODEL_PRICING } from '@/lib/model-pricing';

export async function GET() {
    let pricing = DEFAULT_MODEL_PRICING;
    let source = 'default';

    const envPricing = process.env.MODEL_PRICING_JSON;
    if (envPricing) {
        try {
            const parsed = JSON.parse(envPricing);
            if (parsed && typeof parsed === 'object') {
                pricing = { ...pricing, ...parsed };
                source = 'env';
            }
        } catch {
            source = 'default';
        }
    }

    return NextResponse.json({
        pricing,
        source,
        updatedAt: new Date().toISOString(),
    });
}
