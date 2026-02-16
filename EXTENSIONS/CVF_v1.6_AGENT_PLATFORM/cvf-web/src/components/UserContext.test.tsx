/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { UserContextForm, UserContextBadge, useUserContext } from './UserContext';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

const STORAGE_KEY = 'cvf_user_context';

describe('UserContext', () => {
    beforeEach(() => {
        localStorage.removeItem(STORAGE_KEY);
    });

    describe('useUserContext hook', () => {
        it('returns default context initially', () => {
            const { result } = renderHook(() => useUserContext());
            expect(result.current.context.name).toBe('');
            expect(result.current.context.role).toBe('');
            expect(result.current.context.company).toBe('');
        });

        it('loads context from localStorage', async () => {
            const saved = { name: 'Alice', role: 'Dev', company: 'Corp', industry: 'Tech', preferences: '', customContext: '' };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

            const { result } = renderHook(() => useUserContext());
            await waitFor(() => {
                expect(result.current.isLoaded).toBe(true);
            });
            expect(result.current.context.name).toBe('Alice');
            expect(result.current.context.role).toBe('Dev');
        });

        it('handles corrupted localStorage gracefully', async () => {
            localStorage.setItem(STORAGE_KEY, '{{invalid json');

            const { result } = renderHook(() => useUserContext());
            await waitFor(() => {
                expect(result.current.isLoaded).toBe(true);
            });
            expect(result.current.context.name).toBe('');
        });

        it('saveContext persists to localStorage', async () => {
            const { result } = renderHook(() => useUserContext());
            await waitFor(() => expect(result.current.isLoaded).toBe(true));

            act(() => {
                result.current.saveContext({
                    name: 'Bob',
                    role: 'PM',
                    company: 'Startup',
                    industry: 'Fintech',
                    preferences: 'English',
                    customContext: 'Extra info',
                });
            });

            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
            expect(stored.name).toBe('Bob');
            expect(stored.company).toBe('Startup');
        });

        it('clearContext removes from localStorage', async () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 'Alice', role: '', company: '', industry: '', preferences: '', customContext: '' }));
            const { result } = renderHook(() => useUserContext());
            await waitFor(() => expect(result.current.isLoaded).toBe(true));

            act(() => {
                result.current.clearContext();
            });

            expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
            expect(result.current.context.name).toBe('');
        });

        it('getContextPrompt returns empty string for empty context', async () => {
            const { result } = renderHook(() => useUserContext());
            await waitFor(() => expect(result.current.isLoaded).toBe(true));

            expect(result.current.getContextPrompt()).toBe('');
        });

        it('getContextPrompt builds prompt from context fields', async () => {
            const { result } = renderHook(() => useUserContext());
            await waitFor(() => expect(result.current.isLoaded).toBe(true));

            act(() => {
                result.current.saveContext({
                    name: 'Alice',
                    role: 'Dev',
                    company: 'Corp',
                    industry: 'Tech',
                    preferences: 'English',
                    customContext: 'My extra context',
                });
            });

            const prompt = result.current.getContextPrompt();
            expect(prompt).toContain('[USER CONTEXT]');
            expect(prompt).toContain('Alice');
            expect(prompt).toContain('Dev');
            expect(prompt).toContain('Corp');
            expect(prompt).toContain('Tech');
            expect(prompt).toContain('English');
            expect(prompt).toContain('My extra context');
        });

        it('getContextPrompt omits empty fields', async () => {
            const { result } = renderHook(() => useUserContext());
            await waitFor(() => expect(result.current.isLoaded).toBe(true));

            act(() => {
                result.current.saveContext({
                    name: 'Alice',
                    role: '',
                    company: '',
                    industry: '',
                    preferences: '',
                    customContext: '',
                });
            });

            const prompt = result.current.getContextPrompt();
            expect(prompt).toContain('Alice');
            expect(prompt).not.toContain('Vai trò');
            expect(prompt).not.toContain('Công ty');
        });
    });

    describe('UserContextForm', () => {
        it('renders form with all input fields', async () => {
            render(<UserContextForm />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText('John Doe')).toBeTruthy();
            });
            expect(screen.getByPlaceholderText('Product Manager, Developer...')).toBeTruthy();
            expect(screen.getByPlaceholderText('TechStart Inc.')).toBeTruthy();
            expect(screen.getByPlaceholderText('SaaS, E-commerce, Fintech...')).toBeTruthy();
        });

        it('renders close button when onClose is provided', async () => {
            const onClose = vi.fn();
            render(<UserContextForm onClose={onClose} />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText('John Doe')).toBeTruthy();
            });
            // Find the close button (svg path)
            const closeButton = document.querySelector('button svg');
            expect(closeButton).toBeTruthy();
        });

        it('does not render close button when no onClose', async () => {
            render(<UserContextForm />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText('John Doe')).toBeTruthy();
            });
            // Should not have close button svg (only the checkmark svg after save)
            const svgs = document.querySelectorAll('button svg');
            // No close button svg
            expect(svgs.length).toBe(0);
        });

        it('fills and saves form data', async () => {
            render(<UserContextForm />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText('John Doe')).toBeTruthy();
            });

            fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Test User' } });
            fireEvent.change(screen.getByPlaceholderText('Product Manager, Developer...'), { target: { value: 'Engineer' } });

            // Click save
            const saveBtn = screen.getByText('userContext.save');
            fireEvent.click(saveBtn);

            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
            expect(stored.name).toBe('Test User');
            expect(stored.role).toBe('Engineer');
        });

        it('clears form data', async () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 'Alice', role: 'Dev', company: '', industry: '', preferences: '', customContext: '' }));
            render(<UserContextForm />);

            await waitFor(() => {
                expect((screen.getByPlaceholderText('John Doe') as HTMLInputElement).value).toBe('Alice');
            });

            const clearBtn = screen.getByText('userContext.clear');
            fireEvent.click(clearBtn);

            expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
            expect((screen.getByPlaceholderText('John Doe') as HTMLInputElement).value).toBe('');
        });

        it('shows saved indicator after saving', async () => {
            render(<UserContextForm />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText('John Doe')).toBeTruthy();
            });

            const saveBtn = screen.getByText('userContext.save');
            fireEvent.click(saveBtn);

            expect(screen.getByText('userContext.saved')).toBeTruthy();
        });

        it('renders in compact mode', async () => {
            const { container } = render(<UserContextForm compact={true} />);
            await waitFor(() => {
                expect(screen.getByPlaceholderText('John Doe')).toBeTruthy();
            });
            expect(container.firstChild).toBeTruthy();
            // Compact mode uses p-4 instead of p-6
            expect((container.firstChild as HTMLElement).className).toContain('p-4');
        });
    });

    describe('UserContextBadge', () => {
        it('renders badge with Context text when no user data', async () => {
            const onClick = vi.fn();
            render(<UserContextBadge onClick={onClick} />);
            await waitFor(() => {
                expect(screen.getByText('Context')).toBeTruthy();
            });
        });

        it('renders badge with user name when context exists', async () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 'Alice', role: 'Dev', company: 'Corp', industry: '', preferences: '', customContext: '' }));
            const onClick = vi.fn();
            render(<UserContextBadge onClick={onClick} />);
            await waitFor(() => {
                expect(screen.getByText('Alice')).toBeTruthy();
            });
        });

        it('shows User when name is empty but has role', async () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: '', role: 'Dev', company: '', industry: '', preferences: '', customContext: '' }));
            const onClick = vi.fn();
            render(<UserContextBadge onClick={onClick} />);
            await waitFor(() => {
                expect(screen.getByText('User')).toBeTruthy();
            });
        });

        it('calls onClick when clicked', async () => {
            const onClick = vi.fn();
            render(<UserContextBadge onClick={onClick} />);
            await waitFor(() => {
                expect(screen.getByText('Context')).toBeTruthy();
            });

            fireEvent.click(screen.getByText('Context'));
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it('has green styling when context exists', async () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 'Alice', role: '', company: '', industry: '', preferences: '', customContext: '' }));
            const onClick = vi.fn();
            render(<UserContextBadge onClick={onClick} />);
            await waitFor(() => {
                expect(screen.getByText('Alice')).toBeTruthy();
            });

            const button = screen.getByText('Alice').closest('button')!;
            expect(button.className).toContain('bg-green-100');
        });
    });
});
