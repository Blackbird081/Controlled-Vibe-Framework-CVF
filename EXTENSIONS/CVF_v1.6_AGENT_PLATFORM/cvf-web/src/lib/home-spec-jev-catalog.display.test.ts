// Text Encoding Exception: tests exercise Vietnamese Home outcomes.
import { describe, expect, it } from 'vitest';
import { getHomeOutcomeAuthority, getHomeExportTemplate, getHomeRecommendedAssfPackage, homeOnlyAssfRecommendations, getJevOutcomeChoices, homeQuickActions, getHomeOutcomeByKey, homeSpecOutcomeTitle, homeSpecTemplates, resolveHomeOutcomeId } from './home-spec-jev-catalog';
import { routeEligibleHomeKeywords } from './home-spec-keyword-router';

describe('Home outcome catalog K3', () => {
  it('excludes the nine empty and twelve internal entries, merges aliases, and retains no-match', () => {
    const ids = homeSpecTemplates.map(x => x.id);
    for (const id of ['app_builder_wizard','business_strategy_wizard','content_strategy_wizard','data_analysis_wizard','marketing_campaign_wizard','product_design_wizard','research_project_wizard','security_assessment_wizard','system_design_wizard','api_design','api_security','architecture_design','architecture_review','auto_documentation','cli_tool_spec','code_review','non_coder_debug','project_init_checklist','vibe_logic_mapping','vibe_to_spec','web_ux_redesign_system','build_my_app','app_builder_complete','decision_memo']) expect(ids).not.toContain(id);
    expect(resolveHomeOutcomeId('build_my_app')).toBe('app_requirements_spec');
    expect(resolveHomeOutcomeId('app_builder_complete')).toBe('app_requirements_spec');
    expect(resolveHomeOutcomeId('decision_memo')).toBe('strategy_analysis');
    expect(getJevOutcomeChoices().map(x=>x.id)).toEqual(['no_match',...ids]);
  });
  it('describes summary and translation as a two-step task in the Jev choice catalog', () => {
    const choice = getJevOutcomeChoices().find(item => item.id === 'summary_translation');
    expect(choice?.description).toBe('Summarize a supplied passage, then translate the summary into the chosen language. Not for translating a single sentence or line.');
  });
  it('explains the same summary and translation scope in Vietnamese', () => {
    const template = getHomeExportTemplate('summary_translation', 'vi');
    expect(template?.description).toBe('Tóm tắt đoạn văn được cung cấp, rồi dịch bản tóm tắt sang ngôn ngữ mong muốn. Không dùng để dịch một câu hoặc một dòng.');
  });
  it('uses the email and terms-of-service labels requested in H4.2', () => {
    expect(homeSpecOutcomeTitle('email_template','en')).toBe('Email');
    const reminder = routeEligibleHomeKeywords('Write a polite reminder email for clients with invoices overdue by 30 days.');
    expect(reminder.recommendedTemplateId).toBe('email_template');
    expect(homeSpecOutcomeTitle(reminder.recommendedTemplateId!, 'en')).toBe('Email');
    expect(homeSpecOutcomeTitle('tos_review','en')).toBe('Terms of service review');
  });
  it('adds five bilingual outcomes with usable English agent instructions', () => {
    for(const id of ['short_message','social_post','tracking_table','lesson_or_test','summary_translation']) {
      expect(homeSpecTemplates.some(x=>x.id===id)).toBe(true);
      expect(Object.hasOwn(homeOnlyAssfRecommendations, id)).toBe(true);
      expect(getHomeRecommendedAssfPackage(id)).toBeNull();
      for(const locale of ['vi','en'] as const){const t=getHomeExportTemplate(id,locale);expect(t?.name).toBeTruthy();expect(t?.intentPattern).toBeTruthy();expect(t?.outputTemplate).toBeTruthy();expect(t?.fields.filter(x=>x.required).length).toBeGreaterThan(0);}
    }
  });
  it('keeps H4.4 printer troubleshooting outside Home suggestions on both attempts', () => {
    for (const text of ['Fix my printer, it says paper jam but there is no paper stuck.', 'Give me troubleshooting steps for my printer, ask for the make, model and exact error first.']) {
      const result = routeEligibleHomeKeywords(text);
      expect(result.confidence).toBe('weak');
      expect(result.recommendedTemplateId).toBeNull();
    }
  });
  it('preserves distinct legacy outcome links and one eligible Home set', () => {
    expect(getHomeOutcomeByKey('create_proposal')).toBe('home_proposal');
    expect(getHomeOutcomeByKey('review_contract')).toBe('home_contract_review');
    expect(getHomeOutcomeByKey('create_prd')).toBe('app_requirements_spec');
    expect(homeQuickActions.every(action => homeSpecTemplates.some(t => t.id === action.templateId))).toBe(true);
    expect(new Set(homeSpecTemplates.map(t => t.id)).size).toBe(homeSpecTemplates.length);
    expect(homeSpecTemplates).toHaveLength(41);
    for (const template of homeSpecTemplates) {
      for (const locale of ['vi','en'] as const) {
        const localized = getHomeExportTemplate(template.id, locale)!;
        expect(homeSpecOutcomeTitle(template.id, locale)).toBeTruthy();
        expect(localized.intentPattern).toBeTruthy();
        expect(localized.outputTemplate || localized.outputExpected.length).toBeTruthy();
        if (locale === 'en') {
          expect(localized.fields.map(f => f.label).join(' ')).not.toMatch(/[À-ỹ]/u);
          expect(localized.outputExpected.join(' ')).not.toMatch(/[À-ỹ]/u);
          expect(localized.intentPattern).not.toMatch(/[À-ỹ]/u);
          expect(localized.outputTemplate).not.toMatch(/[À-ỹ]/u);
        }
      }
    }
  });
  it('keeps landing-page Home content free of unrelated redesign instructions in both languages', () => {
    for (const locale of ['vi','en'] as const) {
      const landing = getHomeExportTemplate('web_build_handoff', locale)!;
      expect(landing.fields.map(field => field.id)).toEqual(['websiteGoal','audience','mustDo','screens','mustPreserve','lookAndFeel','references']);
      expect(JSON.stringify(landing)).not.toMatch(/Web Redesign DNA/i);
      expect(landing.intentPattern).toContain('[websiteGoal]');
      expect(landing.outputTemplate).toContain(locale === 'vi' ? 'Nội dung trang giới thiệu' : 'Landing page content');
    }
  });
  it('distinguishes static introduction copy from site functionality and redesign in the Jev catalog', () => {
    const choices = getJevOutcomeChoices();
    const landing = choices.find(item => item.id === 'web_build_handoff')?.description;
    const application = choices.find(item => item.id === 'app_requirements_spec')?.description;
    expect(landing).toMatch(/static introduction page/i);
    expect(application).toMatch(/bookings.*sign-ups.*email.*accounts.*data.*site redesign/i);
    expect(getHomeExportTemplate('web_build_handoff', 'vi')?.description).toContain('trang tĩnh');
    expect(getHomeExportTemplate('web_build_handoff', 'en')?.description).toBe(landing);
    expect(getHomeExportTemplate('app_requirements_spec', 'vi')?.description).toContain('làm lại cả website');
    expect(getHomeExportTemplate('app_requirements_spec', 'en')?.description).toBe(application);
  });
  it('describes day-to-day operations separately from marketing and strategy in both languages', () => {
    const choice = getJevOutcomeChoices().find(item => item.id === 'operator_plan');
    const vietnamese = getHomeExportTemplate('operator_plan', 'vi')?.description;
    expect(choice?.description).toMatch(/day-to-day.*staffing.*shifts.*handoffs.*not for marketing.*strategy/i);
    expect(getHomeExportTemplate('operator_plan', 'en')?.description).toBe(choice?.description);
    expect(vietnamese).toMatch(/hằng ngày.*phân công.*ca làm.*bàn giao.*không dùng cho.*tiếp thị.*chiến lược/i);
  });

  it('reads certified floors and boundaries without granting execution', () => {
    expect(getHomeOutcomeAuthority('app_requirements_spec')?.riskLevel).toBe('R1');
    expect(getHomeOutcomeAuthority('data_analysis')?.riskLevel).toBe('R2');
    expect(getHomeOutcomeAuthority('short_message')).toBeNull();
    expect(getHomeOutcomeAuthority('data_analysis')?.packs[0].executionBoundary.externalSideEffects).toBe(false);
  });
});
