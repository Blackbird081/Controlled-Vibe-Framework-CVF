// Text Encoding Exception: Vietnamese data fixtures verify UTF-8 fidelity and accepted user input.
import { describe, it, expect, vi } from 'vitest';
import { readBoundedRequestBody } from './bounded-request-body';

function streamRequest(chunks: Uint8Array[], cancel = vi.fn(), headers?: HeadersInit) {
    let index = 0;
    const stream = new ReadableStream<Uint8Array>({
        pull(controller) { if (index < chunks.length) controller.enqueue(chunks[index++]); else controller.close(); },
        cancel,
    }, { highWaterMark: 0 });
    return { request: new Request('http://localhost/test', { method: 'POST', body: stream, duplex: 'half' as const, headers } as RequestInit), stream, cancel, readCount: () => index };
}

describe('bounded request body', () => {
    it.each([{ bytes: [0xff] }, { bytes: [0xc0, 0xaf] }, { bytes: [0xed, 0xa0, 0x80] }, { bytes: [0xe2, 0x82] }])('rejects malformed UTF-8 without replacement %#', async ({ bytes }) => {
        const fixture = streamRequest([new Uint8Array(bytes)], vi.fn());
        await expect(readBoundedRequestBody(fixture.request, 100)).rejects.toThrow('Request body must use valid UTF-8.');
        expect(fixture.stream.locked).toBe(false);
    });
    it('preserves exact raw signed text across split UTF-8, BOM and whitespace', async () => {
        const source = '\ufeff  {"idea":"Đặt lịch tiếng Việt"}\r\n';
        const bytes = new TextEncoder().encode(source);
        const { request, stream } = streamRequest(Array.from(bytes, byte => new Uint8Array([byte])));
        expect(await readBoundedRequestBody(request, bytes.length)).toBe(await new Response(bytes).text());
        expect(stream.locked).toBe(false);
    });
    it.each([undefined, { 'content-length': '1' }])('counts actual bytes, cancels overflow and leaves unread tail %#', async headers => {
        const fixture = streamRequest([new Uint8Array(4), new Uint8Array(5), new Uint8Array(100)], vi.fn(), headers);
        expect(await readBoundedRequestBody(fixture.request, 8)).toBeNull();
        expect(fixture.cancel).toHaveBeenCalledOnce();
        expect(fixture.readCount()).toBe(2);
        expect(fixture.stream.locked).toBe(false);
    });
    it('rejects declared oversize without consuming body', async () => {
        const fixture = streamRequest([new Uint8Array(4)], vi.fn(), { 'content-length': '9' });
        expect(await readBoundedRequestBody(fixture.request, 8)).toBeNull();
        expect(fixture.readCount()).toBe(0);
    });
    it.each([() => Promise.reject(new Error('cleanup failed')), () => new Promise<void>(() => {})])('does not wait for or expose failed producer cleanup %#', async cancel => {
        const fixture = streamRequest([new Uint8Array(9)], vi.fn(cancel));
        expect(await readBoundedRequestBody(fixture.request, 8)).toBeNull();
        expect(fixture.stream.locked).toBe(false);
    });
    it('accepts exact limit and rejects one additional UTF-8 byte', async () => {
        const body = 'đ';
        expect(await readBoundedRequestBody(new Request('http://localhost/test', { method: 'POST', body }), 2)).toBe(body);
        expect(await readBoundedRequestBody(new Request('http://localhost/test', { method: 'POST', body }), 1)).toBeNull();
    });
});
