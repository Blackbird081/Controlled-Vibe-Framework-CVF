// CVF Dashboard Application

// State
let capabilities = [];
let auditLogs = [];
let baseAuditLogs = [];
let dashboardAuditLogs = [];

const DASHBOARD_AUDIT_STORAGE_KEY = 'cvf_dashboard_audit_logs';
const DASHBOARD_ACTOR = 'dashboard_ui';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    addDashboardAuditLog('dashboard_open', { tab: 'overview' });
    setupEventListeners();
    setupAutoRefresh();
});

// Load data
function loadData() {
    if (window.cvfData) {
        capabilities = window.cvfData.capabilities;
        baseAuditLogs = window.cvfData.auditLogs;
    }
    dashboardAuditLogs = loadDashboardAuditLogs();
    auditLogs = mergeAuditLogs(baseAuditLogs, dashboardAuditLogs);
    renderAll();
}

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.dataset.tab;
            switchTab(tab);
        });
    });

    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(link.dataset.tab);
        });
    });

    // Filters
    document.getElementById('capability-search')?.addEventListener('input', filterCapabilities);
    document.getElementById('state-filter')?.addEventListener('change', filterCapabilities);
    document.getElementById('risk-filter')?.addEventListener('change', filterCapabilities);

    document.getElementById('audit-search')?.addEventListener('input', filterAuditLogs);
    document.getElementById('audit-capability-filter')?.addEventListener('change', filterAuditLogs);
    document.getElementById('audit-status-filter')?.addEventListener('change', filterAuditLogs);
}

// Setup auto refresh
function setupAutoRefresh() {
    const autoRefresh = document.getElementById('auto-refresh');
    if (autoRefresh?.checked) {
        setInterval(refreshData, 30000);
    }
}

