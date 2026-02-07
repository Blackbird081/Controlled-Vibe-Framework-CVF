'use client';

import React, { Component, ReactNode } from 'react';
import { captureError } from '@/lib/monitoring';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

// Error Boundary Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        captureError(error, { componentStack: errorInfo.componentStack });
        this.setState({ errorInfo });
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[200px] flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h2 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
                            Oops! Something went wrong
                        </h2>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <button
                            onClick={this.handleRetry}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                        >
                            🔄 Try Again
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details className="mt-4 text-left">
                                <summary className="text-xs text-red-500 cursor-pointer">
                                    Stack Trace (dev only)
                                </summary>
                                <pre className="mt-2 text-xs overflow-auto max-h-32 bg-red-100 dark:bg-red-900/50 p-2 rounded">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Async error handler with retry logic
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        delayMs?: number;
        backoffMultiplier?: number;
        onRetry?: (attempt: number, error: Error) => void;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        delayMs = 1000,
        backoffMultiplier = 2,
        onRetry
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < maxRetries) {
                onRetry?.(attempt, lastError);
                const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError;
}

// Toast notification system
export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

let toastListeners: ((toasts: ToastMessage[]) => void)[] = [];
let currentToasts: ToastMessage[] = [];

export function addToast(toast: Omit<ToastMessage, 'id'>) {
    const id = `toast_${Date.now()}`;
    const newToast: ToastMessage = { ...toast, id };
    currentToasts = [...currentToasts, newToast];
    toastListeners.forEach(listener => listener(currentToasts));

    // Auto remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
        removeToast(id);
    }, duration);

    return id;
}

export function removeToast(id: string) {
    currentToasts = currentToasts.filter(t => t.id !== id);
    toastListeners.forEach(listener => listener(currentToasts));
}

export function subscribeToasts(listener: (toasts: ToastMessage[]) => void) {
    toastListeners.push(listener);
    return () => {
        toastListeners = toastListeners.filter(l => l !== listener);
    };
}

// Toast Container Component
export function ToastContainer() {
    const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

    React.useEffect(() => {
        return subscribeToasts(setToasts);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`p-4 rounded-lg shadow-lg flex items-start gap-3 animate-slide-in ${toast.type === 'success' ? 'bg-green-500 text-white' :
                            toast.type === 'error' ? 'bg-red-500 text-white' :
                                toast.type === 'warning' ? 'bg-amber-500 text-white' :
                                    'bg-blue-500 text-white'
                        }`}
                >
                    <span className="text-lg">
                        {toast.type === 'success' && '✓'}
                        {toast.type === 'error' && '✗'}
                        {toast.type === 'warning' && '⚠️'}
                        {toast.type === 'info' && 'ℹ️'}
                    </span>
                    <p className="flex-1 text-sm">{toast.message}</p>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-white/80 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}

// API Error handler
export function handleAPIError(error: unknown): string {
    if (error instanceof Error) {
        // Network errors
        if (error.message.includes('fetch') || error.message.includes('network')) {
            return 'Network error. Please check your connection.';
        }
        // Timeout
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
            return 'Request timed out. Please try again.';
        }
        // Rate limit
        if (error.message.includes('429') || error.message.includes('rate limit')) {
            return 'Too many requests. Please wait a moment.';
        }
        // Auth errors
        if (error.message.includes('401') || error.message.includes('unauthorized') || error.message.includes('API key')) {
            return 'Authentication failed. Check your API key.';
        }
        // Generic API error
        if (error.message.includes('API') || error.message.includes('server')) {
            return 'API error. Please try again later.';
        }
        return error.message;
    }
    return 'An unexpected error occurred.';
}

// Loading state component
export function LoadingSpinner({ size = 'md', message }: { size?: 'sm' | 'md' | 'lg'; message?: string }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`} />
            {message && <p className="text-sm text-gray-500">{message}</p>}
        </div>
    );
}

// Empty state component
export function EmptyState({
    icon = '📭',
    title,
    description,
    action
}: {
    icon?: string;
    title: string;
    description?: string;
    action?: ReactNode
}) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <span className="text-4xl mb-4">{icon}</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
            {action}
        </div>
    );
}
