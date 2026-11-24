'use client';

// Text Encoding Exception: Vietnamese text is required for the localized setup guide.

import Link from 'next/link';
import { SurfaceTopBar } from '@/components';
import setup from '@/data/windows-setup.json';
import { useLanguage } from '@/lib/i18n';

type Resource = keyof typeof setup.links;

const guidance = {
    vi: {
        title: 'Cài CVF trên máy của bạn',
        subtitle: 'Chuẩn bị VS Code và mở CVF Web trên máy Windows.',
        back: 'Quay lại Hướng dẫn',
        needs: 'Bạn cần gì',
        requirements: 'Để mở CVF Web, bạn cần Windows 10 hoặc 11 bản 64 bit, trình duyệt, Node.js 22 (từ 22.12) hoặc Node.js 24, kèm npm và thư mục CVF đã có thư viện. Git giúp bạn lấy và cập nhật CVF. Cài VS Code và Claude Code hoặc Codex khi muốn giao đặc tả cho trợ lý. Docker là tùy chọn.',
        flowTitle: 'CVF Web và trợ lý làm gì?',
        flow: 'Tạo bản đặc tả trên CVF Web rồi giao cho trợ lý trong VS Code. Trợ lý thực hiện và lưu mã trên máy bạn. Xem tiến độ trong trợ lý. CVF Web không theo dõi tiến độ thực thi.',
        confirmation: 'Làm xong, bạn sẽ thấy',
        steps: [
            {
                title: 'Cài VS Code',
                action: 'Tải bản dành cho Windows, cài rồi mở VS Code.',
                result: 'Cửa sổ VS Code mở được và có thanh bên để chọn tiện ích.',
                links: ['vscode'],
            },
            {
                title: 'Cài Claude Code hoặc Codex',
                action: 'Mở mục Tiện ích trong VS Code. Cài một trong hai tiện ích, mở bảng trò chuyện của tiện ích đó và đăng nhập bằng tài khoản của bạn.',
                result: 'Bảng trò chuyện của tiện ích mở được trong VS Code.',
                links: ['claude', 'codex'],
            },
            {
                title: 'Lấy CVF về máy',
                action: 'Cài Git và Node.js nếu còn thiếu. Nếu có đường dẫn kho CVF, nhấn Ctrl+Shift+P trong VS Code, tìm lệnh sao chép kho Git, rồi dán địa chỉ và chọn nơi lưu. Nếu nhận tệp nén, giải nén toàn bộ rồi mở thư mục trong VS Code.',
                result: 'Bạn thấy tệp Start-CVF-Web.cmd ở ngay trong thư mục CVF.',
                links: ['git', 'node', 'source'],
            },
            {
                title: 'Bấm đúp để máy tự kiểm tra',
                action: 'Bấm đúp Start-CVF-Web.cmd trong thư mục CVF. Nếu thiếu thứ cần để Web chạy, cửa sổ sẽ giải thích cách bổ sung.',
                result: 'Cửa sổ báo CVF Web đã sẵn sàng và in đường dẫn nhật ký. Nếu thiếu Git, VS Code hoặc tiện ích trợ lý, cửa sổ in lưu ý sau khi Web đã mở.',
                links: [],
            },
            {
                title: 'Mở CVF Web',
                action: 'Giữ cửa sổ khởi động mở. Nếu trình duyệt chưa tự mở, sao chép địa chỉ được in trong cửa sổ và dán vào trình duyệt.',
                result: 'Lần đầu hoặc sau khi có cập nhật, hãy chờ máy chuẩn bị bản Web. Khi trang đăng nhập hiện ra, chọn GitHub hoặc Google như người thiết lập CVF đã hướng dẫn. Nếu tài khoản của bạn chưa được liên kết, hãy nhờ người quản trị cấp quyền.',
                links: [],
            },
            {
                title: 'Thêm khóa để dùng AI ở Trang chủ',
                action: 'Trong thư mục CVF, bấm đúp Configure-CVF-Web-Keys.cmd và chọn Tiếng Việt. Chọn nhà cung cấp rồi lưu khóa truy cập của bạn. Cửa sổ che khóa khi bạn dán và lưu khóa cho tài khoản Windows của bạn. Mở lại CVF Web sau khi lưu, thay hoặc xóa khóa trong cửa sổ này.',
                result: 'Cửa sổ báo đã lưu khóa cho nhà cung cấp. Dùng AI thật tính phí theo nhà cung cấp. Khi CVF Web đang chạy, chương trình khác dùng cùng tài khoản Windows có thể đọc khóa. Hãy dùng tài khoản Windows riêng.',
                links: [],
            },
            {
                title: 'Cho trợ lý AI giúp viết bản đặc tả',
                action: 'Trong CVF Web, vào Cài đặt, dán khóa API của nhà cung cấp như OpenAI và lưu. Mở Trợ lý AI để nhờ soạn nháp, rồi đưa nội dung vào bản đặc tả. Nhà cung cấp tính phí theo mức sử dụng của bạn.',
                result: 'Cài đặt đã lưu nhà cung cấp và khóa của bạn. Bạn có thể mở Trợ lý AI và chọn mô hình của nhà cung cấp đó.',
                links: [],
            },
        ],
        sample: 'Nếu chỉ muốn thử, chạy Start-CVF-Web.cmd -Demo. Khi máy chưa có tài khoản đăng nhập được liên kết, dùng Start-CVF-Web.cmd -Demo -Dev để thực hành trên máy. CVF Web hiện thông báo “Câu trả lời AI là câu mẫu”.',
        troubleshooting: 'Nếu gặp lỗi',
        findIssue: 'Tìm tên hoặc mã xuất hiện trong cửa sổ kiểm tra.',
        advisory: 'Lưu ý',
    },
    en: {
        title: 'Set up CVF on your computer',
        subtitle: 'Set up VS Code and open CVF Web on your Windows computer.',
        back: 'Back to Help',
        needs: 'What you need',
        requirements: 'To open CVF Web, you need 64-bit Windows 10 or 11, a browser, Node.js 22 (22.12 or newer) or Node.js 24 with npm, and a CVF folder with its dependencies. Git downloads and updates CVF. Install VS Code and Claude Code or Codex when you want to hand a specification to the agent. Docker is optional.',
        flowTitle: 'How CVF Web and the agent work together',
        flow: 'Create a specification in CVF Web, then give it to the agent in VS Code. The agent does the work and keeps the code on your computer. Follow progress in the agent. CVF Web does not track execution progress.',
        confirmation: 'When this is done, you will see',
        steps: [
            {
                title: 'Install VS Code',
                action: 'Download VS Code for Windows, install it, and open it.',
                result: 'The VS Code window opens and shows the sidebar where you can find extensions.',
                links: ['vscode'],
            },
            {
                title: 'Install Claude Code or Codex',
                action: 'Open Extensions in VS Code. Install either extension, open its chat panel, and sign in with your account.',
                result: 'The extension chat panel opens in VS Code.',
                links: ['claude', 'codex'],
            },
            {
                title: 'Get CVF on your computer',
                action: 'Install Git and Node.js if needed. If you have a CVF repository address, press Ctrl+Shift+P in VS Code, choose Git: Clone, paste the address, and choose where to save it. If you received a ZIP, extract the whole package and open that folder in VS Code.',
                result: 'Start-CVF-Web-EN.cmd is in the CVF folder.',
                links: ['git', 'node', 'source'],
            },
            {
                title: 'Double-click to check this computer',
                action: 'Double-click Start-CVF-Web-EN.cmd in the CVF folder. If a requirement for opening Web is missing, the window explains what to do.',
                result: 'The window says CVF Web is ready and prints the log path. If Git, VS Code, or the agent extension is missing, a notice appears once Web is ready.',
                links: [],
            },
            {
                title: 'Open CVF Web',
                action: 'Keep the launcher window open. If your browser does not open automatically, copy the address printed in the window into your browser.',
                result: 'On first launch or after an update, wait while your computer prepares the app. When the sign-in page opens, use the GitHub or Google account linked by the person who set up CVF. Ask your administrator for access if your account has not been linked yet.',
                links: [],
            },
            {
                title: 'Add a key to use AI from Home',
                action: 'In the CVF folder, double-click Configure-CVF-Web-Keys.cmd and choose English. Choose the provider and save your key. The window hides the key while you paste it and saves it for your Windows account. Reopen CVF Web after saving, replacing or deleting a key in this window.',
                result: 'The window confirms the provider key is saved. Your provider charges for real AI use. While CVF Web runs, another program using the same Windows account can read the key. Use a separate Windows account.',
                links: [],
            },
            {
                title: 'Get AI help writing a specification',
                action: 'In CVF Web, open Settings, paste an API key from a provider such as OpenAI, and save. Open AI Assistant to get a draft, then add it to your specification. Your provider charges based on use.',
                result: 'Settings show the saved provider and key. You can open AI Assistant and choose a model from that provider.',
                links: [],
            },
        ],
        sample: 'To try sample answers, run Start-CVF-Web-EN.cmd -Demo. On a computer without a linked sign-in account, use Start-CVF-Web-EN.cmd -Demo -Dev for local practice. CVF Web shows “AI answers are samples”.',
        troubleshooting: 'If something goes wrong',
        findIssue: 'Find the message or code you saw in the checker window.',
        advisory: 'Notice',
    },
} satisfies Record<'vi' | 'en', {
    title: string;
    subtitle: string;
    back: string;
    needs: string;
    requirements: string;
    flowTitle: string;
    flow: string;
    confirmation: string;
    steps: { title: string; action: string; result: string; links: Resource[] }[];
    sample: string;
    troubleshooting: string;
    findIssue: string;
    advisory: string;
}>;

