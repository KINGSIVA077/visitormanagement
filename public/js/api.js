// ═══ VisitorGate API Helper (Node.js Backend) ═══
const API_BASE = window.location.origin + '/api';

const api = {
    async _request(url, method = 'GET', data = null) {
        const token = localStorage.getItem('vms_token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        const options = {
            method,
            headers
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const res = await fetch(API_BASE + url, options);

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }

        return res.json();
    },

    async get(url) {
        return this._request(url, 'GET');
    },

    async post(url, data) {
        return this._request(url, 'POST', data);
    },

    async put(url, data) {
        return this._request(url, 'PUT', data);
    },

    async del(url) {
        return this._request(url, 'DELETE');
    }
};

// ═══ Utilities ═══
const utils = {
    formatDate(d) {
        if (!d) return '—';
        const dt = new Date(d);
        return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    },
    formatTime(d) {
        if (!d) return '—';
        const dt = new Date(d);
        return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    },
    getQueryParam(name) {
        return new URLSearchParams(window.location.search).get(name);
    }
};

// Make globally available
window.api = api;
window.utils = utils;
