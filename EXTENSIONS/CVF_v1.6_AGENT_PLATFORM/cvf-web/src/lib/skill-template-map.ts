/**
 * Bi-directional mapping between Templates (UI forms) and Skills (governance .skill.md files).
 *
 * Templates = INPUT side (help users create specs via forms)
 * Skills    = KNOWLEDGE side (detailed governance + UAT metadata)
 *
 * This mapping enables:
 * - From Templates page: "📚 View related Skill" link
 * - From Skills page:    "📝 Use Template" link
 *
 * Format: { templateId → { domain, skillId } }
 * where domain = skill folder name, skillId = filename without .skill.md
 */

export interface SkillRef {
    domain: string;
    skillId: string;
}

/**
 * Maps template IDs to their corresponding skill domain/ID.
 * Only templates with a clear 1:1 skill match are included.
 */
export const templateToSkillMap: Record<string, SkillRef> = {
    // === Business templates → business_analysis skills ===
    'business_strategy_wizard': { domain: 'business_analysis', skillId: 'business_plan' },
    'strategy_analysis': { domain: 'business_analysis', skillId: '01_strategy_analysis' },
    'risk_assessment': { domain: 'business_analysis', skillId: '02_risk_assessment' },
    'competitor_review': { domain: 'business_analysis', skillId: 'business_competitor_analysis' },

    // === Technical templates → technical_review skills ===
    'system_design_wizard': { domain: 'technical_review', skillId: '02_architecture_review' },
    'code_review': { domain: 'technical_review', skillId: '01_code_review' },
    'architecture_review': { domain: 'technical_review', skillId: '02_architecture_review' },

    // === Content templates → content_creation skills ===
    'content_strategy_wizard': { domain: 'content_creation', skillId: '01_documentation' },
    'documentation': { domain: 'content_creation', skillId: '01_documentation' },
    'email_template': { domain: 'content_creation', skillId: '02_report_writing' },

    // === Development templates → app_development skills ===
    'app_builder_wizard': { domain: 'app_development', skillId: '01_app_requirements_spec' },
    'build_my_app': { domain: 'app_development', skillId: '01_app_requirements_spec' },
    'app_builder_complete': { domain: 'app_development', skillId: '01_app_requirements_spec' },
    'app_requirements_spec': { domain: 'app_development', skillId: '01_app_requirements_spec' },
    'tech_stack_selection': { domain: 'app_development', skillId: '02_tech_stack_selection' },
    'architecture_design': { domain: 'app_development', skillId: '03_architecture_design' },
    'database_schema': { domain: 'app_development', skillId: '04_database_schema_design' },
    'api_design': { domain: 'app_development', skillId: '05_api_design_spec' },
    'desktop_app_spec': { domain: 'app_development', skillId: '06_desktop_app_spec' },
    'cli_tool_spec': { domain: 'app_development', skillId: '07_cli_tool_spec' },
    'local_deployment': { domain: 'app_development', skillId: '08_local_deployment' },

    // === Marketing templates → marketing_seo skills ===
    'marketing_campaign_wizard': { domain: 'marketing_seo', skillId: 'marketing_demand_acquisition' },
    'seo_audit': { domain: 'marketing_seo', skillId: 'seo_audit' },
    'copywriting_evaluation': { domain: 'marketing_seo', skillId: 'copywriting_evaluation' },
    'landing_page_cro': { domain: 'marketing_seo', skillId: 'landing_page_cro' },
    'pricing_strategy': { domain: 'marketing_seo', skillId: 'pricing_strategy_review' },
    'content_quality': { domain: 'marketing_seo', skillId: 'content_quality_checklist' },
    'email_campaign': { domain: 'marketing_seo', skillId: 'email_campaign_review' },
    'social_ad_review': { domain: 'marketing_seo', skillId: 'social_media_ad_review' },
    'brand_voice': { domain: 'marketing_seo', skillId: 'brand_voice_consistency' },

    // === Product & UX templates → product_ux skills ===
    'product_design_wizard': { domain: 'product_ux', skillId: 'user_flow_analysis' },
    'ab_test_review': { domain: 'product_ux', skillId: 'ab_test_review' },
    'accessibility_audit': { domain: 'product_ux', skillId: 'accessibility_audit' },
    'user_flow_analysis': { domain: 'product_ux', skillId: 'user_flow_analysis' },
    'ux_heuristic_evaluation': { domain: 'product_ux', skillId: 'ux_heuristic_evaluation' },
    'feature_prioritization': { domain: 'product_ux', skillId: 'feature_prioritization' },
    'user_persona': { domain: 'product_ux', skillId: 'user_persona_development' },
    'error_handling_ux': { domain: 'product_ux', skillId: 'error_handling_ux' },
    'onboarding_review': { domain: 'product_ux', skillId: 'onboarding_experience_review' },

    // === Security templates → security_compliance skills ===
    'security_assessment_wizard': { domain: 'security_compliance', skillId: 'api_security_checklist' },
    'api_security': { domain: 'security_compliance', skillId: 'api_security_checklist' },
    'gdpr_compliance': { domain: 'security_compliance', skillId: 'gdpr_compliance_review' },
    'privacy_policy_audit': { domain: 'security_compliance', skillId: 'privacy_policy_audit' },
    'incident_response': { domain: 'security_compliance', skillId: 'incident_response_plan' },
    'data_handling': { domain: 'security_compliance', skillId: 'data_handling_review' },
    'tos_review': { domain: 'security_compliance', skillId: 'terms_of_service_review' },

    // === Research templates (no direct skill domain match) ===
    'research_project_wizard': { domain: 'ai_ml_evaluation', skillId: '01_model_selection' },
    'data_analysis_wizard': { domain: 'finance_analytics', skillId: '01_budget_analysis' },
    'data_analysis': { domain: 'finance_analytics', skillId: '01_budget_analysis' },

    // === New skills added v1.1.0 — 6 confirmed bridges ===
    // Vibe workflow templates → app_development skills
    'vibe_to_spec': { domain: 'app_development', skillId: '01_vibe_to_spec' },
    'vibe_logic_mapping': { domain: 'app_development', skillId: '02_vibe_logic_mapping' },
    'non_coder_debug': { domain: 'app_development', skillId: '03_non_coder_debug' },
    'auto_documentation': { domain: 'app_development', skillId: '05_auto_documentation_vn' },
    'project_init_checklist': { domain: 'app_development', skillId: '07_project_init_checklist' },
    // Grandma UX Test → product_ux
    'grandma_ux_test': { domain: 'product_ux', skillId: '04_grandma_ux_test' },
    // Financial Trend Predictor → finance_analytics (unique key)
    'data_analysis_finance': { domain: 'finance_analytics', skillId: '09_financial_trend_predictor' },
};

