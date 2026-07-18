import { NextRequest, NextResponse } from 'next/server';

import type { SessionCookie } from '@/lib/middleware-auth';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { deriveServiceTokenIdentity, verifyServiceTokenRequest } from '@/lib/service-token-auth';

export type RouteGovernanceRiskLevel = 'R0' | 'R1' | 'R2' | 'R3';
export type RouteGovernanceAuthMode = 'session' | 'service_token' | 'unauthorized';
export type RouteGovernanceWorkflowStage =
  | 'BODY_CAPTURED'
  | 'ROUTE_CONFIG_RESOLVED'
  | 'SERVICE_TOKEN_EVALUATED'
  | 'SESSION_EVALUATED'
  | 'PROOF_EMITTED';

export const ROUTE_GOVERNANCE_PROOF_WORKFLOW_CHAIN_VERSION = 'cvf.routeGovernanceProofWorkflow.t2c.v1' as const;

export interface RouteGovernanceProofConfig {
  routeId: string;
  surface: string;
  riskLevel: RouteGovernanceRiskLevel;
  evidenceBasis: string;
}

export const ROUTE_GOVERNANCE_PROOF_REGISTRY = {
  '/api/artifacts/export': {
    routeId: '/api/artifacts/export',
    surface: 'artifact-export',
    riskLevel: 'R1',
    evidenceBasis: 'ERH-T2C route governance proof workflow for artifact export',
  },
  '/api/governance/override': {
    routeId: '/api/governance/override',
    surface: 'governance-override',
    riskLevel: 'R2',
    evidenceBasis: 'ERH-T2C route governance proof workflow for override request',
  },
  '/api/knowledge/ingest': {
    routeId: '/api/knowledge/ingest',
    surface: 'knowledge-ingest',
    riskLevel: 'R1',
    evidenceBasis: 'ERH-T2C route governance proof workflow for knowledge ingest',
  },
  '/api/lpci/intake': {
    routeId: '/api/lpci/intake',
    surface: 'lpci-intake',
    riskLevel: 'R1',
    evidenceBasis: 'ERH-T2C route governance proof workflow for LPCI corpus intake',
  },
  '/api/lpci/query': {
    routeId: '/api/lpci/query',
    surface: 'lpci-query',
    riskLevel: 'R2',
    evidenceBasis: 'ERH-T2C route governance proof workflow for LPCI governed query',
  },
} as const satisfies Record<string, RouteGovernanceProofConfig>;

export type RegisteredRouteGovernanceProofRoute = keyof typeof ROUTE_GOVERNANCE_PROOF_REGISTRY;

export function getRouteGovernanceProofConfig(routeId: RegisteredRouteGovernanceProofRoute): RouteGovernanceProofConfig {
  return ROUTE_GOVERNANCE_PROOF_REGISTRY[routeId];
}

export interface RouteGovernanceProof {
  proofVersion: 'cvf.routeGovernanceProof.t2c.v1';
  workflowChainVersion: typeof ROUTE_GOVERNANCE_PROOF_WORKFLOW_CHAIN_VERSION;
  routeId: string;
  surface: string;
  riskLevel: RouteGovernanceRiskLevel;
  evidenceBasis: string;
  stages: RouteGovernanceWorkflowStage[];
  terminalStage: RouteGovernanceWorkflowStage;
  authMode: RouteGovernanceAuthMode;
  decision: 'ALLOW' | 'DENY';
  serviceTokenConfigured: boolean;
  serviceTokenPresented: boolean;
  serviceSignaturePresented: boolean;
  actorId: string | null;
  generatedAt: string;
}

export interface RouteGovernanceAuthorization {
  allowed: boolean;
  proof: RouteGovernanceProof;
  session: SessionCookie | null;
  response?: NextResponse;
}

