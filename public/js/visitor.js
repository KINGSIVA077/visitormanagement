let sessionData = null;

document.addEventListener('DOMContentLoaded', async () => {
    const sessionCode = utils.getQueryParam('session');
    const token = utils.getQueryParam('token');

    if (!sessionCode || !token) { showError(); return; }

    try {
        const result = await api.post('/qr-sessions/validate', { session_code: sessionCode, token });
        if (!result.valid) { showError(); return; }

        sessionData = result;

        if (result.template_id) {
            try {
                const template = await api.get('/form-templates/' + result.template_id);
                document.getElementById('form-title').textContent = template.name;
                document.getElementById('form-desc').textContent = template.description || 'Please fill in your details.';
                renderDynamicFields(template.fields);
            } catch (e) { /* use default form */ }
        }

        const depts = await api.get('/departments');
        const deptSelect = document.getElementById('f-department');
        deptSelect.innerHTML = '<option value="">Select Department</option>' +
            depts.map(d => `<option value="${d.id}">${d.name} (${d.code})</option>`).join('');

        // Transition from loading to form
        document.getElementById('loading-view').style.display = 'none';
        document.getElementById('form-view').style.display = 'block';

    } catch (e) {
        console.error('Validation failed:', e);
        showError(e.message || 'The registration link is invalid or has expired.');
    }

    document.getElementById('f-department').addEventListener('change', loadStaffForDept);
    document.getElementById('visitor-form').addEventListener('submit', submitForm);
});

async function loadStaffForDept() {
    const deptId = document.getElementById('f-department').value;
    const staffSelect = document.getElementById('f-staff');
    staffSelect.innerHTML = '<option value="">Loading Staff...</option>';
    if (!deptId) {
        staffSelect.innerHTML = '<option value="">Select Staff</option>';
        return;
    }

    try {
        const staff = await api.get('/departments/' + deptId + '/staff');
        staffSelect.innerHTML = '<option value="">Select Staff</option>' + staff.map(s => {
            const statusLabel = s.availability_status ? s.availability_status.toUpperCase() : 'AVAILABLE';
            return `<option value="${s.id}">${statusLabel} - ${s.name} (${s.designation || 'Staff'})</option>`;
        }).join('');
    } catch (e) { 
        console.error('Staff load error:', e);
        staffSelect.innerHTML = '<option value="">Error loading staff</option>';
    }
}

function renderDynamicFields(fields) {
    const container = document.getElementById('dynamic-fields');
    if (!container) return;
    
    const coreFields = [
        { id: 'visitor_name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter your full name' },
        { id: 'visitor_phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+91 9876543210' },
        { id: 'visitor_email', label: 'Email Address', type: 'email', required: false, placeholder: 'you@example.com' }
    ];

    const templateFields = fields || [];
    const templateLabels = templateFields.map(f => (f.label || '').toLowerCase());

    const fieldsToRender = [];
    
    coreFields.forEach(cf => {
        const isAlreadyInTemplate = templateLabels.some(l => 
            l.includes(cf.label.toLowerCase()) || 
            (cf.id === 'visitor_name' && (l.includes('name') || l.includes('full name'))) ||
            (cf.id === 'visitor_phone' && (l.includes('phone') || l.includes('mobile')))
        );
        
        if (!isAlreadyInTemplate) {
            fieldsToRender.push(cf);
        }
    });

    templateFields.forEach(f => {
        const lbl = (f.label || '').toLowerCase();
        if (!lbl.includes('department') && !lbl.includes('person to meet') && !lbl.includes('staff')) {
            fieldsToRender.push(f);
        }
    });

    if (!templateLabels.some(l => l.includes('purpose'))) {
        fieldsToRender.push({
            id: 'purpose',
            label: 'Purpose of Visit',
            type: 'select',
            required: true,
            options: ['General Visit', 'Meeting', 'Delivery', 'Interview', 'Other']
        });
    }

    container.innerHTML = fieldsToRender.map(f => `
        <div class="form-group">
            <label class="form-label">${f.label}${f.required ? ' *' : ''}</label>
            ${fieldHTML(f)}
        </div>
    `).join('');
}

function fieldHTML(f) {
    const req = f.required ? 'required' : '';
    const name = f.id || f.label.toLowerCase().replace(/\s+/g, '_');
    
    switch (f.type) {
        case 'textarea':
            return `<textarea name="${name}" id="f-${name}" placeholder="${f.placeholder || ''}" ${req}></textarea>`;
        case 'select':
        case 'dropdown':
            const options = Array.isArray(f.options) ? f.options : [];
            return `<select name="${name}" id="f-${name}" ${req}>
                <option value="">Select Option</option>
                ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
            </select>`;
        default:
            return `<input type="${f.type || 'text'}" name="${name}" id="f-${name}" placeholder="${f.placeholder || ''}" ${req}>`;
    }
}

