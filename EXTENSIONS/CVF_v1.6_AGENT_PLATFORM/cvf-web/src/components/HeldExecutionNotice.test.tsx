/** @vitest-environment jsdom */
// Text Encoding Exception: exact Vietnamese roadmap copy.
import { webcrypto, createHash } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HeldExecutionNotice from './HeldExecutionNotice';

const fetchMock = vi.fn();
const response = (body: object, ok = true) => ({ ok, json: async () => body });
const control = (overrides: object = {}) => ({ revision: 7, execution: { active: true, canonicalId: 'request-A' }, ...overrides });
const status = (overrides: object = {}) => response({ success: true, control: control(overrides) });
const releaseButton = () => screen.getByRole('button', { name: 'Cho phép bắt đầu yêu cầu mới' }) as HTMLButtonElement;
const check = () => fireEvent.click(screen.getByRole('checkbox', { name: 'Tôi hiểu yêu cầu cũ có thể vẫn phát sinh phí' }));

describe('HeldExecutionNotice', () => {
    beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); vi.stubGlobal('crypto', webcrypto); });
    afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
    it('does not request status while inactive', () => { render(<HeldExecutionNotice active={false} />); expect(fetchMock).not.toHaveBeenCalled(); });
    it('renders exact disclosure and requires acknowledgment before revision-bound release', async () => {
        fetchMock.mockResolvedValueOnce(status()).mockResolvedValueOnce(response({ success: true }));
        render(<HeldExecutionNotice active />);
        expect(await screen.findByText('Yêu cầu trước chưa rõ kết quả / Previous request outcome unknown')).toBeTruthy();
        expect(screen.getByText('Yêu cầu cũ có thể vẫn được xử lý và phát sinh phí. Thao tác này không hủy yêu cầu cũ. CVF sẽ không tự gửi lại hoặc cấp thêm lượt gọi cho yêu cầu đó sau khi xác nhận. Bạn có thể bắt đầu yêu cầu mới; bằng chứng của yêu cầu cũ vẫn được lưu để kiểm tra.')).toBeTruthy();
        expect(releaseButton().disabled).toBe(true); check(); expect(releaseButton().disabled).toBe(false);
        fireEvent.click(releaseButton());
        await waitFor(() => expect(screen.queryByText(/Previous request outcome unknown/)).toBeNull());
        expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: 'status' });
        expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ action: 'release_held', expectedRevision: 7, canonicalId: 'request-A' });
    });
    it.each([{ execution: null }, { execution: { active: false, canonicalId: 'request-A' } }])('does not show without an active execution', async overrides => {
        fetchMock.mockResolvedValue(status(overrides)); render(<HeldExecutionNotice active />);
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        expect(screen.queryByText(/Previous request outcome unknown/)).toBeNull();
    });
    it('does not show for an already released execution, but does for a different digest', async () => {
        const digest = createHash('sha256').update('request-A').digest('hex').slice(0, 16);
        fetchMock.mockResolvedValueOnce(status({ heldRelease: { idDigest: digest } }));
        const view = render(<HeldExecutionNotice active />); await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        await new Promise(resolve => setTimeout(resolve, 20)); expect(screen.queryByText(/Previous request outcome unknown/)).toBeNull();
        view.unmount(); fetchMock.mockResolvedValueOnce(status({ heldRelease: { idDigest: '0000000000000000' } }));
        render(<HeldExecutionNotice active />); expect(await screen.findByText(/Previous request outcome unknown/)).toBeTruthy();
    });
    it('shows local release time and a safe failure code without server error text', async () => {
        const time = '2026-11-16T10:05:00.000Z';
        fetchMock.mockResolvedValueOnce(status()).mockResolvedValueOnce(response({ success: false, code: 'RELEASE_TOO_EARLY', releasableAt: time, error: 'secret' }, false));
        render(<HeldExecutionNotice active />); await screen.findByText(/Previous request outcome unknown/); check(); fireEvent.click(releaseButton());
        const formatted = new Date(time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
        expect(await screen.findByText(`Có thể xác nhận sau ${formatted}`)).toBeTruthy();
        expect(screen.getByRole('alert').textContent).toBe('Chưa đến lúc xác nhận. Hãy thử lại vào thời điểm hiển thị.');
        expect(screen.getByRole('alert').getAttribute('data-control-code')).toBe('RELEASE_TOO_EARLY');
        expect(screen.queryByText('secret')).toBeNull();
    });
    it('does not display unsafe server codes', async () => {
        fetchMock.mockResolvedValueOnce(status()).mockResolvedValueOnce(response({ success: false, code: 'secret token' }, false));
        render(<HeldExecutionNotice active />); await screen.findByText(/Previous request outcome unknown/); check(); fireEvent.click(releaseButton());
        expect((await screen.findByRole('alert')).textContent).toBe('Chưa thể kiểm tra trạng thái');
        expect(screen.queryByText('secret token')).toBeNull();
    });
});
