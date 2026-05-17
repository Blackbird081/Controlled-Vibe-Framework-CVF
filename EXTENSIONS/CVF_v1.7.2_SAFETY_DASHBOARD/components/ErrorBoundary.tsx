"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[CVF ErrorBoundary]", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full space-y-4 border border-red-200">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">⚠️</span>
                            <h2 className="text-lg font-bold text-red-700">
                                Đã xảy ra lỗi
                            </h2>
                        </div>
                        <p className="text-sm text-gray-600">
                            Ứng dụng gặp lỗi không mong muốn. Vui lòng tải lại trang.
                        </p>
                        {this.state.error && (
                            <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-32 text-red-600">
                                {this.state.error.message}
                            </pre>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition w-full"
                        >
                            Tải lại trang
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
