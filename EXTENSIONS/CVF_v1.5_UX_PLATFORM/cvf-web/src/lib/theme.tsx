'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load saved theme preference
        const saved = localStorage.getItem('cvf_theme') as Theme;
        if (saved && (saved === 'light' || saved === 'dark')) {
            setThemeState(saved);
            applyTheme(saved);
        } else {
            // Default to dark mode
            applyTheme('dark');
        }
    }, []);

    const applyTheme = (newTheme: Theme) => {
        if (typeof document !== 'undefined') {
            if (newTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('cvf_theme', newTheme);
        applyTheme(newTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, mounted }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Theme toggle component
export function ThemeToggle() {
    const { theme, toggleTheme, mounted } = useTheme();

    // Prevent hydration mismatch - render placeholder until mounted
    if (!mounted) {
        return (
            <button
                className="px-3 py-2 text-sm font-medium text-gray-400 transition-colors flex items-center gap-1"
                disabled
            >
                🌙
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </button>
    );
}

