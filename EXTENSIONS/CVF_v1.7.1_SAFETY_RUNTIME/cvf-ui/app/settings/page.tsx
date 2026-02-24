"use client"

import { useState } from "react"

interface SettingsSection {
  label: string
  key: string
  value: string
  type: "text" | "number" | "select"
  options?: string[]
  description: string
}

const settingsConfig: SettingsSection[] = [
  { label: "Default Provider", key: "defaultProvider", value: "OPENCLAW", type: "select", options: ["OPENCLAW", "DIRECT_LLM", "LOCAL"], description: "Primary AI provider for generation" },
  { label: "Max Tokens / Day", key: "maxTokens", value: "100000", type: "number", description: "Daily token budget across all providers" },
  { label: "Max Cost / Day (USD)", key: "maxCost", value: "50", type: "number", description: "Daily spending limit" },
  { label: "Rate Limit (API)", key: "rateLimitApi", value: "30", type: "number", description: "Max API requests per minute" },
  { label: "Rate Limit (AI)", key: "rateLimitAi", value: "10", type: "number", description: "Max AI generation requests per minute" },
  { label: "JWT Expiry (seconds)", key: "jwtExpiry", value: "3600", type: "number", description: "Token expiration time" },
  { label: "OpenAI API Key", key: "openaiKey", value: "sk-••••••••", type: "text", description: "OpenAI API key (stored securely)" },
]

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--cvf-bg-input)",
  border: "1px solid var(--cvf-border)",
  borderRadius: "var(--cvf-radius-sm)",
  color: "var(--cvf-text-primary)",
  fontSize: "14px",
  outline: "none",
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(
    Object.fromEntries(settingsConfig.map((s) => [s.key, s.value]))
  )
  const [saved, setSaved] = useState(false)

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    // In production: POST to /api/settings
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="cvf-animate-in">
      <div className="cvf-page-header">
        <h1 className="cvf-page-title">AI Settings</h1>
        <p className="cvf-page-subtitle">Configure AI providers, rate limits, and security</p>
      </div>

      <div className="cvf-card" style={{ maxWidth: "700px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {settingsConfig.map((cfg) => (
            <div key={cfg.key}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "var(--cvf-text-primary)", marginBottom: "6px" }}>
                {cfg.label}
              </label>
              <p style={{ fontSize: "12px", color: "var(--cvf-text-muted)", marginBottom: "8px" }}>{cfg.description}</p>

              {cfg.type === "select" ? (
                <select
                  value={settings[cfg.key]}
                  onChange={(e) => handleChange(cfg.key, e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {cfg.options?.map((opt) => (
                    <option key={opt} value={opt} style={{ background: "var(--cvf-bg-card)" }}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={cfg.type}
                  value={settings[cfg.key]}
                  onChange={(e) => handleChange(cfg.key, e.target.value)}
                  style={inputStyle}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "32px", display: "flex", alignItems: "center", gap: "16px" }}>
          <button className="cvf-btn cvf-btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          {saved && (
            <span style={{ color: "var(--cvf-success)", fontSize: "14px" }}>
              ✓ Settings saved
            </span>
          )}
        </div>
      </div>
    </div>
  )
}