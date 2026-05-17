'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    defaultIntegrationsConfig,
    encodeIntegrationsHeader,
    loadIntegrationsConfig,
    type IntegrationsConfig,
} from '../integrations-config';

export type RuntimeStoreHeaders = Record<string, string>;

export function useRuntimeStore(): { headers: RuntimeStoreHeaders; isConfigured: boolean } {
    const [config, setConfig] = useState<IntegrationsConfig>(defaultIntegrationsConfig);

    useEffect(() => {
        queueMicrotask(() => {
            setConfig(loadIntegrationsConfig());
        });
    }, []);

    const isConfigured = config.runtimeStore.provider !== 'none';
    const headers = useMemo<RuntimeStoreHeaders>(
        () => {
            if (!isConfigured) {
                return {} as RuntimeStoreHeaders;
            }
            return { 'x-cvf-integration-config': encodeIntegrationsHeader(config) };
        },
        [config, isConfigured],
    );

    return { headers, isConfigured };
}
