// ═══ Event Registration Page Logic ═══
let currentEvent = null;

document.addEventListener('DOMContentLoaded', async () => {
    const token = utils.getQueryParam('event');
    if (!token) return showError('No event token provided. Please scan a valid event QR code.');

    try {
        // Load event by QR token
        currentEvent = await api.get('/events/by-token/' + token);
        if (!currentEvent || !currentEvent.id) throw new Error('Event not found');

        // Check if event is active
        if (currentEvent.status !== 'ACTIVE') return showError('This event is no longer accepting registrations.');

        // Populate event details
        document.getElementById('evt-name').textContent = currentEvent.name;
        document.getElementById('evt-desc').textContent = currentEvent.description || '';
        document.getElementById('evt-date').textContent = new Date(currentEvent.event_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('evt-time').textContent = currentEvent.event_time || 'TBA';
        document.getElementById('evt-venue').textContent = currentEvent.venue || 'TBA';

        // Show form
        document.getElementById('loading-view').style.display = 'none';
        document.getElementById('form-view').style.display = 'block';

    } catch (e) {
        showError(e.message || 'Failed to load event details.');
    }

    // Handle form submission
    document.getElementById('event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-sm"></span> Submitting...';

        const errEl = document.getElementById('form-error');
        errEl.style.display = 'none';

        try {
            await api.post('/event-registrations', {
                event_id: currentEvent.id,
                visitor_name: document.getElementById('f-name').value.trim(),
                visitor_email: document.getElementById('f-email').value.trim(),
                visitor_phone: document.getElementById('f-phone').value.trim(),
                organization: document.getElementById('f-org').value.trim(),
                designation: document.getElementById('f-desg').value.trim()
            });

            // Show success
            document.getElementById('form-view').style.display = 'none';
            document.getElementById('success-view').style.display = 'block';

        } catch (err) {
            errEl.textContent = err.message || 'Registration failed. Please try again.';
            errEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Register for Event';
        }
    });
});

function showError(msg) {
    document.getElementById('loading-view').style.display = 'none';
    document.getElementById('error-view').style.display = 'block';
    if (msg) document.getElementById('error-msg').textContent = msg;
}
