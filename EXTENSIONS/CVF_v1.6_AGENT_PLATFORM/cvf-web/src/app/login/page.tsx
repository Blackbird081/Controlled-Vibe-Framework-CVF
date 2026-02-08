'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const AUTH_COOKIE = 'cvf_auth';
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';
const ROLE_COOKIE = 'cvf_role';
const LOGIN_STORAGE_KEY = 'cvf_login_saved';

function hasAuthCookie() {
    return document.cookie.split(';').some((cookie) => cookie.trim().startsWith(`${AUTH_COOKIE}=`));
}

function setAuthCookie() {
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `${AUTH_COOKIE}=1; Path=/; Max-Age=${maxAge}`;
}

function setRoleCookie(role: string) {
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `${ROLE_COOKIE}=${role}; Path=/; Max-Age=${maxAge}`;
}

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const from = searchParams.get('from') || '/';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('admin');
    const [rememberLogin, setRememberLogin] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (hasAuthCookie()) {
            router.replace(from);
        }
    }, [from, router]);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(LOGIN_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as { username?: string; password?: string; role?: string };
                if (parsed.username) {
                    setUsername(parsed.username);
                }
                if (parsed.password) {
                    setPassword(parsed.password);
                }
                if (parsed.role) {
                    setRole(parsed.role);
                }
                setRememberLogin(true);
            }
        } catch {
            // ignore invalid storage
        }
    }, []);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
            setAuthCookie();
            setRoleCookie(role);
            if (rememberLogin) {
                localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify({ username, password, role }));
            } else {
                localStorage.removeItem(LOGIN_STORAGE_KEY);
            }
            router.replace(from);
            return;
        }

        setError('Sai tài khoản hoặc mật khẩu.');
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
                                checked={rememberLogin}
                                onChange={(e) => setRememberLogin(e.target.checked)}
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
                    {rememberLogin && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                            Lưu ý: Mật khẩu sẽ được lưu trên máy này.
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
                        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                    >
                        Đăng nhập
                    </button>
                </form>

                <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/60 rounded-lg px-3 py-2">
                    Tài khoản mặc định: <span className="font-semibold">admin / admin123</span>
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
