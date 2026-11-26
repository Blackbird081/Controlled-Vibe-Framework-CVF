'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

export default function ComplianceReportPage() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="inline-flex min-h-11 items-center text-sm text-blue-700 hover:underline dark:text-blue-300">
          {t('nav.home')}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
          {t('complianceReport.title')}
        </h1>
        <p className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
          {t('complianceReport.noData')}
        </p>
      </div>
    </main>
  );
}
