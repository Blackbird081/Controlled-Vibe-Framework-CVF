'use client';

// Security utilities for CVF Agent Platform

// Sanitize HTML to prevent XSS
export function sanitizeHtml(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// Validate API key format
export function validateApiKey(provider: string, key: string): { valid: boolean; error?: string } {
    if (!key || key.trim() === '') {
        return { valid: false, error: 'API key is required' };
    }

    const trimmedKey = key.trim();

    switch (provider) {
        case 'gemini':
            // Gemini keys typically start with 'AI' and are 39 chars
            if (!trimmedKey.startsWith('AI') || trimmedKey.length < 35) {
                return { valid: false, error: 'Invalid Gemini API key format' };
            }
            break;
        case 'openai':
            // OpenAI keys start with 'sk-' and are 51+ chars
            if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 40) {
                return { valid: false, error: 'Invalid OpenAI API key format (should start with sk-)' };
            }
            break;
        case 'anthropic':
            // Anthropic keys start with 'sk-ant-'
            if (!trimmedKey.startsWith('sk-ant-') || trimmedKey.length < 40) {
                return { valid: false, error: 'Invalid Anthropic API key format (should start with sk-ant-)' };
            }
            break;
    }

    return { valid: true };
}

// ============================================
// SECURE ENCRYPTION using Web Crypto API
// ============================================

// Derive a CryptoKey from password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt.buffer as ArrayBuffer,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Generate master key from device fingerprint + constant
function getMasterPassword(): string {
    // Combine multiple entropy sources
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'server';
    const language = typeof navigator !== 'undefined' ? navigator.language : 'en';
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `cvf_2026_${userAgent.slice(0, 20)}_${language}_${timezone}`;
}

// Encrypt data using AES-GCM (async)
export async function encryptDataAsync(data: string): Promise<string> {
    try {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);

        // Generate random salt and IV
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Derive key from master password
        const key = await deriveKey(getMasterPassword(), salt);

        // Encrypt
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            dataBuffer
        );

        // Combine: salt (16) + iv (12) + encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);

        // Return as base64
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Encryption failed');
    }
}

// Decrypt data using AES-GCM (async)
export async function decryptDataAsync(encryptedBase64: string): Promise<string> {
    try {
        // Decode base64
        const combined = new Uint8Array(
            atob(encryptedBase64).split('').map(c => c.charCodeAt(0))
        );

        // Extract salt, iv, and encrypted data
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const encrypted = combined.slice(28);

        // Derive key
        const key = await deriveKey(getMasterPassword(), salt);

        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Decryption failed');
    }
}

// Synchronous wrappers for backward compatibility (uses fallback for SSR)
export function encryptData(data: string, _salt?: string): string {
    // For SSR or when crypto.subtle not available, use simple obfuscation
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        return btoa(encodeURIComponent(data));
    }
    // Return placeholder - actual encryption happens async
    // Callers should migrate to encryptDataAsync
    return `__ASYNC__${btoa(encodeURIComponent(data))}`;
}

export function decryptData(encrypted: string, _salt?: string): string {
    // Handle async placeholder
    if (encrypted.startsWith('__ASYNC__')) {
        return decodeURIComponent(atob(encrypted.slice(9)));
    }
    // Legacy fallback
    try {
        return decodeURIComponent(atob(encrypted));
    } catch {
        return encrypted;
    }
}

// Safe code execution sandbox
export function createSandbox() {
    const BLOCKED_KEYWORDS = [
        'eval', 'Function', 'constructor',
        'window', 'document', 'localStorage', 'sessionStorage',
        'fetch', 'XMLHttpRequest', 'WebSocket',
        'import', 'require', 'module', 'exports',
        '__proto__', 'prototype',
        'process', 'global', 'globalThis',
    ];

    const ALLOWED_GLOBALS = {
        Math,
        Date,
        JSON,
        Array,
        Object,
        String,
        Number,
        Boolean,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        console: {
            log: (...args: unknown[]) => args.map(String).join(' '),
        },
    };

    return {
        validate(code: string): { safe: boolean; reason?: string } {
            const lowerCode = code.toLowerCase();

            for (const keyword of BLOCKED_KEYWORDS) {
                if (lowerCode.includes(keyword.toLowerCase())) {
                    return { safe: false, reason: `Blocked keyword: ${keyword}` };
                }
            }

            // Check for dangerous patterns
            if (/\.\s*\[/.test(code)) {
                return { safe: false, reason: 'Dynamic property access not allowed' };
            }

            return { safe: true };
        },

        execute(code: string, timeout: number = 1000): { result: unknown; error?: string } {
            const validation = this.validate(code);
            if (!validation.safe) {
                return { result: null, error: validation.reason };
            }

            try {
                // Create isolated function with limited globals
                const safeFunction = new Function(
                    ...Object.keys(ALLOWED_GLOBALS),
                    `"use strict"; return (${code})`
                );

                // Execute with timeout simulation
                const start = Date.now();
                const result = safeFunction(...Object.values(ALLOWED_GLOBALS));

                if (Date.now() - start > timeout) {
                    return { result: null, error: 'Execution timeout' };
                }

                return { result };
            } catch (error) {
                return { result: null, error: String(error) };
            }
        },
    };
}

// Rate limiting for API calls
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
    key: string,
    maxRequests: number = 10,
    windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
    }

    if (record.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: record.resetTime - now
        };
    }

    record.count++;
    return {
        allowed: true,
        remaining: maxRequests - record.count,
        resetIn: record.resetTime - now
    };
}

// Input validation helpers
export function validateUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

export function validateJson(json: string): { valid: boolean; error?: string } {
    try {
        JSON.parse(json);
        return { valid: true };
    } catch (error) {
        return { valid: false, error: String(error) };
    }
}

export function sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
}

// File size limits
export const FILE_SIZE_LIMITS = {
    import: 5 * 1024 * 1024, // 5MB
    export: 10 * 1024 * 1024, // 10MB
    image: 2 * 1024 * 1024, // 2MB
};

export function checkFileSize(size: number, type: keyof typeof FILE_SIZE_LIMITS): boolean {
    return size <= FILE_SIZE_LIMITS[type];
}
