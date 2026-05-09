/**
 * CVF Full Skill Registry
 * ========================
 * Auto-generated from the 141 CVF skills with phase/risk metadata.
 * Each skill declares which phase it's allowed in and its risk level,
 * enabling the GuardRuntimeEngine to block inappropriate skill invocations.
 *
 * Sprint 8 — Task 8.2
 *
 * @module cvf-guard-contract/runtime/full-skill-registry
 */

import { SkillRegistry, type SkillDefinition } from './skill-registry';

// ─── Skill Categories ────────────────────────────────────────────────

const SKILL_CATEGORIES = {
  INTAKE: { phase: 'INTAKE' as const, defaultRisk: 'R0' as const },
  DESIGN: { phase: 'DESIGN' as const, defaultRisk: 'R1' as const },
  BUILD: { phase: 'BUILD' as const, defaultRisk: 'R2' as const },
  REVIEW: { phase: 'REVIEW' as const, defaultRisk: 'R1' as const },
  CROSS_PHASE: { phase: undefined, defaultRisk: 'R1' as const },
};

// ─── Full Skill Definitions (141 skills across 12 domains) ───────────

const FULL_SKILLS: SkillDefinition[] = [
  // ── Domain 1: Research & Analysis (12 skills) ──
  { id: 'market-research', name: 'Market Research', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R0', description: 'Analyze market trends and competitive landscape' },
  { id: 'competitor-analysis', name: 'Competitor Analysis', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R0', description: 'Deep-dive competitor strategies' },
  { id: 'user-research', name: 'User Research', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R0', description: 'User interviews and persona development' },
  { id: 'data-analysis', name: 'Data Analysis', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R0', description: 'Statistical analysis and insights' },
  { id: 'feasibility-study', name: 'Feasibility Study', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R1', description: 'Technical and business feasibility assessment' },
  { id: 'trend-analysis', name: 'Trend Analysis', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R0', description: 'Identify and analyze industry trends' },
  { id: 'swot-analysis', name: 'SWOT Analysis', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R0', description: 'Strengths, weaknesses, opportunities, threats' },
  { id: 'gap-analysis', name: 'Gap Analysis', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R0', description: 'Identify gaps between current and desired state' },
  { id: 'stakeholder-analysis', name: 'Stakeholder Analysis', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R1', description: 'Map stakeholders and their interests' },
  { id: 'risk-assessment', name: 'Risk Assessment', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R1', description: 'Identify and evaluate project risks' },
  { id: 'benchmarking', name: 'Benchmarking', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R0', description: 'Compare performance against industry standards' },
  { id: 'technology-evaluation', name: 'Technology Evaluation', domain: 'research', requiredPhase: 'INTAKE', riskLevel: 'R1', description: 'Evaluate technology options and trade-offs' },

  // ── Domain 2: Strategy & Planning (12 skills) ──
  { id: 'business-strategy', name: 'Business Strategy', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Develop business strategy and goals' },
  { id: 'product-roadmap', name: 'Product Roadmap', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Plan product evolution and milestones' },
  { id: 'go-to-market', name: 'Go-to-Market Strategy', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Launch strategy and market entry plan' },
  { id: 'pricing-strategy', name: 'Pricing Strategy', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R2', description: 'Define pricing models and tiers' },
  { id: 'resource-planning', name: 'Resource Planning', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Allocate team and budget resources' },
  { id: 'milestone-planning', name: 'Milestone Planning', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R0', description: 'Define project milestones and deadlines' },
  { id: 'budget-planning', name: 'Budget Planning', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R2', description: 'Create and manage project budgets' },
  { id: 'okr-definition', name: 'OKR Definition', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R0', description: 'Set objectives and key results' },
  { id: 'kpi-framework', name: 'KPI Framework', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R0', description: 'Define key performance indicators' },
  { id: 'change-management', name: 'Change Management', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R2', description: 'Plan organizational change processes' },
  { id: 'partnership-strategy', name: 'Partnership Strategy', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Identify and plan strategic partnerships' },
  { id: 'exit-strategy', name: 'Exit Strategy', domain: 'strategy', requiredPhase: 'DESIGN', riskLevel: 'R2', description: 'Plan exit scenarios and succession' },

  // ── Domain 3: Design & Architecture (12 skills) ──
  { id: 'system-architecture', name: 'System Architecture', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Design system architecture and components' },
  { id: 'api-design', name: 'API Design', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Design RESTful/GraphQL API contracts' },
  { id: 'database-design', name: 'Database Design', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R2', description: 'Schema design and data modeling' },
  { id: 'ux-design', name: 'UX Design', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R0', description: 'User experience design and flows' },
  { id: 'ui-design', name: 'UI Design', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R0', description: 'Visual interface design' },
  { id: 'wireframing', name: 'Wireframing', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R0', description: 'Low-fidelity wireframes and layouts' },
  { id: 'prototyping', name: 'Prototyping', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R0', description: 'Interactive prototype creation' },
  { id: 'design-system', name: 'Design System', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Component library and style guide' },
  { id: 'microservice-design', name: 'Microservice Design', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R2', description: 'Microservice boundaries and communication' },
  { id: 'event-driven-design', name: 'Event-Driven Design', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R2', description: 'Event sourcing and CQRS patterns' },
  { id: 'security-architecture', name: 'Security Architecture', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R3', description: 'Security controls and threat modeling' },
  { id: 'infrastructure-design', name: 'Infrastructure Design', domain: 'design', requiredPhase: 'DESIGN', riskLevel: 'R2', description: 'Cloud infrastructure and DevOps architecture' },

  // ── Domain 4: Development (18 skills) ──
  { id: 'frontend-dev', name: 'Frontend Development', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Build user-facing web interfaces' },
  { id: 'backend-dev', name: 'Backend Development', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Server-side logic and APIs' },
  { id: 'mobile-dev', name: 'Mobile Development', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'iOS/Android app development' },
  { id: 'fullstack-dev', name: 'Fullstack Development', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'End-to-end application development' },
  { id: 'api-implementation', name: 'API Implementation', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Implement API endpoints' },
  { id: 'database-implementation', name: 'Database Implementation', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'Create and migrate database schemas' },
  { id: 'authentication', name: 'Authentication System', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'Implement auth and authorization' },
  { id: 'payment-integration', name: 'Payment Integration', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'Payment gateway integration' },
  { id: 'ci-cd-pipeline', name: 'CI/CD Pipeline', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Continuous integration and deployment' },
  { id: 'third-party-integration', name: 'Third-Party Integration', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Integrate external services and APIs' },
  { id: 'data-pipeline', name: 'Data Pipeline', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'ETL and data processing workflows' },
  { id: 'caching-layer', name: 'Caching Layer', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Implement caching strategies' },
  { id: 'search-engine', name: 'Search Implementation', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Full-text search and indexing' },
  { id: 'notification-system', name: 'Notification System', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Email, push, SMS notifications' },
  { id: 'file-management', name: 'File Management', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'File upload, storage, processing' },
  { id: 'logging-monitoring', name: 'Logging & Monitoring', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Application logging and observability' },
  { id: 'websocket-realtime', name: 'WebSocket/Realtime', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Real-time communication' },
  { id: 'batch-processing', name: 'Batch Processing', domain: 'development', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Scheduled tasks and batch jobs' },

  // ── Domain 5: Content & Marketing (12 skills) ──
  { id: 'content-writing', name: 'Content Writing', domain: 'content', requiredPhase: 'BUILD', riskLevel: 'R0', description: 'Blog posts, articles, copy' },
  { id: 'seo-optimization', name: 'SEO Optimization', domain: 'content', requiredPhase: 'BUILD', riskLevel: 'R0', description: 'Search engine optimization' },
  { id: 'social-media-content', name: 'Social Media Content', domain: 'content', requiredPhase: 'BUILD', riskLevel: 'R0', description: 'Social media posts and campaigns' },
  { id: 'email-marketing', name: 'Email Marketing', domain: 'content', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Email campaigns and automation' },
  { id: 'ad-copywriting', name: 'Ad Copywriting', domain: 'content', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Advertising copy for various channels' },
  { id: 'video-script', name: 'Video Script', domain: 'content', requiredPhase: 'BUILD', riskLevel: 'R0', description: 'Video scripts and storyboards' },
  { id: 'press-release', name: 'Press Release', domain: 'content', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'PR communications and press releases' },
  { id: 'brand-guidelines', name: 'Brand Guidelines', domain: 'content', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Brand identity and style guide' },
  { id: 'landing-page-copy', name: 'Landing Page Copy', domain: 'content', requiredPhase: 'BUILD', riskLevel: 'R0', description: 'Conversion-optimized page copy' },
  { id: 'product-description', name: 'Product Description', domain: 'content', requiredPhase: 'BUILD', riskLevel: 'R0', description: 'Product listings and descriptions' },
  { id: 'newsletter', name: 'Newsletter', domain: 'content', requiredPhase: 'BUILD', riskLevel: 'R0', description: 'Regular newsletter content' },
  { id: 'case-study', name: 'Case Study', domain: 'content', requiredPhase: 'BUILD', riskLevel: 'R0', description: 'Customer success stories' },

  // ── Domain 6: Testing & QA (12 skills) ──
  { id: 'unit-testing', name: 'Unit Testing', domain: 'testing', requiredPhase: 'BUILD', riskLevel: 'R0', description: 'Write unit tests' },
  { id: 'integration-testing', name: 'Integration Testing', domain: 'testing', requiredPhase: 'REVIEW', riskLevel: 'R1', description: 'Integration and API tests' },
  { id: 'e2e-testing', name: 'E2E Testing', domain: 'testing', requiredPhase: 'REVIEW', riskLevel: 'R1', description: 'End-to-end automated tests' },
  { id: 'performance-testing', name: 'Performance Testing', domain: 'testing', requiredPhase: 'REVIEW', riskLevel: 'R1', description: 'Load and stress testing' },
  { id: 'security-testing', name: 'Security Testing', domain: 'testing', requiredPhase: 'REVIEW', riskLevel: 'R2', description: 'Vulnerability scanning and pentesting' },
  { id: 'accessibility-testing', name: 'Accessibility Testing', domain: 'testing', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'WCAG compliance testing' },
  { id: 'regression-testing', name: 'Regression Testing', domain: 'testing', requiredPhase: 'REVIEW', riskLevel: 'R1', description: 'Verify existing functionality' },
  { id: 'code-review', name: 'Code Review', domain: 'testing', requiredPhase: 'REVIEW', riskLevel: 'R1', description: 'Peer code review process' },
  { id: 'test-automation', name: 'Test Automation', domain: 'testing', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Automated test framework setup' },
  { id: 'qa-process', name: 'QA Process', domain: 'testing', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'Quality assurance workflow' },
  { id: 'bug-triage', name: 'Bug Triage', domain: 'testing', requiredPhase: 'REVIEW', riskLevel: 'R1', description: 'Bug prioritization and resolution' },
  { id: 'test-data-management', name: 'Test Data Management', domain: 'testing', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Test fixtures and data generation' },

  // ── Domain 7: DevOps & Infrastructure (12 skills) ──
  { id: 'cloud-deployment', name: 'Cloud Deployment', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'Deploy to AWS/GCP/Azure' },
  { id: 'containerization', name: 'Containerization', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Docker and container orchestration' },
  { id: 'kubernetes', name: 'Kubernetes Management', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'K8s cluster management' },
  { id: 'infrastructure-as-code', name: 'Infrastructure as Code', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'Terraform/Pulumi/CDK' },
  { id: 'monitoring-setup', name: 'Monitoring Setup', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'APM and alerting configuration' },
  { id: 'backup-recovery', name: 'Backup & Recovery', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'Backup strategies and disaster recovery' },
  { id: 'ssl-certificates', name: 'SSL/TLS Certificates', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Certificate management' },
  { id: 'dns-management', name: 'DNS Management', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'DNS configuration and routing' },
  { id: 'cdn-setup', name: 'CDN Setup', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Content delivery network' },
  { id: 'scaling-strategy', name: 'Auto-Scaling', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Horizontal/vertical scaling' },
  { id: 'secret-management', name: 'Secret Management', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'Vault/secrets management' },
  { id: 'network-security', name: 'Network Security', domain: 'devops', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'Firewall and VPN configuration' },

  // ── Domain 8: Data & Analytics (11 skills) ──
  { id: 'data-modeling', name: 'Data Modeling', domain: 'data', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Data schema and relationships' },
  { id: 'data-visualization', name: 'Data Visualization', domain: 'data', requiredPhase: 'BUILD', riskLevel: 'R0', description: 'Charts, dashboards, reports' },
  { id: 'ml-model-training', name: 'ML Model Training', domain: 'data', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Train machine learning models' },
  { id: 'ab-testing', name: 'A/B Testing', domain: 'data', requiredPhase: 'REVIEW', riskLevel: 'R1', description: 'Experiment design and analysis' },
  { id: 'analytics-setup', name: 'Analytics Setup', domain: 'data', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Tracking and analytics implementation' },
  { id: 'data-migration', name: 'Data Migration', domain: 'data', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'Migrate data between systems' },
  { id: 'reporting', name: 'Report Generation', domain: 'data', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'Automated reporting and dashboards' },
  { id: 'data-cleaning', name: 'Data Cleaning', domain: 'data', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Data quality and cleansing' },
  { id: 'predictive-analytics', name: 'Predictive Analytics', domain: 'data', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Forecasting and prediction models' },
  { id: 'nlp-processing', name: 'NLP Processing', domain: 'data', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Natural language processing tasks' },
  { id: 'recommendation-engine', name: 'Recommendation Engine', domain: 'data', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Personalized recommendations' },

  // ── Domain 9: Project Management (10 skills) ──
  { id: 'project-kickoff', name: 'Project Kickoff', domain: 'pm', requiredPhase: 'INTAKE', riskLevel: 'R0', description: 'Project initiation and kickoff' },
  { id: 'sprint-planning', name: 'Sprint Planning', domain: 'pm', requiredPhase: 'DESIGN', riskLevel: 'R0', description: 'Agile sprint planning' },
  { id: 'task-breakdown', name: 'Task Breakdown', domain: 'pm', requiredPhase: 'DESIGN', riskLevel: 'R0', description: 'Work breakdown structure' },
  { id: 'progress-tracking', name: 'Progress Tracking', domain: 'pm', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'Track project progress and velocity' },
  { id: 'retrospective', name: 'Retrospective', domain: 'pm', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'Team retrospective and improvements' },
  { id: 'status-report', name: 'Status Report', domain: 'pm', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'Project status documentation' },
  { id: 'requirement-gathering', name: 'Requirement Gathering', domain: 'pm', requiredPhase: 'INTAKE', riskLevel: 'R0', description: 'Elicit and document requirements' },
  { id: 'scope-management', name: 'Scope Management', domain: 'pm', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Define and control project scope' },
  { id: 'risk-management', name: 'Risk Management', domain: 'pm', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Risk identification and mitigation' },
  { id: 'stakeholder-communication', name: 'Stakeholder Communication', domain: 'pm', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'Stakeholder updates and alignment' },

  // ── Domain 10: Documentation (10 skills) ──
  { id: 'api-documentation', name: 'API Documentation', domain: 'docs', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'OpenAPI/Swagger docs' },
  { id: 'user-guide', name: 'User Guide', domain: 'docs', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'End-user documentation' },
  { id: 'technical-docs', name: 'Technical Documentation', domain: 'docs', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'Developer guides and references' },
  { id: 'architecture-docs', name: 'Architecture Docs', domain: 'docs', requiredPhase: 'DESIGN', riskLevel: 'R0', description: 'Architecture decision records' },
  { id: 'runbook', name: 'Runbook', domain: 'docs', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'Operational runbooks' },
  { id: 'changelog', name: 'Changelog', domain: 'docs', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'Release notes and changelogs' },
  { id: 'onboarding-guide', name: 'Onboarding Guide', domain: 'docs', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'New team member onboarding' },
  { id: 'compliance-docs', name: 'Compliance Documentation', domain: 'docs', requiredPhase: 'REVIEW', riskLevel: 'R1', description: 'Compliance and regulatory docs' },
  { id: 'sla-definition', name: 'SLA Definition', domain: 'docs', requiredPhase: 'DESIGN', riskLevel: 'R1', description: 'Service level agreements' },
  { id: 'knowledge-base', name: 'Knowledge Base', domain: 'docs', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'FAQ and knowledge articles' },

  // ── Domain 11: Security & Compliance (10 skills) ──
  { id: 'threat-modeling', name: 'Threat Modeling', domain: 'security', requiredPhase: 'DESIGN', riskLevel: 'R2', description: 'STRIDE/DREAD threat analysis' },
  { id: 'vulnerability-scan', name: 'Vulnerability Scanning', domain: 'security', requiredPhase: 'REVIEW', riskLevel: 'R2', description: 'Automated security scanning' },
  { id: 'penetration-testing', name: 'Penetration Testing', domain: 'security', requiredPhase: 'REVIEW', riskLevel: 'R3', description: 'Simulated attack testing' },
  { id: 'access-control', name: 'Access Control Design', domain: 'security', requiredPhase: 'DESIGN', riskLevel: 'R3', description: 'RBAC/ABAC implementation' },
  { id: 'incident-response', name: 'Incident Response Plan', domain: 'security', requiredPhase: 'DESIGN', riskLevel: 'R2', description: 'Security incident procedures' },
  { id: 'gdpr-compliance', name: 'GDPR Compliance', domain: 'security', requiredPhase: 'REVIEW', riskLevel: 'R2', description: 'Data privacy compliance' },
  { id: 'soc2-audit', name: 'SOC2 Audit Prep', domain: 'security', requiredPhase: 'REVIEW', riskLevel: 'R2', description: 'SOC2 certification preparation' },
  { id: 'encryption-setup', name: 'Encryption Setup', domain: 'security', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'Data encryption at rest and in transit' },
  { id: 'security-training', name: 'Security Training', domain: 'security', requiredPhase: 'REVIEW', riskLevel: 'R0', description: 'Security awareness training' },
  { id: 'audit-logging', name: 'Audit Logging', domain: 'security', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Security event logging and SIEM' },

  // ── Domain 12: AI & Automation (10 skills) ──
  { id: 'prompt-engineering', name: 'Prompt Engineering', domain: 'ai', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Design effective AI prompts' },
  { id: 'agent-design', name: 'Agent Design', domain: 'ai', requiredPhase: 'DESIGN', riskLevel: 'R2', description: 'Design AI agent architectures' },
  { id: 'rag-implementation', name: 'RAG Implementation', domain: 'ai', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Retrieval-augmented generation' },
  { id: 'fine-tuning', name: 'Model Fine-Tuning', domain: 'ai', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Fine-tune LLMs for specific tasks' },
  { id: 'chatbot-development', name: 'Chatbot Development', domain: 'ai', requiredPhase: 'BUILD', riskLevel: 'R1', description: 'Conversational AI development' },
  { id: 'workflow-automation', name: 'Workflow Automation', domain: 'ai', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Business process automation' },
  { id: 'evaluation-framework', name: 'AI Evaluation', domain: 'ai', requiredPhase: 'REVIEW', riskLevel: 'R1', description: 'AI model evaluation and benchmarking' },
  { id: 'guardrails-setup', name: 'AI Guardrails', domain: 'ai', requiredPhase: 'BUILD', riskLevel: 'R3', description: 'Safety and content filters' },
  { id: 'multimodal-ai', name: 'Multimodal AI', domain: 'ai', requiredPhase: 'BUILD', riskLevel: 'R2', description: 'Image, video, audio AI processing' },
  { id: 'ai-ethics-review', name: 'AI Ethics Review', domain: 'ai', requiredPhase: 'REVIEW', riskLevel: 'R2', description: 'Bias detection and ethical review' },
];

// ─── Factory ─────────────────────────────────────────────────────────

/**
 * Create a SkillRegistry with all 141 CVF skills.
 * Each skill has phase/risk metadata for guard enforcement.
 */
export function createFullSkillRegistry(): SkillRegistry {
  const registry = new SkillRegistry();
  for (const skill of FULL_SKILLS) {
    registry.register(skill);
  }
  return registry;
}

/**
 * Get all skills (for export/listing).
 */
export function getAllSkills(): readonly SkillDefinition[] {
  return FULL_SKILLS;
}

/**
 * Get skills by domain.
 */
export function getSkillsByDomain(domain: string): SkillDefinition[] {
  return FULL_SKILLS.filter(s => s.domain === domain);
}

/**
 * Get all unique domains.
 */
export function getAllDomains(): string[] {
  return [...new Set(FULL_SKILLS.map(s => s.domain))];
}

export { FULL_SKILLS };
