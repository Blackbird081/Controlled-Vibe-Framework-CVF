/**
 * Bilingual template name/description translations.
 * template.name / template.description = Vietnamese (default)
 * This map provides English equivalents.
 */

export const templateEnglish: Record<string, { name: string; description?: string }> = {
    // Business
    business_strategy_wizard: { name: '📈 Business Strategy Wizard', description: 'Multi-step wizard to create a governed Strategic Decision Document with review packet and live path' },
    strategy_analysis: { name: 'Strategy Analysis', description: 'Analyze business strategy, compare alternatives' },
    risk_assessment: { name: 'Risk Assessment', description: 'Risk assessment with mitigation plans' },
    competitor_review: { name: 'Competitor Review', description: 'Competitive analysis' },

    // Technical
    system_design_wizard: { name: '🔧 System Design Wizard', description: 'Multi-step wizard to create a governed System Design Document with review packet and live path' },
    code_review: { name: 'Code Review', description: 'Turn risky code or logic into a plain-language review and builder handoff' },
    architecture_review: { name: 'Architecture Review', description: 'System architecture review' },

    // Content
    content_strategy_wizard: { name: '✍️ Content Strategy Wizard', description: 'Multi-step wizard to create a governed Content Strategy with review packet and live path' },
    documentation: { name: 'Documentation', description: 'Turn rough notes into operational documentation and handoff guides' },
    email_template: { name: 'Email Templates', description: 'Create professional emails' },

    // Research
    research_project_wizard: { name: '🔬 Research Project Wizard', description: 'Multi-step wizard to create a governed Research Proposal with review packet and live path' },
    data_analysis_wizard: { name: '📊 Data Analysis Wizard', description: 'Multi-step wizard to create a governed Data Analysis Plan with review packet and live path' },
    data_analysis: { name: 'Data Analysis', description: 'Translate data into plain-language findings and decision guidance' },

    // Marketing
    marketing_campaign_wizard: { name: '📣 Marketing Campaign Wizard', description: 'Multi-step wizard to create a governed Campaign Brief with review packet and live path' },
    seo_audit: { name: 'SEO Audit', description: 'Website evaluation for Technical SEO, On-page, Off-page' },
    copywriting_evaluation: { name: 'Copywriting Evaluation', description: 'Evaluate and improve marketing copy' },
    landing_page_cro: { name: 'Landing Page CRO', description: 'Conversion rate optimization for landing pages' },
    pricing_strategy: { name: 'Pricing Strategy Review', description: 'Evaluate and optimize pricing strategy' },
    content_quality: { name: 'Content Quality Checklist', description: 'Content quality assessment with E-E-A-T' },
    email_campaign: { name: 'Email Campaign Review', description: 'Email marketing campaign evaluation' },
    social_ad_review: { name: 'Social Media Ad Review', description: 'Optimize ads on Facebook, Instagram, TikTok' },
    brand_voice: { name: 'Brand Voice Consistency', description: 'Ensure consistent brand voice' },

    // Product & UX
    product_design_wizard: { name: '🎨 Product Design Wizard', description: 'Multi-step wizard to create a governed Product Design Spec with review packet and live path' },
    ab_test_review: { name: 'A/B Test Review', description: 'Review product experiments in plain language and recommend the next decision' },
    accessibility_audit: { name: 'Accessibility Audit', description: 'WCAG compliance check' },
    user_flow_analysis: { name: 'User Flow Analysis', description: 'Analyze and optimize user journeys' },
    ux_heuristic_evaluation: { name: 'UX Heuristic Evaluation', description: "UX evaluation using Nielsen's 10 Heuristics" },
    feature_prioritization: { name: 'Feature Prioritization', description: 'RICE/ICE framework for feature prioritization' },
    user_persona: { name: 'User Persona Development', description: 'Create user personas based on data' },
    error_handling_ux: { name: 'Error Handling UX', description: 'Improve error handling experience' },
    onboarding_review: { name: 'Onboarding Experience Review', description: 'Optimize first-time user experience' },
    web_ux_redesign_system: { name: 'Web UX System', description: 'Turn a UX brief into a governed web handoff packet with a clear review gate' },
    web_build_handoff: { name: 'Web Build Handoff', description: 'Turn a plain-language website brief into a builder-ready governed packet' },

    // Security
    security_assessment_wizard: { name: '🔐 Security Assessment Wizard', description: 'Multi-step wizard to create a governed Security Assessment Report with review packet and live path' },
    api_security: { name: 'API Security Checklist', description: 'Review sensitive system flows and protection gaps without endpoint jargon' },
    gdpr_compliance: { name: 'GDPR Compliance Review', description: 'EU data protection compliance check' },
    privacy_policy_audit: { name: 'Privacy Policy Audit', description: 'Privacy policy review and improvement' },
    incident_response: { name: 'Incident Response Plan', description: 'Security incident response planning' },
    data_handling: { name: 'Data Handling Review', description: 'Review how data is collected, shared, retained, and protected in plain language' },
    tos_review: { name: 'Terms of Service Review', description: 'Terms of Service coverage and fairness' },

    // Development
    app_builder_wizard: { name: '🧙 App Builder Wizard', description: 'Multi-step wizard to create a governed app spec with packet review and live path. Recommended for complex apps.' },
    build_my_app: { name: '🚀 Build My App', description: 'Describe your app idea and let CVF route it into a governed starter path for non-coders.' },
    app_builder_complete: { name: '📦 App Builder Complete', description: 'Create a full product brief and builder-ready handoff without exposing stack choices to the user.' },
    individual_skills_folder: { name: '📂 Skill Templates (8)', description: '8 individual templates for each step: Requirements, Tech Stack, Architecture, Database, API, Desktop/CLI, Deployment.' },
    app_requirements_spec: { name: 'App Requirements Spec', description: 'Gather requirements for new app, define scope and success criteria' },
    tech_stack_selection: { name: 'Tech Stack Selection', description: 'Choose suitable technology for app based on requirements' },
    architecture_design: { name: 'Architecture Design', description: 'Design system architecture with component diagram' },
    database_schema: { name: 'Database Schema Design', description: 'Design database schema with ERD and SQL' },
    api_design: { name: 'API Design Spec', description: 'Turn business data-exchange needs into an integration handoff packet' },
    desktop_app_spec: { name: 'Desktop App Spec', description: 'Spec for desktop app: windows, menus, shortcuts, tray' },
    cli_tool_spec: { name: 'CLI Tool Spec', description: 'Spec for command-line tool: commands, arguments, options' },
    local_deployment: { name: 'Local Deployment Spec', description: 'Packaging and distribution spec for local apps' },
    vibe_logic_mapping: { name: 'Vibe Logic Mapping', description: 'Translate approved vibe keywords into a builder-ready style brief' },
};

