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
      vi: 'CVF giúp tôi tự làm trang web giới thiệu quán chỉ trong một ngày mà không cần thuê thợ sửa code. Tiết kiệm được bao nhiêu chi phí!',
      en: 'CVF helped me build a website for my restaurant in just one day without hiring a developer. It saved me so much money!',
    },
    name: 'Minh Tuấn',
    role: { vi: 'Restaurant Owner, Hà Nội', en: 'Restaurant Owner, Ha Noi' },
    initials: 'MT',
    bg: 'bg-[#d1fae5]',
    avatarBg: 'bg-emerald-500',
  },
  {
    quote: {
      vi: 'Tôi đã thử nhiều công cụ AI nhưng quy trình quản trị và kiểm soát của CVF khiến tôi tin tưởng hơn hẳn.',
      en: "I’ve tried many AI tools, but CVF’s governance and control processes give me far more confidence.",
    },
    name: 'Lan Hương',
    role: { vi: 'Product Manager, Hồ Chí Minh', en: 'Product Manager, Ho Chi Minh' },
    initials: 'LH',
    bg: 'bg-[#e0f2fe]',
    avatarBg: 'bg-sky-500',
  },
  {
    quote: {
      vi: 'Wizard 8 bước cực kỳ trực quan. Tôi đã hoàn thiện bản mẫu (prototype) đầy đủ tính năng chỉ trong 30 phút. Rất ấn tượng!',
      en: 'The 8-step Wizard is incredibly intuitive. I built a fully functional prototype in just 30 minutes. Impressive!',
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
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-indigo-600">
          {lang === 'vi' ? 'Câu chuyện thực tế' : 'Testimonials'}
        </p>
        <h2 className="mb-3 text-center text-2xl font-extrabold font-serif-display md:text-3xl">
          {lang === 'vi' ? 'Định nghĩa lại cách bạn làm việc với AI.' : 'Redefining your workflow with AI.'}
        </h2>
        <p className="mb-10 mx-auto max-w-2xl text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {lang === 'vi'
            ? 'Trong khi thế giới chạy theo AI tự trị, chúng tôi ưu tiên sự an toàn của bạn. Tại CVF, quản trị là nền tảng — đảm bảo mọi dòng code đều nằm trong tầm kiểm sát của con người.'
            : 'While the world rushes toward autonomous AI, we put your safety first. At CVF, governance is the foundation — ensuring every line of code stays under human oversight.'}
        </p>
        <div className="grid gap-5 sm:grid-cols-3">
          {CARDS.map((c, i) => (
            <div key={i} className={`rounded-2xl ${c.bg} p-6 dark:opacity-90`}>
              {/* Star ratings */}
              <div className="mb-3 flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <svg key={n} width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
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
        <p className="mt-4 text-center text-[10px] text-gray-400 opacity-50">
          {lang === 'vi' ? '* Nội dung minh họa — không đại diện người dùng thực' : '* Illustrative testimonials — not representing real users'}
        </p>
      </div>
    </section>
  );
}
