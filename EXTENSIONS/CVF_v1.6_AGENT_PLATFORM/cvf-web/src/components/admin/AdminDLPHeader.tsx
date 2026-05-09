'use client';

import { useLanguage } from '@/lib/i18n';

export function AdminDLPHeader() {
  const { language } = useLanguage();
  const vi = language === 'vi';

  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {vi ? 'Bảo vệ dữ liệu trước khi gửi cho AI' : 'Protect data before it reaches AI'}
      </div>
      <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
        {vi ? 'Bảo vệ dữ liệu đầu ra' : 'Data protection controls'}
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {vi
          ? 'Che các dữ liệu nhạy cảm trước khi nội dung rời workspace. Mẫu mặc định luôn bật, còn quy tắc tùy chỉnh giúp bạn siết chặt thêm cho từng tổ chức.'
          : 'Mask sensitive data before content leaves the workspace. Built-in presets always stay on, while custom rules let you tighten protection for your organization.'}
      </p>
    </div>
  );
}
