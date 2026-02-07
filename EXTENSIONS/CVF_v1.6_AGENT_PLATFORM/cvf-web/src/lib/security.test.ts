/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    sanitizeHtml,
    validateApiKey,
    encryptData,
    decryptData,
    encryptDataAsync,
    decryptDataAsync,
    createSandbox,
    checkRateLimit,
    validateUrl,
    validateJson,
    sanitizeFilename,
    checkFileSize,
    FILE_SIZE_LIMITS,
} from './security';

describe('security.ts', () => {
    describe('sanitizeHtml', () => {
        it('escapes HTML tags', () => {
            const result = sanitizeHtml('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
            expect(result).toContain('&lt;script&gt;');
        });

        it('handles normal text', () => {
            expect(sanitizeHtml('Hello World')).toBe('Hello World');
        });

        it('escapes special characters', () => {
            const result = sanitizeHtml('<div onclick="evil()">Click</div>');
            expect(result).toContain('&lt;');
            expect(result).toContain('&gt;');
        });
    });

    describe('validateApiKey', () => {
        it('rejects empty keys', () => {
            expect(validateApiKey('gemini', '')).toEqual({
                valid: false,
                error: 'API key is required'
            });
        });

        it('validates Gemini key format', () => {
            expect(validateApiKey('gemini', 'AIzaSyB123456789012345678901234567890')).toEqual({
                valid: true
            });
            expect(validateApiKey('gemini', 'invalid').valid).toBe(false);
        });

        it('validates OpenAI key format', () => {
            expect(validateApiKey('openai', 'sk-1234567890123456789012345678901234567890abcd')).toEqual({
                valid: true
            });
            expect(validateApiKey('openai', 'invalid').valid).toBe(false);
        });

        it('validates Anthropic key format', () => {
            expect(validateApiKey('anthropic', 'sk-ant-1234567890123456789012345678901234567890')).toEqual({
                valid: true
            });
            expect(validateApiKey('anthropic', 'sk-123').valid).toBe(false);
        });
    });

    describe('encryptData / decryptData (sync)', () => {
        it('encrypts and marks as async placeholder', () => {
            const original = 'my-secret-api-key';
            const encrypted = encryptData(original);
            expect(encrypted).toContain('__ASYNC__');
        });

        it('decrypts async placeholder correctly', () => {
            const original = 'test-data-123';
            const encrypted = encryptData(original);
            const decrypted = decryptData(encrypted);
            expect(decrypted).toBe(original);
        });

        it('handles legacy base64 data', () => {
            const legacy = btoa(encodeURIComponent('legacy-data'));
            const decrypted = decryptData(legacy);
            expect(decrypted).toBe('legacy-data');
        });
    });

    describe('encryptDataAsync / decryptDataAsync', () => {
        it('encrypts and decrypts correctly', async () => {
            const original = 'my-super-secret-api-key-12345';
            const encrypted = await encryptDataAsync(original);

            // Should be base64
            expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);

            const decrypted = await decryptDataAsync(encrypted);
            expect(decrypted).toBe(original);
        });

        it('produces different ciphertext for same input (random IV)', async () => {
            const data = 'same-data';
            const encrypted1 = await encryptDataAsync(data);
            const encrypted2 = await encryptDataAsync(data);

            // Due to random salt/IV, outputs should differ
            expect(encrypted1).not.toBe(encrypted2);
        });

        it('handles unicode data', async () => {
            const unicode = 'Xin chào 你好 🎉';
            const encrypted = await encryptDataAsync(unicode);
            const decrypted = await decryptDataAsync(encrypted);
            expect(decrypted).toBe(unicode);
        });

        it('throws on invalid input', async () => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
            try {
                await expect(decryptDataAsync('invalid-base64!!!')).rejects.toThrow();
            } finally {
                spy.mockRestore();
            }
        });
    });

    describe('createSandbox', () => {
        it('blocks dangerous keywords', () => {
            const sandbox = createSandbox();

            expect(sandbox.validate('eval("code")').safe).toBe(false);
            expect(sandbox.validate('window.location').safe).toBe(false);
            expect(sandbox.validate('document.cookie').safe).toBe(false);
            expect(sandbox.validate('fetch("/api")').safe).toBe(false);
        });

        it('allows safe operations', () => {
            const sandbox = createSandbox();

            expect(sandbox.validate('1 + 1').safe).toBe(true);
            expect(sandbox.validate('Math.sqrt(16)').safe).toBe(true);
            expect(sandbox.validate('"hello".toUpperCase()').safe).toBe(true);
        });

        it('executes safe code', () => {
            const sandbox = createSandbox();

            expect(sandbox.execute('1 + 2').result).toBe(3);
            expect(sandbox.execute('Math.max(1, 5, 3)').result).toBe(5);
        });

        it('rejects unsafe code execution', () => {
            const sandbox = createSandbox();
            const result = sandbox.execute('eval("1+1")');

            expect(result.result).toBeNull();
            expect(result.error).toContain('Blocked keyword');
        });
    });

    describe('checkRateLimit', () => {
        beforeEach(() => {
            // Reset rate limit state by using unique keys
        });

        it('allows requests within limit', () => {
            const key = `test-${Date.now()}`;
            const result = checkRateLimit(key, 5, 60000);

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(4);
        });

        it('blocks after exceeding limit', () => {
            const key = `rate-test-${Date.now()}`;

            for (let i = 0; i < 5; i++) {
                checkRateLimit(key, 5, 60000);
            }

            const blocked = checkRateLimit(key, 5, 60000);
            expect(blocked.allowed).toBe(false);
            expect(blocked.remaining).toBe(0);
        });
    });

    describe('validateUrl', () => {
        it('accepts valid http/https URLs', () => {
            expect(validateUrl('https://example.com')).toBe(true);
            expect(validateUrl('http://localhost:3000')).toBe(true);
        });

        it('rejects invalid URLs', () => {
            expect(validateUrl('not-a-url')).toBe(false);
            expect(validateUrl('ftp://files.com')).toBe(false);
            expect(validateUrl('javascript:alert(1)')).toBe(false);
        });
    });

    describe('validateJson', () => {
        it('validates correct JSON', () => {
            expect(validateJson('{"key": "value"}')).toEqual({ valid: true });
            expect(validateJson('[1, 2, 3]')).toEqual({ valid: true });
        });

        it('rejects invalid JSON', () => {
            const result = validateJson('{invalid}');
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('sanitizeFilename', () => {
        it('removes dangerous characters', () => {
            expect(sanitizeFilename('file<script>.txt')).toBe('file_script_.txt');
            // Path separators get replaced
            const sanitized = sanitizeFilename('../../../etc/passwd');
            expect(sanitized).not.toContain('/');
        });

        it('truncates long filenames', () => {
            const longName = 'a'.repeat(300);
            expect(sanitizeFilename(longName).length).toBe(255);
        });
    });

    describe('checkFileSize', () => {
        it('accepts files within limits', () => {
            expect(checkFileSize(1024, 'import')).toBe(true);
            expect(checkFileSize(FILE_SIZE_LIMITS.image, 'image')).toBe(true);
        });

        it('rejects files exceeding limits', () => {
            expect(checkFileSize(FILE_SIZE_LIMITS.import + 1, 'import')).toBe(false);
        });
    });
});
