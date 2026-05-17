export type IntegrationProvider = 'supabase' | 'http' | 'none';

export interface SupabaseIntegrationConfig {
    url: string;
    anonKey: string;
}

export interface HttpIntegrationConfig {
    endpoint: string;
    bearerToken: string;
}

export interface IntegrationsConfig {
    runtimeStore: {
        provider: IntegrationProvider;
        supabase: SupabaseIntegrationConfig;
        http: HttpIntegrationConfig;
    };
}

export const INTEGRATIONS_STORAGE_KEY = 'cvf_integrations';

export const defaultIntegrationsConfig: IntegrationsConfig = {
    runtimeStore: {
        provider: 'none',
        supabase: {
            url: '',
            anonKey: '',
        },
        http: {
            endpoint: '',
            bearerToken: '',
        },
    },
};

export function loadIntegrationsConfig(): IntegrationsConfig {
    if (typeof window === 'undefined') {
        return defaultIntegrationsConfig;
    }

    try {
        const saved = window.localStorage.getItem(INTEGRATIONS_STORAGE_KEY);
        if (!saved) {
            return defaultIntegrationsConfig;
        }
        return normalizeIntegrationsConfig(JSON.parse(saved) as Partial<IntegrationsConfig>);
    } catch {
        return defaultIntegrationsConfig;
    }
}

export function saveIntegrationsConfig(config: IntegrationsConfig): void {
    if (typeof window === 'undefined') {
        return;
    }
    window.localStorage.setItem(
        INTEGRATIONS_STORAGE_KEY,
        JSON.stringify(normalizeIntegrationsConfig(config)),
    );
}

export function encodeIntegrationsHeader(config: IntegrationsConfig): string {
    return base64Encode(JSON.stringify(normalizeIntegrationsConfig(config)));
}

export function decodeIntegrationsHeader(header: string): IntegrationsConfig | null {
    try {
        return normalizeIntegrationsConfig(JSON.parse(base64Decode(header)) as Partial<IntegrationsConfig>);
    } catch {
        return null;
    }
}

function normalizeIntegrationsConfig(config: Partial<IntegrationsConfig>): IntegrationsConfig {
    const runtimeStore = config.runtimeStore ?? defaultIntegrationsConfig.runtimeStore;
    const provider = normalizeProvider(runtimeStore.provider);

    return {
        runtimeStore: {
            provider,
            supabase: {
                url: stringValue(runtimeStore.supabase?.url),
                anonKey: stringValue(runtimeStore.supabase?.anonKey),
            },
            http: {
                endpoint: stringValue(runtimeStore.http?.endpoint),
                bearerToken: stringValue(runtimeStore.http?.bearerToken),
            },
        },
    };
}

function normalizeProvider(provider: unknown): IntegrationProvider {
    return provider === 'supabase' || provider === 'http' || provider === 'none'
        ? provider
        : 'none';
}

function stringValue(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function base64Encode(value: string): string {
    const bufferLike = (globalThis as typeof globalThis & { Buffer?: BufferLike }).Buffer;
    if (bufferLike) {
        return bufferLike.from(value, 'utf8').toString('base64');
    }
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

function base64Decode(value: string): string {
    const bufferLike = (globalThis as typeof globalThis & { Buffer?: BufferLike }).Buffer;
    if (bufferLike) {
        return bufferLike.from(value, 'base64').toString('utf8');
    }
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
}

interface BufferLike {
    from(input: string, encoding: string): {
        toString(encoding: string): string;
    };
}
