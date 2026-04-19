'use client';

import { useLanguage } from '@/lib/i18n';

export function AdminSettingsHeader() {
  const { language } = useLanguage();
  const vi = language === 'vi';

  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {vi ? 'Tích hợp bảo mật và nhật ký' : 'Security integrations and logging'}
      </div>
      <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
        {vi ? 'Bảo mật & SIEM' : 'Security & SIEM'}
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {vi
          ? 'Kết nối hệ thống giám sát, chọn loại sự kiện cần gửi đi và quản lý cấu hình bảo mật cho không gian quản trị.'
          : 'Connect your monitoring stack, choose which events to forward, and manage security settings for the admin workspace.'}
      </p>
    </div>
  );
}
