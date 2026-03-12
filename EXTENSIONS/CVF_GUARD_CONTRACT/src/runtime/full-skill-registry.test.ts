import { describe, it, expect } from 'vitest';
import {
  FULL_SKILLS,
  createFullSkillRegistry,
  getAllDomains,
  getAllSkills,
  getSkillsByDomain,
} from './full-skill-registry';

describe('full-skill-registry', () => {
  it('exposes the full skill list', () => {
    expect(FULL_SKILLS.length).toBe(141);
    expect(getAllSkills()).toBe(FULL_SKILLS);
  });

  it('creates a registry with all skills', () => {
    const registry = createFullSkillRegistry();
    expect(registry.getCount()).toBe(141);
    const sample = registry.get('market-research');
    expect(sample?.name).toBe('Market Research');
  });

  it('filters skills by domain and lists domains', () => {
    const researchSkills = getSkillsByDomain('research');
    expect(researchSkills.length).toBeGreaterThan(0);
    expect(researchSkills.every((skill) => skill.domain === 'research')).toBe(true);

    const domains = getAllDomains();
    expect(domains.length).toBe(12);
    expect(domains).toContain('research');
    expect(domains).toContain('ai');
  });
});
