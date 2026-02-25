import Sidebar from "../components/Sidebar"
import "../styles/design-system.css"

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <title>CVF Dashboard — Controlled Vibe Framework</title>
                <meta name="description" content="AI governance dashboard for the Controlled Vibe Framework" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <div className="cvf-layout">
                    <Sidebar />
                    <main className="cvf-main">{children}</main>
                </div>
            </body>
        </html>
    )
}
