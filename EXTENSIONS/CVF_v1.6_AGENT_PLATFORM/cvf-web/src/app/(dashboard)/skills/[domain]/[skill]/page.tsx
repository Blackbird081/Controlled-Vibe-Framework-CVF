'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SurfaceTopBar } from '@/components';
import { SkillDetailView } from '@/components/SkillDetailView';
import { Skill, SkillCategory, SkillIndexPayload } from '@/types/skill';
import { useLanguage } from '@/lib/i18n';

export default function SkillDetailPage() {
    const params = useParams();
    const { t } = useLanguage();
    const domain = (params?.domain as string | undefined) ?? '';
    const skillId = (params?.skill as string | undefined) ?? '';
    const [skill, setSkill] = useState<Skill | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!domain || !skillId) return;
        let active = true;

        async function load() {
            setLoading(true);
            setNotFound(false);
            try {
                const response = await fetch('/data/skills-index.json', { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error('Failed to load skill index');
                }
                const payload = await response.json() as SkillIndexPayload | SkillCategory[];
                const categories: SkillCategory[] = Array.isArray(payload) ? payload : (payload.categories ?? []);
                const category = categories.find((item) => item.id === domain);
                const found = category?.skills?.find((item) => item.id === skillId) ?? null;
                if (active) {
                    setSkill(found);
                    setNotFound(!found);
                }
            } catch (error) {
                console.error('Failed to load skill detail', error);
                if (active) {
                    setSkill(null);
                    setNotFound(true);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void load();
        return () => {
            active = false;
        };
    }, [domain, skillId]);

    if (loading) {
        return (
            <div className="px-4 py-20">
                <div className="mx-auto flex max-w-5xl justify-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500" />
                </div>
            </div>
        );
    }

    if (notFound || !skill) {
        return (
            <div className="pb-10">
                <SurfaceTopBar
                    title={t('skills.notFound')}
                    subtitle={t('skills.notFoundDesc')}
                    actions={(
                        <Link
                            href="/skills"
                            className="inline-flex items-center rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                        >
                            {t('skills.backToCvf')}
                        </Link>
                    )}
                />
            </div>
        );
    }

    return (
        <div className="pb-10">
            <SurfaceTopBar
                title={skill.title}
                subtitle={`${skill.domain} - ${skill.difficulty}`}
                actions={(
                    <Link
                        href="/skills"
                        className="inline-flex items-center rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/15"
                    >
                        {t('skills.backToCvf')}
                    </Link>
                )}
            />

            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
                <SkillDetailView skill={skill} />
            </div>
        </div>
    );
}
