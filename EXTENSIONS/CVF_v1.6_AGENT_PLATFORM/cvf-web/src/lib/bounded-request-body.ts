export class InvalidRequestBodyEncodingError extends Error {
    constructor() {
        super('Request body must use valid UTF-8.');
        this.name = 'InvalidRequestBodyEncodingError';
    }
}

/** Application-retained request bound; not a proxy, concurrency or upload deadline. */
export async function readBoundedRequestBody(request: Request, maxBytes: number): Promise<string | null> {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw new RangeError('Invalid request byte limit');
    const declaredLength = Number(request.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) return null;
    if (!request.body) return '';
    const reader = request.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0;
    let text = '';
    const decode = (value?: Uint8Array, stream = false): string => {
        try { return decoder.decode(value, { stream }); }
        catch {
            void reader.cancel().catch(() => undefined);
            throw new InvalidRequestBodyEncodingError();
        }
    };
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) return text + decode();
            bytes += value.byteLength;
            if (bytes > maxBytes) {
                void reader.cancel().catch(() => undefined);
                return null;
            }
            text += decode(value, true);
        }
    } finally {
        reader.releaseLock();
    }
}