function buildProof(input: {
  config: RouteGovernanceProofConfig;
  stages: RouteGovernanceWorkflowStage[];
  authMode: RouteGovernanceAuthMode;
  decision: 'ALLOW' | 'DENY';
  serviceTokenConfigured: boolean;
  serviceTokenPresented: boolean;
  serviceSignaturePresented: boolean;
  actorId: string | null;
}): RouteGovernanceProof {
  return {
    proofVersion: 'cvf.routeGovernanceProof.t2c.v1',
    workflowChainVersion: ROUTE_GOVERNANCE_PROOF_WORKFLOW_CHAIN_VERSION,
    routeId: input.config.routeId,
    surface: input.config.surface,
    riskLevel: input.config.riskLevel,
    evidenceBasis: input.config.evidenceBasis,
    stages: input.stages,
    terminalStage: 'PROOF_EMITTED',
    authMode: input.authMode,
    decision: input.decision,
    serviceTokenConfigured: input.serviceTokenConfigured,
    serviceTokenPresented: input.serviceTokenPresented,
    serviceSignaturePresented: input.serviceSignaturePresented,
    actorId: input.actorId,
    generatedAt: new Date().toISOString(),
  };
}

export async function authorizeRouteGovernanceProof(
  request: NextRequest,
  bodyText: string,
  config: RouteGovernanceProofConfig,
): Promise<RouteGovernanceAuthorization> {
  const baseStages: RouteGovernanceWorkflowStage[] = ['BODY_CAPTURED', 'ROUTE_CONFIG_RESOLVED'];
  const serviceToken = request.headers.get('x-cvf-service-token');
  const configuredToken = process.env.CVF_SERVICE_TOKEN;
  const signature = request.headers.get('x-cvf-service-signature');
  const timestamp = request.headers.get('x-cvf-service-timestamp');
  const serviceTokenConfigured = Boolean(configuredToken);
  const serviceTokenPresented = Boolean(serviceToken);
  const serviceSignaturePresented = Boolean(signature && timestamp);

  if (serviceTokenPresented) {
    const isServiceAllowed = verifyServiceTokenRequest({
      configuredToken,
      presentedToken: serviceToken,
      signature,
      timestamp,
      body: bodyText,
    });

    if (isServiceAllowed) {
      const stages: RouteGovernanceWorkflowStage[] = [...baseStages, 'SERVICE_TOKEN_EVALUATED', 'PROOF_EMITTED'];
      return {
        allowed: true,
        session: null,
        proof: buildProof({
          config,
          stages,
          authMode: 'service_token',
          decision: 'ALLOW',
          serviceTokenConfigured,
          serviceTokenPresented,
          serviceSignaturePresented,
          actorId: deriveServiceTokenIdentity(serviceToken ?? ''),
        }),
      };
    }
  }

  const session = await verifySessionCookie(request);
  if (session) {
    const stages: RouteGovernanceWorkflowStage[] = serviceTokenPresented
      ? [...baseStages, 'SERVICE_TOKEN_EVALUATED', 'SESSION_EVALUATED', 'PROOF_EMITTED']
      : [...baseStages, 'SESSION_EVALUATED', 'PROOF_EMITTED'];
    return {
      allowed: true,
      session,
      proof: buildProof({
        config,
        stages,
        authMode: 'session',
        decision: 'ALLOW',
        serviceTokenConfigured,
        serviceTokenPresented,
        serviceSignaturePresented,
        actorId: session.userId,
      }),
    };
  }

  const proof = buildProof({
    config,
    stages: serviceTokenPresented
      ? [...baseStages, 'SERVICE_TOKEN_EVALUATED', 'SESSION_EVALUATED', 'PROOF_EMITTED']
      : [...baseStages, 'SESSION_EVALUATED', 'PROOF_EMITTED'],
    authMode: 'unauthorized',
    decision: 'DENY',
    serviceTokenConfigured,
    serviceTokenPresented,
    serviceSignaturePresented,
    actorId: null,
  });

  return {
    allowed: false,
    session: null,
    proof,
    response: NextResponse.json(
      {
        success: false,
        error: serviceTokenPresented
          ? 'Unauthorized: invalid service token or signature.'
          : 'Unauthorized: please login or provide a valid service token.',
        routeGovernanceProof: proof,
      },
      { status: 401 },
    ),
  };
}
