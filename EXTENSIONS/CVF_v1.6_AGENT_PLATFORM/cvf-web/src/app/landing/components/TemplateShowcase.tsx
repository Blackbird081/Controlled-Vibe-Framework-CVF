import Link from 'next/link';

const TEMPLATES = [
  {
    icon: '🍽️',
    title: { vi: 'App Đặt Bàn Nhà Hàng', en: 'Restaurant Booking App' },
    desc: { vi: 'Form đặt bàn, quản lý lịch, email xác nhận tự động.', en: 'Booking form, schedule management, auto email confirmation.' },
    gradient: 'from-rose-100 to-orange-50',
    dot: 'bg-rose-400',
  },
  {
    icon: '📦',
    title: { vi: 'CRM Quản Lý Đơn Hàng', en: 'Order Management CRM' },
    desc: { vi: 'Theo dõi đơn hàng, khách hàng và báo cáo doanh thu.', en: 'Track orders, customers and revenue reports.' },
    gradient: 'from-blue-100 to-indigo-50',
    dot: 'bg-blue-400',
  },
  {
    icon: '🚀',
    title: { vi: 'Landing Page Builder', en: 'Landing Page Builder' },
    desc: { vi: 'Trang giới thiệu sản phẩm + form liên hệ chuyên nghiệp.', en: 'Product showcase page + professional contact form.' },
    gradient: 'from-violet-100 to-purple-50',
    dot: 'bg-violet-400',
  },
  {
    icon: '📊',
    title: { vi: 'Báo Cáo Phân Tích AI', en: 'AI Analytics Report' },
    desc: { vi: 'Dashboard dữ liệu kinh doanh thông minh, xuất PDF ngay.', en: 'Smart business data dashboard, export to PDF instantly.' },
    gradient: 'from-emerald-100 to-teal-50',
    dot: 'bg-emerald-400',
  },
];

export default function TemplateShowcase({ lang }: { lang: 'vi' | 'en' }) {
  return (
    <section className="border-y border-gray-100 py-16 dark:border-gray-800 md:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold font-serif-display md:text-4xl">
            {lang === 'vi' ? 'Không chỉ là mockup. Là phần mềm thật.' : 'Not just a mockup. Real software.'}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-gray-600 dark:text-gray-400">
            {lang === 'vi'
              ? '20+ template sẵn sàng — chọn và tùy chỉnh theo nhu cầu của bạn.'
              : '20+ ready-made templates — pick and customize to your needs.'}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((tpl, i) => (
            <Link
              key={i}
              href="/login"
              className="group rounded-2xl border border-gray-200/60 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-gray-700/60 dark:bg-gray-900"
            >
              <div className={`mb-4 flex h-24 items-center justify-center rounded-xl bg-gradient-to-br ${tpl.gradient} text-4xl dark:opacity-80`}>
                {tpl.icon}
              </div>
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${tpl.dot}`} />
                <h3 className="font-serif-display text-sm font-bold leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {lang === 'vi' ? tpl.title.vi : tpl.title.en}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                {lang === 'vi' ? tpl.desc.vi : tpl.desc.en}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-6 py-2.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
          >
            {lang === 'vi' ? 'Xem tất cả templates →' : 'Browse all templates →'}
          </Link>
        </div>
      </div>
    </section>
  );
}
