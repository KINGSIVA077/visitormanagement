// ═══ VisitorGate Authentication Module ═══

(function () {
    const BASE_URL = window.location.origin;
    const AUTH_KEY = 'vms_user';
    const TOKEN_KEY = 'vms_token';

    // Role → Dashboard mapping
    const ROLE_DASHBOARDS = {
        admin: 'admin.html',
        security: 'security.html',
        staff: 'staff.html'
    };

    // ── Check if already logged in ──
    function checkExistingSession() {
        const user = getUser();
        if (user && user.role && ROLE_DASHBOARDS[user.role]) {
            window.location.href = ROLE_DASHBOARDS[user.role];
        }
    }

    // ── Get stored user ──
    function getUser() {
        try {
            return JSON.parse(localStorage.getItem(AUTH_KEY));
        } catch { return null; }
    }

    // ── Logout ──
    function logout() {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = 'login.html';
    }

    // ── Show loading bar ──
    function setLoading(active) {
        const bar = document.getElementById('loading-bar');
        if (!bar) return;
        if (active) {
            bar.style.width = '0';
            bar.style.opacity = '1';
            bar.classList.add('active');
            bar.classList.remove('done');
        } else {
            bar.classList.remove('active');
            bar.classList.add('done');
        }
    }

    // ── Toast notification ──
    function showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icons = { success: 'check-circle', error: 'x-circle', info: 'info' };
        toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}" style="width:18px;height:18px;margin-right:12px"></i><span>${message}</span>`;
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(60px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ── Login form handler ──
    function initLoginForm() {
        const form = document.getElementById('login-form');
        if (!form) return;

        // Check for existing session on load
        checkExistingSession();

        // Password toggle
        const toggleBtn = document.getElementById('toggle-password');
        const passInput = document.getElementById('password');
        if (toggleBtn && passInput) {
            toggleBtn.addEventListener('click', () => {
                const isPass = passInput.type === 'password';
                passInput.type = isPass ? 'text' : 'password';
                toggleBtn.innerHTML = isPass ? '<i data-lucide="eye-off" style="width:20px;height:20px"></i>' : '<i data-lucide="eye" style="width:20px;height:20px"></i>';
                lucide.createIcons();
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const btn = document.getElementById('login-btn');
            const btnText = document.getElementById('btn-text');
            const btnSpinner = document.getElementById('btn-spinner');
            const errorDiv = document.getElementById('login-error');

            if (!email || !password) {
                showError(errorDiv, 'Please enter both email and password.');
                return;
            }

            // Show loading state
            btn.disabled = true;
            btnText.textContent = 'Signing in...';
            if (btnSpinner) btnSpinner.style.display = 'inline-block';
            errorDiv.style.display = 'none';
            setLoading(true);

            try {
                const response = await fetch(`${BASE_URL}/auth/v1/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Invalid email or password');
                }

                if (!data.user || !data.user.role) {
                    throw new Error('Invalid response from server');
                }

                const role = data.user.role;
                const dashboard = ROLE_DASHBOARDS[role];

                if (!dashboard) {
                    throw new Error(`Unknown role: ${role}`);
                }

                // Store auth data
                localStorage.setItem(AUTH_KEY, JSON.stringify(data.user));
                localStorage.setItem(TOKEN_KEY, data.access_token);

                setLoading(false);
                showToast(`Welcome, ${data.user.name}!`, 'success');

                // Redirect after brief delay for UX
                setTimeout(() => {
                    window.location.href = dashboard;
                }, 600);

            } catch (err) {
                setLoading(false);
                showError(errorDiv, err.message);
                btn.disabled = false;
                btnText.textContent = 'Sign In';
                if (btnSpinner) btnSpinner.style.display = 'none';
            }
        });
    }

    function showError(el, msg) {
        if (!el) return;
        el.textContent = msg;
        el.style.display = 'block';
    }

    // ── Auth guard for dashboard pages ──
    function requireAuth(requiredRole) {
        const user = getUser();
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }
        if (requiredRole && user.role !== requiredRole) {
            window.location.href = ROLE_DASHBOARDS[user.role] || 'login.html';
            return null;
        }
        return user;
    }

    // Init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoginForm);
    } else {
        initLoginForm();
    }

    // Expose globally
    window.auth = {
        getUser,
        logout,
        requireAuth,
        showToast,
        ROLE_DASHBOARDS,
        checkExistingSession
    };
})();
