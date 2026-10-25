import { createHash } from 'node:crypto';

/** Pure canonical JSON and digest primitives for pending execution records. */

export class CanonicalizationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CanonicalizationError';
    }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

function escapeJsonString(input: string): string {
    let index = 0;
    while (index < input.length) {
        const unit = input.charCodeAt(index);
        if (unit >= 0xd800 && unit <= 0xdbff) {
            const next = input.charCodeAt(index + 1);
            if (!(next >= 0xdc00 && next <= 0xdfff)) {
                throw new CanonicalizationError('lone high surrogate is not valid JCS input');
            }
            index += 1;
        } else if (unit >= 0xdc00 && unit <= 0xdfff) {
            throw new CanonicalizationError('lone low surrogate is not valid JCS input');
        }
        index += 1;
    }
    let out = '"';
    for (const ch of input) {
        const code = ch.codePointAt(0) ?? 0;
        switch (ch) {
            case '"':
                out += '\\"';
                break;
            case '\\':
                out += '\\\\';
                break;
            case '\b':
                out += '\\b';
                break;
            case '\f':
                out += '\\f';
                break;
            case '\n':
                out += '\\n';
                break;
            case '\r':
                out += '\\r';
                break;
            case '\t':
                out += '\\t';
                break;
            default:
                if (code < 0x20) {
                    out += `\\u${code.toString(16).padStart(4, '0')}`;
                } else {
                    out += ch;
                }
        }
    }
    return out + '"';
}

function serializeNumber(value: number, path: string): string {
    if (!Number.isFinite(value)) {
        throw new CanonicalizationError(`non-finite number at ${path}`);
    }
    if (Object.is(value, -0)) {
        return '0';
    }
    return String(value);
}

export function canonicalizeToJson(value: unknown): string {
    const seen = new Set<unknown>();

    function walk(input: unknown, path: string): string {
        if (input === null) {
            return 'null';
        }
        const t = typeof input;
        if (t === 'boolean') {
            return input ? 'true' : 'false';
        }
        if (t === 'number') {
            return serializeNumber(input as number, path);
        }
        if (t === 'string') {
            return escapeJsonString(input as string);
        }
        if (t === 'undefined') {
            throw new CanonicalizationError(`undefined is not canonicalizable at ${path}`);
        }
        if (t === 'bigint') {
            throw new CanonicalizationError(`bigint is not canonicalizable at ${path}`);
        }
        if (t === 'symbol') {
            throw new CanonicalizationError(`symbol is not canonicalizable at ${path}`);
        }
        if (t === 'function') {
            throw new CanonicalizationError(`function is not canonicalizable at ${path}`);
        }
        if (t === 'object') {
            if (seen.has(input)) {
                throw new CanonicalizationError(`cyclic reference detected at ${path}`);
            }
            if (Array.isArray(input)) {
                seen.add(input);
                for (const ownKey of Reflect.ownKeys(input)) {
                    if (ownKey === 'length') continue;
                    if (typeof ownKey !== 'string' || !/^(0|[1-9][0-9]*)$/.test(ownKey)) {
                        throw new CanonicalizationError(`array has unsupported own property at ${path}`);
                    }
                }
                let holeIndex = 0;
                while (holeIndex < input.length) {
                    if (!(holeIndex in input)) {
                        throw new CanonicalizationError(`sparse array hole at ${path}[${holeIndex}]`);
                    }
                    holeIndex += 1;
                }
                const items = input.map((item, i) => walk(item, `${path}[${i}]`));
                seen.delete(input);
                return `[${items.join(',')}]`;
            }
            if (input instanceof Date) {
                throw new CanonicalizationError(`Date instance is not canonicalizable at ${path}`);
            }
            if (!isPlainObject(input)) {
                throw new CanonicalizationError(`non-plain object prototype is not canonicalizable at ${path}`);
            }
            seen.add(input);
            if (Object.getOwnPropertySymbols(input).length > 0) {
                throw new CanonicalizationError(`symbol-keyed property is not canonicalizable at ${path}`);
            }
            for (const ownName of Object.getOwnPropertyNames(input)) {
                const descriptor = Object.getOwnPropertyDescriptor(input, ownName);
                if (!descriptor?.enumerable || !('value' in descriptor)) {
                    throw new CanonicalizationError(`non-enumerable or accessor property "${ownName}" is not canonicalizable at ${path}`);
                }
            }
            const keys = Object.keys(input).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
            const parts: string[] = [];
            for (const key of keys) {
                const propValue = (input as Record<string, unknown>)[key];
                if (propValue === undefined) {
                    throw new CanonicalizationError(`undefined value for key "${key}" at ${path}`);
                }
                parts.push(`${escapeJsonString(key)}:${walk(propValue, `${path}.${key}`)}`);
            }
            seen.delete(input);
            return `{${parts.join(',')}}`;
        }
        throw new CanonicalizationError(`unsupported value type "${t}" at ${path}`);
    }

    return walk(value, '$');
}

function sha256Hex(input: string): string {
    return createHash('sha256').update(input, 'utf8').digest('hex').toLowerCase();
}

export function canonicalDigest(value: unknown): string {
    return sha256Hex(canonicalizeToJson(value));
}
