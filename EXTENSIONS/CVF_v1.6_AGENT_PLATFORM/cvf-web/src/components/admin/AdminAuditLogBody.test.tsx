/**
 * @vitest-environment jsdom
 */
// Text Encoding Exception: Vietnamese assertions verify required user-facing labels.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AdminAuditLogBody } from './AdminAuditLogBody';

let mockLanguage: 'en' | 'vi' = 'en';

vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({ language: mockLanguage }),
}));

type AuditEventFixture = {
  id: string;
  timestamp: string;
  eventType: string;
  action: string;
  actorId: string;
  actorRole: string;
  targetResource: string;
  outcome: string;
  riskLevel?: string;
  phase?: string;
  payload?: Record<string, unknown>;
};

function makeEvent(overrides: Partial<AuditEventFixture> = {}): AuditEventFixture {
  return {
    id: 'audit-001',
    timestamp: '2026-07-26T10:30:00.000Z',
    eventType: 'MANDATORY_GATEWAY_EVALUATED',
    action: 'analyze_workspace',
    actorId: 'operator-123',
    actorRole: 'admin',
    targetResource: '/api/execute',
    outcome: 'ALLOW',
    riskLevel: 'R1',
    phase: 'INTAKE',
    payload: {
      gatewayDecision: 'ALLOW',
      gatewayRequestId: 'req-allow-001',
    },
    ...overrides,
  };
}

function renderAuditEvents(events: AuditEventFixture[]) {
  return render(
    <AdminAuditLogBody
      filteredEvents={events}
      actorFilter=""
      outcomeFilter=""
      riskFilter=""
    />,
  );
}

afterEach(() => {
  cleanup();
  mockLanguage = 'en';
});

describe('AdminAuditLogBody mandatory gateway projection', () => {
  it('renders ALLOW decision and request ID in both responsive presentations without a blocker', () => {
    renderAuditEvents([
      makeEvent({
        payload: {
          gatewayDecision: 'ALLOW',
          gatewayRequestId: 'req-allow-001',
          secretPrompt: 'SENTINEL_SECRET_MUST_NOT_RENDER',
          gatewayAllowed: true,
        },
      }),
    ]);

    expect(screen.getAllByText('Gateway decision:')).toHaveLength(2);
    expect(screen.getAllByText('Request ID:')).toHaveLength(2);
    expect(screen.getAllByText('req-allow-001')).toHaveLength(2);
    expect(screen.getAllByText('ALLOW')).toHaveLength(4);
    expect(screen.queryByText('Blocked by:')).toBeNull();
    expect(screen.queryByText('SENTINEL_SECRET_MUST_NOT_RENDER')).toBeNull();
  });

  it('renders BLOCK decision, request ID, and blocker in both responsive presentations', () => {
    renderAuditEvents([
      makeEvent({
        id: 'audit-block',
        outcome: 'BLOCK',
        payload: {
          gatewayDecision: 'BLOCK',
          gatewayRequestId: 'req-block-001',
          gatewayBlockedBy: 'authority_gate',
        },
      }),
    ]);

    expect(screen.getAllByText('BLOCK')).toHaveLength(4);
    expect(screen.getAllByText('req-block-001')).toHaveLength(2);
    expect(screen.getAllByText('Blocked by:')).toHaveLength(2);
    expect(screen.getAllByText('authority_gate')).toHaveLength(2);
  });

  it('preserves generic event rendering without gateway detail labels', () => {
    renderAuditEvents([
      makeEvent({
        id: 'audit-generic',
        eventType: 'ADMIN_SETTINGS_UPDATED',
        action: 'review_settings',
        actorId: 'admin-456',
        actorRole: 'workspace_admin',
        targetResource: 'workspace:demo',
        outcome: 'PASS',
        riskLevel: 'R2',
        phase: 'REVIEW',
        payload: {
          gatewayDecision: 'BLOCK',
          gatewayRequestId: 'must-not-project',
        },
      }),
    ]);

    expect(screen.getAllByText('ADMIN_SETTINGS_UPDATED')).toHaveLength(2);
    expect(screen.getAllByText('review_settings')).toHaveLength(2);
    expect(screen.getByText('admin-456')).toBeTruthy();
    expect(screen.getByText('workspace_admin')).toBeTruthy();
    expect(screen.getAllByText('workspace:demo')).toHaveLength(2);
    expect(screen.getAllByText('PASS')).toHaveLength(2);
    expect(screen.getAllByText('R2')).toHaveLength(2);
    expect(screen.getAllByText('REVIEW')).toHaveLength(2);
    expect(screen.queryByText('Gateway decision:')).toBeNull();
    expect(screen.queryByText('must-not-project')).toBeNull();
  });

  it('ignores malformed allowlisted values without crashing or exposing raw payload data', () => {
    renderAuditEvents([
      makeEvent({
        id: 'audit-malformed',
        payload: {
          gatewayDecision: { raw: 'BLOCK' },
          gatewayRequestId: 12345,
          gatewayBlockedBy: ['authority_gate'],
          token: 'SENTINEL_TOKEN_MUST_NOT_RENDER',
        },
      }),
    ]);

    expect(screen.getAllByText('MANDATORY_GATEWAY_EVALUATED')).toHaveLength(2);
    expect(screen.queryByText('Gateway decision:')).toBeNull();
    expect(screen.queryByText('Request ID:')).toBeNull();
    expect(screen.queryByText('Blocked by:')).toBeNull();
    expect(screen.queryByText('SENTINEL_TOKEN_MUST_NOT_RENDER')).toBeNull();
  });

  it('carries the gateway labels into Vietnamese', () => {
    mockLanguage = 'vi';

    renderAuditEvents([
      makeEvent({
        outcome: 'BLOCK',
        payload: {
          gatewayDecision: 'BLOCK',
          gatewayRequestId: 'req-vi-001',
          gatewayBlockedBy: 'authority_gate',
        },
      }),
    ]);

    expect(screen.getAllByText('Quyết định cổng:')).toHaveLength(2);
    expect(screen.getAllByText('Mã yêu cầu:')).toHaveLength(2);
    expect(screen.getAllByText('Bị chặn bởi:')).toHaveLength(2);
  });
});
