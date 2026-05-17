'use client';

import { useEffect, useCallback, useState } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

// Tour steps for CVF workflow
const tourSteps: DriveStep[] = [
    {
        element: '#tour-welcome',
        popover: {
            title: '👋 Chào mừng đến với CVF!',
            description: 'Đây là nền tảng giúp bạn sử dụng AI một cách đơn giản, không cần viết prompt. Hãy để tôi hướng dẫn bạn!',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '#tour-category-tabs',
        popover: {
            title: '📂 Bước 1: Chọn danh mục',
            description: 'Chọn danh mục phù hợp với nhu cầu: Kinh doanh, Kỹ thuật, Marketing, v.v.',
            side: 'bottom',
            align: 'start',
        },
    },
    {
        element: '#tour-template-grid',
        popover: {
            title: '🎯 Bước 2: Chọn Template',
            description: 'Mỗi template là một "bài tập" đã được chuẩn bị sẵn. Bạn chỉ cần điền thông tin!',
            side: 'top',
            align: 'center',
        },
    },
    {
        element: '#tour-template-card',
        popover: {
            title: '💡 Click để sử dụng',
            description: 'Click vào template để mở form điền thông tin. Có thể bấm Preview để xem ví dụ output.',
            side: 'right',
            align: 'start',
        },
    },
    {
        element: '#tour-nav-skills',
        popover: {
            title: '📚 Skill Library',
            description: 'Khám phá 53+ skills chuyên sâu theo domain: App Dev, Marketing, Security...',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '#tour-nav-analytics',
        popover: {
            title: '📊 Analytics',
            description: 'Theo dõi lịch sử sử dụng và thống kê chất lượng kết quả của bạn.',
            side: 'bottom',
            align: 'center',
        },
    },
    {
        element: '#tour-nav-marketplace',
        popover: {
            title: '🏪 Marketplace',
            description: 'Tìm kiếm và import templates từ cộng đồng.',
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
            description: 'Bạn đã hiểu cách sử dụng CVF. Hãy chọn một template và bắt đầu thôi!',
        },
    },
];

interface TourGuideProps {
    autoStart?: boolean;
    onComplete?: () => void;
}

export function TourGuide({ autoStart = false, onComplete }: TourGuideProps) {
    const [isReady, setIsReady] = useState(false);

    const startTour = useCallback(() => {
        const driverObj = driver({
            showProgress: true,
            showButtons: ['next', 'previous', 'close'],
            steps: tourSteps,
            nextBtnText: 'Tiếp →',
            prevBtnText: '← Trước',
            doneBtnText: 'Hoàn thành ✓',
            progressText: '{{current}} / {{total}}',
            onDestroyStarted: () => {
                if (onComplete) {
                    onComplete();
                }
                driverObj.destroy();
            },
        });

        driverObj.drive();
    }, [onComplete]);

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
            title="Bắt đầu hướng dẫn sử dụng"
        >
            <span>🎓</span>
            <span className="hidden sm:inline">Hướng dẫn</span>
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
