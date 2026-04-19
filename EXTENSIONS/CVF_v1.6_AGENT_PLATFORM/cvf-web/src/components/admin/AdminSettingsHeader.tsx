'use client';

import { useLanguage } from '@/lib/i18n';

export function AdminSettingsHeader() {
  const { language } = useLanguage();
  const vi = language === 'vi';

  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {vi ? 'Giai đoạn D2 • Tăng cường bảo mật Enterprise' : 'Phase D2 • Enterprise Hardening'}
      </div>
      <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
        {vi ? 'Cài đặt' : 'Settings'}
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {vi
          ? 'Cấu hình phân phối kiểm toán đầu ra và các kiểm soát bảo mật Enterprise cho bảng điều khiển quản trị.'
          : 'Configure outbound audit delivery and enterprise hardening controls for the admin console.'}
      </p>
    </div>
  );
}
