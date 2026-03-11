// ═══ Admin Dashboard Logic — VisitorGate ═══
let allDepts = [];
let allStaff = [];
let allEvents = [];
let currentEventId = '';
let selectedRegs = new Set();

document.addEventListener('DOMContentLoaded', () => {
    loadOverview();
    showSection('overview');
});

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('sec-' + id).classList.add('active');
    document.querySelectorAll('.sidebar .nav a').forEach(a => a.classList.remove('active'));

    // Sidebar active state
    const currentLink = Array.from(document.querySelectorAll('.sidebar .nav a')).find(a => a.getAttribute('onclick')?.includes(`'${id}'`));
    if (currentLink) currentLink.classList.add('active');

    loadSectionData(id);
}

function loadSectionData(id) {
    switch (id) {
        case 'overview': loadOverview(); break;
        case 'departments': loadDepartments(); break;
        case 'staff': loadStaff(); break;
        case 'templates': loadTemplates(); break;
        case 'analytics': loadAnalytics(); break;
        case 'events': loadEvents(); break;
        case 'audit': loadAuditLogs(); break;
    }
}

// ═══ SEARCH & FILTERING ═══
function filterDepts() {
    const term = document.getElementById('dept-search').value.toLowerCase();
    const filtered = allDepts.filter(d =>
        d.name.toLowerCase().includes(term) ||
        d.code.toLowerCase().includes(term)
    );
    renderDeptsTable(filtered);
}

function filterStaff() {
    const term = document.getElementById('staff-search').value.toLowerCase();
    const filtered = allStaff.filter(u =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.staff_id && u.staff_id.toLowerCase().includes(term))
    );
    renderStaffTable(filtered);
}

// ═══ OVERVIEW ═══
async function loadOverview() {
    try {
        const [depts, users, inside, requests] = await Promise.all([
            api.get('/departments'),
            api.get('/users'),
            api.get('/checkins/active'),
            api.get('/visitor-requests/pending')
        ]);
        document.getElementById('ov-depts').textContent = depts.length;
        document.getElementById('ov-staff').textContent = users.filter(u => u.role === 'staff').length;
        document.getElementById('ov-inside').textContent = inside.length;
        document.getElementById('ov-visitors').textContent = requests.length;

        const recentEl = document.getElementById('recent-activity');
        if (requests.length) {
            recentEl.innerHTML = requests.slice(0, 5).map(r => `
                <div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <div class="fw-600 text-sm">${r.visitor_name}</div>
                        <div class="text-xs text-muted">Meeting: ${r.staff_name || 'Staff'}</div>
                    </div>
                    <span class="badge ${r.approval_status === 'APPROVED' ? 'badge-green' : r.approval_status === 'REJECTED' ? 'badge-red' : 'badge-yellow'}">${r.approval_status}</span>
                </div>
            `).join('');
        } else {
            recentEl.innerHTML = '<div class="text-center py-20 text-muted text-sm">No recent visitor requests</div>';
        }
    } catch (e) { console.error('Overview error:', e); }
}

// ═══ DEPARTMENTS ═══
async function loadDepartments() {
    try {
        allDepts = await api.get('/departments');
        renderDeptsTable(allDepts);
    } catch (e) { console.error('Departments error:', e); }
}