export const templateEnglishFieldLabels: Record<string, Record<string, string>> = {
    strategy_analysis: {
        topic: 'Strategy topic',
        context: 'Context',
        options: 'Options under consideration',
        constraints: 'Constraints',
        priority: 'Priority',
    },
    brand_voice: {
        brand: 'Brand name',
        industry: 'Industry',
        audience: 'Target audience',
        samples: 'Sample content',
        values: 'Brand values',
    },
    web_build_handoff: {
        websiteGoal: 'What is this website for?',
        audience: 'Who will use this website?',
        mustDo: 'What must users be able to do?',
        screens: 'What pages or popups are needed?',
        mustPreserve: 'What must stay unchanged?',
        lookAndFeel: 'What should the interface feel like?',
        references: 'Examples or additional notes',
    },
    app_builder_complete: {
        appName: '1. App / product name',
        appType: '2. What kind of product is this?',
        problem: '3. What problem does it solve?',
        targetUsers: '4. Who will use this product?',
        coreFeatures: '5. The most important things the app must do',
        successCriteria: '6. When would you consider the first version successful?',
        mustPreserve: '7. What must stay unchanged',
        platforms: '8. Where does the app need to run?',
        dataNeeds: '9. What data does the app need to remember or process?',
        lookAndFeel: '10. Look and feel',
        outOfScope: '11. Out of scope',
        constraints: '12. Constraints or special conditions',
    },
};

