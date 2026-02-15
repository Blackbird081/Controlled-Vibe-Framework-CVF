/**
 * Bilingual template name/description translations.
 * template.name / template.description = Vietnamese (default)
 * This map provides English equivalents.
 */

export const templateEnglish: Record<string, { name: string; description?: string }> = {
    // Business
    business_strategy_wizard: { name: '📈 Business Strategy Wizard', description: 'Multi-step wizard to create Strategic Decision Document in 4 steps: Context → Options → SWOT/Risk → Review' },
    strategy_analysis: { name: 'Strategy Analysis', description: 'Analyze business strategy, compare alternatives' },
    risk_assessment: { name: 'Risk Assessment', description: 'Risk assessment with mitigation plans' },
    competitor_review: { name: 'Competitor Review', description: 'Competitive analysis' },

    // Technical
    system_design_wizard: { name: '🔧 System Design Wizard', description: 'Multi-step wizard to create System Design Document in 5 steps: Requirements → Estimations → Design → Deep Dive → Review' },
    code_review: { name: 'Code Review', description: 'Code review for quality, security, performance' },
    architecture_review: { name: 'Architecture Review', description: 'System architecture review' },

    // Content
    content_strategy_wizard: { name: '✍️ Content Strategy Wizard', description: 'Multi-step wizard to create Content Strategy in 5 steps: Brand → Audience → Pillars → Channels → Review' },
    documentation: { name: 'Documentation', description: 'Create technical documentation' },
    email_template: { name: 'Email Templates', description: 'Create professional emails' },

    // Research
    research_project_wizard: { name: '🔬 Research Project Wizard', description: 'Multi-step wizard to create Research Proposal in 4 steps: Question → Methodology → Resources → Review' },
    data_analysis_wizard: { name: '📊 Data Analysis Wizard', description: 'Multi-step wizard to create Data Analysis Plan in 5 steps: Problem → Understanding → Methodology → Deliverables → Review' },
    data_analysis: { name: 'Data Analysis', description: 'Analyze data and extract insights' },

    // Marketing
    marketing_campaign_wizard: { name: '📣 Marketing Campaign Wizard', description: 'Multi-step wizard to create Campaign Brief in 5 steps: Goals → Audience → Channels → Content → Review' },
    seo_audit: { name: 'SEO Audit', description: 'Website evaluation for Technical SEO, On-page, Off-page' },
    copywriting_evaluation: { name: 'Copywriting Evaluation', description: 'Evaluate and improve marketing copy' },
    landing_page_cro: { name: 'Landing Page CRO', description: 'Conversion rate optimization for landing pages' },
    pricing_strategy: { name: 'Pricing Strategy Review', description: 'Evaluate and optimize pricing strategy' },
    content_quality: { name: 'Content Quality Checklist', description: 'Content quality assessment with E-E-A-T' },
    email_campaign: { name: 'Email Campaign Review', description: 'Email marketing campaign evaluation' },
    social_ad_review: { name: 'Social Media Ad Review', description: 'Optimize ads on Facebook, Instagram, TikTok' },
    brand_voice: { name: 'Brand Voice Consistency', description: 'Ensure consistent brand voice' },

    // Product & UX
    product_design_wizard: { name: '🎨 Product Design Wizard', description: 'Multi-step wizard to create Product Design Spec in 6 steps: Problem → User → Solution → UX → Visual → Review' },
    ab_test_review: { name: 'A/B Test Review', description: 'Evaluate A/B test design and results' },
    accessibility_audit: { name: 'Accessibility Audit', description: 'WCAG compliance check' },
    user_flow_analysis: { name: 'User Flow Analysis', description: 'Analyze and optimize user journeys' },
    ux_heuristic_evaluation: { name: 'UX Heuristic Evaluation', description: "UX evaluation using Nielsen's 10 Heuristics" },
    feature_prioritization: { name: 'Feature Prioritization', description: 'RICE/ICE framework for feature prioritization' },
    user_persona: { name: 'User Persona Development', description: 'Create user personas based on data' },
    error_handling_ux: { name: 'Error Handling UX', description: 'Improve error handling experience' },
    onboarding_review: { name: 'Onboarding Experience Review', description: 'Optimize first-time user experience' },

    // Security
    security_assessment_wizard: { name: '🔐 Security Assessment Wizard', description: 'Multi-step wizard to create Security Assessment Report in 5 steps: Scope → Threats → Vulns → Risk → Review' },
    api_security: { name: 'API Security Checklist', description: 'OWASP Top 10 API security audit' },
    gdpr_compliance: { name: 'GDPR Compliance Review', description: 'EU data protection compliance check' },
    privacy_policy_audit: { name: 'Privacy Policy Audit', description: 'Privacy policy review and improvement' },
    incident_response: { name: 'Incident Response Plan', description: 'Security incident response planning' },
    data_handling: { name: 'Data Handling Review', description: 'Data lifecycle management review' },
    tos_review: { name: 'Terms of Service Review', description: 'Terms of Service coverage and fairness' },

    // Development
    app_builder_wizard: { name: '🧙 App Builder Wizard', description: 'Multi-step wizard to create spec in 8 steps. Recommended for complex apps!' },
    build_my_app: { name: '🚀 Build My App', description: 'Describe your app idea → AI decides everything and builds for you. For non-coders.' },
    app_builder_complete: { name: '📦 App Builder Complete', description: 'Create comprehensive spec with full technical details. For users who understand CVF workflow.' },
    individual_skills_folder: { name: '📂 Skill Templates (8)', description: '8 individual templates for each step: Requirements, Tech Stack, Architecture, Database, API, Desktop/CLI, Deployment.' },
    app_requirements_spec: { name: 'App Requirements Spec', description: 'Gather requirements for new app, define scope and success criteria' },
    tech_stack_selection: { name: 'Tech Stack Selection', description: 'Choose suitable technology for app based on requirements' },
    architecture_design: { name: 'Architecture Design', description: 'Design system architecture with component diagram' },
    database_schema: { name: 'Database Schema Design', description: 'Design database schema with ERD and SQL' },
    api_design: { name: 'API Design Spec', description: 'Design REST API with endpoints and request/response format' },
    desktop_app_spec: { name: 'Desktop App Spec', description: 'Spec for desktop app: windows, menus, shortcuts, tray' },
    cli_tool_spec: { name: 'CLI Tool Spec', description: 'Spec for command-line tool: commands, arguments, options' },
    local_deployment: { name: 'Local Deployment Spec', description: 'Packaging and distribution spec for local apps' },
};

/**
 * Get the localized name/description for a template.
 * When locale is 'vi', returns template's default name/description (Vietnamese).
 * When locale is 'en', returns from the English lookup map.
 */
export function getTemplateName(templateId: string, defaultName: string, locale: string): string {
    if (locale === 'en') {
        return templateEnglish[templateId]?.name || defaultName;
    }
    return defaultName;
}

export function getTemplateDescription(templateId: string, defaultDesc: string, locale: string): string {
    if (locale === 'en') {
        return templateEnglish[templateId]?.description || defaultDesc;
    }
    return defaultDesc;
}