function renderDeptsTable(depts) {
    const tbody = document.getElementById('dept-tbody');
    if (!depts.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding:32px">No departments found</td></tr>';
        return;
    }
    tbody.innerHTML = depts.map(d => `
        <tr>
            <td class="fw-600">${d.name}</td>
            <td><code class="text-primary">${d.code}</code></td>
            <td><span class="badge ${d.is_active ? 'badge-green' : 'badge-red'}">${d.is_active ? 'Active' : 'Inactive'}</span></td>
            <td class="text-sm text-muted">${utils.formatDate(d.created_at)}</td>
            <td>
                <div class="flex-gap">
                    <button class="btn btn-ghost btn-xs" onclick="editDept('${d.id}')">✏️</button>
                    <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="deleteDept('${d.id}','${d.name.replace(/'/g, "\\'")}')">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ═══ STAFF ═══
async function loadStaff() {
    try {
        const [users, depts] = await Promise.all([api.get('/users'), api.get('/departments')]);
        allStaff = users.filter(u => u.role === 'staff');

        const deptMap = {};
        depts.forEach(d => deptMap[d.id] = d.name);
        window.deptMap = deptMap; // Store globally for render

        renderStaffTable(allStaff);
    } catch (e) { console.error('Staff error:', e); }
}

function renderStaffTable(staff) {
    const tbody = document.getElementById('staff-tbody');
    if (!staff.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding:32px">No staff members found</td></tr>';
        return;
    }
    tbody.innerHTML = staff.map(u => `
        <tr>
            <td><code class="text-muted">${u.staff_id || '—'}</code></td>
            <td class="fw-600">${u.name}</td>
            <td class="text-sm text-muted">${u.email}</td>
            <td class="text-sm">${window.deptMap[u.department_id] || '—'}</td>
            <td><span class="badge ${u.availability_status === 'available' ? 'badge-green' : 'badge-yellow'}">${u.availability_status || 'available'}</span></td>
            <td>
                <div class="flex-gap">
                    <button class="btn btn-ghost btn-xs" onclick="editStaff('${u.id}')">✏️</button>
                    <button class="btn btn-ghost btn-xs" style="color:var(--red)" onclick="deleteStaff('${u.id}','${u.name.replace(/'/g, "\\'")}')">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ═══ EVENTS & BULK ACTIONS ═══
async function loadEvents() {
    try {
        allEvents = await api.get('/events');
        allEvents = allEvents.filter(e => e.status !== 'CANCELLED');
        const el = document.getElementById('events-list');
        if (!allEvents.length) {
            el.innerHTML = '<div class="card text-center" style="grid-column:span 2;padding:48px"><p class="text-muted">No events created yet.</p></div>';
            return;
        }
        el.innerHTML = allEvents.map(e => `
            <div class="card mb-16">
                <div class="flex-between mb-12">
                    <div>
                        <h4 class="mb-4">${e.name}</h4>
                        <span class="badge ${e.status === 'ACTIVE' ? 'badge-green' : 'badge-red'} text-xs">${e.status}</span>
                    </div>
                    <div class="stat-icon" style="background:var(--primary-bg);color:var(--primary)">🎪</div>
                </div>
                <div class="text-sm text-muted mb-16">
                    📅 ${new Date(e.event_date).toLocaleDateString()} · 📍 ${e.venue || 'TBA'}
                </div>
                <div class="flex-gap">
                    <button class="btn btn-primary btn-sm" onclick="showEventQR('${e.qr_token}','${e.name}')">📱 QR</button>
                    <button class="btn btn-ghost btn-sm" onclick="viewEventRegistrations('${e.id}','${e.name}')">👥 Regs (${e.total_registrations || 0})</button>
                    <button class="btn btn-ghost btn-sm" onclick="editEvent('${e.id}')">✏️ Edit</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="deleteEvent('${e.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error('Events error:', e); }
}

async function viewEventRegistrations(eventId, eventName) {
    currentEventId = eventId;
    selectedRegs.clear();
    updateBulkBar();

    try {
        document.getElementById('evt-detail-title').textContent = 'Registrations: ' + eventName;
        const regs = await api.get('/event-registrations?event_id=' + eventId);
        const el = document.getElementById('event-registrations-list');

        if (!regs.length) {
            el.innerHTML = '<div class="text-center py-20 text-muted">No registrations yet</div>';
        } else {
            el.innerHTML = regs.map(r => {
                // Parse custom_data if string
                let customData = r.custom_data;
                if (typeof customData === 'string') { try { customData = JSON.parse(customData); } catch (e) { customData = null; } }

                // Build extra details from custom data
                let extraDetails = '';
                if (customData && typeof customData === 'object') {
                    const entries = Object.entries(customData).filter(([k, v]) => v && !['Full Name', 'Email Address', 'Phone Number'].includes(k));
                    if (entries.length) {
                        extraDetails = `<div class="text-xs text-muted" style="margin-top:6px; padding-top:6px; border-top:1px solid var(--border)">
                            ${entries.map(([k, v]) => `<span style="margin-right:12px"><b>${k}:</b> ${v}</span>`).join('')}
                        </div>`;
                    }
                }

                return `
                <div class="card mb-12 flex-align" style="gap:15px; padding:12px">
                    ${r.approval_status === 'PENDING' ? `
                        <input type="checkbox" onchange="toggleRegSelection('${r.id}')" ${selectedRegs.has(r.id) ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer">
                    ` : '<div style="width:18px"></div>'}
                    <div style="flex:1">
                        <div class="fw-600">${r.visitor_name}</div>
                        <div class="text-xs text-muted">${r.visitor_email || ''}${r.visitor_email && r.visitor_phone ? ' · ' : ''}${r.visitor_phone || ''}</div>
                        ${r.organization ? `<div class="text-xs text-muted">🏢 ${r.organization}${r.designation ? ' — ' + r.designation : ''}</div>` : ''}
                        ${extraDetails}
                    </div>
                    <span class="badge ${r.approval_status === 'APPROVED' ? 'badge-green' : r.approval_status === 'REJECTED' ? 'badge-red' : 'badge-yellow'}">${r.approval_status}</span>
                </div>
            `;
            }).join('');
        }
        document.getElementById('event-detail-panel').style.display = 'block';
    } catch (e) { alert('Failed to load registrations'); }
}

function toggleRegSelection(id) {
    if (selectedRegs.has(id)) selectedRegs.delete(id);
    else selectedRegs.add(id);
    updateBulkBar();
}

function updateBulkBar() {
    const bar = document.getElementById('bulk-actions-bar');
    const count = selectedRegs.size;
    bar.style.display = count > 0 ? 'flex' : 'none';
    document.getElementById('selected-count').textContent = `${count} selected`;
}

async function handleBulkAction(action) {
    if (selectedRegs.size === 0) return;
    const confirmMsg = `Are you sure you want to ${action} ${selectedRegs.size} registrations?`;
    if (!confirm(confirmMsg)) return;

    try {
        const ids = Array.from(selectedRegs);
        await api.post(`/event-registrations/bulk-${action}`, {
            ids,
            approved_by: auth.getUser()?.name || 'admin'
        });

        auth.showToast(`Successfully processed ${ids.length} registrations`, 'success');
        selectedRegs.clear();
        loadEvents();
        const eventName = document.getElementById('evt-detail-title').textContent.replace('Registrations: ', '');
        viewEventRegistrations(currentEventId, eventName);
    } catch (e) { alert('Bulk action failed: ' + e.message); }
}

// ═══ AUDIT LOGS ═══
async function loadAuditLogs() {
    try {
        const logs = await api.get('/audit-logs');
        document.getElementById('audit-list').innerHTML = logs.map(l => `
            <div class="mb-12 pb-12" style="border-bottom:1px solid var(--border)">
                <div class="flex-between mb-4">
                    <span class="fw-700 text-sm">${l.user_name || 'System'}</span>
                    <span class="text-xs text-muted">${utils.formatDate(l.created_at)}</span>
                </div>
                <div class="text-sm">Action: <span class="text-primary">${(l.action || '').replace(/_/g, ' ')}</span></div>
                <div class="text-xs text-muted">ID: ${l.entity_id || '—'}</div>
            </div>
        `).join('') || '<p class="text-muted text-sm text-center py-20">No audit logs found</p>';
    } catch (e) { console.error('Audit error:', e); }
}

// ═══ DEPT/STAFF/TEMPLATE HANDLERS (Simplified) ═══
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function openAddDept() {
    document.getElementById('dept-modal-title').textContent = 'Add Department';
    document.getElementById('dept-id').value = '';
    ['dept-name', 'dept-code', 'dept-desc'].forEach(id => document.getElementById(id).value = '');
    openModal('modal-dept');
}

async function editDept(id) {
    try {
        const d = await api.get('/departments/' + id);
        document.getElementById('dept-modal-title').textContent = 'Edit Department';
        document.getElementById('dept-id').value = d.id;
        document.getElementById('dept-name').value = d.name;
        document.getElementById('dept-code').value = d.code;
        document.getElementById('dept-desc').value = d.description || '';
        openModal('modal-dept');
    } catch (e) { alert('Failed to load department'); }
}

async function saveDept() {
    const id = document.getElementById('dept-id').value;
    const payload = {
        name: document.getElementById('dept-name').value.trim(),
        code: document.getElementById('dept-code').value.trim().toUpperCase(),
        description: document.getElementById('dept-desc').value.trim()
    };
    if (!payload.name || !payload.code) return alert('Name and Code required');
    try {
        if (id) await api.put('/departments/' + id, payload);
        else await api.post('/departments', payload);
        closeModal('modal-dept');
        loadDepartments();
        auth.showToast('Department saved', 'success');
    } catch (e) { alert('Failed to save: ' + e.message); }
}

async function deleteDept(id, name) {
    if (!confirm(`Delete department ${name}?`)) return;
    try {
        await api.del('/departments/' + id);
        loadDepartments();
        auth.showToast('Department deleted', 'success');
    } catch (e) { alert(e.message); }
}

// Staff handlers similarly... boilerplate removed for brevity in this view, 
// implementation includes full handlers for staff/templates/events as per existing structure.
// [RE-INCLUDING NECESSARY HANDLERS FOR STAFF TO ENSURE FUNCTIONALITY]

async function openAddStaff() {
    const depts = await api.get('/departments');
    document.getElementById('staff-dept').innerHTML = depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    document.getElementById('staff-id').value = '';
    ['staff-name', 'staff-staff-id', 'staff-email', 'staff-phone', 'staff-desg'].forEach(id => document.getElementById(id).value = '');
    openModal('modal-staff');
}

async function editStaff(id) {
    const [u, depts] = await Promise.all([api.get('/users'), api.get('/departments')]);
    const staff = u.find(x => x.id === id);
    document.getElementById('staff-dept').innerHTML = depts.map(d => `<option value="${d.id}" ${d.id === staff.department_id ? 'selected' : ''}>${d.name}</option>`).join('');
    document.getElementById('staff-id').value = staff.id;
    document.getElementById('staff-name').value = staff.name;
    document.getElementById('staff-staff-id').value = staff.staff_id || '';
    document.getElementById('staff-email').value = staff.email;
    document.getElementById('staff-phone').value = staff.phone || '';
    document.getElementById('staff-desg').value = staff.designation || '';
    document.getElementById('staff-role').value = staff.role;
    openModal('modal-staff');
}

async function saveStaff() {
    const id = document.getElementById('staff-id').value;
    const payload = {
        name: document.getElementById('staff-name').value,
        email: document.getElementById('staff-email').value,
        phone: document.getElementById('staff-phone').value,
        department_id: document.getElementById('staff-dept').value,
        designation: document.getElementById('staff-desg').value,
        staff_id: document.getElementById('staff-staff-id').value,
        role: document.getElementById('staff-role').value
    };
    try {
        if (id) await api.put('/users/' + id, payload);
        else await api.post('/users', payload);
        closeModal('modal-staff');
        loadStaff();
        auth.showToast('Staff saved', 'success');
    } catch (e) { alert(e.message); }
}

async function deleteStaff(id, name) {
    if (!confirm(`Delete ${name}?`)) return;
    try {
        await api.del('/users/' + id);
        loadStaff();
        auth.showToast('Staff removed', 'success');
    } catch (e) { alert(e.message); }
}

// ═══ TEMPLATES ═══
async function loadTemplates() {
    try {
        const templates = await api.get('/form-templates');
        const grid = document.getElementById('templates-grid');
        grid.innerHTML = templates.map(t => `
            <div class="card p-16">
                <h4 class="mb-8">${t.name}</h4>
                <p class="text-xs text-muted mb-16">${t.category}</p>
                <div class="flex-gap">
                    <button class="btn btn-ghost btn-sm" onclick="editTemplate('${t.id}')">Edit</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="deleteTemplate('${t.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error('Templates error:', e); }
}

async function editTemplate(id) {
    try {
        const t = await api.get('/form-templates/' + id);
        document.getElementById('tmpl-modal-title').textContent = 'Edit Template';
        document.getElementById('tmpl-id').value = t.id;
        document.getElementById('tmpl-name').value = t.name;
        document.getElementById('tmpl-category').value = t.category || 'other';
        document.getElementById('tmpl-desc').value = t.description || '';

        const list = document.getElementById('tmpl-fields-list');
        list.innerHTML = '';
        if (t.fields && Array.isArray(t.fields)) {
            t.fields.forEach(f => {
                addTmplField(f.id, f.label, f.type);
            });
        }
        openModal('modal-template');
    } catch (e) { alert('Failed to load template'); }
}

async function deleteTemplate(id) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
        await api.del('/form-templates/' + id);
        loadTemplates();
        auth.showToast('Template deleted', 'success');
    } catch (e) { alert(e.message); }
}

function openAddTemplate() {
    document.getElementById('tmpl-modal-title').textContent = 'Create Visitor Template';
    document.getElementById('tmpl-id').value = '';
    document.getElementById('tmpl-name').value = '';
    document.getElementById('tmpl-category').value = 'other';
    document.getElementById('tmpl-desc').value = '';
    document.getElementById('tmpl-fields-list').innerHTML = '';
    addTmplField('purpose', 'Purpose', 'text');
    openModal('modal-template');
}

function addTmplField(id = '', label = '', type = 'text') {
    const div = document.createElement('div');
    div.className = 'flex-gap mb-8';
    div.innerHTML = `
        <input class="field-id" placeholder="id" value="${id}" style="width:80px">
        <input class="field-label" placeholder="label" value="${label}" style="flex:1">
        <select class="field-type"><option value="text">Text</option><option value="select">Dropdown</option></select>
        <button onclick="this.parentElement.remove()" class="text-red">✕</button>
    `;
    document.getElementById('tmpl-fields-list').appendChild(div);
}

async function saveTemplate() {
    const id = document.getElementById('tmpl-id').value;
    const fields = [];
    document.querySelectorAll('#tmpl-fields-list .flex-gap').forEach(row => {
        fields.push({ id: row.querySelector('.field-id').value, label: row.querySelector('.field-label').value, type: row.querySelector('.field-type').value });
    });
    const payload = { name: document.getElementById('tmpl-name').value, category: document.getElementById('tmpl-category').value, description: document.getElementById('tmpl-desc').value, fields };
    try {
        if (id) await api.put('/form-templates/' + id, payload);
        else await api.post('/form-templates', payload);
        closeModal('modal-template');
        loadTemplates();
        auth.showToast('Template saved', 'success');
    } catch (e) { alert('Failed to save template: ' + e.message); }
}

// ═══ ANALYTICS ═══
async function loadAnalytics() {
    try {
        const stats = await api.get('/analytics/stats');
        const inside = await api.get('/checkins/active');
        const users = await api.get('/users');

        document.getElementById('analytics-stats').innerHTML = `
            <div class="card stat-card"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Requests</div></div>
            <div class="card stat-card"><div class="stat-value">${inside.length}</div><div class="stat-label">Currently Inside</div></div>
            <div class="card stat-card"><div class="stat-value">${users.filter(u => u.role === 'staff').length}</div><div class="stat-label">Staff Count</div></div>
            <div class="card stat-card"><div class="stat-value">${stats.approved}</div><div class="stat-label">Approved</div></div>
        `;

        renderCharts(stats);
    } catch (e) { console.error('Analytics error:', e); }
}

function renderCharts(stats) {
    const commonOptions = {
        chart: { foreColor: '#94a3b8', toolbar: { show: false } },
        theme: { mode: 'dark' },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    };

    // Clear previous charts
    document.getElementById('dept-chart').innerHTML = '';
    document.getElementById('purpose-chart').innerHTML = '';

    // Dept Chart
    new ApexCharts(document.getElementById('dept-chart'), {
        ...commonOptions,
        series: [{ name: 'Visitors', data: stats.dept_dist.map(d => d.count) }],
        chart: { ...commonOptions.chart, type: 'bar', height: 250 },
        plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
        xaxis: { categories: stats.dept_dist.map(d => d.name) },
        grid: { borderColor: 'rgba(255,255,255,0.05)' }
    }).render();

    // Purpose Chart
    new ApexCharts(document.getElementById('purpose-chart'), {
        ...commonOptions,
        series: stats.purpose_dist.map(p => p.count),
        labels: stats.purpose_dist.map(p => p.name),
        chart: { ...commonOptions.chart, type: 'donut', height: 250 },
        stroke: { show: false },
        legend: { position: 'bottom' },
        dataLabels: { enabled: false }
    }).render();
}

// ═══ EVENT HELPERS ═══

// Default fields seeded when creating a new event
const DEFAULT_EVENT_FIELDS = [
    { label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
    { label: 'Email Address', type: 'email', required: true, placeholder: 'your.email@example.com' },
    { label: 'Phone Number', type: 'phone', required: true, placeholder: '+91 9876543210' },
    { label: 'Organization / College', type: 'text', required: false, placeholder: 'Your organization name' },
    { label: 'Designation / Role', type: 'text', required: false, placeholder: 'e.g. Student, Professor' }
];

function addEventField(label = '', type = 'text', required = false, placeholder = '', options = '') {
    const container = document.getElementById('evt-fields-list');
    const div = document.createElement('div');
    div.className = 'evt-field-row';
    div.style.cssText = 'background:var(--bg-input); border:1px solid var(--border); border-radius:10px; padding:12px; margin-bottom:10px; position:relative;';
    div.innerHTML = `
        <div style="display:grid; grid-template-columns:1fr 120px 60px; gap:8px; margin-bottom:8px">
            <input class="ef-label" placeholder="Field label" value="${label}" style="font-size:13px; padding:8px 10px">
            <select class="ef-type" onchange="toggleFieldOptions(this)" style="font-size:13px; padding:8px 10px">
                <option value="text" ${type === 'text' ? 'selected' : ''}>Text</option>
                <option value="email" ${type === 'email' ? 'selected' : ''}>Email</option>
                <option value="phone" ${type === 'phone' ? 'selected' : ''}>Phone</option>
                <option value="number" ${type === 'number' ? 'selected' : ''}>Number</option>
                <option value="textarea" ${type === 'textarea' ? 'selected' : ''}>Textarea</option>
                <option value="select" ${type === 'select' ? 'selected' : ''}>Dropdown</option>
            </select>
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-size:12px;color:var(--text-muted)">
                <input type="checkbox" class="ef-required" ${required ? 'checked' : ''} style="width:16px;height:16px"> Req
            </label>
        </div>
        <div style="display:grid; grid-template-columns:1fr auto; gap:8px">
            <input class="ef-placeholder" placeholder="Placeholder text..." value="${placeholder}" style="font-size:12px; padding:6px 10px">
            <button type="button" onclick="this.closest('.evt-field-row').remove()" class="btn btn-ghost btn-xs" style="color:var(--red);padding:4px 8px">✕</button>
        </div>
        <div class="ef-options-row" style="margin-top:8px; ${type === 'select' ? '' : 'display:none'}">
            <input class="ef-options" placeholder="Comma-separated options, e.g. Student, Faculty, Guest" value="${options}" style="font-size:12px; padding:6px 10px">
        </div>
    `;
    container.appendChild(div);
}

function toggleFieldOptions(selectEl) {
    const row = selectEl.closest('.evt-field-row');
    const optRow = row.querySelector('.ef-options-row');
    optRow.style.display = selectEl.value === 'select' ? 'block' : 'none';
}

function collectEventFields() {
    const fields = [];
    document.querySelectorAll('#evt-fields-list .evt-field-row').forEach(row => {
        const label = row.querySelector('.ef-label').value.trim();
        if (!label) return;
        const field = {
            label,
            type: row.querySelector('.ef-type').value,
            required: row.querySelector('.ef-required').checked,
            placeholder: row.querySelector('.ef-placeholder').value.trim()
        };
        if (field.type === 'select') {
            field.options = row.querySelector('.ef-options').value.split(',').map(o => o.trim()).filter(Boolean);
        }
        fields.push(field);
    });
    return fields;
}

function openCreateEvent() {
    document.getElementById('evt-modal-title').textContent = 'Create New Event';
    document.getElementById('evt-save-btn').textContent = 'Create Event';
    document.getElementById('evt-id').value = '';
    ['evt-name-input', 'evt-desc-input', 'evt-date-input', 'evt-time-input', 'evt-venue-input'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('evt-max').value = '0';
    // Seed default fields
    document.getElementById('evt-fields-list').innerHTML = '';
    DEFAULT_EVENT_FIELDS.forEach(f => addEventField(f.label, f.type, f.required, f.placeholder));
    openModal('modal-event');
}

async function editEvent(id) {
    try {
        const events = await api.get('/events');
        const e = events.find(x => x.id === id);
        if (!e) return alert('Event not found');

        document.getElementById('evt-modal-title').textContent = 'Edit Event';
        document.getElementById('evt-save-btn').textContent = 'Save Changes';
        document.getElementById('evt-id').value = e.id;
        document.getElementById('evt-name-input').value = e.name || '';
        document.getElementById('evt-desc-input').value = e.description || '';
        // Fix date format: DB returns ISO timestamp but <input type="date"> needs yyyy-MM-dd
        const rawDate = e.event_date || '';
        document.getElementById('evt-date-input').value = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate.slice(0, 10);
        document.getElementById('evt-time-input').value = e.event_time || '';
        document.getElementById('evt-venue-input').value = e.venue || '';
        document.getElementById('evt-max').value = e.max_participants || 0;

        // Load custom fields
        document.getElementById('evt-fields-list').innerHTML = '';
        let fields = e.custom_fields;
        if (typeof fields === 'string') { try { fields = JSON.parse(fields); } catch (ex) { fields = null; } }

        if (fields && Array.isArray(fields) && fields.length > 0) {
            fields.forEach(f => addEventField(f.label, f.type, f.required, f.placeholder || '', (f.options || []).join(', ')));
        } else {
            // If no custom fields saved yet, use defaults
            DEFAULT_EVENT_FIELDS.forEach(f => addEventField(f.label, f.type, f.required, f.placeholder));
        }
        openModal('modal-event');
    } catch (e) { alert('Failed to load event: ' + e.message); }
}

async function saveEvent() {
    const id = document.getElementById('evt-id').value;
    const custom_fields = collectEventFields();
    const payload = {
        name: document.getElementById('evt-name-input').value.trim(),
        description: document.getElementById('evt-desc-input').value.trim(),
        event_date: document.getElementById('evt-date-input').value,
        event_time: document.getElementById('evt-time-input').value,
        venue: document.getElementById('evt-venue-input').value.trim(),
        max_participants: parseInt(document.getElementById('evt-max').value) || 0,
        custom_fields
    };
    if (!payload.name || !payload.event_date) return alert('Event name and date are required');
    try {
        if (id) await api.put('/events/' + id, payload);
        else await api.post('/events', payload);
        closeModal('modal-event');
        loadEvents();
        auth.showToast(id ? 'Event updated' : 'Event created', 'success');
    } catch (e) { alert('Failed to save event: ' + e.message); }
}

async function deleteEvent(id) {
    const evt = allEvents.find(x => x.id === id);
    const name = evt ? evt.name : 'this event';
    if (!confirm(`Delete "${name}"? This will cancel the event.`)) return;
    try {
        await api.del('/events/' + id);
        loadEvents();
        auth.showToast('Event deleted', 'success');
    } catch (e) { alert('Failed to delete event: ' + e.message); }
}

async function showEventQR(token, name) {
    const info = await api.get('/server-info');
    const url = `${info.base_url || window.location.origin}/event-register.html?event=${token}`;
    const qr = await api.get('/qr/generate?url=' + encodeURIComponent(url));
    document.getElementById('modal-evt-qr-img').src = qr.qr_image;
    document.getElementById('modal-evt-qr-url').textContent = url;
    openModal('modal-event-qr');
}

function handleLogout() { auth.logout(); }

