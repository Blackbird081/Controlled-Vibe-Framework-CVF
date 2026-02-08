'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SkillDetailView } from '@/components/SkillDetailView';
import { Skill, SkillCategory } from '@/types/skill';

type SkillIndexPayload = SkillCategory[] | { categories?: SkillCategory[] };

export default function SkillDetailPage() {
    const params = useParams();
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
                const payload = await response.json() as SkillIndexPayload;
                const categories = Array.isArray(payload) ? payload : (payload.categories ?? []);
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

        load();
        return () => {
            active = false;
        };
    }, [domain, skillId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (notFound || !skill) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
                    <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">
                            ← Back to CVF
                        </Link>
                    </div>
                </header>
                <main className="max-w-5xl mx-auto px-4 py-20 text-center text-gray-500">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Skill not found</h1>
                    <p className="text-sm">The skill you are looking for is not available in the current build.</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">
                        ← Back to CVF
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6">
                <SkillDetailView skill={skill} />
            </main>
        </div>
    );
}
