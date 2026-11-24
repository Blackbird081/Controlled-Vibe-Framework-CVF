// Text Encoding Exception: Vietnamese user-facing fixtures and language-matching literals require UTF-8.
import { describe, expect, it } from 'vitest';
import { generateSpec } from '@/components/SpecExport';
import { generateIntent, getTemplateById } from '@/lib/templates';

const headings = [
  'What This Document Is For',
  'Required Inputs, Artifacts, And Fields',
  'Step-By-Step Procedure',
  'Decision Branches',
  'QA Checks',
  'Common Failure Modes And Recovery',
  'Final Handoff Acceptance Checklist',
];

const template = getTemplateById('documentation')!;

describe('documentation brief constraints', () => {
  it('carries the short Vietnamese brief and its precedence into the constructed specification', () => {
    const values = {
      subject: 'Bàn giao ca làm việc',
      currentNotes: 'Nhận công việc → kiểm tra tiến độ → bàn giao cho ca sau. Viết tiếng Việt, tối đa 150 từ, gồm 3 bước và checklist.',
      readerGoal: 'Bàn giao công việc cho ca sau',
    };
    const intent = generateIntent(template, values);
    const spec = generateSpec(template, values, 'en', 'governance');

    expect(spec).toContain(values.currentNotes);
    expect(intent).toContain('word limit and number of steps take priority');
    expect(intent).toContain('response language');
    expect(intent).toContain('Unknown or a proposal requiring confirmation');
    expect(spec).toContain('Under an explicit user word limit keep only sections 1, 3 and 7; the limit counts headings');
    expect(intent).toContain('A word limit counts every word including headings');
    for (const heading of headings) {
      expect(intent).toContain(`## ${heading}`);
      expect(template.outputTemplate).toMatch(new RegExp(`## [1-7]\\. ${heading}`));
    }
  });

  it('retains a useful default procedure and checklist without asserting missing policy', () => {
    expect(template.sampleOutput).toContain('1. Receive the work.');
    expect(template.sampleOutput).toContain('3. Hand it over to the next shift.');
    expect(template.sampleOutput).toContain('- [ ]');
    expect(template.sampleOutput).toContain('Recovery policy: Unknown; confirm with the team.');
    expect(template.intentPattern).toContain('SUCCESS CRITERIA:');
    expect(template.intentPattern).toContain('OUTPUT FORMAT');
  });
});
