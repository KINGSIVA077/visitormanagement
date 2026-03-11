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
    staffSelect.innerHTML = '<option value="">Select Staff</option>';
    if (!deptId) return;

    try {
        const staff = await api.get('/departments/' + deptId + '/staff');
        staffSelect.innerHTML += staff.map(s => {
            const statusIcon = s.availability_status === 'available' ? '🟢' : s.availability_status === 'busy' ? '🔴' : '🟡';
            return `<option value="${s.id}">${statusIcon} ${s.name} (${s.designation || 'Staff'})</option>`;
        }).join('');
    } catch (e) { console.error('Staff load error:', e); }
}

function renderDynamicFields(fields) {
    const container = document.getElementById('dynamic-fields');
    const skip = ['name', 'phone', 'email', 'department', 'staff_id', 'purpose'];
    const extra = fields.filter(f => !skip.includes(f.id));

    container.innerHTML = extra.map(f => `
        <div class="form-group">
            <label class="form-label">${f.label}${f.required ? ' *' : ''}</label>
            ${fieldHTML(f)}
        </div>
    `).join('');
}

function fieldHTML(f) {
    const req = f.required ? 'required' : '';
    switch (f.type) {
        case 'textarea':
            return `<textarea name="${f.id}" placeholder="${f.placeholder || ''}" ${req}></textarea>`;
        case 'select':
        case 'dropdown':
            return `<select name="${f.id}" ${req}><option value="">Select</option>${(f.options || []).map(o => `<option>${o}</option>`).join('')}</select>`;
        case 'radio':
            return (f.options || []).map(o => `<label style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;cursor:pointer"><input type="radio" name="${f.id}" value="${o}" ${req}> ${o}</label>`).join('');
        case 'checkbox':
            return `<label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" name="${f.id}" ${req}> ${f.placeholder || f.label}</label>`;
        default:
            return `<input type="${f.type || 'text'}" name="${f.id}" placeholder="${f.placeholder || ''}" ${req}>`;
    }
}

async function submitForm(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const formData = Object.fromEntries(new FormData(e.target));

    const payload = {
        session_id: sessionData.session_id,
        visitor_name: document.getElementById('f-name').value,
        visitor_phone: document.getElementById('f-phone').value,
        visitor_email: document.getElementById('f-email').value || '',
        department_id: document.getElementById('f-department').value,
        staff_id: document.getElementById('f-staff').value,
        form_data: { ...formData, purpose: document.getElementById('f-purpose').value }
    };

    try {
        await api.post('/visitor-requests/submit', payload);
        document.getElementById('form-view').style.display = 'none';
        document.getElementById('success-view').style.display = 'block';
    } catch (err) {
        const errEl = document.getElementById('form-error');
        errEl.textContent = err.message || 'Submission failed. Please try again.';
        errEl.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Submit Entry Request';
    }
}

function showError(msg) {
    document.getElementById('form-view').style.display = 'none';
    if (msg) document.querySelector('#error-view p').textContent = msg;
    document.getElementById('error-view').style.display = 'block';
}
