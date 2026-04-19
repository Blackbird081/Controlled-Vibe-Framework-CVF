'use client';

import { useLanguage } from '@/lib/i18n';

export function AdminDLPHeader() {
  const { language } = useLanguage();
  const vi = language === 'vi';

  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {vi ? 'Giai đoạn D1 • An toàn đầu ra' : 'Phase D1 • Egress Safety'}
      </div>
      <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
        {vi ? 'Kiểm soát DLP' : 'DLP Controls'}
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {vi
          ? 'Ẩn dữ liệu nhạy cảm trước khi prompt rời khỏi luồng thực thi. Cài đặt mặc định luôn bật, quy tắc regex tuỳ chỉnh là sự kiện chính sách chỉ-thêm.'
          : 'Redact sensitive data before prompts leave the execute path. Presets are always on, custom regex rules are append-only policy events.'}
      </p>
    </div>
  );
}
