"use client";

import { ReactNode } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "react-hot-toast";

export default function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <ErrorBoundary>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        fontSize: "0.875rem",
                        borderRadius: "0.75rem",
                        padding: "8px 14px",
                    },
                }}
            />
        </ErrorBoundary>
    );
}
