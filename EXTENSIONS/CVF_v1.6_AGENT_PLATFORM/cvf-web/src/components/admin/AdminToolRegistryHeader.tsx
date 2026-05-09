'use client';

import { useLanguage } from '@/lib/i18n';

export function AdminToolRegistryHeader() {
  const { language } = useLanguage();
  const vi = language === 'vi';

  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {vi ? 'Quyền truy cập công cụ và phạm vi dữ liệu' : 'Tool access and knowledge scope'}
      </div>
      <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
        {vi ? 'Quản lý công cụ cho workspace' : 'Manage workspace tools'}
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {vi
          ? 'Chọn vai trò nào được dùng từng công cụ, đồng thời giới hạn bộ dữ liệu nào được phép tham gia vào câu trả lời AI.'
          : 'Decide which roles can use each tool and which knowledge collections may contribute context to AI responses.'}
      </p>
    </div>
  );
}
