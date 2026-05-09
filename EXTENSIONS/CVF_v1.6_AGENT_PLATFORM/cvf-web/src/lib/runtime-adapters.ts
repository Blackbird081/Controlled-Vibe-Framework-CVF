'use client';

/**
 * CVF v1.7.3 — Runtime Adapter Registry (ported for Web UI)
 * Adapter status/capabilities for the Safety Dashboard.
 */

export type RuntimeCapability = 'filesystem' | 'shell' | 'http' | 'custom';

export interface RuntimeAdapterInfo {
    name: string;
    displayName: string;
    description: { vi: string; en: string };
    capabilities: RuntimeCapability[];
    icon: string;
    status: 'active' | 'standby' | 'disabled';
    safetyNotes: { vi: string; en: string };
}

export const RUNTIME_ADAPTERS: RuntimeAdapterInfo[] = [
    {
        name: 'openclaw',
        displayName: 'OpenClaw',
        description: {
            vi: 'Adapter toàn diện: filesystem, shell (timeout 10s), HTTP',
            en: 'Full adapter: filesystem, shell (10s timeout), HTTP',
        },
        capabilities: ['filesystem', 'shell', 'http'],
        icon: '🐾',
        status: 'active',
        safetyNotes: {
            vi: 'Shell có timeout 10s + SIGTERM tự động',
            en: 'Shell has 10s timeout + automatic SIGTERM',
        },
    },
    {
        name: 'picoclaw',
        displayName: 'PicoClaw',
        description: {
            vi: 'Adapter gọn nhẹ: chỉ filesystem (đọc/ghi)',
            en: 'Lightweight: filesystem only (read/write)',
        },
        capabilities: ['filesystem'],
        icon: '🔧',
        status: 'standby',
        safetyNotes: {
            vi: 'Không có shell — an toàn theo mặc định',
            en: 'No shell access — safe by default',
        },
    },
    {
        name: 'zeroclaw',
        displayName: 'ZeroClaw',
        description: {
            vi: 'Adapter HTTP: chỉ gọi API bên ngoài',
            en: 'HTTP-only: external API calls only',
        },
        capabilities: ['http'],
        icon: '🌐',
        status: 'standby',
        safetyNotes: {
            vi: 'Timeout 30s — không truy cập hệ thống local',
            en: '30s timeout — no local system access',
        },
    },
    {
        name: 'nano',
        displayName: 'Nano',
        description: {
            vi: 'Container cô lập — ủy quyền thực thi sang sandbox',
            en: 'Isolated container — delegates to sandbox',
        },
        capabilities: ['custom'],
        icon: '📦',
        status: 'disabled',
        safetyNotes: {
            vi: 'Không thực thi trực tiếp — mọi hành động qua sandbox',
            en: 'No direct execution — all actions via sandbox',
        },
    },
];

export const CAPABILITY_LABELS: Record<RuntimeCapability, { vi: string; en: string; icon: string }> = {
    filesystem: { vi: 'Hệ thống tệp', en: 'Filesystem', icon: '📁' },
    shell: { vi: 'Dòng lệnh', en: 'Shell', icon: '💻' },
    http: { vi: 'HTTP/API', en: 'HTTP/API', icon: '🌐' },
    custom: { vi: 'Tùy chỉnh', en: 'Custom', icon: '⚙️' },
};

export const STATUS_STYLES: Record<string, { label: { vi: string; en: string }; color: string }> = {
    active: { label: { vi: 'Hoạt động', en: 'Active' }, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    standby: { label: { vi: 'Chờ', en: 'Standby' }, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    disabled: { label: { vi: 'Tắt', en: 'Disabled' }, color: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' },
};
