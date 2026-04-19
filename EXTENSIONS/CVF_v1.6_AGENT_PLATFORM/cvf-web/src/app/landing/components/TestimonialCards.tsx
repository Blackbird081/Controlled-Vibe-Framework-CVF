type Card = {
  quote: { vi: string; en: string };
  name: string;
  role: { vi: string; en: string };
  initials: string;
  bg: string;
  avatarBg: string;
};

const CARDS: Card[] = [
  {
    quote: {
      vi: 'VibCode giúp tôi ra mắt landing page trong 1 ngày mà không cần thuê developer. Unbelievable!',
      en: 'VibCode helped me launch a landing page in 1 day without hiring a developer. Unbelievable!',
    },
    name: 'Minh Tuấn',
    role: { vi: 'Chủ nhà hàng, Hà Nội', en: 'Restaurant Owner, Hanoi' },
    initials: 'MT',
    bg: 'bg-[#d1fae5]',
    avatarBg: 'bg-emerald-500',
  },
  {
    quote: {
      vi: 'Tôi đã thử nhiều công cụ AI nhưng CVF governance của VibCode khiến tôi tin tưởng hơn hẳn.',
      en: "I've tried many AI tools but VibCode's CVF governance made me trust it far more than the rest.",
    },
    name: 'Lan Hương',
    role: { vi: 'Product Manager, HCM', en: 'Product Manager, HCMC' },
    initials: 'LH',
    bg: 'bg-[#e0f2fe]',
    avatarBg: 'bg-sky-500',
  },
  {
    quote: {
      vi: 'Wizard 8 bước cực kỳ trực quan. Tôi build được spec app hoàn chỉnh chỉ trong 30 phút.',
      en: 'The 8-step wizard is incredibly intuitive. I built a complete app spec in just 30 minutes.',
    },
    name: 'Phúc Thịnh',
    role: { vi: 'Startup Founder, Đà Nẵng', en: 'Startup Founder, Da Nang' },
    initials: 'PT',
    bg: 'bg-[#fce7f3]',
    avatarBg: 'bg-pink-500',
  },
];

export default function TestimonialCards({ lang }: { lang: 'vi' | 'en' }) {
  return (
    <section className="bg-white py-16 dark:bg-gray-900/30 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="mb-10 text-center text-2xl font-extrabold font-serif-display md:text-3xl">
          {lang === 'vi' ? 'Họ đã thay đổi cách làm việc' : 'They transformed the way they work'}
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {CARDS.map((c, i) => (
            <div key={i} className={`rounded-2xl ${c.bg} p-6 dark:opacity-90`}>
              <p className="mb-5 font-serif-display text-base italic leading-relaxed text-gray-800">
                &ldquo;{lang === 'vi' ? c.quote.vi : c.quote.en}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${c.avatarBg} text-xs font-bold text-white`}>
                  {c.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-600">{lang === 'vi' ? c.role.vi : c.role.en}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          {lang === 'vi' ? '* Nội dung minh họa — không đại diện người dùng thực' : '* Illustrative testimonials — not representing real users'}
        </p>
      </div>
    </section>
  );
}
