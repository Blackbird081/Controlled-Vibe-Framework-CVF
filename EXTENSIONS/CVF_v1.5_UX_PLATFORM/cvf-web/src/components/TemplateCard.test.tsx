import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateCard } from './TemplateCard';
import type { Template } from '@/types';

describe('TemplateCard', () => {
  const template: Template = {
    id: 'tpl_1',
    name: 'Landing Page',
    icon: '🚀',
    description: 'Create a high-converting landing page',
    category: 'marketing',
    fields: [],
    intentPattern: 'Create landing page',
    outputExpected: ['Spec'],
    sampleOutput: '# Sample',
  };

  it('renders template content', () => {
    render(<TemplateCard template={template} onClick={() => {}} />);
    expect(screen.getByText('Landing Page')).toBeInTheDocument();
    expect(screen.getByText('Create a high-converting landing page')).toBeInTheDocument();
    expect(screen.getByText('Marketing & SEO')).toBeInTheDocument();
  });

  it('fires onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(<TemplateCard template={template} onClick={onClick} />);
    fireEvent.click(screen.getByText('Landing Page'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows preview button when sample output and handler provided', () => {
    const onPreview = vi.fn();
    render(<TemplateCard template={template} onClick={() => {}} onPreview={onPreview} />);
    const preview = screen.getByTitle('Preview output');
    fireEvent.click(preview);
    expect(onPreview).toHaveBeenCalledTimes(1);
  });
});
