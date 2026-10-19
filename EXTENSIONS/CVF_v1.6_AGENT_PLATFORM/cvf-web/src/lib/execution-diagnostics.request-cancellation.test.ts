import { describe, expect, it } from 'vitest';
import { buildExecutionDiagnostic, classifyProviderError } from './execution-diagnostics';

describe('request cancellation diagnostic', () => {
    it('uses a fixed nonretryable class without caller reason', () => {
        const diagnostic = buildExecutionDiagnostic({ stage: 'provider', class: 'request_cancelled', httpStatus: 499 });
        expect(diagnostic).toMatchObject({ class: 'request_cancelled', retryable: false, userAction: 'none', httpStatus: 499 });
        expect(JSON.stringify(diagnostic)).not.toContain('private reason');
    });

    it('keeps an independent provider timeout retryable', () => {
        expect(classifyProviderError(new Error('provider timeout'))).toMatchObject({
            class: 'provider_timeout', retryable: true, userAction: 'wait_and_retry',
        });
    });
});
