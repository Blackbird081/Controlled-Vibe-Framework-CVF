/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
    it('renders thinking state', () => {
        render(<TypingIndicator />);
        expect(screen.getByText('Thinking...')).toBeTruthy();
    });
});