const control = 'inline-flex min-h-11 min-w-11 max-w-full items-center rounded-xl px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-300 dark:hover:bg-indigo-500/15';

function ResourceLinks({ keys, language }: { keys: Resource[]; language: 'vi' | 'en' }) {
    if (!keys.length) return null;

    return (
        <div className="mt-2 flex flex-wrap gap-x-2">
            {keys.map((key) => (
                <a key={key} href={setup.links[key].url} className={control} target="_blank" rel="noreferrer">
                    {setup.links[key][language]}
                </a>
            ))}
        </div>
    );
}

export default function LocalSetupPage() {
    const { language } = useLanguage();
    const copy = guidance[language];

    return (
        <div className="pb-10">
            <SurfaceTopBar
                title={copy.title}
                subtitle={copy.subtitle}
                actions={<Link href="/help" className={control}>{copy.back}</Link>}
            />
            <article className="mx-auto max-w-4xl space-y-7 px-4 py-6 text-slate-700 dark:text-slate-300 sm:px-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#171b29]">
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{copy.needs}</h2>
                    <p className="mt-2 leading-7">{copy.requirements}</p>
                    <h2 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">{copy.flowTitle}</h2>
                    <p className="mt-2 leading-7">{copy.flow}</p>
                </section>
                <ol className="list-decimal space-y-5 rounded-2xl border border-slate-200 bg-white py-5 pr-5 pl-10 marker:font-semibold marker:text-indigo-700 dark:border-white/10 dark:bg-[#171b29] dark:marker:text-indigo-300">
                    {copy.steps.map((step) => (
                        <li key={step.title} className="pl-1">
                            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{step.title}</h2>
                            <p className="mt-1 leading-7">{step.action}</p>
                            <p className="mt-2 text-sm leading-6">
                                <strong>{copy.confirmation}</strong>
                                {' '}{step.result}
                            </p>
                            <ResourceLinks keys={step.links} language={language} />
                        </li>
                    ))}
                </ol>
                <p className="leading-7">{copy.sample}</p>
                <section aria-labelledby="setup-troubleshooting">
                    <h2 id="setup-troubleshooting" className="text-xl font-semibold text-slate-950 dark:text-white">
                        {copy.troubleshooting}
                    </h2>
                    <p className="mt-1 leading-7">{copy.findIssue}</p>
                    <div className="mt-3 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-[#171b29]">
                        {Object.entries(setup.issues).map(([code, issue]) => (
                            <details key={code} data-setup-issue={code} className="px-4">
                                <summary className="min-h-11 cursor-pointer py-3 font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-white">
                                    {issue[language].title}
                                    {setup.advisories.includes(code) && <span className="ml-2 text-sm font-normal">{copy.advisory}</span>}
                                    <code translate="no" className="ml-2 inline-block break-all text-xs font-normal text-slate-500 dark:text-slate-400">{code}</code>
                                </summary>
                                <div className="pb-3">
                                    <p className="leading-7">{issue[language].help}</p>
                                    {code === 'PACKAGES_MISSING' && (
                                        <code className="mt-2 block break-all rounded-lg bg-slate-100 p-2 text-sm dark:bg-slate-950">{setup.installCommand}</code>
                                    )}
                                    {code === 'NODE_VERSION' && (
                                        <code className="mt-2 block break-all rounded-lg bg-slate-100 p-2 text-sm dark:bg-slate-950">{setup.nodePathCommand}</code>
                                    )}
                                    {code === 'SQLITE_BINDING_MISSING' && (
                                        <code className="mt-2 block break-all rounded-lg bg-slate-100 p-2 text-sm dark:bg-slate-950">{setup.sqliteRepairCommand}</code>
                                    )}
                                    <ResourceLinks keys={issue.links as Resource[]} language={language} />
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            </article>
        </div>
    );
}
