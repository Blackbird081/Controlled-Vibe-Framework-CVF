import templateAssfPackMap from '@/data/template-assf-pack-map.json';

export const ASSF_PACKAGE_CATEGORY = 'agent_system_skills';
export function isAssfPackageId(value: unknown): value is string {
    return typeof value === 'string' && /^cvf-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export const templateAssfPackageIds: Readonly<Record<string, string | null>> = templateAssfPackMap;

export function getRecommendedAssfPackage(templateId: string) {
    const skillId = Object.hasOwn(templateAssfPackageIds, templateId) ? templateAssfPackageIds[templateId] : null;
    return skillId ? { skillId, href: `/skills/${ASSF_PACKAGE_CATEGORY}/${skillId}` } : null;
}

export function getTemplatesForAssfPackage(skillId: string): string[] {
    return Object.entries(templateAssfPackageIds)
        .filter(([, packageId]) => packageId === skillId)
        .map(([templateId]) => templateId);
}