export type TemplateFieldChromeTranslation = {
    label?: string;
    placeholder?: string;
    hint?: string;
    example?: string;
};

export const templateEnglishFieldChrome: Record<string, Record<string, TemplateFieldChromeTranslation>> = {
    strategy_analysis: {
        topic: {
            label: 'Strategy topic',
            placeholder: 'Example: Expand into the Central region',
            hint: 'Name the decision, strategic direction, or tradeoff that needs analysis.',
            example: 'Expand into the Central region for an FMCG product line',
        },
        context: {
            label: 'Context',
            placeholder: 'Describe the industry, company size, market, timing...',
            hint: 'Give enough business context for useful analysis: industry, company size, market share, constraints, and trends.',
            example: 'B2B SaaS company, 200 employees, $5M annual revenue. The market is growing 15% year over year.',
        },
        options: {
            label: 'Options under consideration',
            placeholder: 'List the options you are comparing',
            hint: 'One option per line. The agent will compare pros, cons, risk, and next steps.',
            example: '1. Open a direct branch\n2. Partner with local operators\n3. Sell online first',
        },
        constraints: {
            label: 'Constraints',
            placeholder: 'Budget, timeline, resources...',
            hint: 'Name budget, time, staffing, operating, or approval limits.',
            example: 'Maximum budget $500K, must complete by Q3 2026',
        },
        priority: {
            label: 'Priority',
            hint: 'Choose the primary strategic objective for this analysis.',
        },
    },
    brand_voice: {
        brand: {
            label: 'Brand name',
            placeholder: 'Brand name',
            hint: 'The brand whose voice consistency should be reviewed.',
            example: 'TaskFlow',
        },
        industry: {
            label: 'Industry',
            placeholder: 'Industry',
            hint: 'The business category or market the brand operates in.',
            example: 'SaaS / Productivity Tools',
        },
        audience: {
            label: 'Target audience',
            placeholder: 'Primary customer persona',
            hint: 'Name the core audience and buying context.',
            example: 'SMB founders and team leaders, age 28-45',
        },
        samples: {
            label: 'Sample content',
            placeholder: '3-5 samples from different channels',
            hint: 'Paste a few content samples from web, email, social, ads, or support messages.',
            example: 'Website: "Streamline your workflow..."\nEmail: "Hey team! Check out..."\nSocial: "Big news!..."',
        },
        values: {
            label: 'Brand values',
            placeholder: 'Core brand values',
            hint: 'The values the voice should preserve.',
            example: 'Simple, reliable, human-friendly',
        },
    },
    web_build_handoff: {
        websiteGoal: {
            label: 'What is this website for?',
            placeholder: 'Main business or product goal',
            hint: 'Use business language. You do not need technical terms.',
            example: 'Help customers book a consultation and understand services faster',
        },
        audience: {
            label: 'Who will use this website?',
            placeholder: 'Primary users',
            hint: 'Name the main user group or role.',
            example: 'Small-business owners looking for AI automation solutions',
        },
        mustDo: {
            label: 'What must users be able to do?',
            placeholder: 'The 3-5 most important user actions',
            hint: 'Describe what users need to accomplish on the website.',
            example: 'View services\nCompare packages\nBook a consultation\nLeave contact information',
        },
        screens: {
            label: 'What pages or popups are needed?',
            placeholder: 'List pages, modals, or forms',
            hint: 'List the screens you expect the agent to create.',
            example: 'Home, Services, Pricing, Contact form modal, Thank-you page',
        },
        mustPreserve: {
            label: 'What must stay unchanged?',
            placeholder: 'Logic, data, integrations, auth, routes...',
            hint: 'If there is existing backend logic, say what the builder must not break.',
            example: 'CRM form webhook, current routes, admin auth, lead-submit API',
        },
        lookAndFeel: {
            label: 'What should the interface feel like?',
            placeholder: 'Desired style or feeling',
            hint: 'Describe the overall interface feeling.',
            example: 'Trustworthy, bright, modern, easy to read on mobile',
        },
        references: {
            label: 'Examples or additional notes',
            placeholder: 'Reference links or short notes',
            hint: 'Mention sites you like or things the builder should avoid.',
            example: 'I like clear sections, strong headlines, and prominent CTAs; avoid excessive effects.',
        },
    },
    app_builder_complete: {
        appName: {
            label: '1. App / product name',
            placeholder: 'Example: TaskFlow',
            hint: 'Use a memorable name so the packet and handoff stay attached to the right product.',
            example: 'TaskFlow',
        },
        appType: {
            label: '2. What kind of product is this?',
            hint: 'Choose only the main product surface. You do not need to name a framework.',
        },
        problem: {
            label: '3. What problem does it solve?',
            placeholder: 'Describe the pain point or work that is slow, confusing, or manual...',
            hint: 'Focus on the real-world problem instead of the technical solution.',
            example: 'A small team needs to track daily work, but Jira is too heavy and takes too long to update.',
        },
        targetUsers: {
            label: '4. Who will use this product?',
            placeholder: 'Main user group',
            hint: 'Name the people who benefit directly from the app.',
            example: 'Solo developers and small teams of 2-5 people',
        },
        coreFeatures: {
            label: '5. The most important things the app must do',
            placeholder: 'List 3-5 core capabilities for the first version',
            hint: 'Describe user actions or outcomes they need to achieve.',
            example: '1. Create and update tasks\n2. View tasks on a board\n3. Filter by status\n4. Remind users about upcoming deadlines',
        },
        successCriteria: {
            label: '6. When would you consider the first version successful?',
            placeholder: 'Visible completion signs or outcomes you must see',
            hint: 'Write this as an acceptance checklist from a non-coder perspective.',
            example: 'A user can create a task within 1 minute, view the board smoothly on desktop, and use core features without internet.',
        },
        mustPreserve: {
            label: '7. What must stay unchanged',
            placeholder: 'Logic, data, routes, integrations, workflows, required wording...',
            hint: 'This tells the builder what must not be broken during implementation.',
            example: 'Keep the reporting webhook, current CSV export format, and published plan names unchanged.',
        },
        platforms: {
            label: '8. Where does the app need to run?',
            placeholder: 'Windows, macOS, web browser, Android...',
            hint: 'Name where people will actually use the product.',
            example: 'Windows + macOS',
        },
        dataNeeds: {
            label: '9. What data does the app need to remember or process?',
            placeholder: 'User information, tasks, attachments, reports...',
            hint: 'Do not name a database. Just describe the data type and sensitivity.',
            example: 'Tasks, deadlines, internal notes, owners, and small attachments',
        },
        lookAndFeel: {
            label: '10. Look and feel',
            placeholder: 'Describe the desired style or feeling',
            hint: 'Use plain words such as clean, focused, premium, data-heavy, calm, or fast.',
            example: 'Minimal, work-focused, easy to scan, low visual noise',
        },
        outOfScope: {
            label: '11. Out of scope',
            placeholder: 'Clear limits to avoid overbuilding',
            hint: 'Name the parts that are deliberately not part of this version.',
            example: 'No multi-user mode yet, no dedicated mobile app, no cloud sync yet',
        },
        constraints: {
            label: '12. Constraints or special conditions',
            placeholder: 'Deadline, budget, internal rules, offline operation, compliance...',
            hint: 'Any limit that changes how the builder should implement the product.',
            example: 'Must work offline, internal rollout in 3 weeks, no complex runtime installation required',
        },
    },
};

