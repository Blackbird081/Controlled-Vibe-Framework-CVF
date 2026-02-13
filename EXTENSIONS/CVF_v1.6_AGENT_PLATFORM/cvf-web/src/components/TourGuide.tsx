'use client';

import { useEffect, useCallback, useState } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useLanguage } from '@/lib/i18n';

type Lang = 'vi' | 'en';

// Tour steps for CVF workflow — bilingual
const TOUR_STEPS: Record<Lang, DriveStep[]> = {
    vi: [
        {
            element: '#tour-welcome',
            popover: {
                title: '👋 Chào mừng đến với CVF!',
                description: 'Nền tảng giúp bạn sử dụng AI đơn giản, không cần viết prompt. Hãy để tôi hướng dẫn bạn!',
                side: 'bottom',
                align: 'center',
            },
        },
        {
            element: '#tour-category-tabs',
            popover: {
                title: '📂 Bước 1: Chọn danh mục',
                description: '8 danh mục: Business, Technical, Content, Research, Marketing, Product, Security, Development.',
                side: 'bottom',
                align: 'start',
            },
        },
        {
            element: '#tour-template-grid',
            popover: {
                title: '🎯 Bước 2: Chọn Template',
                description: '50 templates đã được chuẩn bị sẵn. Bạn chỉ cần điền thông tin — không cần viết prompt!',
                side: 'top',
                align: 'center',
            },
        },
        {
            element: '#tour-template-card',
            popover: {
                title: '💡 Click để sử dụng',
                description: 'Click template → Điền form → Xuất spec (3 chế độ: Simple / Rules / CVF Full Mode).',
                side: 'right',
                align: 'start',
            },
        },
        {
            element: '#tour-nav-skills',
            popover: {
                title: '📚 Skill Library',
                description: '12 domains × 124 skills. Xem skill → nhấn 📝 Dùng Template để chuyển sang template tương ứng.',
                side: 'bottom',
                align: 'center',
            },
        },
        {
            element: '#tour-nav-agent',
            popover: {
                title: '🤖 Agent Chat + Governance',
                description: 'Chat AI có GovernanceBar (Phase/Role/Risk). Bật Auto mode → AI tự tuân thủ rules.',
                side: 'bottom',
                align: 'center',
            },
        },
        {
            element: '#tour-nav-analytics',
            popover: {
                title: '📊 Analytics',
                description: 'Theo dõi lịch sử sử dụng và thống kê chất lượng kết quả.',
                side: 'bottom',
                align: 'center',
            },
        },
        {
            element: '#tour-lang-switch',
            popover: {
                title: '🌐 Ngôn ngữ',
                description: 'Chuyển đổi giữa Tiếng Việt và English.',
                side: 'bottom',
                align: 'end',
            },
        },
        {
            popover: {
                title: '🎉 Sẵn sàng!',
                description: 'Bạn đã hiểu cách dùng CVF. Hãy chọn template và bắt đầu thôi! 💪',
            },
        },
    ],
    en: [
        {
            element: '#tour-welcome',
            popover: {
                title: '👋 Welcome to CVF!',
                description: 'A platform that helps you use AI simply, without writing prompts. Let me show you around!',
                side: 'bottom',
                align: 'center',
            },
        },
        {
            element: '#tour-category-tabs',
            popover: {
                title: '📂 Step 1: Choose a Category',
                description: '8 categories: Business, Technical, Content, Research, Marketing, Product, Security, Development.',
                side: 'bottom',
                align: 'start',
            },
        },
        {
            element: '#tour-template-grid',
            popover: {
                title: '🎯 Step 2: Pick a Template',
                description: '50 ready-made templates. Just fill in the info — no prompt writing needed!',
                side: 'top',
                align: 'center',
            },
        },
        {
            element: '#tour-template-card',
            popover: {
                title: '💡 Click to Use',
                description: 'Click template → Fill form → Export spec (3 modes: Simple / Rules / CVF Full Mode).',
                side: 'right',
                align: 'start',
            },
        },
        {
            element: '#tour-nav-skills',
            popover: {
                title: '📚 Skill Library',
                description: '12 domains × 124 skills. View skill → click 📝 Use Template to jump to matching template.',
                side: 'bottom',
                align: 'center',
            },
        },
        {
            element: '#tour-nav-agent',
            popover: {
                title: '🤖 Agent Chat + Governance',
                description: 'Chat with AI with GovernanceBar (Phase/Role/Risk). Enable Auto mode → AI auto-complies.',
                side: 'bottom',
                align: 'center',
            },
        },
        {
            element: '#tour-nav-analytics',
            popover: {
                title: '📊 Analytics',
                description: 'Track usage history and result quality statistics.',
                side: 'bottom',
                align: 'center',
            },
        },
        {
            element: '#tour-lang-switch',
            popover: {
                title: '🌐 Language',
                description: 'Switch between Tiếng Việt and English.',
                side: 'bottom',
                align: 'end',
            },
        },
        {
            popover: {
                title: '🎉 Ready!',
                description: 'You now know how to use CVF. Pick a template and get started! 💪',
            },
        },
    ],
};

