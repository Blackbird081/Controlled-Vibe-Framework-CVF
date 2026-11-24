'use client';
// Text Encoding Exception: localized Jev preference and stop reasons.

import { useEffect, useState } from 'react';
import { requestHomeSpecJev, type JevSetting } from '@/lib/home-spec-jev-client';
import type { HomeSpecLocale } from '@/lib/home-spec-jev-catalog';

export function JevHomeSettings({ language }: { language: HomeSpecLocale }) {
    const [setting, setSetting] = useState<JevSetting | null>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(false);
    const vi = language === 'vi';

    useEffect(() => {
        let current = true;
        void requestHomeSpecJev<JevSetting>().then(value => { if (current) setSetting(value); });
        return () => { current = false; };
    }, []);

    if (!setting) return null;
    const unavailable = setting.reason === 'unavailable';
    const reason = setting.reason === 'selection_changes' || setting.reason === 'library_or_no_match'
        ? (vi ? 'Gợi ý đã tự tắt. Quy tắc hiện tại tắt khi ít nhất 3 trong 10 kết quả chọn sẵn gần nhất bị bác; bạn có thể bật lại.' : 'Suggestions turned off. The current rule turns them off when at least 3 of the last 10 preselected outcomes are rejected; you can turn them back on.')
        : unavailable ? (vi ? 'Máy này chưa sẵn sàng dùng Jev.' : 'Jev is unavailable on this installation.') : null;

    async function update(enabled: boolean) {
        setPending(true);
        setError(false);
        const next = await requestHomeSpecJev<JevSetting>({ action: 'preference', enabled });
        if (next) setSetting(next);
        else setError(true);
        setPending(false);
    }

    return (
        <section className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
            <label className="inline-flex min-h-11 items-center gap-3 font-medium">
                <input type="checkbox" checked={setting.enabled} disabled={unavailable || pending}
                    onChange={event => void update(event.target.checked)} />
                {vi ? 'Gợi ý của Jev trên Trang chủ' : 'Jev suggestions on Home'}
            </label>
            {reason && <p role="status" className="text-sm">{reason}</p>}
            {!unavailable && <p className="text-sm text-slate-600 dark:text-slate-300">
                {vi ? 'Thay đổi có hiệu lực ngay. Khi tắt, Trang chủ gợi ý theo từ khóa.' : 'Changes take effect immediately. When off, Home suggests outcomes using keywords.'}
            </p>}
            {!unavailable && <p className="text-sm text-slate-600 dark:text-slate-300">
                {vi ? 'CVF tự tắt khi ít nhất 3 trong 10 kết quả chọn sẵn gần nhất bị bác. Bộ đếm dùng chung cho các tài khoản trên máy này; bạn có thể bật lại.' : 'CVF turns off after at least 3 of the last 10 preselected outcomes are rejected. The counter is shared across accounts on this computer; you can turn it back on.'}
            </p>}
            {error && <p role="alert" className="text-sm text-red-600">{vi ? 'Chưa lưu được. Hãy thử lại.' : 'Could not save. Try again.'}</p>}
        </section>
    );
}