function loadDashboardAuditLogs() {
    if (typeof localStorage === 'undefined') return [];
    try {
        const raw = localStorage.getItem(DASHBOARD_AUDIT_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveDashboardAuditLogs(logs) {
    if (typeof localStorage === 'undefined') return;
    const trimmed = logs.slice(-500);
    localStorage.setItem(DASHBOARD_AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
}

function mergeAuditLogs(baseLogs, dashboardLogs) {
    const merged = [...(baseLogs || []), ...(dashboardLogs || [])];
    return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function addDashboardAuditLog(action, details = {}, capabilityId = 'DASHBOARD_ACCESS') {
    const entry = {
        id: `dashboard-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        capability_id: capabilityId,
        version: 'ui',
        actor: DASHBOARD_ACTOR,
        inputs: { action, ...details },
        outputs: null,
        success: true,
        duration_ms: 0,
        context: { category: 'dashboard', action }
    };

    dashboardAuditLogs.push(entry);
    saveDashboardAuditLogs(dashboardAuditLogs);
    auditLogs = mergeAuditLogs(baseAuditLogs, dashboardAuditLogs);

    renderAuditTable();
    populateFilters();
}

function getExecutionLogs() {
    return auditLogs.filter(log => log.context?.category !== 'dashboard');
}

// Switch tab
function switchTab(tabId) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabId);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.toggle('active', tab.id === `tab-${tabId}`);
    });

    // Update title
    const titles = {
        'overview': 'Overview',
        'capabilities': 'Capabilities',
        'audit': 'Audit Logs',
        'risks': 'Risk Analysis',
        'settings': 'Settings'
    };
    document.getElementById('page-title').textContent = titles[tabId] || 'Dashboard';
}

// Refresh data
function refreshData() {
    loadData();
    addDashboardAuditLog('refresh');
    showNotification('Data refreshed');
}

// Render all
function renderAll() {
    renderStats();
    renderRiskDistribution();
    renderExecutionStats();
    renderRecentActivity();
    renderCapabilitiesTable();
    renderAuditTable();
    renderRiskAnalysis();
    populateFilters();
}

// Render stats
function renderStats() {
    const counts = {
        active: capabilities.filter(c => c.state === 'ACTIVE').length,
        proposed: capabilities.filter(c => c.state === 'PROPOSED' || c.state === 'APPROVED').length,
        deprecated: capabilities.filter(c => c.state === 'DEPRECATED').length,
        retired: capabilities.filter(c => c.state === 'RETIRED').length
    };

    document.getElementById('stat-active').textContent = counts.active;
    document.getElementById('stat-proposed').textContent = counts.proposed;
    document.getElementById('stat-deprecated').textContent = counts.deprecated;
    document.getElementById('stat-retired').textContent = counts.retired;
}

// Render risk distribution
function renderRiskDistribution() {
    const total = capabilities.length || 1;
    const riskCounts = {
        R0: capabilities.filter(c => c.risk_level === 'R0').length,
        R1: capabilities.filter(c => c.risk_level === 'R1').length,
        R2: capabilities.filter(c => c.risk_level === 'R2').length,
        R3: capabilities.filter(c => c.risk_level === 'R3').length
    };

    ['R0', 'R1', 'R2', 'R3'].forEach(level => {
        const lowerLevel = level.toLowerCase();
        const percent = (riskCounts[level] / total) * 100;
        document.getElementById(`risk-${lowerLevel}`).style.width = `${percent}%`;
        document.getElementById(`risk-${lowerLevel}-count`).textContent = riskCounts[level];
    });
}

// Render execution stats
function renderExecutionStats() {
    const executionLogs = getExecutionLogs();
    const successful = executionLogs.filter(l => l.success).length;
    const total = executionLogs.length || 1;
    const successRate = ((successful / total) * 100).toFixed(1);

    const avgDuration = executionLogs.length > 0
        ? (executionLogs.reduce((sum, l) => sum + l.duration_ms, 0) / executionLogs.length).toFixed(0)
        : 0;

    document.getElementById('exec-success-rate').textContent = `${successRate}%`;
    document.getElementById('exec-avg-duration').textContent = `${avgDuration}ms`;
    document.getElementById('exec-total').textContent = executionLogs.length;
}

// Render recent activity
function renderRecentActivity() {
    const container = document.getElementById('recent-activity');
    const recent = getExecutionLogs().slice(0, 5);

    container.innerHTML = recent.map(log => `
        <div class="activity-item">
            <div class="activity-icon ${log.success ? 'success' : 'failed'}">
                ${log.success ? '✅' : '❌'}
            </div>
            <div class="activity-info">
                <div class="activity-title">${log.capability_id}</div>
                <div class="activity-meta">Actor: ${log.actor}</div>
            </div>
            <div class="activity-time">${formatTime(log.timestamp)}</div>
        </div>
    `).join('');
}

// Render capabilities table
function renderCapabilitiesTable(filtered = null) {
    const data = filtered || capabilities;
    const showRetired = document.getElementById('show-retired')?.checked ?? true;
    const displayData = showRetired ? data : data.filter(c => c.state !== 'RETIRED');

    const tbody = document.getElementById('capabilities-tbody');
    tbody.innerHTML = displayData.map(cap => `
        <tr>
            <td><strong>${cap.capability_id}</strong></td>
            <td>${cap.domain}</td>
            <td><span class="badge badge-${cap.risk_level.toLowerCase()}">${cap.risk_level}</span></td>
            <td><span class="badge badge-${cap.state.toLowerCase()}">${cap.state}</span></td>
            <td>${cap.owner}</td>
            <td>${formatDate(cap.last_audit)}</td>
            <td>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px" onclick="viewCapability('${cap.capability_id}')">View</button>
            </td>
        </tr>
    `).join('');
}

// Render audit table
function renderAuditTable(filtered = null) {
    const data = filtered || auditLogs;

    const tbody = document.getElementById('audit-tbody');
    tbody.innerHTML = data.map(log => `
        <tr>
            <td>${formatDateTime(log.timestamp)}</td>
            <td>${log.capability_id}</td>
            <td>${log.actor}</td>
            <td><span class="badge badge-${log.success ? 'success' : 'failed'}">${log.success ? 'SUCCESS' : 'FAILED'}</span></td>
            <td>${log.duration_ms}ms</td>
            <td>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px" onclick="viewAuditLog('${log.id}')">Details</button>
            </td>
        </tr>
    `).join('');
}

// Render risk analysis
function renderRiskAnalysis() {
    ['R0', 'R1', 'R2', 'R3'].forEach(level => {
        const caps = capabilities.filter(c => c.risk_level === level && c.state === 'ACTIVE');
        const container = document.getElementById(`${level.toLowerCase()}-capabilities`);
        container.innerHTML = caps.map(c => `
            <span class="capability-chip" onclick="viewCapability('${c.capability_id}')">${c.capability_id}</span>
        `).join('');
    });
}

// Populate filters
function populateFilters() {
    const select = document.getElementById('audit-capability-filter');
    if (select) {
        const uniqueCaps = [...new Set(auditLogs.map(l => l.capability_id))];
        select.innerHTML = '<option value="">All Capabilities</option>' +
            uniqueCaps.map(c => `<option value="${c}">${c}</option>`).join('');
    }
}

// Filter capabilities
function filterCapabilities() {
    const search = document.getElementById('capability-search').value.toLowerCase();
    const stateFilter = document.getElementById('state-filter').value;
    const riskFilter = document.getElementById('risk-filter').value;

    const filtered = capabilities.filter(cap => {
        const matchSearch = cap.capability_id.toLowerCase().includes(search) ||
            cap.domain.toLowerCase().includes(search) ||
            cap.description.toLowerCase().includes(search);
        const matchState = !stateFilter || cap.state === stateFilter;
        const matchRisk = !riskFilter || cap.risk_level === riskFilter;
        return matchSearch && matchState && matchRisk;
    });

    renderCapabilitiesTable(filtered);
}

// Filter audit logs
function filterAuditLogs() {
    const search = document.getElementById('audit-search').value.toLowerCase();
    const capFilter = document.getElementById('audit-capability-filter').value;
    const statusFilter = document.getElementById('audit-status-filter').value;

    const filtered = auditLogs.filter(log => {
        const matchSearch = log.capability_id.toLowerCase().includes(search) ||
            log.actor.toLowerCase().includes(search);
        const matchCap = !capFilter || log.capability_id === capFilter;
        const matchStatus = !statusFilter ||
            (statusFilter === 'SUCCESS' && log.success) ||
            (statusFilter === 'FAILED' && !log.success);
        return matchSearch && matchCap && matchStatus;
    });

    renderAuditTable(filtered);
}

// View capability details
function viewCapability(id) {
    const cap = capabilities.find(c => c.capability_id === id);
    if (!cap) return;

    const content = `
        <div style="display: grid; gap: 16px;">
            <div>
                <strong>Capability ID:</strong> ${cap.capability_id}
            </div>
            <div>
                <strong>Description:</strong> ${cap.description}
            </div>
            <div>
                <strong>Domain:</strong> ${cap.domain}
            </div>
            <div>
                <strong>Risk Level:</strong> <span class="badge badge-${cap.risk_level.toLowerCase()}">${cap.risk_level}</span>
            </div>
            <div>
                <strong>State:</strong> <span class="badge badge-${cap.state.toLowerCase()}">${cap.state}</span>
            </div>
            <div>
                <strong>Owner:</strong> ${cap.owner}
            </div>
            <div>
                <strong>Version:</strong> ${cap.version}
            </div>
            <div>
                <strong>Last Audit:</strong> ${formatDateTime(cap.last_audit)}
            </div>
            ${cap.deprecation_reason ? `
                <div style="background: rgba(245,158,11,0.1); padding: 12px; border-radius: 8px;">
                    <strong>⚠️ Deprecation Reason:</strong> ${cap.deprecation_reason}
                </div>
            ` : ''}
            <div>
                <strong>Lifecycle Transitions:</strong>
                <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">
                    ${cap.transitions.map(t => `
                        <div style="background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 6px; font-size: 13px;">
                            <span class="badge badge-${t.from.toLowerCase()}">${t.from}</span>
                            → 
                            <span class="badge badge-${t.to.toLowerCase()}">${t.to}</span>
                            <span style="color: var(--text-muted); margin-left: 8px;">${t.actor} • ${formatDateTime(t.timestamp)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    showModal(`Capability: ${cap.capability_id}`, content);
}

// View audit log details
function viewAuditLog(id) {
    const log = auditLogs.find(l => l.id === id);
    if (!log) return;

    const content = `
        <div style="display: grid; gap: 16px;">
            <div>
                <strong>Log ID:</strong> ${log.id}
            </div>
            <div>
                <strong>Timestamp:</strong> ${formatDateTime(log.timestamp)}
            </div>
            <div>
                <strong>Capability:</strong> ${log.capability_id} v${log.version}
            </div>
            <div>
                <strong>Actor:</strong> ${log.actor}
            </div>
            <div>
                <strong>Status:</strong> <span class="badge badge-${log.success ? 'success' : 'failed'}">${log.success ? 'SUCCESS' : 'FAILED'}</span>
            </div>
            <div>
                <strong>Duration:</strong> ${log.duration_ms}ms
            </div>
            ${log.error ? `
                <div style="background: rgba(239,68,68,0.1); padding: 12px; border-radius: 8px;">
                    <strong>❌ Error:</strong> ${log.error}
                </div>
            ` : ''}
            <div>
                <strong>Inputs:</strong>
                <pre style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; overflow: auto; font-size: 12px;">${JSON.stringify(log.inputs, null, 2)}</pre>
            </div>
            <div>
                <strong>Outputs:</strong>
                <pre style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; overflow: auto; font-size: 12px;">${JSON.stringify(log.outputs, null, 2)}</pre>
            </div>
            <div>
                <strong>Context:</strong>
                <pre style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; overflow: auto; font-size: 12px;">${JSON.stringify(log.context, null, 2)}</pre>
            </div>
        </div>
    `;

    showModal(`Audit Log: ${log.id}`, content);
}

// Show modal
function showModal(title, content) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Show add capability modal
function showAddCapabilityModal() {
    const content = `
        <form id="add-capability-form" style="display: grid; gap: 16px;">
            <div>
                <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Capability ID</label>
                <input type="text" name="capability_id" placeholder="CAPABILITY_NAME_v1" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: var(--bg-secondary); color: var(--text-primary);">
            </div>
            <div>
                <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Domain</label>
                <input type="text" name="domain" placeholder="development" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: var(--bg-secondary); color: var(--text-primary);">
            </div>
            <div>
                <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Description</label>
                <textarea name="description" placeholder="What does this capability do?" rows="3" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: var(--bg-secondary); color: var(--text-primary);"></textarea>
            </div>
            <div>
                <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Risk Level</label>
                <select name="risk_level" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: var(--bg-secondary); color: var(--text-primary);">
                    <option value="R0">R0 - Passive</option>
                    <option value="R1" selected>R1 - Controlled</option>
                    <option value="R2">R2 - Elevated</option>
                    <option value="R3">R3 - Critical</option>
                </select>
            </div>
            <div>
                <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">Owner</label>
                <input type="text" name="owner" placeholder="team-name" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: var(--bg-secondary); color: var(--text-primary);">
            </div>
            <button type="submit" class="btn btn-primary">Create Capability (PROPOSED)</button>
        </form>
    `;

    showModal('Add New Capability', content);

    document.getElementById('add-capability-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newCap = {
            capability_id: formData.get('capability_id'),
            domain: formData.get('domain'),
            description: formData.get('description'),
            risk_level: formData.get('risk_level'),
            version: '1.0',
            state: 'PROPOSED',
            owner: formData.get('owner'),
            registered_by: 'dashboard@example.com',
            last_audit: null,
            transitions: []
        };
        capabilities.push(newCap);
        addDashboardAuditLog('capability_created', { state: 'PROPOSED' }, newCap.capability_id);
        renderAll();
        closeModal();
        showNotification('Capability created in PROPOSED state');
    });
}

// Export data
function exportData() {
    const data = {
        capabilities: capabilities,
        auditLogs: auditLogs,
        exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cvf-dashboard-export-${formatDateForFile(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addDashboardAuditLog('export_data', { count: auditLogs.length });
}

// Import data
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.capabilities) capabilities = data.capabilities;
            if (data.auditLogs) baseAuditLogs = data.auditLogs;
            auditLogs = mergeAuditLogs(baseAuditLogs, dashboardAuditLogs);
            renderAll();
            addDashboardAuditLog('import_data', { count: auditLogs.length });
            showNotification('Data imported successfully');
        } catch (err) {
            showNotification('Failed to import data: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Load data from paths (settings)
function loadDataFromPaths() {
    const registryPath = document.getElementById('registry-path').value;
    const auditPath = document.getElementById('audit-path').value;

    // In a real implementation, this would fetch from the specified paths
    // For now, show a notification
    showNotification(`Would load from:\n• ${registryPath}\n• ${auditPath}\n\nUsing sample data for demo.`);
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple notification - could be enhanced with a toast library
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Utility functions
function formatTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateForFile(date) {
    return date.toISOString().slice(0, 10);
}

// Close modal on outside click
document.getElementById('modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
        closeModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});
