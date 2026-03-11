let selectedTemplate = null;
let lastQrData = null;
const categoryIcons = { parent: '👨‍👩‍👧‍👦', admission: '🎓', vendor: '🚚', meeting: '👔', document: '📄', event: '🎉', other: '➕' };

// Get security user ID from auth
function getSecurityId() {
    const user = window.auth ? auth.getUser() : null;
    return user ? user.id : 'sec-user-111';
}

document.addEventListener('DOMContentLoaded', () => {
    loadAll();
    setInterval(loadAll, 5000);
});

async function loadAll() {
    loadStats();
    loadPending();
    loadInside();
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('sec-' + id).classList.add('active');
    document.querySelectorAll('.sidebar .nav a').forEach(a => a.classList.remove('active'));
    if (event && event.target) {
        const link = event.target.closest('a');
        if (link) link.classList.add('active');
    }
    if (id === 'categories' && !document.getElementById('category-grid').children.length) loadCategories();
}

// ═══ STATS ═══
async function loadStats() {
    try {
        const [pending, inside, templates] = await Promise.all([
            api.get('/visitor-requests/pending'),
            api.get('/checkins/active'),
            api.get('/form-templates')
        ]);
        const pendingCount = pending.filter(r => r.approval_status === 'PENDING').length;
        const approvedCount = pending.filter(r => r.approval_status === 'APPROVED').length;
        document.getElementById('stat-pending').textContent = pendingCount;
        document.getElementById('stat-approved').textContent = approvedCount;
        document.getElementById('stat-inside').textContent = inside.length;
        document.getElementById('stat-templates').textContent = templates.length;
        document.getElementById('nav-pending-count').textContent = pendingCount;
        document.getElementById('nav-inside-count').textContent = inside.length;
    } catch (e) { console.error('Stats error:', e); }
}

// ═══ CATEGORIES ═══
async function loadCategories() {
    try {
        const templates = await api.get('/form-templates');
        const grid = document.getElementById('category-grid');
        if (!templates.length) {
            grid.innerHTML = '<div class="card text-center" style="padding:48px;grid-column:span 3"><span style="font-size:48px">📝</span><p class="text-muted mt-16">No templates available. Ask admin to create templates first.</p></div>';
            return;
        }
        grid.innerHTML = templates.map(t => `
            <div class="card category-card" onclick="selectCategory('${t.id}','${t.category}', this)" data-id="${t.id}">
                <span class="emoji">${categoryIcons[t.category] || '📋'}</span>
                <span class="name">${t.name}</span>
                <p class="text-xs text-muted" style="margin-top:6px">${t.category}</p>
            </div>
        `).join('');
    } catch (e) { console.error('Category error:', e); }
}

function selectCategory(templateId, category, el) {
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedTemplate = { id: templateId, category };
    generateQR(templateId, category);
}

// ═══ QR GENERATION ═══
async function generateQR(templateId, category) {
    try {
        const session = await api.post('/qr-sessions/generate', {
            template_id: templateId, category, security_id: getSecurityId()
        });
        const qr = await api.get('/qr/generate?url=' + encodeURIComponent(session.visitor_url));
        lastQrData = { session, qr };

        document.getElementById('generated-qr').src = qr.qr_image;
        document.getElementById('qr-session-code').textContent = 'Code: ' + session.session_code;
        document.getElementById('qr-result-panel').style.display = 'block';

        document.getElementById('home-qr-img').src = qr.qr_image;
        document.getElementById('home-qr-status').textContent = '🟢 QR Active';
        document.getElementById('home-qr-code').textContent = session.session_code;
        document.getElementById('active-qr-card').style.display = 'block';
    } catch (e) { console.error('QR error:', e); alert('Failed to generate QR'); }
}

function generateNewQR() {
    if (selectedTemplate) generateQR(selectedTemplate.id, selectedTemplate.category);
}

// ═══ PENDING LIST ═══
async function loadPending() {
    try {
        const data = await api.get('/visitor-requests/pending');
        window.pendingRequests = data;
        const el = document.getElementById('pending-list');
        if (!data.length) { el.innerHTML = '<div class="empty-state"><span class="emoji">✨</span><p>No pending requests</p></div>'; return; }
        el.innerHTML = data.map(r => `
            <div class="card mb-12 fade-in">
                <div class="flex-between mb-8">
                     <h4>${r.visitor_name}</h4>
                     <span class="badge ${r.approval_status === 'APPROVED' ? 'badge-green' : 'badge-yellow'}">${r.approval_status}</span>
                </div>
                <p class="text-sm">To meet: ${r.staff_name || 'Staff'} · ${r.department_name || ''}</p>
                <p class="text-xs text-muted">${r.form_data?.purpose || 'Visit'} · ${utils.formatDate(r.created_at)}</p>
                <div style="display:flex;gap:8px;align-items:center;margin-top:10px">
                    ${r.approval_status === 'APPROVED'
                ? `
                        <button class="btn btn-ghost btn-sm" onclick="printBadge('${r.id}')">🖨️ Pass</button>
                        <button class="btn btn-success btn-sm" onclick="doCheckIn('${r.id}','${r.session_id}')">Check In</button>
                    `
                : `<span class="text-xs text-muted">Awaiting Approval...</span>`}
                </div>
            </div>
        `).join('');
    } catch (e) { console.error('Pending error:', e); }
}

