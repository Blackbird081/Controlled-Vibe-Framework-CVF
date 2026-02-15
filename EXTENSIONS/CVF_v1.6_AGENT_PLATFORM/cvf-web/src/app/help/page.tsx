'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { HELP_CONTENT } from '@/data/help-content';

export default function HelpPage() {
    const { language, t } = useLanguage();
    const content = HELP_CONTENT[language];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <Link
                        href="/"
                        className="inline-block mb-6 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        {t('help.backHome')}
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                        {content.header.title}
                    </h1>
                    <p className="text-gray-400">{content.header.subtitle}</p>
                </div>

                {/* Process Steps */}
                <div className="space-y-6 mb-12">
                    {content.steps.map((step, idx) => (
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
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs ${step.role === 'user'
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-purple-500/20 text-purple-400'
                                                }`}
                                        >
                                            {content.roleLabels[step.role]}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 mb-3">{step.content}</p>

                                    {step.example && (
                                        <div className="bg-black/30 rounded-lg p-4 font-mono text-sm space-y-2">
                                            <div className="text-green-400">✅ {language === 'vi' ? 'Đúng' : 'Correct'}: {step.example.correct}</div>
                                            <div className="text-red-400">❌ {language === 'vi' ? 'Sai' : 'Wrong'}: {step.example.wrong}</div>
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
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {step.responses.map(r => (
                                                <div key={r.label} className={`text-center p-3 rounded-lg border ${r.label === 'ACCEPT' ? 'border-green-500/50 bg-green-500/10' :
                                                    r.label === 'REVISE' ? 'border-yellow-500/50 bg-yellow-500/10' :
                                                        'border-red-500/50 bg-red-500/10'
                                                    }`}
                                                >
                                                    <div className="text-2xl mb-1">{r.icon}</div>
                                                    <div className="font-semibold text-sm">{r.label}</div>
                                                    <div className="text-xs text-gray-400">{r.desc}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {idx < content.steps.length - 1 && (
                                <div className="flex justify-center mt-4">
                                    <span className="text-2xl text-purple-400 animate-bounce">↓</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* New Features Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        🚀 {language === 'vi' ? 'Tính năng nâng cao' : 'Advanced Features'}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {content.features.map(f => (
                            <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-emerald-500/50 transition-all">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{f.icon}</span>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-base mb-1">{f.title}</h4>
                                        <p className="text-gray-400 text-sm">{f.desc}</p>
                                        {f.link && (
                                            <Link
                                                href={f.link}
                                                className="inline-block mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                            >
                                                {f.linkText} →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Do / Don't */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                        <h3 className="text-xl font-semibold text-green-400 mb-4">✅ {language === 'vi' ? 'NÊN LÀM' : 'DO'}</h3>
                        <ul className="space-y-2">
                            {content.doList.map(item => (
                                <li key={item} className="flex items-start gap-2">
                                    <span className="text-green-400">✓</span>
                                    <span className="text-gray-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                        <h3 className="text-xl font-semibold text-red-400 mb-4">❌ {language === 'vi' ? 'KHÔNG NÊN' : 'DON\'T'}</h3>
                        <ul className="space-y-2">
                            {content.dontList.map(item => (
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
                        💡 {language === 'vi' ? 'Mẹo quan trọng' : 'Key Tips'}
                    </h3>
                    <ul className="space-y-2">
                        {content.tips.map(tip => (
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
                        {content.quote.text.split('\n').map((line, idx) => (
                            <span key={idx}>
                                {line}
                                {idx === 0 && <br />}
                            </span>
                        ))}
                    </p>
                    <p className="text-sm text-gray-500">{content.quote.author}</p>
                </div>

                {/* CTA */}
                <div className="text-center mt-12">
                    <Link
                        href="/"
                        className="inline-block px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity"
                    >
                        {content.header.cta}
                    </Link>
                </div>
            </div>
        </div>
    );
}