const TOUR_BUTTONS: Record<Lang, { next: string; prev: string; done: string; btnTitle: string; btnLabel: string }> = {
    vi: { next: 'Tiếp →', prev: '← Trước', done: 'Hoàn thành ✓', btnTitle: 'Bắt đầu hướng dẫn', btnLabel: 'Hướng dẫn' },
    en: { next: 'Next →', prev: '← Back', done: 'Done ✓', btnTitle: 'Start guided tour', btnLabel: 'Guide' },
};

interface TourGuideProps {
    autoStart?: boolean;
    onComplete?: () => void;
}

export function TourGuide({ autoStart = false, onComplete }: TourGuideProps) {
    const [isReady, setIsReady] = useState(false);
    const { language } = useLanguage();

    const startTour = useCallback(() => {
        const btns = TOUR_BUTTONS[language];
        const driverObj = driver({
            showProgress: true,
            showButtons: ['next', 'previous', 'close'],
            steps: TOUR_STEPS[language],
            nextBtnText: btns.next,
            prevBtnText: btns.prev,
            doneBtnText: btns.done,
            progressText: '{{current}} / {{total}}',
            onDestroyStarted: () => {
                if (onComplete) {
                    onComplete();
                }
                driverObj.destroy();
            },
        });

        driverObj.drive();
    }, [onComplete, language]);

    useEffect(() => {
        // Wait for DOM elements to be ready
        const timer = setTimeout(() => {
            setIsReady(true);
            if (autoStart) {
                startTour();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [autoStart, startTour]);

    if (!isReady) return null;

    const btns = TOUR_BUTTONS[language];
    return (
        <button
            onClick={startTour}
            className="fixed bottom-24 right-6 z-40
                 px-4 py-2.5 rounded-full
                 bg-gradient-to-r from-blue-600 to-purple-600
                 hover:from-blue-700 hover:to-purple-700
                 text-white font-medium text-sm
                 shadow-lg hover:shadow-xl
                 transition-all duration-200
                 flex items-center gap-2"
            title={btns.btnTitle}
        >
            <span>🎓</span>
            <span className="hidden sm:inline">{btns.btnLabel}</span>
        </button>
    );
}

// CSS overrides for driver.js (add to globals.css)
export const driverStyles = `
/* Driver.js custom styles */
.driver-popover {
  background: #1f2937 !important;
  color: #f3f4f6 !important;
  border-radius: 12px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
}

.driver-popover-title {
  font-size: 1.1rem !important;
  font-weight: 600 !important;
}

.driver-popover-description {
  font-size: 0.95rem !important;
  line-height: 1.5 !important;
}

.driver-popover-progress-text {
  color: #9ca3af !important;
}

.driver-popover-navigation-btns button {
  border-radius: 8px !important;
  padding: 8px 16px !important;
  font-weight: 500 !important;
}

.driver-popover-next-btn {
  background: #3b82f6 !important;
}

.driver-popover-prev-btn {
  background: #4b5563 !important;
}

.driver-popover-close-btn {
  color: #9ca3af !important;
}

/* Light mode */
:not(.dark) .driver-popover {
  background: white !important;
  color: #1f2937 !important;
}
`;
