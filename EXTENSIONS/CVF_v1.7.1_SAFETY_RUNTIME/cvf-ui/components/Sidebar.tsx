import Link from "next/link"

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/proposals", label: "Proposals", icon: "📋" },
  { href: "/policies", label: "Policies", icon: "🛡️" },
  { href: "/audit", label: "Audit Log", icon: "📜" },
  { href: "/execution", label: "Execution", icon: "⚡" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
]

export default function Sidebar() {
  return (
    <aside className="cvf-sidebar">
      <div className="cvf-logo">◆ CVF Dashboard</div>
      <nav>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="cvf-nav-item">
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
