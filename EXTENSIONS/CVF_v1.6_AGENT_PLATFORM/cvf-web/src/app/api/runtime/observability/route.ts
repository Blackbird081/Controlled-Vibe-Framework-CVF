import { NextRequest, NextResponse } from 'next/server';
import { decodeIntegrationsHeader } from '@/lib/integrations-config';
import { buildIntegrationAdapter } from '@/lib/server/integration-store';
import { getRuntimeObservabilitySnapshot } from '@/lib/server/runtime-observability';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const configHeader = request.headers.get('x-cvf-integration-config');
    const clientConfig = configHeader ? decodeIntegrationsHeader(configHeader) : null;
    const integrationAdapter = buildIntegrationAdapter(clientConfig);
    const snapshot = await getRuntimeObservabilitySnapshot({ integrationAdapter });

    return NextResponse.json(snapshot, {
        headers: {
            'Cache-Control': 'no-store',
        },
    });
}
