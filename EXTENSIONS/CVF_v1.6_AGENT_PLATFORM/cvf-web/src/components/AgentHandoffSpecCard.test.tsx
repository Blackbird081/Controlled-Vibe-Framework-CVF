/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AgentHandoffSpecCard } from './AgentHandoffSpecCard';
import { generateDeliverablePack } from '@/lib/deliverable-pack';
import type { Execution } from '@/types';

const execution: Execution = {
    id: 'exec_card_1',
    templateId: 'documentation',
    templateName: 'Documentation',
    category: 'content',
    input: { notes: 'Write a 3 steps SOP, at most 10 words.' },
    intent: 'SOP',
    output: '1. one two three four\n2. five six seven eight\n3. nine ten eleven twelve',
    status: 'completed',
    createdAt: new Date('2026-11-15T00:00:00Z'),
};

describe('AgentHandoffSpecCard', () => {
    it('shows readiness, criteria statuses and remaining work from the pack spec', () => {
        const spec = generateDeliverablePack(execution).agentHandoffSpec;
        render(<AgentHandoffSpecCard spec={spec} />);
        const card = screen.getByTestId('agent-handoff-spec');
        expect(within(card).getByText('REWORK_REQUIRED')).toBeTruthy();
        expect(within(card).getByText('10-word maximum').textContent).toBe('UNMET 10-word maximum');
        expect(within(card).getByText(/Rework the deliverable until "10-word maximum" is met/)).toBeTruthy();
    });
});
