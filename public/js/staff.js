// ═══ Staff Portal Logic — VisitorGate ═══
let activeRequests = [];
let historyRequests = [];
let lastRequestCount = 0;
let currentTab = 'active';

function getStaffId() {
    const user = window.auth ? auth.getUser() : null;
    return user ? user.id : 'stf-user-222';
}

async function requestNotifPermission() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    updateNotifBtn(permission);
}

function updateNotifBtn(permission) {
    const btn = document.getElementById('notif-btn');
    if (!btn) return;
    if (permission === 'granted') {
        btn.textContent = '🔔';
        btn.style.color = 'var(--green)';
        btn.title = 'Notifications Enabled';
    } else if (permission === 'denied') {
        btn.textContent = '🔕';
        btn.style.color = 'var(--red)';
        btn.title = 'Notifications Blocked';
    } else {
        btn.textContent = '🔔';
        btn.style.color = 'white';
        btn.title = 'Click to enable notifications';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadStaffProfile();
    showTab('active');

    // Polling
    setInterval(() => {
        if (currentTab === 'active') {
            loadRequests();
        }
    }, 10000);

    // Initial Notif Check
    if ("Notification" in window) {
        updateNotifBtn(Notification.permission);
    }
});

async function loadStaffProfile() {
    const user = window.auth ? auth.getUser() : null;
    if (user) {
        document.getElementById('staff-name').textContent = user.name;
        document.getElementById('staff-dept').textContent = user.designation || 'Staff Member';
        updateStatusUI(user.availability_status || 'available');
    }
}

async function loadRequests() {
    try {
        const requests = await api.get('/visitor-requests/my-requests/' + getStaffId());

        // Notify if new requests arrived that weren't there before
        const pendingCount = requests.filter(r => r.approval_status === 'PENDING').length;
        if (pendingCount > lastRequestCount) {
            playNotificationSound();
            showBrowserNotification('New Visitor Request', `You have ${pendingCount} pending requests.`);
        }
        lastRequestCount = pendingCount;

        activeRequests = requests;
        if (currentTab === 'active') renderRequests();
    } catch (e) {
        console.error('Requests error:', e);
    }
}

async function loadHistory() {
    const list = document.getElementById('requests-list');
    list.innerHTML = `<div class="text-center py-40"><div class="spinner"></div><p class="text-muted mt-10">Loading history...</p></div>`;

    try {
        const history = await api.get('/visitor-requests/history/' + getStaffId());
        historyRequests = history;
        if (currentTab === 'history') renderHistory();
    } catch (e) {
        console.error('History error:', e);
        list.innerHTML = `<div class="card text-center p-20"><p class="text-red">Failed to load history</p></div>`;
    }
}

function showTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('tab-' + tab);
    if (btn) btn.classList.add('active');

    if (tab === 'active') {
        loadRequests();
    } else {
        loadHistory();
    }
}

