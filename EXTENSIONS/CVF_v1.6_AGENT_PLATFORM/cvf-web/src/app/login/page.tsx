'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from') || '/';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [rememberUsername, setRememberUsername] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // If session already exists, middleware will redirect after first render
    }, [from, router]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('cvf_login_username');
            if (saved) {
                setUsername(saved);
                setRememberUsername(true);
            }
        } catch {
            // ignore invalid storage
        }
    }, []);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                setError(data.error || 'Đăng nhập thất bại.');
                setIsSubmitting(false);
                return;
            }

            if (rememberUsername) {
                localStorage.setItem('cvf_login_username', username);
            } else {
                localStorage.removeItem('cvf_login_username');
            }

            router.replace(from);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                    <div className="text-3xl">🔐</div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">CVF v1.6 Login</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Vui lòng đăng nhập để truy cập toàn bộ giao diện.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Username
                        </label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            type="text"
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="admin"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type={showPassword ? 'text' : 'password'}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="admin123"
                        />
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={rememberUsername}
                                onChange={(e) => setRememberUsername(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Lưu tài khoản/mật khẩu
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showPassword}
                                onChange={(e) => setShowPassword(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            Hiện mật khẩu
                        </label>
                    </div>
                    {rememberUsername && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                            Lưu ý: Chỉ lưu username, không lưu mật khẩu.
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Role (UI only)
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                        </select>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium transition-colors"
                    >
                        {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/60 rounded-lg px-3 py-2">
                    Tài khoản mặc định: <strong>admin</strong> / <strong>admin123</strong>. Có thể thay đổi qua biến môi trường <code>CVF_ADMIN_USER</code> và <code>CVF_ADMIN_PASS</code>.
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" />}>
            <LoginPageContent />
        </Suspense>
    );
}
