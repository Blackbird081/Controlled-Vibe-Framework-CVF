import { describe, expect, it } from 'vitest';
import {
    buildExecutionDiagnostic,
    buildProviderExecutionDiagnostic,
    classifyProviderError,
    redactDiagnosticMessage,
    renderExecutionDiagnostic,
} from './execution-diagnostics';

describe('execution diagnostics', () => {
    it.each([
        ['timeout after 60000ms', 'provider_timeout', true, 'wait_and_retry'],
        ['insufficient balance in account', 'insufficient_balance', false, 'top_up_or_check_quota'],
        ['too many requests 429', 'rate_limited', true, 'wait_and_retry'],
        ['Unauthorized invalid api key', 'invalid_api_key', false, 'check_api_key'],
        ['model does not exist or account lacks access', 'model_unavailable', false, 'change_model'],
        ['fetch failed network error', 'network_error', true, 'wait_and_retry'],
    ] as const)('classifies provider error %s', (message, expectedClass, retryable, userAction) => {
        expect(classifyProviderError(new Error(message))).toMatchObject({
            class: expectedClass,
            retryable,
            userAction,
        });
    });

    it('builds the stable V3 contract shape with route metadata', () => {
        expect(buildExecutionDiagnostic({
            stage: 'routing',
            class: 'routing_denied',
            provider: 'alibaba',
            model: 'router-denied',
            httpStatus: 403,
            receiptId: 'rcpt-env-example',
            traceId: 'env-example',
        })).toEqual({
            contractVersion: 'cvf.executionDiagnostic.v1',
            stage: 'routing',
            class: 'routing_denied',
            retryable: false,
            userAction: 'lower_risk_or_change_provider',
            safeMessage: 'Provider routing denied the requested lane.',
            provider: 'alibaba',
            model: 'router-denied',
            httpStatus: 403,
            receiptId: 'rcpt-env-example',
            traceId: 'env-example',
        });
    });

    it('redacts obvious key and bearer token fragments', () => {
        const redacted = redactDiagnosticMessage('Bearer abc.def.ghi api_key=sk-live-secret-token');
        expect(redacted).not.toContain('abc.def.ghi');
        expect(redacted).not.toContain('sk-live-secret-token');
        expect(redacted).toContain('[redacted]');
    });

    it('builds provider diagnostics without leaking raw error details', () => {
        const diagnostic = buildProviderExecutionDiagnostic({
            provider: 'deepseek',
            model: 'deepseek-chat',
            error: new Error('AbortError: timeout'),
            latencyMs: 60001,
        });
        expect(diagnostic).toMatchObject({
            stage: 'provider',
            class: 'provider_timeout',
            retryable: true,
            userAction: 'wait_and_retry',
            provider: 'deepseek',
            model: 'deepseek-chat',
            latencyMs: 60001,
        });
    });

    it('renders a concise CLI/MCP-friendly user action string', () => {
        const rendered = renderExecutionDiagnostic(buildExecutionDiagnostic({
            stage: 'auth',
            class: 'missing_api_key',
            provider: 'openai',
            model: 'not configured',
        }));
        expect(rendered).toContain('selected provider has no configured API key');
        expect(rendered).toContain('Next action: check_api_key');
    });
});