function renderRequests() {
    const list = document.getElementById('requests-list');
    if (!activeRequests.length) {
        list.innerHTML = `<div class="card text-center" style="padding:40px"><p class="text-muted" data-lang="no_requests">${lang.t('no_requests')}</p></div>`;
        return;
    }

    list.innerHTML = activeRequests.map(r => `
        <div class="card mb-16 fade-in ${r.approval_status === 'PENDING' ? 'pulse-red' : ''}" style="border-left: 4px solid ${getStatusColor(r.approval_status)}">
            <div class="flex-between mb-8">
                <span class="text-xs text-muted">${utils.formatDate(r.created_at)}</span>
                <span class="badge" style="background:${getStatusColor(r.approval_status)}33; color:${getStatusColor(r.approval_status)}">${r.approval_status}</span>
            </div>
            <div class="fw-700 mb-4" style="font-size:1.1rem">${r.visitor_name}</div>
            <div class="text-sm text-muted mb-12 flex-align" style="gap:6px">
                <span style="font-size:1rem">📱</span> ${r.visitor_phone}
            </div>
            <div style="background:rgba(255,255,255,0.03);padding:12px 16px;border-radius:12px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.05)" class="text-sm">
                <b class="text-muted" data-lang="purpose">${lang.t('purpose')}:</b> <span class="text-primary">${r.form_data?.purpose || 'General Visit'}</span>
            </div>
            
            ${r.approval_status === 'PENDING' || r.approval_status === 'BUSY' ? `
                <div style="display:flex;gap:10px">
                    <button class="btn btn-ghost btn-sm" style="color:var(--red);flex:1;background:var(--red-bg)" onclick="handleAction('${r.id}', 'reject')" data-lang="reject">${lang.t('reject')}</button>
                    ${r.approval_status === 'PENDING' ? `
                        <button class="btn btn-ghost btn-sm" style="color:var(--yellow);flex:1;background:var(--yellow-bg)" onclick="handleAction('${r.id}', 'busy')" data-lang="busy">${lang.t('busy')}</button>
                    ` : ''}
                    <button class="btn btn-success btn-sm" style="flex:2;box-shadow:var(--shadow-glow)" onclick="handleAction('${r.id}', 'approve')" data-lang="approve">${lang.t('approve')}</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderHistory() {
    const list = document.getElementById('requests-list');
    if (!historyRequests.length) {
        list.innerHTML = `<div class="card text-center" style="padding:40px"><p class="text-muted">No history found.</p></div>`;
        return;
    }

    list.innerHTML = `
        <div class="text-xs text-muted mb-10 px-4">Showing last 100 resolved visits</div>
        ${historyRequests.map(r => `
            <div class="card mb-12 p-12 flex-between" style="opacity:0.85; border-left: 3px solid ${getStatusColor(r.approval_status)}">
                <div style="flex:1">
                    <div class="fw-600 text-sm">${r.visitor_name}</div>
                    <div class="text-xs text-muted">${utils.formatDate(r.created_at)}</div>
                </div>
                <div class="text-right">
                    <span class="badge" style="background:${getStatusColor(r.approval_status)}22; color:${getStatusColor(r.approval_status)}; font-size:0.65rem">${r.approval_status}</span>
                    <div class="text-xs mt-4">${r.duration_minutes ? r.duration_minutes + ' min' : '—'}</div>
                </div>
            </div>
        `).join('')}
    `;
}

function getStatusColor(status) {
    switch (status) {
        case 'APPROVED': return 'var(--green)';
        case 'REJECTED': return 'var(--red)';
        case 'BUSY': return 'var(--yellow)';
        default: return 'var(--blue)';
    }
}

async function handleAction(id, action) {
    let reason = '';
    if (action === 'reject') {
        reason = prompt(lang.t('enter_reason'));
        if (reason === null) return;
    }

    try {
        await api.post(`/visitor-requests/${id}/${action}`, { staff_id: getStaffId(), reason });
        loadRequests();
        const msg = action === 'approve' ? 'Visitor approved!' : action === 'busy' ? 'Marked as busy' : 'Visitor rejected';
        if (window.auth) auth.showToast(msg, action === 'approve' ? 'success' : 'info');
    } catch (e) { alert('Action failed: ' + e.message); }
}

async function setStatus(status) {
    try {
        await api.post(`/users/${getStaffId()}/availability`, { status });
        updateStatusUI(status);
        if (window.auth) auth.showToast(`Status updated to ${status}`, 'success');
    } catch (e) { alert('Failed to update status'); }
}

function updateStatusUI(status) {
    document.querySelectorAll('#availability-toggle button').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('btn-' + (status || 'available'));
    if (btn) btn.classList.add('active');
}

// ═══ Notification Utilities ═══
function playNotificationSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); // A4

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) { console.warn('Audio play failed:', e); }
}

function showBrowserNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: '/favicon.ico' });
    }
}
