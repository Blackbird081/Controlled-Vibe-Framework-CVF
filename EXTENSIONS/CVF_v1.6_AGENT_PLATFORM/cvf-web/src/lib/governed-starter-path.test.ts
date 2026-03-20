/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
    buildGovernedStarterHandoff,
    clearGovernedStarterHandoff,
    readGovernedStarterHandoff,
    resolveGovernedStarterTemplate,
    saveGovernedStarterHandoff,
    type QuickStartResult,
} from './governed-starter-path';

describe('governed-starter-path', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('maps suggested template ids to governed wizard ids', () => {
        expect(resolveGovernedStarterTemplate(['marketing-campaign']).id).toBe('marketing_campaign_wizard');
        expect(resolveGovernedStarterTemplate(['unknown-template']).id).toBe('app_builder_wizard');
    });

    it('builds and persists a governed starter handoff', () => {
        const result: QuickStartResult = {
            provider: 'gemini',
            apiKey: 'secret',
            userInput: 'Tôi muốn tạo app quản lý công việc',
            detectedIntent: {
                phase: 'BUILD',
                riskLevel: 'R1',
                suggestedTemplates: ['app-builder'],
                confidence: 0.8,
                friendlyPhase: '🔨 Xây dựng & Thực thi',
                friendlyRisk: '🟢 Rủi ro thấp',
            },
        };

        const handoff = buildGovernedStarterHandoff(result);
        saveGovernedStarterHandoff(handoff);

        expect(handoff.recommendedTemplateId).toBe('app_builder_wizard');
        expect(readGovernedStarterHandoff()).toEqual(handoff);

        clearGovernedStarterHandoff();
        expect(readGovernedStarterHandoff()).toBeNull();
    });
});
