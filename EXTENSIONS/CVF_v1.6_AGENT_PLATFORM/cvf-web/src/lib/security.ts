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

// Encrypt data for localStorage (simple obfuscation)
export function encryptData(data: string, salt: string = 'cvf_2026'): string {
    try {
        const encoded = btoa(encodeURIComponent(data));
        // Simple XOR-like obfuscation
        let result = '';
        for (let i = 0; i < encoded.length; i++) {
            const charCode = encoded.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
            result += String.fromCharCode(charCode);
        }
        return btoa(result);
    } catch {
        return data; // Fallback to original if encoding fails
    }
}

// Decrypt data from localStorage
export function decryptData(encrypted: string, salt: string = 'cvf_2026'): string {
    try {
        const decoded = atob(encrypted);
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
            result += String.fromCharCode(charCode);
        }
        return decodeURIComponent(atob(result));
    } catch {
        return encrypted; // Return as-is if decryption fails
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
