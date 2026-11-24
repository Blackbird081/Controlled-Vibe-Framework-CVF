import enLabels from '@/lib/i18n/en.json';
import viLabels from '@/lib/i18n/vi.json';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LedgerExplorer } from './LedgerExplorer';

// Mock i18n — default to English, override per test via mockLanguage
let mockLanguage: 'vi' | 'en' = 'en';
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: mockLanguage, t: (key: string) => ((mockLanguage === 'vi' ? viLabels : enLabels) as Record<string, string>)[key] ?? key }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LedgerExplorer', () => {
    beforeEach(() => {
        mockLanguage = 'en';
    });

    it('shows loading state initially', () => {
        mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
        render(<LedgerExplorer />);
        expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('shows empty state when no entries', async () => {
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({
                success: true,
                data: { total_blocks: 0, returned: 0, entries: [] },
            }),
        });

        render(<LedgerExplorer />);
        await vi.waitFor(() => {
            expect(screen.getByText('No entries yet')).toBeTruthy();
        });
    });

    it('shows error when API fails', async () => {
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({
                success: false,
                error: 'Governance Engine disconnected',
            }),
        });

        render(<LedgerExplorer />);
        await vi.waitFor(() => {
            expect(screen.getByText('Could not connect to the activity log')).toBeTruthy();
        });
    });

    it('renders ledger blocks with valid chain', async () => {
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({
                success: true,
                data: {
                    total_blocks: 2,
                    returned: 2,
                    entries: [
                        {
                            block_index: 0,
                            hash: 'hash0',
                            previous_hash: '000000',
                            event: { type: 'evaluation', status: 'APPROVED' },
                            timestamp: '2026-02-21T12:00:00Z',
                        },
                        {
                            block_index: 1,
                            hash: 'hash1',
                            previous_hash: 'hash0',
                            event: { type: 'evaluation', status: 'REJECTED' },
                            timestamp: '2026-02-21T12:01:00Z',
                        },
                    ],
                },
            }),
        });

        render(<LedgerExplorer />);
        await vi.waitFor(() => {
            expect(screen.getByText('Total records: 2')).toBeTruthy();
            expect(screen.getByText(/Log integrity verified/)).toBeTruthy();
        });
    });

    it('shows tamper warning for broken chain', async () => {
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({
                success: true,
                data: {
                    total_blocks: 2,
                    returned: 2,
                    entries: [
                        {
                            block_index: 0,
                            hash: 'hash0',
                            previous_hash: '000000',
                            event: {},
                            timestamp: '2026-02-21T12:00:00Z',
                        },
                        {
                            block_index: 1,
                            hash: 'hash1',
                            previous_hash: 'WRONG_HASH',
                            event: {},
                            timestamp: '2026-02-21T12:01:00Z',
                        },
                    ],
                },
            }),
        });

        render(<LedgerExplorer />);
        await vi.waitFor(() => {
            expect(screen.getAllByText(/Log integrity check failed/).length).toBeGreaterThanOrEqual(1);
            expect(screen.getByText(/Change detected in record/)).toBeTruthy();
        });
    });

    it('renders in Vietnamese', async () => {
        mockLanguage = 'vi';
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({
                success: true,
                data: { total_blocks: 0, returned: 0, entries: [] },
            }),
        });

        render(<LedgerExplorer />);
        await vi.waitFor(() => {
            expect(screen.getByText('Chưa có bản ghi nào')).toBeTruthy();
        });
    });
});
