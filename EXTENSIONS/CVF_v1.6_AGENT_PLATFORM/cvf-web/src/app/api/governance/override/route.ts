import { NextRequest, NextResponse } from 'next/server';
import { governanceFetchDirect } from '@/lib/governance-engine';
import { authorizeRouteGovernanceProof, getRouteGovernanceProofConfig } from '@/lib/route-governance-proof';

export async function POST(request: NextRequest) {
    try {
        const bodyText = await request.text();
        const routeAuth = await authorizeRouteGovernanceProof(
            request,
            bodyText,
            getRouteGovernanceProofConfig('/api/governance/override'),
        );
        if (!routeAuth.allowed && routeAuth.response) return routeAuth.response;

        let body: Record<string, unknown>;
        try {
            body = JSON.parse(bodyText);
        } catch {
            return NextResponse.json(
                { status: 'error', message: 'Invalid JSON body', routeGovernanceProof: routeAuth.proof },
                { status: 400 }
            );
        }
        const requestId = typeof body.requestId === 'string' ? body.requestId : '';
        const justification = typeof body.justification === 'string' ? body.justification : '';
        const scope = typeof body.scope === 'string' ? body.scope : undefined;
        const expiryDays = typeof body.expiryDays === 'number' ? body.expiryDays : undefined;
        const riskAcknowledged = body.riskAcknowledged === true;

        if (!requestId || !justification || justification.trim().length < 50) {
            return NextResponse.json(
                { status: 'error', message: 'requestId and justification (min 50 chars) are required', routeGovernanceProof: routeAuth.proof },
                { status: 400 }
            );
        }

        if (!riskAcknowledged) {
            return NextResponse.json(
                { status: 'error', message: 'Risk acknowledgment is required', routeGovernanceProof: routeAuth.proof },
                { status: 400 }
            );
        }

        const result = await governanceFetchDirect('/api/v1/override');

        if (!result) {
            // Fallback: create local override record
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + Math.min(30, expiryDays || 7));
            return NextResponse.json({
                status: 'ok',
                fallback: true,
                routeGovernanceProof: routeAuth.proof,
                data: {
                    override_id: `ovr-${Date.now()}`,
                    request_id: requestId,
                    scope: scope || 'request',
                    expires_at: expiry.toISOString(),
                    status: 'PENDING_APPROVAL',
                },
            });
        }

        const payload = result && typeof result === 'object' && !Array.isArray(result)
            ? { ...result, routeGovernanceProof: routeAuth.proof }
            : { status: 'ok', data: result, routeGovernanceProof: routeAuth.proof };
        return NextResponse.json(payload);
    } catch {
        return NextResponse.json(
            { status: 'error', message: 'Override request failed' },
            { status: 500 }
        );
    }
}
