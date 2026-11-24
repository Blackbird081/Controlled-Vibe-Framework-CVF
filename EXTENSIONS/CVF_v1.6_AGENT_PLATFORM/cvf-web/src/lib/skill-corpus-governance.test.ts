import { describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import path from 'node:path';
import { runInNewContext } from 'node:vm';

// CommonJS script consumed by both build-time and app-time surfaces.
// Keep the test close to runtime code, but load the exact generator module.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadSkillCorpusGovernance } = require('../../scripts/skill-corpus-governance');

function loadSkillIndex() {
  const raw = readFileSync(path.resolve(__dirname, '../../public/data/skills-index.json'), 'utf8');
  return JSON.parse(raw) as {
    archiveCategories?: unknown;
    meta?: {
      assfProjectedSkills?: number;
      certifiedPackageProjections?: number;
    };
    categories: Array<{
      id: string;
      skills: Array<{
        id: string;
        frontDoorVisible?: boolean;
        assfProjectionClass?: string;
        linkedTemplates?: Array<{
          templateId: string;
          corpusClass: string;
        }>;
      }>;
    }>;
  };
}

describe('skill corpus governance', () => {
  it('counts quarantined sources without opening their content or inspecting per-skill UAT', () => {
    const webRoot = path.resolve(__dirname, '../..');
    const scriptsDir = path.join(webRoot, 'scripts');
    const scriptPath = path.join(scriptsDir, 'build-skill-index.js');
    const scriptRequire = createRequire(scriptPath);
    const skillsRoot = path.resolve(webRoot, '../../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS');
    const uatRoot = path.resolve(webRoot, '../../../governance/skill-library/uat/results');
    const category = path.join(skillsRoot, 'fixture');
    const skillFiles = ['visible', 'quarantined', 'unclassified'].map(id => `${id}.skill.md`);
    const filesystem = {
      existsSync: vi.fn((file: string) => file === skillsRoot || path.dirname(file) === uatRoot),
      readdirSync: (folder: string) => folder === skillsRoot
        ? [{ name: 'fixture', isDirectory: () => true }]
        : skillFiles,
      readFileSync: vi.fn((file: string) => path.dirname(file) === category ? '# Test fixture' : ''),
      mkdirSync: vi.fn(),
      writeFileSync: vi.fn(),
    };
    const governance = {
      classes: { UNSCREENED: 'UNSCREENED_LEGACY' },
      skillMap: new Map([
        ['fixture::visible', { frontDoorVisible: true }],
        ['fixture::quarantined', { frontDoorVisible: false }],
      ]),
      summary: {},
      sourcePaths: [],
    };
    const writeRoster = vi.fn();
    const index = runInNewContext(readFileSync(scriptPath, 'utf8') + '\n;indexPayload', {
      __dirname: scriptsDir,
      require(specifier: string) {
        if (specifier === 'fs') return filesystem;
        if (specifier === './build-jev-assf-roster') return { writeJevAssfRoster: writeRoster };
        if (specifier === './skill-corpus-governance') return { loadSkillCorpusGovernance: () => governance };
        return scriptRequire(specifier);
      },
      console: { log: vi.fn() },
    });

    expect(writeRoster).toHaveBeenCalledWith(
      path.resolve(webRoot, '../../..'), [], path.join(webRoot, 'src/lib/server/jev-web-assf-roster.json'),
    );
    expect(filesystem.readFileSync.mock.calls.map(([file]) => file)).toEqual([
      path.join(category, 'visible.skill.md'),
      path.join(uatRoot, 'UAT-visible.md'),
    ]);
    expect(filesystem.existsSync.mock.calls.filter(([file]) => path.dirname(file) === uatRoot)).toEqual([
      [path.join(uatRoot, 'UAT-visible.md')],
    ]);
    expect(index.meta).toMatchObject({ totalScannedSkills: 3, quarantinedSkills: 2, frontDoorSkills: 1 });
    expect(index.categories[0].skills.map((skill: { id: string }) => skill.id)).toEqual(['visible']);
  });

  it('regenerates the Web suggestion roster from real certified sources', () => {
    const web = path.resolve(__dirname, '../..');
    const repo = path.resolve(web, '../../..');
    const localIndex = path.join(repo, 'docs/reference/agent_system_skills/generated/skill-index.json');
    const entries = JSON.parse(readFileSync(localIndex, 'utf8')).skills;
    const load = createRequire(path.join(web, 'scripts/build-skill-index.js'));
    const { writeJevAssfRoster } = load('./build-jev-assf-roster');
    const directory = mkdtempSync(path.join(tmpdir(), 'cvf-assf-web-test-'));
    try {
      const output = path.join(directory, 'roster.json');
      expect(() => writeJevAssfRoster(repo, [], output)).toThrow('distinct active certified Local packages');
      writeJevAssfRoster(repo, entries, output);
      const checkedIn = path.join(web, 'src/lib/server/jev-web-assf-roster.json');
      expect(JSON.parse(readFileSync(output, 'utf8'))).toEqual(JSON.parse(readFileSync(checkedIn, 'utf8')));
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('keeps the frozen benchmark subset aligned to the 9 trusted wizards only', () => {
    const governance = loadSkillCorpusGovernance();

    expect(governance.trustedBenchmarkSet.has('api_design')).toBe(false);
    expect(governance.trustedBenchmarkSet.has('app_builder_wizard')).toBe(true);
    expect(governance.trustedBenchmarkSet.size).toBe(9);
  });

  it('does not publish the 24 retired and two merged legacy skills', () => {
    const retired = [
      'ai_ml_evaluation/01_model_selection',
      'app_development/01_app_requirements_spec', 'app_development/03_architecture_design',
      'app_development/05_api_design_spec', 'app_development/07_project_init_checklist',
      'business_analysis/01_strategy_analysis', 'business_analysis/02_risk_assessment',
      'business_analysis/03_market_research', 'business_analysis/04_business_plan',
      'content_creation/01_documentation', 'content_creation/02_report_writing',
      'marketing_seo/01_seo_audit', 'marketing_seo/03_content_quality_review',
      'marketing_seo/04_social_media_review', 'marketing_seo/05_brand_strategy_review',
      'product_ux/01_user_persona_development', 'product_ux/02_user_flow_analysis',
      'product_ux/03_ux_heuristic_evaluation', 'product_ux/04_accessibility_audit',
      'product_ux/05_onboarding_experience_review', 'product_ux/cvf_web_ux_redesign_system',
      'security_compliance/01_security_assessment', 'security_compliance/02_data_privacy_compliance',
      'security_compliance/03_incident_response', 'technical_review/01_code_review',
      'technical_review/02_architecture_review',
    ];
    const published = new Set(loadSkillIndex().categories.flatMap(category =>
      category.skills.map(skill => `${category.id}/${skill.id}`)));
    expect(retired).toHaveLength(26);
    expect(retired.filter(id => published.has(id))).toEqual([]);
  });

  it('keeps the legacy finance candidate out of the Web index during certification', () => {
    const governance = loadSkillCorpusGovernance();
    const finance = loadSkillIndex().categories.find(category => category.id === 'finance_analytics');

    expect(governance.skillMap.get('finance_analytics::01_finance_analysis_system')).toBeUndefined();
    expect(finance?.skills.some(skill => skill.id === '01_finance_analysis_system') ?? false).toBe(false);
  });

  it('keeps the strict front door fully trusted after wave 2 closeout', () => {
    const governance = loadSkillCorpusGovernance();
    const skillIndex = loadSkillIndex();
    const linkedTemplates = skillIndex.categories
      .flatMap((category) => category.skills)
      .flatMap((skill) => skill.linkedTemplates ?? []);

    expect(governance.templateClassMap.api_design).toBe('TRUSTED_FOR_VALUE_PROOF');
    expect(governance.templateClassMap.app_builder_complete).toBe('TRUSTED_FOR_VALUE_PROOF');
    expect(governance.templateClassMap.web_ux_redesign_system).toBe('TRUSTED_FOR_VALUE_PROOF');
    expect(linkedTemplates.some((item) => item.templateId === 'architecture_review')).toBe(false);
    expect(linkedTemplates.every((item) => item.corpusClass === 'TRUSTED_FOR_VALUE_PROOF')).toBe(true);
    expect(linkedTemplates.some((item) => item.corpusClass === 'REVIEW_REQUIRED')).toBe(false);
    expect(linkedTemplates.some((item) => item.corpusClass === 'LEGACY_LOW_CONFIDENCE')).toBe(false);
    expect(linkedTemplates.some((item) => item.corpusClass === 'REJECT_FOR_NON_CODER_FRONTDOOR')).toBe(false);
    expect(linkedTemplates.some((item) => item.corpusClass === 'UNSCREENED_LEGACY')).toBe(false);
  });

  it('publishes only agent-ready public skills and does not expose archive categories', () => {
    const skillIndex = loadSkillIndex();
    const publicSkills = skillIndex.categories.flatMap((category) => category.skills);

    expect(skillIndex.archiveCategories).toBeUndefined();
    expect(publicSkills.length).toBeGreaterThan(0);
    publicSkills.forEach((skill) => {
      expect(skill.frontDoorVisible).toBe(true);
      if (skill.assfProjectionClass === 'CERTIFIED_PACKAGE_PROJECTION') {
        expect(skill.linkedTemplates?.length ?? 0).toBe(0);
      } else {
        expect(skill.linkedTemplates?.length ?? 0).toBeGreaterThan(0);
        expect(skill.linkedTemplates?.every((item) => item.corpusClass === 'TRUSTED_FOR_VALUE_PROOF')).toBe(true);
      }
    });
  });

  it('publishes certified ASSF package projections without using corpusClass as certification state', () => {
    const skillIndex = loadSkillIndex();
    const publicSkills = skillIndex.categories.flatMap((category) => category.skills);
    const assfSkill = publicSkills.find((skill) => skill.assfProjectionClass === 'CERTIFIED_PACKAGE_PROJECTION');

    expect(skillIndex.meta?.assfProjectedSkills).toBeGreaterThan(0);
    expect(skillIndex.meta?.certifiedPackageProjections).toBeGreaterThan(0);
    expect(assfSkill).toBeDefined();
    expect(assfSkill?.assfProjectionClass).toBe('CERTIFIED_PACKAGE_PROJECTION');
  });
});
