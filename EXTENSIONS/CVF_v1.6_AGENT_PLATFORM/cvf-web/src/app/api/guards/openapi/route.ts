/**
 * GET /api/guards/openapi
 * ========================
 * Auto-generated OpenAPI spec for CVF Guard API endpoints.
 *
 * Sprint 8 — Task 8.5
 */

import { NextResponse } from 'next/server';

const OPENAPI_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'CVF Guard API',
    version: '2.0.0',
    description: 'CVF Governance Guard endpoints for cross-channel enforcement. Any AI agent, IDE extension, or external tool can call these endpoints to check if an action is allowed before executing it.',
    contact: { name: 'CVF Team', url: 'https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF' },
  },
  servers: [
    { url: '/', description: 'Current deployment' },
  ],
  paths: {
    '/api/guards/evaluate': {
      post: {
        summary: 'Full guard pipeline evaluation',
        description: 'Evaluate an action against the hardened default CVF guard stack. Returns ALLOW, BLOCK, or ESCALATE.',
        operationId: 'evaluateGuards',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['requestId', 'action'],
                properties: {
                  requestId: { type: 'string', description: 'Unique request identifier' },
                  action: { type: 'string', description: 'Description of the action to evaluate' },
                  phase: { type: 'string', enum: ['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE', 'DISCOVERY'], default: 'BUILD' },
                  riskLevel: { type: 'string', enum: ['R0', 'R1', 'R2', 'R3'], default: 'R0' },
                  role: { type: 'string', enum: ['OBSERVER', 'ANALYST', 'BUILDER', 'REVIEWER', 'GOVERNOR', 'HUMAN', 'AI_AGENT', 'OPERATOR'], default: 'AI_AGENT' },
                  agentId: { type: 'string', description: 'Optional agent identifier' },
                  targetFiles: { type: 'array', items: { type: 'string' } },
                  fileScope: { type: 'array', items: { type: 'string' } },
                  mutationCount: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Guard evaluation result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        requestId: { type: 'string' },
                        finalDecision: { type: 'string', enum: ['ALLOW', 'BLOCK', 'ESCALATE'] },
                        blockedBy: { type: 'string', nullable: true },
                        escalatedBy: { type: 'string', nullable: true },
                        agentGuidance: { type: 'string', nullable: true },
                        durationMs: { type: 'number' },
                        guardsEvaluated: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': { description: 'Invalid request' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    '/api/guards/phase-gate': {
      post: {
        summary: 'Quick phase gate check',
        operationId: 'checkPhaseGate',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['requestId', 'action'],
                properties: {
                  requestId: { type: 'string' },
                  action: { type: 'string' },
                  phase: { type: 'string', enum: ['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE', 'DISCOVERY'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Phase gate result' },
        },
      },
    },
    '/api/guards/audit-log': {
      get: {
        summary: 'Get guard audit log',
        operationId: 'getAuditLog',
        parameters: [
          { name: 'requestId', in: 'query', schema: { type: 'string' }, description: 'Filter by requestId' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 }, description: 'Max entries' },
        ],
        responses: {
          '200': { description: 'Audit log entries' },
        },
      },
    },
    '/api/guards/health': {
      get: {
        summary: 'Guard API health check',
        operationId: 'healthCheck',
        responses: {
          '200': { description: 'API health status' },
        },
      },
    },
    '/api/guards/openapi': {
      get: {
        summary: 'This OpenAPI specification',
        operationId: 'getOpenApiSpec',
        responses: {
          '200': { description: 'OpenAPI JSON spec' },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(OPENAPI_SPEC, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
