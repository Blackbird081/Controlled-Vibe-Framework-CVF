const AVATARS = [
  { bg: 'from-indigo-400 to-violet-400', initials: 'TN' },
  { bg: 'from-emerald-400 to-teal-400',  initials: 'LH' },
  { bg: 'from-rose-400 to-pink-400',     initials: 'MK' },
  { bg: 'from-amber-400 to-orange-400',  initials: 'PT' },
];

const BRANDS = ['Haravan', 'Tiki Labs', 'Topica', 'VNG', 'Got It'];

export default function SocialProof({ lang }: { lang: 'vi' | 'en' }) {
  return (
    <section className="border-b border-gray-100 bg-white py-8 dark:border-gray-800 dark:bg-gray-900/30">
      <div className="mx-auto max-w-5xl px-6 text-center">
        {/* Avatar strip + trust line */}
        <div className="mb-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <div className="flex -space-x-2">
            {AVATARS.map((a, i) => (
              <div
                key={i}
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${a.bg} text-xs font-bold text-white ring-2 ring-white dark:ring-gray-900`}
              >
                {a.initials}
              </div>
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {lang === 'vi'
              ? '12,000+ nhà sáng lập không-code đang dùng Vibe Coding'
              : '12,000+ no-code founders are using Vibe Coding'}
          </p>
        </div>

        {/* Brand logos */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
          {lang === 'vi' ? 'Được tin dùng bởi' : 'Trusted by teams at'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {BRANDS.map(b => (
            <span
              key={b}
              className="text-sm font-bold text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
