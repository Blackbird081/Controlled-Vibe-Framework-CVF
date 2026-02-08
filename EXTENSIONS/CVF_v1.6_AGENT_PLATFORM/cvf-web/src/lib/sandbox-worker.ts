'use strict';

type SandboxRequest = {
    id: string;
    code: string;
};

type SandboxResponse = {
    id: string;
    result?: unknown;
    error?: string;
};

const BLOCKED_KEYWORDS = [
    'eval', 'Function', 'constructor',
    'window', 'document', 'localStorage', 'sessionStorage',
    'fetch', 'XMLHttpRequest', 'WebSocket',
    'import', 'require', 'module', 'exports',
    '__proto__', 'prototype',
    'process', 'global', 'globalThis',
    'self', 'postMessage', 'importScripts',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'navigator', 'location',
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
};

function validate(code: string): { safe: boolean; reason?: string } {
    const lowerCode = code.toLowerCase();
    for (const keyword of BLOCKED_KEYWORDS) {
        if (lowerCode.includes(keyword.toLowerCase())) {
            return { safe: false, reason: `Blocked keyword: ${keyword}` };
        }
    }
    if (/\.\s*\[/.test(code)) {
        return { safe: false, reason: 'Dynamic property access not allowed' };
    }
    return { safe: true };
}

function execute(code: string): { result?: unknown; error?: string } {
    try {
        const safeFunction = new Function(
            ...Object.keys(ALLOWED_GLOBALS),
            `"use strict"; return (${code})`
        );
        const result = safeFunction(...Object.values(ALLOWED_GLOBALS));
        return { result };
    } catch (error) {
        return { error: String(error) };
    }
}

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<SandboxRequest>) => {
    const payload = event.data;
    if (!payload || typeof payload.code !== 'string' || typeof payload.id !== 'string') {
        return;
    }

    const validation = validate(payload.code);
    if (!validation.safe) {
        const response: SandboxResponse = { id: payload.id, error: validation.reason };
        workerScope.postMessage(response);
        return;
    }

    const result = execute(payload.code);
    const response: SandboxResponse = {
        id: payload.id,
        result: result.result,
        error: result.error,
    };
    workerScope.postMessage(response);
};

export {};
