/**
 * GET /api/guards/health
 * =====================
 * Health check endpoint for the MCP Guard Bridge.
 * Returns engine status, registered guards, and config.
 */

import { NextResponse } from 'next/server';
import { createGuardEngine } from 'cvf-guard-contract';

export async function GET() {
  const engine = createGuardEngine();
  const guards = engine.getRegisteredGuards();
  const config = engine.getConfig();

  return NextResponse.json({
    status: 'healthy',
    version: '2.0.0',
    bridge: 'next-api',
    guards: {
      count: guards.length,
      registered: guards.map((g) => ({
        id: g.id,
        name: g.name,
        priority: g.priority,
        enabled: g.enabled,
      })),
    },
    config: {
      strictMode: config.strictMode,
      maxGuardsPerPipeline: config.maxGuardsPerPipeline,
      defaultDecision: config.defaultDecision,
    },
    endpoints: [
      { path: '/api/guards/evaluate', method: 'POST', description: 'Full guard pipeline evaluation' },
      { path: '/api/guards/phase-gate', method: 'POST', description: 'Phase gate check' },
      { path: '/api/guards/audit-log', method: 'GET', description: 'Audit trail' },
      { path: '/api/guards/health', method: 'GET', description: 'Health check (this endpoint)' },
    ],
  });
}
