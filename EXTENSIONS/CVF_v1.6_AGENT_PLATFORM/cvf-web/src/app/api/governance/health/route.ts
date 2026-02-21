import { NextResponse } from 'next/server';
import { governanceHealth } from '@/lib/governance-engine';

/**
 * GET /api/governance/health
 * Proxy to v1.6.1 Governance Engine health endpoint.
 * No auth required — used for connection status indicator.
 */
export async function GET() {
    try {
        const result = await governanceHealth();

        if (!result) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Governance Engine unreachable',
                    connectionStatus: 'disconnected',
                },
                { status: 503 },
            );
        }

        return NextResponse.json({
            success: true,
            connectionStatus: 'connected',
            ...result,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal error',
                connectionStatus: 'disconnected',
            },
            { status: 500 },
        );
    }
}
