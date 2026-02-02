'use client';

import { useState } from 'react';

interface Step {
    title: string;
    description: string;
    tip: string;
}

const onboardingSteps: Step[] = [
    {
        title: '👋 Chào mừng đến với CVF!',
        description: 'CVF giúp bạn sử dụng AI một cách có kiểm soát. Không cần biết coding, không cần viết prompt.',
        tip: 'CVF biến yêu cầu của bạn thành structured input cho AI.'
    },
    {
        title: '📋 Chọn Template',
        description: 'Mỗi template được thiết kế cho một loại công việc cụ thể. Chọn template phù hợp và điền form.',
        tip: 'Template đã có sẵn cấu trúc - bạn chỉ cần điền thông tin.'
    },
    {
        title: '🎯 Mô tả Mục tiêu',
        description: 'Nói rõ BẠN CẦN GÌ, không phải AI làm gì. CVF sẽ lo phần còn lại.',
        tip: 'Ví dụ: "Phân tích 3 phương án" thay vì "Dùng SWOT analysis".'
    },
    {
        title: '✅ Đánh giá Kết quả',
        description: 'Sau khi CVF xử lý, bạn đánh giá output: Accept, Revise, hoặc Reject.',
        tip: 'Chỉ đánh giá kết quả cuối cùng, không can thiệp quá trình.'
    },
    {
        title: '🚀 Sẵn sàng!',
        description: 'Bạn đã hiểu cách dùng CVF. Hãy bắt đầu với một template!',
        tip: 'Nếu cần trợ giúp, click nút ❓ ở góc phải màn hình.'
    }
];

interface OnboardingWizardProps {
    onComplete: () => void;
    onSkip: () => void;
}

export function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const step = onboardingSteps[currentStep];
    const isLast = currentStep === onboardingSteps.length - 1;

    const next = () => {
        if (isLast) {
            onComplete();
        } else {
            setCurrentStep(s => s + 1);
        }
    };

    const prev = () => {
        if (currentStep > 0) {
            setCurrentStep(s => s - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
                {/* Progress bar */}
                <div className="h-1 bg-slate-700">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / onboardingSteps.length) * 100}%` }}
                    />
                </div>

                <div className="p-8">
                    {/* Step indicator */}
                    <div className="flex justify-center gap-2 mb-6">
                        {onboardingSteps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-colors ${idx === currentStep ? 'bg-purple-500' :
                                        idx < currentStep ? 'bg-purple-500/50' : 'bg-slate-600'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
                        <p className="text-gray-300 mb-6 leading-relaxed">{step.description}</p>

                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                            <div className="text-xs text-purple-400 uppercase mb-1">💡 Mẹo</div>
                            <p className="text-sm text-gray-300">{step.tip}</p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={onSkip}
                            className="text-gray-500 hover:text-gray-300 text-sm"
                        >
                            Bỏ qua
                        </button>

                        <div className="flex gap-3">
                            {currentStep > 0 && (
                                <button
                                    onClick={prev}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    ← Quay lại
                                </button>
                            )}
                            <button
                                onClick={next}
                                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                {isLast ? 'Bắt đầu!' : 'Tiếp theo →'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
