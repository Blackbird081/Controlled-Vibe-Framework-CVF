const endpoint = '/api/intent-spec/jev';

export interface JevSetting {
    enabled: boolean;
    reason: string | null;
}

export interface HomeSpecChoice {
    runId?: string;
    templateId?: string | null;
    probability?: number | null;
    decision: 'preselect' | 'clarify' | 'fallback';
    candidates?: string[];
    topNoMatch?: boolean;
    fallback?: string | null;
}

export interface HomeSpecFields {
    missing: { id: string; label: string }[];
    fallback?: string;
}

export interface HomeSpecSkill {
    title: string;
    href: string;
}

export async function requestHomeSpecJev<T>(body?: Record<string, unknown>): Promise<T | null> {
    try {
        const result = await fetch(endpoint, body ? {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        } : { cache: 'no-store' });
        return result.ok ? await result.json() as T : null;
    } catch {
        return null;
    }
}
