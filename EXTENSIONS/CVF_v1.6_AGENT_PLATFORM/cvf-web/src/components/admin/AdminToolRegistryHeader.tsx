'use client';

import { useLanguage } from '@/lib/i18n';

export function AdminToolRegistryHeader() {
  const { language } = useLanguage();
  const vi = language === 'vi';

  return (
    <div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {vi ? 'Giai đoạn D • Chính sách runtime + phân vùng kiến thức' : 'Phase D • Runtime policy + knowledge partitioning'}
      </div>
      <h2 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
        {vi ? 'Kiểm soát đăng ký công cụ' : 'Tool Registry Controls'}
      </h2>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        {vi
          ? 'Kho công cụ động với ghi đè chính sách theo vai trò và phân vùng bộ sưu tập kiến thức, lưu trữ qua cửa hàng control-plane chỉ-thêm.'
          : 'Dynamic tool inventory with role policy overrides and knowledge collection scoping persisted through the append-only control-plane store.'}
      </p>
    </div>
  );
}
