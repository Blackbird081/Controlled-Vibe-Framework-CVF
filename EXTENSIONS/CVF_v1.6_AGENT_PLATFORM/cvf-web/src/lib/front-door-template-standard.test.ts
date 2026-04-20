/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { SkillIndexPayload } from '@/types/skill';
import { generateCompleteSpec, getTemplateById } from './templates';

function loadSkillIndex(): SkillIndexPayload {
  const raw = readFileSync(path.resolve(process.cwd(), 'public/data/skills-index.json'), 'utf8');
  return JSON.parse(raw) as SkillIndexPayload;
}

function sampleValuesForTemplate(templateId: string) {
  const template = getTemplateById(templateId);
  if (!template) return {};

  return Object.fromEntries(
    template.fields.map((field) => [
      field.id,
      field.example || field.placeholder || `Sample value for ${field.label}`,
    ]),
  );
}

describe('front-door template standard', () => {
  const skillIndex = loadSkillIndex();
  const frontDoorTemplateIds = Array.from(
    new Set(
      skillIndex.categories
        .flatMap((category) => category.skills)
        .filter((skill) => skill.frontDoorVisible)
        .flatMap((skill) => (skill.linkedTemplates ?? []).map((linked) => linked.templateId)),
    ),
  );

  it('every front-door linked template exists and stays packet-ready for non-coder export', () => {
    expect(frontDoorTemplateIds.length).toBeGreaterThan(0);

    frontDoorTemplateIds.forEach((templateId) => {
      const template = getTemplateById(templateId);

      expect(template, `${templateId} should resolve from the template registry`).toBeDefined();
      expect(template?.description.trim().length, `${templateId} should have a user-facing description`).toBeGreaterThan(0);
      expect(
        Boolean(template?.outputTemplate || template?.sampleOutput || (template?.outputExpected?.length ?? 0) > 0),
        `${templateId} should expose a structured output contract`,
      ).toBe(true);

      if ((template?.fields.length ?? 0) > 0) {
        const requiredFields = template?.fields.filter((field) => field.required) ?? [];
        expect(requiredFields.length, `${templateId} should ask for at least one required input`).toBeGreaterThan(0);

        requiredFields.forEach((field) => {
          expect(field.label.trim().length, `${templateId}.${field.id} should have a label`).toBeGreaterThan(0);
          expect(
            Boolean(field.hint || field.placeholder || field.example),
            `${templateId}.${field.id} should help the non-coder understand what to enter`,
          ).toBe(true);
        });
      }

      const spec = generateCompleteSpec(template!, sampleValuesForTemplate(templateId));
      expect(spec, `${templateId} should generate a governed export packet`).toContain('CVF Non-Coder Success Standard');
      expect(spec, `${templateId} should generate governed response rules`).toContain('Governed Response Rules');
      expect(spec, `${templateId} should generate execution constraints`).toContain('Execution Constraints');
    });
  });
});
