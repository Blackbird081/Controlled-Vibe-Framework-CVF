'use client';
// Text Encoding Exception: this user-facing Vietnamese navigation copy follows the existing Skills UI language.

import Link from 'next/link';
import { SkillLibrary } from '@/components/SkillLibrary';
import { useLanguage } from '@/lib/i18n';

export default function SkillsPage() {
    const { language } = useLanguage();
    const vi = language === 'vi';

    return (
        <section aria-labelledby="skills-page-title" className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
            <header>
                <h1 id="skills-page-title" className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[2rem]">
                    {vi ? 'Bạn muốn làm việc gì?' : 'What do you want to do?'}
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {vi ? 'Chọn một kỹ năng để xem cách làm.' : 'Choose a skill to see how to do it.'}
                </p>
            </header>
            <SkillLibrary />
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <Link href="/marketplace" className="rounded font-medium text-slate-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-slate-300">
                    {vi ? 'Xem kho mẫu bổ sung' : 'Browse additional templates'}
                </Link>
            </div>
        </section>
    );
}