export const templateEnglishIntentPatterns: Record<string, string> = {
    strategy_analysis: `INTENT:
I want to analyze the strategy for [topic].

CONTEXT:
[context]

OPTIONS:
[options]

CONSTRAINTS:
[constraints]

PRIORITY: [priority]

OUTPUT FORMAT:
- Executive Summary -> SWOT Analysis -> Options Comparison -> Risk Assessment -> Recommendations -> Next Actions

SUCCESS CRITERIA:
- Clearly compare pros and cons
- Identify the main risks
- Provide evidence-backed recommendations`,
    brand_voice: `INTENT:
I want to evaluate brand voice consistency for [brand].

INDUSTRY: [industry]
TARGET AUDIENCE: [audience]
BRAND VALUES: [values]

SAMPLE CONTENT:
[samples]

OUTPUT FORMAT:
- Voice Audit -> Consistency Score -> Voice Attributes -> Tone Matrix -> Language Guidelines

SUCCESS CRITERIA:
- Assess voice attributes
- Check cross-channel consistency
- Judge tone appropriateness
- Recommend concrete improvements`,
    web_build_handoff: `INTENT:
I am a non-coder and want CVF to turn this website brief into a build packet for another agent.

WEBSITE GOAL:
[websiteGoal]

TARGET USERS:
[audience]

USERS MUST BE ABLE TO:
[mustDo]

REQUIRED PAGES / MODALS:
[screens]

MUST PRESERVE:
[mustPreserve]

LOOK AND FEEL:
[lookAndFeel]

REFERENCES / NOTES:
[references]

OUTPUT REQUIREMENTS:
- Ask only for plain-language product intent, not hidden technical choices
- Translate the brief into a clear agent-ready web build packet
- Apply CVF Web Redesign DNA automatically where relevant
- Preserve existing logic, integrations, data contracts, and protected flows
- Provide page structure, UX priorities, and an acceptance checklist`,
    app_builder_complete: `INTENT:
I want to create a complete app brief that remains non-coder friendly.

APP / PRODUCT NAME: [appName]
APP TYPE: [appType]

PROBLEM TO SOLVE:
[problem]

TARGET USERS:
[targetUsers]

CORE FEATURES:
[coreFeatures]

SUCCESS CRITERIA:
[successCriteria]

MUST PRESERVE:
[mustPreserve]

PLATFORMS:
[platforms]

DATA NEEDS:
[dataNeeds]

LOOK AND FEEL:
[lookAndFeel]

OUT OF SCOPE:
[outOfScope]

CONSTRAINTS:
[constraints]

OUTPUT REQUIREMENTS:
- Ask only for business intent, user outcomes, constraints, and preservation rules
- Do not ask the end user to choose frameworks, databases, or hidden technical patterns
- Translate this into a builder-ready governed packet
- Include acceptance criteria and handoff boundaries`,
};

