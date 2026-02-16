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

        it('accepts unknown provider with any key', () => {
            const result = validateApiKey('unknown-provider', 'any-key-here');
            expect(result.valid).toBe(true);
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

        it('returns input when base64 decode fails', () => {
            const result = decryptData('not-valid-base64!!!');
            expect(result).toBe('not-valid-base64!!!');
        });

        it('encrypts with SSR fallback when crypto.subtle is unavailable', () => {
            const origSubtle = crypto.subtle;
            Object.defineProperty(crypto, 'subtle', { value: undefined, configurable: true });
            try {
                const encrypted = encryptData('ssr-test');
                expect(encrypted).toBe(btoa(encodeURIComponent('ssr-test')));
                expect(encrypted.startsWith('__ASYNC__')).toBe(false);
            } finally {
                Object.defineProperty(crypto, 'subtle', { value: origSubtle, configurable: true });
            }
        });

        it('handles unicode in encrypt/decrypt roundtrip', () => {
            const encrypted = encryptData('Xin chào 🚀');
            const decrypted = decryptData(encrypted);
            expect(decrypted).toBe('Xin chào 🚀');
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

        it('executes safe code with executeAsync', async () => {
            const sandbox = createSandbox();
            const result = await sandbox.executeAsync('2 + 3');
            expect(result.result).toBe(5);
        });

        it('rejects unsafe code with executeAsync', async () => {
            const sandbox = createSandbox();
            const result = await sandbox.executeAsync('eval("1+1")');
            expect(result.result).toBeNull();
            expect(result.error).toContain('Blocked keyword');
        });

        it('blocks dynamic property access', () => {
            const sandbox = createSandbox();
            const result = sandbox.validate('obj. [key]');
            expect(result.safe).toBe(false);
            expect(result.reason).toContain('Dynamic property access');
        });

        it('blocks additional dangerous keywords', () => {
            const sandbox = createSandbox();
            expect(sandbox.validate('XMLHttpRequest').safe).toBe(false);
            expect(sandbox.validate('WebSocket').safe).toBe(false);
            expect(sandbox.validate('import("module")').safe).toBe(false);
            expect(sandbox.validate('require("fs")').safe).toBe(false);
            expect(sandbox.validate('globalThis.x').safe).toBe(false);
            expect(sandbox.validate('__proto__').safe).toBe(false);
            expect(sandbox.validate('prototype.x').safe).toBe(false);
            expect(sandbox.validate('setTimeout(fn, 0)').safe).toBe(false);
            expect(sandbox.validate('navigator.userAgent').safe).toBe(false);
            expect(sandbox.validate('location.href').safe).toBe(false);
        });

        it('handles execute errors gracefully', () => {
            const sandbox = createSandbox();
            const result = sandbox.execute('throw new Error("test")');
            expect(result.error).toBeDefined();
        });

        it('executes code using console.log in sandbox', () => {
            const sandbox = createSandbox();
            const result = sandbox.execute('console.log("hello", "world")');
            expect(result.result).toBe('hello world');
        });

        it('executes Worker-based executeAsync with mock Worker', async () => {
            // Mock Worker class so the Worker path is taken
            const origWorker = globalThis.Worker;
            let capturedOnMessage: ((e: MessageEvent) => void) | null = null;
            let capturedPostMessage: { id: string; code: string } | null = null;

            class MockWorker {
                onmessage: ((e: MessageEvent) => void) | null = null;
                onerror: ((e: ErrorEvent) => void) | null = null;
                terminate = vi.fn();
                postMessage = (data: { id: string; code: string }) => {
                    capturedPostMessage = data;
                    // Simulate worker responding with success
                    setTimeout(() => {
                        capturedOnMessage = this.onmessage;
                        this.onmessage?.({
                            data: { id: data.id, result: 42 }
                        } as MessageEvent);
                    }, 10);
                };
            }

            globalThis.Worker = MockWorker as unknown as typeof Worker;
            try {
                const sandbox = createSandbox();
                const result = await sandbox.executeAsync('21 * 2');
                expect(result.result).toBe(42);
                expect(capturedPostMessage).toBeTruthy();
            } finally {
                globalThis.Worker = origWorker;
            }
        });

        it('handles Worker error response', async () => {
            const origWorker = globalThis.Worker;
            class MockWorker {
                onmessage: ((e: MessageEvent) => void) | null = null;
                onerror: ((e: ErrorEvent) => void) | null = null;
                terminate = vi.fn();
                postMessage = (data: { id: string; code: string }) => {
                    setTimeout(() => {
                        this.onmessage?.({
                            data: { id: data.id, error: 'Worker error occurred' }
                        } as MessageEvent);
                    }, 10);
                };
            }
            globalThis.Worker = MockWorker as unknown as typeof Worker;
            try {
                const sandbox = createSandbox();
                const result = await sandbox.executeAsync('bad code');
                expect(result.error).toBe('Worker error occurred');
            } finally {
                globalThis.Worker = origWorker;
            }
        });

        it('handles Worker onerror event', async () => {
            const origWorker = globalThis.Worker;
            class MockWorker {
                onmessage: ((e: MessageEvent) => void) | null = null;
                onerror: ((e: ErrorEvent) => void) | null = null;
                terminate = vi.fn();
                postMessage = () => {
                    setTimeout(() => {
                        this.onerror?.({ message: 'Worker crashed' } as ErrorEvent);
                    }, 10);
                };
            }
            globalThis.Worker = MockWorker as unknown as typeof Worker;
            try {
                const sandbox = createSandbox();
                const result = await sandbox.executeAsync('1+1');
                expect(result.error).toBe('Worker crashed');
            } finally {
                globalThis.Worker = origWorker;
            }
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
