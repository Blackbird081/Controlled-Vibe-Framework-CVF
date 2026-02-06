'use client';

import { useState } from 'react';
import Link from 'next/link';

interface QuickTip {
    icon: string;
    title: string;
    content: string;
}

const quickTips: QuickTip[] = [
    {
        icon: '🎯',
        title: 'Mục tiêu rõ ràng',
        content: 'Mô tả bạn cần gì, không phải AI làm gì'
    },
    {
        icon: '📋',
        title: 'Dùng Template',
        content: 'Chọn template → Điền form → Nhận kết quả'
    },
    {
        icon: '✅',
        title: 'Đánh giá Output',
        content: 'Accept / Revise / Reject dựa trên tiêu chí'
    },
    {
        icon: '⚠️',
        title: 'Chấp nhận Escalation',
        content: 'CVF từ chối = CVF đang bảo vệ bạn'
    }
];

const steps = [
    { num: 1, label: 'Xác định mục tiêu' },
    { num: 2, label: 'Chọn template' },
    { num: 3, label: 'Điền form' },
    { num: 4, label: 'CVF xử lý' },
    { num: 5, label: 'Đánh giá output' }
];

export function QuickReference() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Collapsed Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
                <span className="text-xl">❓</span>
                {!isExpanded && <span className="hidden md:inline">Trợ giúp</span>}
            </button>

            {/* Expanded Card */}
            {isExpanded && (
                <div className="absolute bottom-16 right-0 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">🎯 Quick Reference</h3>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-white/80 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* 5 Steps Mini */}
                        <div>
                            <div className="text-xs text-gray-400 uppercase mb-2">Quy trình 5 bước</div>
                            <div className="flex flex-wrap gap-1">
                                {steps.map(step => (
                                    <span
                                        key={step.num}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-full text-xs"
                                    >
                                        <span className="w-4 h-4 bg-purple-500 rounded-full text-[10px] flex items-center justify-center">
                                            {step.num}
                                        </span>
                                        {step.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <div className="space-y-2">
                            {quickTips.map(tip => (
                                <div key={tip.title} className="flex items-start gap-2 p-2 bg-slate-700/50 rounded-lg">
                                    <span className="text-lg">{tip.icon}</span>
                                    <div>
                                        <div className="font-medium text-sm">{tip.title}</div>
                                        <div className="text-xs text-gray-400">{tip.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Response Types */}
                        <div>
                            <div className="text-xs text-gray-400 uppercase mb-2">Đánh giá kết quả</div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
                                    <div className="text-lg">✅</div>
                                    <div className="font-medium text-green-400">ACCEPT</div>
                                </div>
                                <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                                    <div className="text-lg">🔄</div>
                                    <div className="font-medium text-yellow-400">REVISE</div>
                                </div>
                                <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
                                    <div className="text-lg">❌</div>
                                    <div className="font-medium text-red-400">REJECT</div>
                                </div>
                            </div>
                        </div>

                        {/* Link to full help */}
                        <Link
                            href="/help"
                            className="block text-center p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                        >
                            Xem hướng dẫn đầy đủ →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
