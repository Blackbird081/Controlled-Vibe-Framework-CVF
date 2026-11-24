import { describe, expect, it } from 'vitest';
import {
    buildExecutionDiagnostic,
    buildGatewayExecutionDiagnostic,
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

    it('preserves a bounded structured provider HTTP status without parsing messages', () => {
        const error = Object.assign(new Error('opaque provider failure'), { httpStatus: 429 });
        expect(buildProviderExecutionDiagnostic({
            provider: 'alibaba',
            model: 'qwen-flash',
            error,
            latencyMs: 12,
        })).toMatchObject({
            httpStatus: 429,
            latencyMs: 12,
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

describe('Gateway failure diagnostics', () => {
    const build = (error: Parameters<typeof buildGatewayExecutionDiagnostic>[0]['error']) =>
        buildGatewayExecutionDiagnostic({ provider: 'openai', model: 'gpt-4o-mini', error, latencyMs: 5 });

    it.each([
        ['401 bad key', { providerDiagnostic: { code: 'provider_http_error', httpStatus: 401 }, retryable: false }, 'invalid_api_key', false, 'check_api_key'],
        ['403', { providerDiagnostic: { code: 'provider_http_error', httpStatus: 403 }, retryable: false }, 'invalid_api_key', false, 'check_api_key'],
        ['429 rate limit', { providerDiagnostic: { code: 'provider_http_error', httpStatus: 429 }, retryable: true }, 'rate_limited', true, 'wait_and_retry'],
        ['quota locked', { providerDiagnostic: { code: 'quota_locked', httpStatus: 429 }, retryable: false }, 'insufficient_balance', false, 'top_up_or_check_quota'],
        ['404 model', { providerDiagnostic: { code: 'provider_http_error', httpStatus: 404 }, retryable: false }, 'model_unavailable', false, 'change_model'],
        ['400', { providerDiagnostic: { code: 'provider_http_error', httpStatus: 400 }, retryable: false }, 'provider_http_error', false, 'do_not_retry_without_new_evidence'],
        ['503', { providerDiagnostic: { code: 'provider_http_error', httpStatus: 503 }, retryable: true }, 'provider_http_error', true, 'wait_and_retry'],
        ['incomplete output', { providerDiagnostic: { code: 'output_incomplete' }, retryable: false }, 'provider_parse_error', false, 'revise_request'],
        ['deadline', { providerDiagnostic: { code: 'provider_timeout' }, retryable: false }, 'provider_timeout', true, 'wait_and_retry'],
        ['credential', { providerDiagnostic: { code: 'credential_unavailable' }, retryable: false }, 'missing_api_key', false, 'check_api_key'],
        ['destination', { providerDiagnostic: { code: 'destination_denied' }, retryable: false }, 'policy_blocked', false, 'contact_admin'],
        ['network (not retryable per Gateway)', { providerDiagnostic: { code: 'network_error' }, retryable: false }, 'network_error', false, 'do_not_retry_without_new_evidence'],
        ['unknown', { providerDiagnostic: { code: 'unknown_error' }, retryable: false }, 'unknown_error', false, 'do_not_retry_without_new_evidence'],
        ['shielded credential envelope', { errorClass: 'credential_shielded', message: 'Credential metadata unavailable', retryable: false }, 'missing_api_key', false, 'check_api_key'],
    ] as const)('classifies %s from the closed code, not free text', (_name, error, expectedClass, retryable, userAction) => {
        expect(build(error)).toMatchObject({ stage: 'provider', class: expectedClass, retryable, userAction, provider: 'openai', model: 'gpt-4o-mini' });
    });

    it('never lets free text override a closed code', () => {
        expect(build({ message: 'quota 401 timeout rate limit', providerDiagnostic: { code: 'output_incomplete' }, retryable: false }).class).toBe('provider_parse_error');
    });

    it('carries the HTTP status', () => {
        expect(build({ providerDiagnostic: { code: 'provider_http_error', httpStatus: 401 }, retryable: false }).httpStatus).toBe(401);
    });
});