/**
 * Reverse lookup: find templates that link to a given skill.
 */
export function getTemplatesForSkill(domain: string, skillId: string): string[] {
    return Object.entries(templateToSkillMap)
        .filter(([, ref]) => ref.domain === domain && ref.skillId === skillId)
        .map(([templateId]) => templateId);
}

/**
 * Get the skill reference for a given template ID.
 */
export function getSkillForTemplate(templateId: string): SkillRef | null {
    return templateToSkillMap[templateId] || null;
}

/**
 * Get all template IDs that link to any skill within a domain.
 */
export function getTemplatesForDomain(domain: string): string[] {
    return Object.entries(templateToSkillMap)
        .filter(([, ref]) => ref.domain === domain)
        .map(([templateId]) => templateId);
}

/**
 * Category → Domain mapping (for templates that don't have a direct skill match).
 */
export const categoryToDomainMap: Record<string, string> = {
    business: 'business_analysis',
    technical: 'technical_review',
    content: 'content_creation',
    development: 'app_development',
    marketing: 'marketing_seo',
    product: 'product_ux',
    security: 'security_compliance',
    research: 'ai_ml_evaluation',
};

/**
 * Domain → Category mapping (reverse).
 */
export const domainToCategoryMap: Record<string, string> = Object.fromEntries(
    Object.entries(categoryToDomainMap).map(([cat, domain]) => [domain, cat])
);
