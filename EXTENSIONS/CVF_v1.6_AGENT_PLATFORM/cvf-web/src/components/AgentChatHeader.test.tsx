/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentChatHeader } from './AgentChatHeader';

vi.mock('./ExportMenu', () => ({
    ExportMenu: () => <div data-testid="export-menu" />,
}));

describe('AgentChatHeader', () => {
    it('shows provider badge and toggles actions', () => {
        const onToggleExportMenu = vi.fn();
        const onToggleDecisionLog = vi.fn();
        const onClose = vi.fn();
        const onMinimize = vi.fn();
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

        render(
            <AgentChatHeader
                currentMode="governance"
                language="vi"
                defaultProvider="gemini"
                isStreaming={true}
                showExportMenu={true}
                onToggleExportMenu={onToggleExportMenu}
                messages={[]}
                onClose={onClose}
                onMinimize={onMinimize}
                decisionLogCount={2}
                decisionLogOpen={false}
                onToggleDecisionLog={onToggleDecisionLog}
            />
        );

        expect(screen.getByText(/Gemini/i)).toBeTruthy();
        expect(screen.getByTestId('export-menu')).toBeTruthy();
        expect(screen.getByText('Streaming...')).toBeTruthy();

        fireEvent.click(screen.getByTitle('Decision log'));
        fireEvent.click(screen.getByTitle('Export chat'));
        fireEvent.click(screen.getByTitle('Thu nhỏ'));
        fireEvent.click(screen.getByTitle('Phóng to'));
        fireEvent.click(screen.getByTitle('Đóng'));

        expect(onToggleDecisionLog).toHaveBeenCalledTimes(1);
        expect(onToggleExportMenu).toHaveBeenCalledTimes(1);
        expect(onMinimize).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(dispatchSpy).toHaveBeenCalled();
        dispatchSpy.mockRestore();
    });

    it('renders without export menu and hides close when not provided', () => {
        const onToggleExportMenu = vi.fn();
        const onToggleDecisionLog = vi.fn();
        const onMinimize = vi.fn();

        render(
            <AgentChatHeader
                currentMode="simple"
                language="en"
                defaultProvider="openai"
                isStreaming={false}
                showExportMenu={false}
                onToggleExportMenu={onToggleExportMenu}
                messages={[]}
                onMinimize={onMinimize}
                decisionLogCount={0}
                decisionLogOpen={true}
                onToggleDecisionLog={onToggleDecisionLog}
            />
        );

        expect(screen.queryByTestId('export-menu')).toBeNull();
        expect(screen.queryByTitle('Đóng')).toBeNull();
        expect(screen.getByText(/GPT-4/i)).toBeTruthy();
    });

    it('renders anthropic provider label', () => {
        render(
            <AgentChatHeader
                currentMode="simple"
                language="en"
                defaultProvider="anthropic"
                isStreaming={false}
                showExportMenu={false}
                onToggleExportMenu={vi.fn()}
                messages={[]}
                decisionLogCount={0}
                decisionLogOpen={false}
                onToggleDecisionLog={vi.fn()}
            />
        );

        expect(screen.getByText(/Claude/i)).toBeTruthy();
    });
});
