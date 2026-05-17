'use client';

import Link from 'next/link';

const steps = [
    {
        number: 1,
        title: '📝 Xác định Mục tiêu',
        role: 'user',
        content: 'Bạn mô tả bạn cần gì, không phải AI làm gì.',
        example: {
            correct: 'Tôi cần phân tích 3 phương án kinh doanh để chọn 1',
            wrong: 'Hãy suy nghĩ như chuyên gia và dùng SWOT'
        }
    },
    {
        number: 2,
        title: '📋 Chọn Template',
        role: 'user',
        content: 'Chọn template phù hợp từ thư viện:',
        categories: ['📊 Business', '💻 Technical', '📝 Content', '🔬 Research']
    },
    {
        number: 3,
        title: '📝 Điền Form',
        role: 'user',
        content: 'Điền thông tin vào form theo template. Không cần viết prompt!',
        fields: ['Mục tiêu', 'Bối cảnh', 'Ràng buộc', 'Kết quả mong đợi']
    },
    {
        number: 4,
        title: '⚙️ CVF Xử lý',
        role: 'system',
        content: 'CVF tự động:',
        steps: ['Chuyển form → Intent chuẩn', 'Kiểm tra ràng buộc', 'Thực thi với AI', 'Kiểm tra output']
    },
    {
        number: 5,
        title: '✅ Đánh giá Kết quả',
        role: 'user',
        content: 'Bạn đánh giá output theo tiêu chí đã đặt:',
        responses: [
            { icon: '✅', label: 'ACCEPT', desc: 'Kết quả dùng được' },
            { icon: '🔄', label: 'REVISE', desc: 'Cần chỉnh sửa nhỏ' },
            { icon: '❌', label: 'REJECT', desc: 'Không đạt, làm lại' }
        ]
    }
];

const tips = [
    'Mục tiêu càng rõ → Kết quả càng tốt',
    'Không can thiệp vào cách AI làm việc',
    'Chỉ đánh giá output cuối cùng',
    'Nếu CVF từ chối → Đọc lý do và điều chỉnh'
];

const doList = [
    'Mô tả rõ mục tiêu cần đạt',
    'Nêu ràng buộc và giới hạn',
    'Đánh giá output, không process',
    'Chấp nhận escalation khi cần'
];

const dontList = [
    'Dẫn dắt kết quả mong muốn',
    'Chỉ định cách AI làm việc',
    'Ép tiếp tục khi bị từ chối',
    'Bỏ qua cảnh báo rủi ro'
];

export default function HelpPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <Link
                        href="/"
                        className="inline-block mb-6 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        ← Quay lại trang chính
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                        🎯 Hướng dẫn sử dụng CVF
                    </h1>
                    <p className="text-gray-400">Quy trình 5 bước để sử dụng CVF hiệu quả</p>
                </div>

                {/* Process Steps */}
                <div className="space-y-6 mb-12">
                    {steps.map((step, idx) => (
                        <div
                            key={step.number}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all hover:-translate-y-1"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-lg">
                                    {step.number}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h3 className="text-xl font-semibold">{step.title}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs ${step.role === 'user'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-purple-500/20 text-purple-400'
                                            }`}>
                                            {step.role === 'user' ? 'End User' : 'CVF System'}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 mb-3">{step.content}</p>

                                    {step.example && (
                                        <div className="bg-black/30 rounded-lg p-4 font-mono text-sm space-y-2">
                                            <div className="text-green-400">✅ Đúng: {step.example.correct}</div>
                                            <div className="text-red-400">❌ Sai: {step.example.wrong}</div>
                                        </div>
                                    )}

                                    {step.categories && (
                                        <div className="flex flex-wrap gap-2">
                                            {step.categories.map(cat => (
                                                <span key={cat} className="px-3 py-1 bg-purple-500/20 rounded-full text-sm">{cat}</span>
                                            ))}
                                        </div>
                                    )}

                                    {step.fields && (
                                        <div className="flex flex-wrap gap-2">
                                            {step.fields.map(field => (
                                                <span key={field} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">{field}</span>
                                            ))}
                                        </div>
                                    )}

                                    {step.steps && (
                                        <div className="bg-black/30 rounded-lg p-4 font-mono text-sm text-green-300">
                                            {step.steps.map((s, i) => (
                                                <div key={i}>{i + 1}. {s}</div>
                                            ))}
                                        </div>
                                    )}

                                    {step.responses && (
                                        <div className="grid grid-cols-3 gap-3">
                                            {step.responses.map(r => (
                                                <div key={r.label} className={`text-center p-3 rounded-lg border ${r.label === 'ACCEPT' ? 'border-green-500/50 bg-green-500/10' :
                                                        r.label === 'REVISE' ? 'border-yellow-500/50 bg-yellow-500/10' :
                                                            'border-red-500/50 bg-red-500/10'
                                                    }`}>
                                                    <div className="text-2xl mb-1">{r.icon}</div>
                                                    <div className="font-semibold text-sm">{r.label}</div>
                                                    <div className="text-xs text-gray-400">{r.desc}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {idx < steps.length - 1 && (
                                <div className="flex justify-center mt-4">
                                    <span className="text-2xl text-purple-400 animate-bounce">↓</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Do / Don't */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                        <h3 className="text-xl font-semibold text-green-400 mb-4">✅ NÊN LÀM</h3>
                        <ul className="space-y-2">
                            {doList.map(item => (
                                <li key={item} className="flex items-start gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span className="text-gray-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                        <h3 className="text-xl font-semibold text-red-400 mb-4">❌ KHÔNG NÊN</h3>
                        <ul className="space-y-2">
                            {dontList.map(item => (
                                <li key={item} className="flex items-start gap-2">
                                    <span className="text-red-400">✗</span>
                                    <span className="text-gray-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-12">
                    <h3 className="text-xl font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                        💡 Mẹo quan trọng
                    </h3>
                    <ul className="space-y-2">
                        {tips.map(tip => (
                            <li key={tip} className="flex items-start gap-2">
                                <span className="text-yellow-400">→</span>
                                <span className="text-gray-300">{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Key Quote */}
                <div className="text-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8">
                    <p className="text-xl italic text-gray-300 mb-2">
                        "CVF không giúp bạn tránh quyết định khó.<br />
                        CVF giúp bạn tránh những quyết định tệ."
                    </p>
                    <p className="text-sm text-gray-500">— CVF Philosophy</p>
                </div>

                {/* CTA */}
                <div className="text-center mt-12">
                    <Link
                        href="/"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
                    >
                        Bắt đầu sử dụng CVF →
                    </Link>
                </div>
            </div>
        </div>
    );
}
