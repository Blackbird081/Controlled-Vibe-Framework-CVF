import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSkillDetail } from '@/actions/skills';
import { SkillDetailView } from '@/components/SkillDetailView';

export const dynamic = 'force-dynamic';

type PageProps = {
    params: Promise<{
        domain: string;
        skill: string;
    }>;
};

export default async function SkillDetailPage({ params }: PageProps) {
    const { domain, skill: skillId } = await params;
    const skill = await getSkillDetail(domain, skillId);
    if (!skill) {
        notFound();
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
