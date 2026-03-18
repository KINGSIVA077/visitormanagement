// ═══ Event Pass Viewer Logic ═══
document.addEventListener('DOMContentLoaded', async () => {
    const token = utils.getQueryParam('token');
    if (!token) return showError('No pass token provided.');

    try {
        const reg = await api.get('/event-registrations/verify?token=' + token);
        if (!reg || !reg.id) throw new Error('Pass not found');

        // Populate pass details
        document.getElementById('pass-name').textContent = reg.visitor_name;
        document.getElementById('pass-org').textContent = [reg.designation, reg.organization].filter(Boolean).join(' · ') || 'Verified Participant';
        document.getElementById('pass-event').textContent = reg.event_name;
        document.getElementById('pass-date').textContent = new Date(reg.event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        document.getElementById('pass-venue').textContent = reg.venue || 'Event Venue';
        document.getElementById('pass-phone').textContent = reg.visitor_phone;

        // Custom details rendering
        let customData = reg.custom_data;
        if (typeof customData === 'string') { try { customData = JSON.parse(customData); } catch (e) { customData = null; } }

        const customContainer = document.getElementById('pass-custom-fields');
        if (customData && typeof customData === 'object') {
            const entries = Object.entries(customData).filter(([k, v]) =>
                v && !['Full Name', 'Email Address', 'Phone Number', 'Organization', 'College', 'Designation', 'Role'].includes(k)
            );
            if (entries.length) {
                customContainer.innerHTML = entries.map(([k, v]) => `
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px">
                        <span style="color:#64748b">${k}:</span>
                        <span style="color:#f1f5f9; font-weight:600">${v}</span>
                    </div>
                `).join('');
            } else {
                customContainer.style.display = 'none';
            }
        } else {
            customContainer.style.display = 'none';
        }

        // Status badge
        const badge = document.getElementById('pass-status-badge');
        const statusIcon = document.getElementById('pass-status-icon');
        const statusText = document.getElementById('pass-status-text');

        if (reg.approval_status === 'APPROVED') {
            badge.className = 'pass-status approved';
            statusIcon.innerHTML = '<i data-lucide="check-circle" style="width:20px;height:20px"></i>';
            statusText.textContent = 'APPROVED';
        } else if (reg.approval_status === 'REJECTED') {
            badge.className = 'pass-status rejected';
            statusIcon.innerHTML = '<i data-lucide="x-circle" style="width:20px;height:20px"></i>';
            statusText.textContent = 'REJECTED';
        } else {
            badge.className = 'pass-status pending';
            statusIcon.innerHTML = '<i data-lucide="clock" style="width:20px;height:20px"></i>';
            statusText.textContent = 'PENDING';
        }
        lucide.createIcons();

        // Generate QR code for the pass token (security scans this)
        const passVerifyUrl = window.location.origin + '/event-pass.html?token=' + token;
        const qr = await api.get('/qr/generate?url=' + encodeURIComponent(passVerifyUrl));
        document.getElementById('pass-qr-img').src = qr.qr_image;

        // Show pass
        document.getElementById('loading-view').style.display = 'none';
        document.getElementById('pass-view').style.display = 'block';

    } catch (e) {
        showError(e.message || 'Failed to load pass.');
    }
});

function showError(msg) {
    document.getElementById('loading-view').style.display = 'none';
    document.getElementById('error-view').style.display = 'block';
    if (msg) document.getElementById('error-msg').textContent = msg;
}
