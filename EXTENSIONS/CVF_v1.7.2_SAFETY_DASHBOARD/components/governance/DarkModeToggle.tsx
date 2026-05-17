// components/governance/DarkModeToggle.tsx
"use client";

import { useState, useEffect } from "react";

export default function DarkModeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("cvf_dark_mode");
        if (stored === "true") {
            setIsDark(true);
            document.documentElement.classList.add("dark");
        }
    }, []);

    const toggle = () => {
        const next = !isDark;
        setIsDark(next);
        if (next) {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
        localStorage.setItem("cvf_dark_mode", String(next));
    };

    return (
        <button
            onClick={toggle}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
            title={isDark ? "Light Mode" : "Dark Mode"}
        >
            {isDark ? "☀️" : "🌙"}
        </button>
    );
}
