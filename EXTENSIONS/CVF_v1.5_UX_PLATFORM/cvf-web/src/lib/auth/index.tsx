'use client';

import { createContext, useContext, ReactNode, useState, useCallback } from 'react';

// Placeholder user type for future implementation
export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'user' | 'admin' | 'enterprise';
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider - Placeholder for future authentication system
 * 
 * Current implementation: localStorage-based guest mode
 * Future plans:
 * - SSO integration (Google, Microsoft, SAML)
 * - JWT token management
 * - Role-based access control
 * - Team/organization management
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = useCallback(async (email: string, password: string) => {
        setIsLoading(true);
        // Placeholder - simulate login delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In production, this would call an auth API
        console.log('Login placeholder:', { email });

        // For now, create a mock user
        setUser({
            id: 'guest_' + Date.now(),
            email,
            name: email.split('@')[0],
            role: 'user',
        });

        setIsLoading(false);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('cvf_auth_token');
        }
    }, []);

    const register = useCallback(async (email: string, password: string, name: string) => {
        setIsLoading(true);
        // Placeholder - simulate registration
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('Register placeholder:', { email, name });

        setUser({
            id: 'user_' + Date.now(),
            email,
            name,
            role: 'user',
        });

        setIsLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            register,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

/**
 * LoginPlaceholder - UI component showing auth is coming soon
 */
export function LoginPlaceholder() {
    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-center">
                <span className="text-4xl mb-4 block">🔐</span>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Đăng nhập (Coming Soon)
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Tính năng đăng nhập và quản lý người dùng sẽ sớm ra mắt.
                    Hiện tại bạn đang sử dụng chế độ local storage.
                </p>
                <div className="flex gap-2 justify-center">
                    <button
                        disabled
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                    >
                        Đăng nhập
                    </button>
                    <button
                        disabled
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
                    >
                        Đăng ký
                    </button>
                </div>
            </div>
        </div>
    );
}