export const templateEnglishOutputTemplates: Record<string, string> = {
    strategy_analysis: `# Strategy Analysis Output

## Executive Summary
- Goal:
- Primary recommendation:
- Rationale:

## Assumptions & Missing Data
- Missing inputs:
- Assumptions used:

## SWOT Analysis
| Strengths | Weaknesses | Opportunities | Threats |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

## Options Comparison
| Option | Pros | Cons | Cost/Impact | Risks | Notes |
| --- | --- | --- | --- | --- | --- |
| Option A |  |  |  |  |  |
| Option B |  |  |  |  |  |

## Risk Assessment
- Top risks, ranked:
1. ...
2. ...
- Mitigations:
- ...

## Recommendations
- Recommendation 1:
- Recommendation 2, if needed:

## Success Criteria Check
- [ ] Clearly compare pros and cons
- [ ] Identify the main risks
- [ ] Provide evidence-backed recommendations

## Next Actions
- Questions for user:
- Data to confirm:`,
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

export function getTemplateFieldLabel(templateId: string, fieldId: string, defaultLabel: string, locale: string): string {
    if (locale === 'en') {
        return templateEnglishFieldChrome[templateId]?.[fieldId]?.label
            || templateEnglishFieldLabels[templateId]?.[fieldId]
            || defaultLabel;
    }
    return defaultLabel;
}

export function getTemplateFieldChrome(
    templateId: string,
    fieldId: string,
    locale: string,
): TemplateFieldChromeTranslation {
    if (locale === 'en') {
        return templateEnglishFieldChrome[templateId]?.[fieldId] || {};
    }
    return {};
}

export function getTemplateIntentPattern(templateId: string, defaultPattern: string, locale: string): string {
    if (locale === 'en') {
        return templateEnglishIntentPatterns[templateId] || defaultPattern;
    }
    return defaultPattern;
}

export function getTemplateOutputTemplate(templateId: string, defaultTemplate: string | undefined, locale: string): string | undefined {
    if (locale === 'en') {
        return templateEnglishOutputTemplates[templateId] || defaultTemplate;
    }
    return defaultTemplate;
}