function printBadge(requestId) {
    const r = window.pendingRequests.find(x => x.id === requestId);
    if (!r) return;

    const printWin = window.open('', '_blank', 'width=450,height=600');
    printWin.document.write(`
        <html>
        <head>
            <title>Visitor Pass - ${r.visitor_name}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 30px; border: 3px double #333; margin: 20px; border-radius: 15px; }
                .header { border-bottom: 2px solid #4361ee; padding-bottom: 15px; margin-bottom: 20px; }
                .brand { font-weight: bold; font-size: 28px; color: #4361ee; }
                .pass-title { letter-spacing: 4px; font-size: 12px; font-weight: bold; color: #666; margin-top: 5px; }
                .name { font-size: 24px; font-weight: bold; margin: 15px 0 5px 0; color: #1e293b; }
                .phone { font-size: 16px; color: #64748b; margin-bottom: 20px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left; margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 8px; }
                .info-item .label { font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: bold; }
                .info-item .val { font-size: 14px; font-weight: 600; color: #334155; }
                .footer { font-size: 11px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
            <div class="header">
                <div class="brand">🛡️ VisitorGate</div>
                <div class="pass-title">OFFICIAL VISITOR PASS</div>
            </div>
            
            <div class="name">${r.visitor_name.toUpperCase()}</div>
            <div class="phone">${r.visitor_phone}</div>
            
            <div class="info-grid">
                <div class="info-item"><div class="label">Staff to Meet</div><div class="val">${r.staff_name}</div></div>
                <div class="info-item"><div class="label">Department</div><div class="val">${r.department_name}</div></div>
                <div class="info-item"><div class="label">Purpose</div><div class="val">${r.form_data?.purpose || 'Meeting'}</div></div>
                <div class="info-item"><div class="label">Approved Date</div><div class="val">${utils.formatDate(r.approval_time).split(',')[0]}</div></div>
            </div>

            <div class="footer">
                Valid for 1 Entry | Please wear this pass visibly
            </div>
        </body>
        </html>
    `);
    printWin.document.close();
}

