'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Cloud, Link2, Loader2, XCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { defaultIntegrationsConfig, loadIntegrationsConfig, saveIntegrationsConfig, type IntegrationProvider, type IntegrationsConfig } from '@/lib/integrations-config';
import type { IntegrationTestResponse } from '@/app/api/integrations/test/route';

const labels = {
    vi: {
        title: 'Cloud Integrations',
        subtitle: 'Kết nối store bên ngoài để Runtime Monitor hiển thị dữ liệu thực trên Netlify.',
        providerLabel: 'Runtime Store Provider',
        none: 'None',
        noneDesc: 'Chỉ dùng dữ liệu local.',
        supabase: 'Supabase',
        supabaseDesc: 'Dán Project URL và anon key từ Supabase dashboard.',
        http: 'Custom HTTP',
        httpDesc: 'Bất kỳ REST endpoint nào trả về mảng runtime_events.',
        projectUrl: 'Project URL',
        anonKey: 'Anon Key (public)',
        endpoint: 'Endpoint URL',
        bearerToken: 'Bearer Token (optional)',
        show: 'Hiện',
        hide: 'Ẩn',
        test: 'Test Connection',
        testing: 'Đang kiểm tra...',
        save: 'Lưu',
        savedLabel: 'Đã lưu!',
        connected: 'Đã kết nối',
        notConnected: 'Chưa kết nối',
        sqlNote: 'Cần tạo bảng runtime_events trong Supabase trước.',
    },
    en: {
        title: 'Cloud Integrations',
        subtitle: 'Connect an external store so the Runtime Monitor shows live data on Netlify.',
        providerLabel: 'Runtime Store Provider',
        none: 'None',
        noneDesc: 'Local data only.',
        supabase: 'Supabase',
        supabaseDesc: 'Paste Project URL and anon key from Supabase dashboard.',
        http: 'Custom HTTP',
        httpDesc: 'Any REST endpoint returning a runtime_events JSON array.',
        projectUrl: 'Project URL',
        anonKey: 'Anon Key (public)',
        endpoint: 'Endpoint URL',
        bearerToken: 'Bearer Token (optional)',
        show: 'Show',
        hide: 'Hide',
        test: 'Test Connection',
        testing: 'Testing...',
        save: 'Save',
        savedLabel: 'Saved!',
        connected: 'Connected',
        notConnected: 'Not connected',
        sqlNote: 'Create the runtime_events table in Supabase first.',
    },
} as const;
type IntegrationLabels = (typeof labels)[keyof typeof labels];
export function IntegrationsTab() {
    const { language } = useLanguage();
    const l = labels[language];
    const [config, setConfig] = useState<IntegrationsConfig>(defaultIntegrationsConfig);
    const [showAnonKey, setShowAnonKey] = useState(false);
    const [showBearerToken, setShowBearerToken] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'error'>('idle');
    const [testDetail, setTestDetail] = useState('');
    const [testLatencyMs, setTestLatencyMs] = useState<number | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        queueMicrotask(() => {
            setConfig(loadIntegrationsConfig());
        });
    }, []);
    const provider = config.runtimeStore.provider;
    const updateRuntimeStore = (updates: Partial<IntegrationsConfig['runtimeStore']>) => {
        setConfig((prev) => ({ ...prev, runtimeStore: { ...prev.runtimeStore, ...updates } }));
    };
    const handleProviderChange = (nextProvider: IntegrationProvider) => {
        updateRuntimeStore({ provider: nextProvider });
        setTestStatus('idle');
        setTestDetail('');
        setTestLatencyMs(null);
    };

    async function handleTest() {
        setTestStatus('testing');
        setTestDetail('');
        setTestLatencyMs(null);
        try {
            const res = await fetch('/api/integrations/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    supabase: config.runtimeStore.supabase,
                    http: config.runtimeStore.http,
                }),
            });
            const data = await res.json() as IntegrationTestResponse;
            setTestStatus(data.ok ? 'ok' : 'error');
            setTestDetail(data.detail ?? '');
            setTestLatencyMs(data.latencyMs);
        } catch (err) {
            setTestStatus('error');
            setTestDetail(err instanceof Error ? err.message : 'Connection failed.');
        }
    }

    function handleSave() {
        saveIntegrationsConfig(config);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div className="space-y-5">
            <div className="flex items-start gap-3">
                <Cloud className="mt-1 h-5 w-5 text-indigo-600" />
                <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{l.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{l.subtitle}</p>
                </div>
            </div>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{l.providerLabel}</label>
                <div className="grid gap-2 sm:grid-cols-3">
                    <ProviderButton label={l.none} desc={l.noneDesc} active={provider === 'none'} onClick={() => handleProviderChange('none')} />
                    <ProviderButton label={l.supabase} desc={l.supabaseDesc} active={provider === 'supabase'} onClick={() => handleProviderChange('supabase')} />
                    <ProviderButton label={l.http} desc={l.httpDesc} active={provider === 'http'} icon={<Link2 className="h-4 w-4" />} onClick={() => handleProviderChange('http')} />
                </div>
            </div>

            {provider === 'supabase' && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-white/[0.08]">
                    <TextInput label={l.projectUrl} value={config.runtimeStore.supabase.url} onChange={(url) => updateRuntimeStore({ supabase: { ...config.runtimeStore.supabase, url } })} />
                    <SecretInput label={l.anonKey} value={config.runtimeStore.supabase.anonKey} visible={showAnonKey} showLabel={l.show} hideLabel={l.hide} onToggle={() => setShowAnonKey((prev) => !prev)} onChange={(anonKey) => updateRuntimeStore({ supabase: { ...config.runtimeStore.supabase, anonKey } })} />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{l.sqlNote}</p>
                </div>
            )}

            {provider === 'http' && (
                <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-white/[0.08]">
                    <TextInput label={l.endpoint} value={config.runtimeStore.http.endpoint} onChange={(endpoint) => updateRuntimeStore({ http: { ...config.runtimeStore.http, endpoint } })} />
                    <SecretInput label={l.bearerToken} value={config.runtimeStore.http.bearerToken} visible={showBearerToken} showLabel={l.show} hideLabel={l.hide} onToggle={() => setShowBearerToken((prev) => !prev)} onChange={(bearerToken) => updateRuntimeStore({ http: { ...config.runtimeStore.http, bearerToken } })} />
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                {provider !== 'none' && (
                    <button type="button" onClick={() => void handleTest()} disabled={testStatus === 'testing'} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
                        {l.test}
                    </button>
                )}
                <StatusBadge status={testStatus} detail={testDetail} latencyMs={testLatencyMs} labels={l} />
                <button type="button" onClick={handleSave} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 dark:border-white/[0.12] dark:text-gray-100 dark:hover:bg-white/[0.06]">
                    {saved ? l.savedLabel : l.save}
                </button>
            </div>
        </div>
    );
}

function ProviderButton({ label, desc, active, icon, onClick }: { label: string; desc: string; active: boolean; icon?: React.ReactNode; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className={`rounded-lg border p-3 text-left transition ${active ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30' : 'border-gray-200 hover:border-gray-300 dark:border-white/[0.08]'}`}>
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">{icon}{label}</span>
            <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">{desc}</span>
        </button>
    );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/[0.08] dark:bg-[#1a1d2e] dark:text-white" />
        </label>
    );
}

function SecretInput(props: { label: string; value: string; visible: boolean; showLabel: string; hideLabel: string; onToggle: () => void; onChange: (value: string) => void }) {
    return (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {props.label}
            <span className="mt-1 flex gap-2">
                <input type={props.visible ? 'text' : 'password'} value={props.value} onChange={(event) => props.onChange(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 dark:border-white/[0.08] dark:bg-[#1a1d2e] dark:text-white" />
                <button type="button" onClick={props.onToggle} className="rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 dark:border-white/[0.08] dark:text-gray-200">
                    {props.visible ? props.hideLabel : props.showLabel}
                </button>
            </span>
        </label>
    );
}

function StatusBadge({ status, detail, latencyMs, labels: l }: { status: 'idle' | 'testing' | 'ok' | 'error'; detail: string; latencyMs: number | null; labels: IntegrationLabels }) {
    if (status === 'idle') return null;
    const isOk = status === 'ok';
    const Icon = status === 'testing' ? Loader2 : isOk ? CheckCircle2 : XCircle;
    const color = status === 'testing' ? 'text-gray-600' : isOk ? 'text-emerald-600' : 'text-red-600';
    return (
        <div className={`flex items-center gap-2 text-sm ${color}`}>
            <Icon className={`h-4 w-4 ${status === 'testing' ? 'animate-spin' : ''}`} />
            <span>{status === 'testing' ? l.testing : isOk ? `${l.connected}${latencyMs !== null ? ` (${latencyMs}ms)` : ''}` : `${l.notConnected}${detail ? `: ${detail}` : ''}`}</span>
        </div>
    );
}