async function submitForm(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const errEl = document.getElementById('form-error');
    
    btn.disabled = true;
    const originalBtnText = btn.textContent;
    btn.textContent = 'Submitting...';
    if (errEl) errEl.style.display = 'none';

    const rawFormData = new FormData(e.target);
    const formData = Object.fromEntries(rawFormData);
    
    let visitor_name = formData.visitor_name || formData.name || formData.full_name;
    let visitor_phone = formData.visitor_phone || formData.phone || formData.mobile;
    let visitor_email = formData.visitor_email || formData.email || '';
    let purpose = formData.purpose || 'General Visit';

    if (!visitor_name) visitor_name = Object.values(formData)[0] || 'Visitor';

    const payload = {
        session_id: sessionData.session_id,
        visitor_name,
        visitor_phone,
        visitor_email,
        department_id: document.getElementById('f-department').value,
        staff_id: document.getElementById('f-staff').value,
        form_data: { ...formData, purpose }
    };

    try {
        const res = await api.post('/visitor-requests/submit', payload);
        document.getElementById('form-view').style.display = 'none';
        document.getElementById('success-view').style.display = 'block';
        
        if (res.request_id) {
            showStatusQR(res.request_id);
            startStatusPolling(res.request_id);
        }
    } catch (err) {
        if (errEl) {
            errEl.textContent = err.message || 'Submission failed. Please try again.';
            errEl.style.display = 'block';
        }
        btn.disabled = false;
        btn.textContent = originalBtnText;
    }
}

async function showStatusQR(requestId) {
    const container = document.getElementById('status-qr-container');
    const img = document.getElementById('status-qr-img');
    if (!container || !img) return;

    try {
        const statusUrl = `${window.location.origin}/visitor-status.html?id=${requestId}`;
        const qr = await api.get('/qr/generate?url=' + encodeURIComponent(statusUrl));
        img.src = qr.qr_image;
        container.style.display = 'block';
    } catch (e) {
        console.warn('Failed to load status QR:', e);
    }
}

let pollingInterval = null;
function startStatusPolling(requestId) {
    if (pollingInterval) clearInterval(pollingInterval);
    
    const timeEl = document.getElementById('timeline-submit-time');
    if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();

    pollingInterval = setInterval(async () => {
        try {
            const data = await api.get('/visitor-requests/pending'); // This gets all pending for security, but we need specific
            // Actually let's use a more direct endpoint if we have one, or just check the pending list for our ID
            const request = data.find(r => r.id === requestId);
            
            const textEl = document.getElementById('live-status-text');
            const detailEl = document.getElementById('live-status-detail');
            const responseItem = document.getElementById('timeline-response');
            
            if (!request) {
                // If not in pending/approved list, it might be in history (rejected)
                // For now, let's assume it's still processing unless we get a definitive "complete" or "rejected"
                return;
            }

            if (request.approval_status === 'APPROVED') {
                clearInterval(pollingInterval);
                if (textEl) {
                    textEl.textContent = 'ACCESS GRANTED';
                    textEl.style.color = '#059669';
                }
                if (detailEl) detailEl.textContent = 'Your request has been approved. Please proceed to the check-in desk.';
                document.getElementById('status-pulse').style.background = '#059669';
                
                if (responseItem) {
                    responseItem.querySelector('#timeline-response-dot').style.background = '#059669';
                    responseItem.querySelector('#timeline-response-dot').style.animation = 'none';
                    responseItem.querySelector('#timeline-response-text').textContent = 'Request Approved';
                    responseItem.querySelector('#timeline-response-text').style.color = '#059669';
                    responseItem.querySelector('#timeline-response-detail').textContent = 'Staff has granted you entry.';
                }
            } else if (request.approval_status === 'REJECTED') {
                clearInterval(pollingInterval);
                if (textEl) {
                    textEl.textContent = 'ACCESS DECLINED';
                    textEl.style.color = '#dc2626';
                }
                if (detailEl) detailEl.textContent = 'Sorry, your entry request was declined by staff.';
                document.getElementById('status-pulse').style.background = '#dc2626';
            }
        } catch (e) {
            console.warn('Polling error:', e);
        }
    }, 5000);
}

function showError(msg) {
    document.getElementById('loading-view').style.display = 'none';
    document.getElementById('form-view').style.display = 'none';
    if (msg) document.getElementById('error-msg').textContent = msg;
    document.getElementById('error-view').style.display = 'block';
}
