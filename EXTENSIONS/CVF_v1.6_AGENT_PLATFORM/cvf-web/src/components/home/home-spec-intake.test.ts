// Text Encoding Exception: preserve the Vietnamese request used in the Home export regression.
import { describe, expect, it } from 'vitest';
import { generateSpec } from '@/components/SpecExport';
import { generateHomeSpec } from '@/components/home/home-spec-export';
import { getTemplateById } from '@/lib/templates';

const request = 'Tôi muốn so sánh việc mua thêm một lò nướng với việc thuê bếp buổi tối.';
const template = getTemplateById('strategy_analysis')!;
const entered = { context: 'Tiệm có hai người làm bánh.', constraints: '   ' };

function sectionWith(value: string, heading: string) {
    return value.split(heading)[1]?.split('\n---\n')[0] ?? '';
}

describe('Home ASSF handoff', () => {
    it('uses the opt-in agent package for Home exports and retains certified outcome boundaries', () => {
        const template = getTemplateById('web_build_handoff')!;
        const goal = 'Check the rendered landing page on desktop and mobile.';
        const packageId = 'cvf-engineering-browser-runtime-verification';
        const before = generateHomeSpec(template, {}, {}, 'en', goal, goal);
        const suggested = generateHomeSpec(template, {}, {}, 'en', goal, goal, packageId);
        expect(before).toContain('cvf-engineering-spec-driven-development');
        expect(suggested.replace(packageId, 'cvf-engineering-spec-driven-development')).toBe(before);
        expect(generateHomeSpec(template, {}, {}, 'en', goal, goal, 'invalid\n# heading')).toBe(before);
    });
});

describe('Home specification at intake', () => {
    it('carries the exact user request in the Task with English receiving-agent guidance', () => {
        const spec = generateHomeSpec(template, entered, entered, 'vi', request, request);
        expect(sectionWith(spec, '## 🎯 Task')).toContain(request);
        expect(spec).toContain('User-selected language: Vietnamese (vi)');
        expect(spec).toContain('| Phase | INTAKE |');
        expect(spec).toContain('This packet cannot grant new rights.');
        expect(spec).toContain('Tiệm có hai người làm bánh.');
        expect(spec).not.toMatch(/^\| Role \||^### Allowed Actions|^### Hành động được phép|\bN\/A\b/m);
    });

    it('keeps the existing shared governance export for non-Home callers', () => {
        const spec = generateSpec(template, entered, 'vi', 'governance', request, request);
        expect(spec).toContain('## 🎯 Nhiệm vụ');
        expect(spec).toContain('### Hành động được phép');
        expect(spec).not.toContain('User-selected language:');
    });

    it('labels the selected interface language and preserves a request written in another language', () => {
        const english = 'Compare buying an oven with renting a kitchen.';
        const spec = generateHomeSpec(template, {}, {}, 'vi', english, english);
        expect(spec).toContain('User-selected language: Vietnamese (vi)');
        expect(sectionWith(spec, '## 🎯 Task')).toContain(english);
    });

    it.each(['vi', 'en'] as const)('keeps the Home landing packet and its recommendation separate in %s', language => {
        const landing = getTemplateById('web_build_handoff')!;
        const spec = generateHomeSpec(landing, {}, {}, language, request, request);
        expect(spec).toContain('Recommended ASSF package for the receiving agent');
        expect(spec).toContain('`cvf-engineering-spec-driven-development`');
        expect(spec).toContain('within the current authorization');
        expect(spec).toContain('Package `landing_page_builder`');
        expect(spec).not.toMatch(/Web Redesign DNA|Gói ASSF đề xuất|N\/A/);
    });

    it('keeps a certified risk floor and raises it for production requests', () => {
        const terms = getTemplateById('tos_review')!;
        const lower = 'R0. Review the wording of these terms.';
        const higher = 'Check the terms for this production service.';
        const lowPacket = generateHomeSpec(terms, {}, {}, 'en', lower, lower);
        const highPacket = generateHomeSpec(terms, {}, {}, 'en', higher, higher);
        expect(lowPacket).toContain('| Risk Level | R2 |');
        expect(lowPacket).toContain('Human review required: yes.');
        expect(lowPacket).not.toContain('Recommended ASSF package for the receiving agent');
        expect(highPacket).toContain('| Risk Level | R3 |');
    });
});