// ═══ INSIDE LIST ═══
async function loadInside() {
    try {
        const data = await api.get('/checkins/active');
        const el = document.getElementById('inside-list');
        if (!data.length) { el.innerHTML = '<div class="empty-state"><span class="emoji">🏢</span><p>No visitors inside campus</p></div>'; return; }
        el.innerHTML = data.map(v => {
            const mins = Math.round((Date.now() - new Date(v.checkin_time).getTime()) / 60000);
            const dur = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
            return `
            <div class="card mb-12 fade-in">
                <div class="flex-between">
                    <div>
                        <div class="flex-align mb-4">
                            <h4 class="mb-0">${v.visitor_name}</h4>
                            <span class="badge badge-primary ml-8" style="font-size:10px">${v.visitor_phone}</span>
                        </div>
                        <p class="text-sm text-muted mb-4">
                            <i class="fas fa-building mr-4"></i>${v.department_name || 'N/A'} 
                            <i class="fas fa-user-tie ml-8 mr-4"></i>${v.staff_name || 'N/A'}
                        </p>
                        <p class="text-xs" style="color: var(--primary)">
                            <i class="fas fa-clock mr-4"></i>In: ${utils.formatTime(v.checkin_time)} · <b>Duration: ${dur}</b>
                        </p>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="doCheckOut('${v.id}')">
                        <i class="fas fa-sign-out-alt mr-4"></i>Check Out
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch (e) { console.error('Inside error:', e); }
}

// ═══ CHECK-IN / CHECK-OUT ═══
async function doCheckIn(requestId, sessionId) {
    try {
        const res = await api.post('/checkins', {
            visitor_request_id: requestId,
            session_id: sessionId || '',
            security_id: getSecurityId(),
            gate_location: 'Main Gate'
        });
        utils.showToast(`✅ Checked in: ${res.visitor_name || 'Visitor'}`, 'success');
        loadAll();
    } catch (e) {
        utils.showToast(e.message || 'Check-in failed', 'error');
    }
}

async function doCheckOut(checkinId) {
    if (!confirm('Are you sure you want to check out this visitor?')) return;
    try {
        await api.post('/checkins/' + checkinId + '/checkout', { security_id: getSecurityId() });
        utils.showToast('🚪 Visitor checked out successfully', 'success');
        loadAll();
    } catch (e) {
        utils.showToast(e.message || 'Check-out failed', 'error');
    }
}

// ═══ EVENT CHECK-IN ═══

async function verifyEventPass() {
    const input = document.getElementById('evt-pass-input').value.trim();
    if (!input) return alert('Please enter a pass token');

    let token = input;
    if (input.includes('token=')) {
        try { token = new URL(input, window.location.origin).searchParams.get('token') || input; } catch (e) { }
    }

    const el = document.getElementById('evt-verify-result');
    el.style.display = 'block';
    el.innerHTML = '<p class="text-center">🔍 Verifying...</p>';

    try {
        const reg = await api.get('/event-registrations/verify?token=' + token);

        const isApproved = reg.approval_status === 'APPROVED';
        const statusColor = isApproved ? 'var(--green)' : 'var(--red)';
        const statusBg = isApproved ? 'var(--green-bg)' : 'var(--red-bg)';

        el.innerHTML = `
            <div style="padding:20px">
                <div class="flex-between mb-16">
                    <h3>${reg.visitor_name}</h3>
                    <span class="badge ${isApproved ? 'badge-green' : 'badge-red'}" style="font-size:14px;padding:6px 16px">${reg.approval_status}</span>
                </div>
                <div class="text-sm mb-8">📧 ${reg.visitor_email} · 📱 ${reg.visitor_phone}</div>
                <div class="text-sm mb-8">🏢 ${reg.organization || 'N/A'} · ${reg.designation || 'Participant'}</div>
                <div class="text-sm mb-16" style="color:var(--primary)">🎪 <b>${reg.event_name}</b> · 📅 ${new Date(reg.event_date).toLocaleDateString('en-IN')} · 📍 ${reg.venue || 'TBA'}</div>

                <div style="background:${statusBg};color:${statusColor};padding:16px;border-radius:12px;text-align:center;font-weight:700;font-size:16px;margin-bottom:16px">
                    ${isApproved
                ? (reg.is_inside ? '🏢 CURRENTLY INSIDE' : '✅ APPROVED — READY FOR CHECK-IN')
                : '❌ NOT APPROVED — ENTRY DENIED'}
                </div>

                ${isApproved ? `
                    <div style="display:flex;gap:12px;justify-content:center">
                        ${reg.is_inside
                    ? ''
                    : `<button class="btn btn-success btn-lg" onclick="eventCheckIn('${reg.id}','${reg.event_id}')">✅ CHECK IN</button>`}
                    </div>
                ` : ''}
            </div>
        `;
    } catch (e) {
        el.innerHTML = `
            <div style="text-align:center;padding:24px">
                <div style="font-size:48px;margin-bottom:12px">❌</div>
                <h3 style="color:var(--red)">Invalid Pass</h3>
                <p class="text-sm text-muted" style="margin-top:8px">${e.message || 'This pass token is not valid.'}</p>
            </div>
        `;
    }
}

async function eventCheckIn(registrationId, eventId) {
    try {
        await api.post('/event-checkins', {
            registration_id: registrationId,
            event_id: eventId,
            security_id: getSecurityId(),
            gate_location: 'Main Gate'
        });
        if (window.auth) auth.showToast('Visitor checked in!', 'success');
        document.getElementById('evt-pass-input').value = '';
        document.getElementById('evt-verify-result').style.display = 'none';
        loadEventInside();
    } catch (e) { alert('Check-in failed: ' + e.message); }
}

async function eventCheckOut(checkinId) {
    try {
        await api.post('/event-checkins/' + checkinId + '/checkout', { security_id: getSecurityId() });
        loadEventInside();
    } catch (e) { alert('Check-out failed: ' + e.message); }
}

async function loadEventInside() {
    try {
        const data = await api.get('/event-checkins/active');
        const el = document.getElementById('event-inside-list');
        if (!data.length) {
            el.innerHTML = '<div class="empty-state"><span class="emoji">🎪</span><p>No event visitors inside</p></div>';
            return;
        }
        el.innerHTML = data.map(v => {
            const mins = Math.round((Date.now() - new Date(v.checkin_time).getTime()) / 60000);
            const dur = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
            return `
            <div class="card mb-12 fade-in">
                <div class="flex-between">
                    <div>
                        <h4>${v.visitor_name}</h4>
                        <p class="text-sm">🎪 ${v.event_name || 'Event'} · ${v.organization || ''}</p>
                        <p class="text-xs text-muted">In: ${utils.formatDate(v.checkin_time)} · Duration: ${dur}</p>
                    </div>
                    <button class="btn btn-ghost btn-sm" onclick="eventCheckOut('${v.id}')">🚪 Check Out</button>
                </div>
            </div>`;
        }).join('');
    } catch (e) { console.error('Event inside error:', e); }
}
