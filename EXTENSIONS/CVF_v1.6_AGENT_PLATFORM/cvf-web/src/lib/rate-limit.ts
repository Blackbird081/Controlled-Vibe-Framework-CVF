import { NextRequest } from 'next/server';

type Bucket = { count: number; resetAt: number };
const WINDOW_MS = 60 * 1000;

const buckets = new Map<string, Bucket>();
const providerBuckets = new Map<string, Bucket>();

function limits() {
    return {
        maxRequests: Number(process.env.CVF_RATE_LIMIT ?? 30),
        providerQuota: Number(process.env.CVF_PROVIDER_QUOTA_PER_MIN ?? 30),
    };
}

function consumeBucket(map: Map<string, Bucket>, key: string, limit: number) {
    const now = Date.now();
    const bucket = map.get(key) || { count: 0, resetAt: now + WINDOW_MS };
    if (now > bucket.resetAt) {
        bucket.count = 0;
        bucket.resetAt = now + WINDOW_MS;
    }
    bucket.count += 1;
    map.set(key, bucket);
    if (bucket.count > limit) {
        const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
        return { allowed: false as const, retryAfterSeconds };
    }
    return { allowed: true as const, retryAfterSeconds: 0 };
}

function getClientIp(headers: Headers): string {
    const forwarded = headers.get('x-forwarded-for') || headers.get('x-real-ip');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return headers.get('cf-connecting-ip') || 'unknown';
}

export function getRateLimiter() {
    return {
        consume(request: NextRequest, userId?: string, provider?: string) {
            const { maxRequests, providerQuota } = limits();
            const key = userId || getClientIp(request.headers);
            const res1 = consumeBucket(buckets, key, maxRequests);
            if (!res1.allowed) return res1;
            if (provider) {
                const res2 = consumeBucket(providerBuckets, `${key}:${provider}`, providerQuota);
                if (!res2.allowed) return res2;
            }
            return { allowed: true as const, retryAfterSeconds: 0 };
        }
    };
}
