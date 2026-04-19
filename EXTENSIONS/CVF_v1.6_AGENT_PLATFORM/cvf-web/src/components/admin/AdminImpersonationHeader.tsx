'use client';

import { useLanguage } from '@/lib/i18n';

export function AdminImpersonationHeader() {
  const { language } = useLanguage();
  const vi = language === 'vi';

  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {vi ? 'Phiên xem thử theo vai trò người dùng' : 'Preview the product as another user'}
      </div>
      <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
        {vi ? 'Xem như người dùng' : 'View as user'}
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {vi
          ? 'Dùng công cụ hỗ trợ này để tái hiện trải nghiệm của người dùng mà không làm thay đổi phiên đăng nhập quản trị hiện tại.'
          : 'Use this support tool to reproduce a user experience without mutating the active admin session.'}
      </p>
    </div>
  );
}
