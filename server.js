import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import os from 'os';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import twilio from 'twilio';
import nodemailer from 'nodemailer';

dotenv.config();

// ═══ TWILIO SMS CLIENT ═══
const SMS_ENABLED = process.env.SMS_ENABLED === 'true' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
let twilioClient = null;
if (SMS_ENABLED) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('📱 Twilio SMS integration ENABLED');
} else {
    console.log('📱 Twilio SMS integration DISABLED (set SMS_ENABLED=true and configure TWILIO_* in .env)');
}

// ═══ NODEMAILER EMAIL CLIENT ═══
const EMAIL_ENABLED = process.env.SMTP_USER && process.env.SMTP_PASS;
let mailTransporter = null;
if (EMAIL_ENABLED) {
    mailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    console.log('📧 Nodemailer integration ENABLED');
} else {
    console.log('📧 Nodemailer integration DISABLED (configure SMTP_* in .env)');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// ═══ CORS — whitelist-based ═══
const getLanIp = () => {
    const nets = os.networkInterfaces();
    let bestIp = 'localhost';

    // Priority: Real physical adapters (Ethernet/WiFi)
    // Filter out common virtual interface names
    const virtualPrefixes = ['vbox', 'vmnet', 'veth', 'wsl', 'docker', 'br-', 'lo', 'virtual', 'ethernet 2'];

    for (const name of Object.keys(nets)) {
        const lowerName = name.toLowerCase();
        const isVirtual = virtualPrefixes.some(p => lowerName.includes(p));

        for (const net of nets[name]) {
            // Skip non-IPv4 and internal/loopback
            if (net.family !== 'IPv4' || net.internal) continue;

            // If we find a real physical adapter, return it immediately
            if (!isVirtual) return net.address;

            // Otherwise, keep the first one we find as a fallback
            if (bestIp === 'localhost') bestIp = net.address;
        }
    }
    return bestIp;
};
const allowedOrigins = [
    'http://localhost:3001',
    `http://${getLanIp()}:3001`,
    'http://127.0.0.1:3001'
];
app.use(cors({
    origin(origin, cb) {
        // Allow requests with no origin (mobile apps, Postman, same-origin)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(null, true); // Allow all for local dev; tighten in production
    },
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ═══ RATE LIMITING ═══
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // generous for local dev
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: 'Too many login attempts. Please wait 15 minutes.' }
});
app.use('/api/', generalLimiter);

// ═══ INPUT VALIDATION HELPERS ═══
const validate = {
    email(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); },
    phone(p) { return /^[\d\s\+\-()]{7,20}$/.test(p); },
    required(obj, fields) {
        const missing = fields.filter(f => !obj[f] || String(obj[f]).trim() === '');
        return missing.length ? `Missing required fields: ${missing.join(', ')}` : null;
    },
    sanitize(str, maxLen = 500) {
        if (typeof str !== 'string') return '';
        return str.trim().slice(0, maxLen);
    }
};

// ═══ ASYNC ERROR WRAPPER ═══
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ═══ API AUTH MIDDLEWARE ═══
const activeSessions = new Map(); // token -> { userId, role, createdAt }
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    const session = activeSessions.get(token);
    if (!session) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    if (Date.now() - session.createdAt > SESSION_EXPIRY) {
        activeSessions.delete(token);
        return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    req.authUser = session;
    next();
}

function adminOnly(req, res, next) {
    if (req.authUser && req.authUser.role === 'admin') return next();
    return res.status(403).json({ error: 'Admin access required' });
}

function sendEmailLog(db, to, subject, body) {
    const id = 'email-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    db.run(`INSERT INTO email_log (id, recipient, subject, body, status, created_at) VALUES (?,?,?,?,'SENT',NOW())`,
        [id, to, subject, body], (err) => {
            if (err) console.error('[EMAIL] Log error:', err.message);
            else console.log(`[EMAIL] 📧 To: ${to} | Subject: ${subject}`);
        });
}

// ═══ VIRTUAL ID PASS HELPER ═══
async function sendVirtualIDPass(visitorData) {
    if (!EMAIL_ENABLED || !mailTransporter) {
        console.log(`[PASS] 📧 SKIPPED (email disabled) | Visit ID Pass for ${visitorData.visitor_name}`);
        return false;
    }

    const passId = 'PASS-' + new Date().getFullYear() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const passUrl = `${process.env.BASE_URL}/virtual-pass.html?id=${visitorData.id}`;
    
    // Update request with pass_id
    db.run(`UPDATE visitor_requests SET pass_id = ? WHERE id = ?`, [passId, visitorData.id]);

    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #1e1b4b; padding: 30px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 20px; letter-spacing: 1px;">${process.env.COLLEGE_NAME || 'VisitorGate Institute'}</h2>
            <p style="margin: 5px 0 0; opacity: 0.8; font-size: 12px;">OFFICIAL VISITOR ID PASS</p>
        </div>
        <div style="padding: 30px; text-align: center; background-color: #ffffff;">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(visitorData.visitor_name)}&background=e2e8f0&color=1e1b4b&size=150&bold=true" 
                 style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid #f1f5f9; margin-bottom: 20px;" alt="Visitor">
            <h1 style="margin: 0; color: #1e1b4b; font-size: 24px;">${visitorData.visitor_name}</h1>
            <p style="margin: 5px 0 20px; color: #6366f1; font-weight: 600;">${visitorData.form_data?.purpose || 'General Visit'}</p>
            
            <div style="background-color: #f8fafc; border: 1px dashed #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                <p style="margin: 0 0 10px; font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">Scan to Verify At Gate</p>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(process.env.BASE_URL + '/verify.html?id=' + visitorData.id)}" 
                     style="width: 150px; height: 150px;" alt="Verification QR">
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left;">
                <div>
                    <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Pass ID</p>
                    <p style="margin: 2px 0 0; font-size: 13px; color: #1e293b; font-weight: 600;">${passId}</p>
                </div>
                <div>
                    <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Meeting With</p>
                    <p style="margin: 2px 0 0; font-size: 13px; color: #1e293b; font-weight: 600;">${visitorData.staff_name || 'Staff'}</p>
                </div>
                <div>
                    <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Department</p>
                    <p style="margin: 2px 0 0; font-size: 13px; color: #1e293b; font-weight: 600;">${visitorData.department_name || '-'}</p>
                </div>
                <div>
                    <p style="margin: 0; font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Valid Date</p>
                    <p style="margin: 2px 0 0; font-size: 13px; color: #1e293b; font-weight: 600;">${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <a href="${passUrl}" style="display: inline-block; background-color: #6366f1; color: white; padding: 12px 25px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">View Full ID Pass</a>
            <p style="margin: 15px 0 0; font-size: 11px; color: #94a3b8;">This is an automated message. Please do not reply.</p>
        </div>
    </div>
    `;

    try {
        await mailTransporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'VisitorGate'}" <${process.env.SMTP_USER}>`,
            to: visitorData.visitor_email,
            subject: `🎫 Your Visitor ID Pass - ${process.env.COLLEGE_NAME}`,
            html: htmlContent,
        });
        console.log(`[PASS] ✅ Sent to ${visitorData.visitor_email}`);
        return true;
    } catch (err) {
        console.error('[PASS] ❌ Error sending email:', err.message);
        return false;
    }
}

// ═══ SMS NOTIFICATION HELPER ═══
async function sendSMS(recipientPhone, message, requestId, direction) {
    const smsId = 'sms-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);

    if (!SMS_ENABLED || !twilioClient) {
        console.log(`[SMS] 📱 SKIPPED (disabled) | To: ${recipientPhone} | ${message.substring(0, 60)}...`);
        // Log as QUEUED even when disabled so status page shows intent
        db.run(`INSERT INTO sms_notifications (id, request_id, recipient_phone, message, direction, status, error_message, created_at) VALUES (?,?,?,?,?,?,?,NOW())`,
            [smsId, requestId, recipientPhone, message, direction, 'QUEUED', 'SMS service disabled']);
        return { success: false, reason: 'disabled' };
    }

    try {
        const result = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: recipientPhone
        });

        console.log(`[SMS] ✅ Sent to ${recipientPhone} | SID: ${result.sid}`);
        db.run(`INSERT INTO sms_notifications (id, request_id, recipient_phone, message, direction, status, twilio_sid, created_at) VALUES (?,?,?,?,?,?,?,NOW())`,
            [smsId, requestId, recipientPhone, message, direction, 'SENT', result.sid]);

        return { success: true, sid: result.sid };
    } catch (err) {
        console.error(`[SMS] ❌ Failed to send to ${recipientPhone}:`, err.message);
        db.run(`INSERT INTO sms_notifications (id, request_id, recipient_phone, message, direction, status, error_message, created_at) VALUES (?,?,?,?,?,?,?,NOW())`,
            [smsId, requestId, recipientPhone, message, direction, 'FAILED', err.message]);

        return { success: false, error: err.message };
    }
}

app.use(express.static('public'));

// Initialize Database (MySQL)
const dbHost = process.env.DB_HOST || 'localhost';
const localHosts = ['localhost', '127.0.0.1', '::1'];
const isCloudDB = !localHosts.includes(dbHost); // Only true for remote hosts (TiDB, PlanetScale, etc.)
const pool = mysql.createPool({
    host: dbHost,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'visitorgate',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ...(isCloudDB ? { ssl: { rejectUnauthorized: true } } : {})
});

// SQLite-to-MySQL Compatibility Layer
const db = {
    all: (query, params, callback) => {
        pool.query(query, params, (err, rows) => {
            if (callback) callback(err, rows);
        });
    },
    get: (query, params, callback) => {
        pool.query(query, params, (err, rows) => {
            if (err) return callback ? callback(err) : null;
            if (callback) callback(null, rows && rows.length > 0 ? rows[0] : null);
        });
    },
    run: (query, params, callback) => {
        pool.query(query, params, (err, result) => {
            if (callback) {
                const context = { lastID: result ? result.insertId : null, changes: result ? result.affectedRows : 0 };
                callback.call(context, err);
            }
        });
    },
    serialize: (fn) => fn(), // MySQL pool doesn't strictly need serialize like SQLite
    prepare: (query) => ({
        run: (params, callback) => {
            pool.query(query, params, callback);
        },
        finalize: () => { }
    })
};

// Check connection
pool.getConnection((err, conn) => {
    if (err) {
        console.error('❌ Error connecting to MySQL (XAMPP):', err.message);
        console.log('💡 TIP: Make sure XAMPP Apache & MySQL are running and "visitorgate" database exists.');
    } else {
        console.log('✅ Connected to local MySQL (XAMPP).');
        conn.release();

        // Auto-add custom_fields column to events if missing
        pool.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_fields JSON DEFAULT NULL`, (e) => {
            if (e && !e.message.includes('Duplicate')) console.warn('[DB] events.custom_fields:', e.message);
        });
        // Auto-add custom_data column to event_registrations if missing
        pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS custom_data JSON DEFAULT NULL`, (e) => {
            if (e && !e.message.includes('Duplicate')) console.warn('[DB] event_registrations.custom_data:', e.message);
        });
        pool.query(`ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS pass_id VARCHAR(20) UNIQUE DEFAULT NULL`, (e) => {
            if (e && !e.message.includes('Duplicate')) console.warn('[DB] event_registrations.pass_id:', e.message);
        });

        // Auto-create sms_notifications table if missing
        pool.query(`CREATE TABLE IF NOT EXISTS sms_notifications (
            id VARCHAR(64) PRIMARY KEY,
            request_id VARCHAR(64),
            recipient_phone VARCHAR(20) NOT NULL,
            message TEXT,
            direction ENUM('TO_STAFF','TO_VISITOR') NOT NULL,
            status ENUM('SENT','FAILED','QUEUED') DEFAULT 'QUEUED',
            twilio_sid VARCHAR(64),
            error_message TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB`, (e) => {
            if (e && !e.message.includes('already exists')) console.warn('[DB] sms_notifications:', e.message);
            else console.log('[DB] ✅ sms_notifications table ready');
        });

        // Global Reset: Set default password 'admin123' for all staff and security users
        const defaultHash = crypto.createHash('sha256').update('admin123').digest('hex');
        pool.query(`UPDATE users SET password_hash = ? WHERE role IN ('staff', 'security')`, [defaultHash], (e, result) => {
            if (e) console.warn('[DB] Global password reset error:', e.message);
            else if (result && result.affectedRows > 0) {
                console.log(`[DB] ✅ Reset ${result.affectedRows} account(s) to default password: admin123 (Roles: staff, security)`);
            }
        });
    }
});

// Schema initialization is now handled via schema.sql in XAMPP/phpMyAdmin
// No longer needed to maintain table creation logic here.

// Departments
// Legacy departments table logic removed

// Legacy users table logic removed

// Legacy migrations removed

// Legacy profiles table logic removed

// Legacy user_roles table logic removed

// Legacy form_templates table logic removed

// Legacy visitor_sessions table logic removed

// Legacy visitor_requests table logic removed

// Legacy checkins table logic removed

// Legacy notifications table logic removed

// Legacy audit_logs table logic removed

// Legacy events table logic removed

// Legacy event_registrations table logic removed

// Legacy event_checkins table logic removed

// Legacy email_log table logic removed

// Seeding logic is now handled via schema.sql in XAMPP

// ===== AUTH ENDPOINTS =====
app.post('/auth/v1/token', authLimiter, (req, res) => {
    const { email, password } = req.body;
    console.log(`\n[AUTH] Auth attempt for: ${email}`);

    if (!email || !password) {
        console.warn('[AUTH] Missing email or password');
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    db.get(`SELECT id, staff_id, email, name, phone, role, department_id, designation, is_active, availability_status, password_hash 
             FROM users WHERE (email = ? OR staff_id = ?) AND is_active = 1`, [email, email], (err, row) => {
        if (err) {
            console.error('[AUTH] Database error:', err.message);
            return res.status(500).json({ error: 'Database error: ' + err.message });
        }

        if (!row) {
            console.warn(`[AUTH] User not found: ${email}`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!row.password_hash || row.password_hash !== passwordHash) {
            console.warn(`[AUTH] Invalid password for: ${email}`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        console.log(`[AUTH] ✅ Authentication successful for: ${email}, role: ${row.role}`);
        const { password_hash, ...userWithoutPassword } = row;
        const token = 'local_token_' + crypto.randomBytes(16).toString('hex');

        // Store session
        activeSessions.set(token, {
            userId: row.id,
            role: row.role,
            email: row.email,
            name: row.name,
            createdAt: Date.now()
        });

        res.status(200).json({
            access_token: token,
            user: userWithoutPassword
        });
    });
});

// ===== HEALTH CHECK (Moved up to ensure visibility) =====
app.get('/api/health', (req, res) => {
    console.log('[HEALTH] Check received');
    res.json({ status: 'ok', message: 'Backend is running' });
});

// ===== VISITOR GATE API ENDPOINTS =====

// Get user by email (with role)
app.get('/api/users/by-email/:email', (req, res) => {
    const email = req.params.email;
    db.get(`SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.email = ?`, [email], (err, row) => {
        if (err) {
            console.error('Error fetching user:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(row);
    });
});

// Get departments
app.get('/api/departments', (req, res) => {
    db.all('SELECT * FROM departments WHERE is_active = 1 ORDER BY name', [], (err, rows) => {
        if (err) {
            console.error('Error fetching departments:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});

// Create department
app.post('/api/departments', authMiddleware, adminOnly, (req, res) => {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code required' });
    const id = 'dept-' + Date.now();
    db.run('INSERT INTO departments (id, name, code, description, is_active) VALUES (?, ?, ?, ?, 1)',
        [id, name, code.toUpperCase(), description || ''], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, name, code: code.toUpperCase() });
        });
});

// Create user
app.post('/api/users', (req, res) => {
    const { name, email, phone, department_id, designation, role, staff_id, password } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    const id = (role || 'staff') + '-' + Date.now();

    // Default password: "admin123" — staff should change it after first login
    const defaultPassword = password || 'admin123';
    const passwordHash = crypto.createHash('sha256').update(defaultPassword).digest('hex');

    // Auto-generate staff_id if it's staff role and ID is missing
    let finalStaffId = staff_id || null;
    if (role === 'staff' && !finalStaffId && department_id) {
        db.get('SELECT code FROM departments WHERE id = ?', [department_id], (err, dept) => {
            const deptCode = dept ? dept.code : 'STF';
            const random = Math.floor(100 + Math.random() * 900);
            finalStaffId = `VG-${deptCode}-${random}`;
            insertUser(finalStaffId);
        });
    } else {
        insertUser(finalStaffId);
    }

    function insertUser(sid) {
        db.run('INSERT INTO users (id, staff_id, email, phone, name, role, department_id, designation, is_active, availability_status, password_hash) VALUES (?,?,?,?,?,?,?,?,1,"available",?)',
            [id, sid, email, phone || '', name, role || 'staff', department_id || '', designation || '', passwordHash], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id, name, email, role, staff_id: sid });
            });
    }
});

// Update user availability
app.post('/api/users/:id/availability', (req, res) => {
    const { status } = req.body;
    db.run('UPDATE users SET availability_status = ? WHERE id = ?', [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Get staff by department
app.get('/api/departments/:dept_id/staff', (req, res) => {
    const dept_id = req.params.dept_id;
    db.all('SELECT id, name, designation, availability_status FROM users WHERE department_id = ? AND role = ? AND is_active = 1 ORDER BY name',
        [dept_id, 'staff'], (err, rows) => {
            if (err) {
                console.error('Error fetching staff:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json(rows || []);
        });
});

// Get form templates
app.get('/api/form-templates', (req, res) => {
    const { category } = req.query;
    let query = 'SELECT * FROM form_templates';
    const params = [];

    if (category) {
        query += ' WHERE category = ?';
        params.push(category);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error fetching templates:', err.message);
            return res.status(500).json({ error: err.message });
        }
        // Parse fields JSON for each template
        const templates = (rows || []).map(t => ({
            ...t,
            fields: typeof t.fields === 'string' ? JSON.parse(t.fields) : (t.fields || [])
        }));
        res.json(templates);
    });
});

// Get single form template
app.get('/api/form-templates/:id', (req, res) => {
    db.get('SELECT * FROM form_templates WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Template not found' });
        res.json({
            ...row,
            fields: typeof row.fields === 'string' ? JSON.parse(row.fields) : (row.fields || [])
        });
    });
});


// Redundant endpoint removed

// Get server info (for detected IP addressing)
app.get('/api/server-info', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    let host = req.headers['x-forwarded-host'] || req.get('host');
    
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const lanIp = getLanIp();
    const lanUrl = `${protocol}://${lanIp}:${port}`;

    // If accessing via localhost and NO static BASE_URL is set,
    // we should prefer the LAN IP so that generated QR codes are portable.
    let baseUrl = process.env.BASE_URL || process.env.PUBLIC_URL;
    if (!baseUrl) {
        if (!req.headers['x-forwarded-host'] && isLocal) {
            baseUrl = lanUrl;
        } else {
            baseUrl = `${protocol}://${host}`;
        }
    }

    res.json({
        base_url: baseUrl,
        lan_url: lanUrl,
        is_local: isLocal
    });
});

// Generate QR session
app.post('/api/qr-sessions/generate', authMiddleware, asyncHandler(async (req, res) => {
    const { template_id, category, security_id } = req.body;

    const err = validate.required(req.body, ['template_id', 'category', 'security_id']);
    if (err) return res.status(400).json({ error: err });

    const sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const sessionCode = 'VMS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(); // 6 hours

    // URL that the visitor will visit — use the request's own origin so it works on any network
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    let host = req.headers['x-forwarded-host'] || req.get('host'); // e.g. "visitormanagement-xyz.onrender.com" or "192.168.10.137:3001"
    
    // Only apply the LAN IP override if there's no reverse proxy and we're strictly on localhost
    // (If x-forwarded-host is present, we are deployed behind a proxy, so we trust that host)
    if (!req.headers['x-forwarded-host'] && (host.includes('localhost') || host.includes('127.0.0.1'))) {
        const lanIp = getLanIp();
        host = `${lanIp}:${port}`;
    }

    const baseUrl = process.env.BASE_URL || process.env.PUBLIC_URL || `${protocol}://${host}`;
    
    // Determine the correct page based on category
    let page = 'visitor.html';
    if (category === 'event') {
        page = 'event-register.html';
    }

    const visitorUrl = `${baseUrl}/${page}?session=${sessionCode}&token=${token}`;

    db.run(`INSERT INTO visitor_sessions (id, session_code, template_id, category, qr_code_url, qr_token, qr_token_hash, status, expires_at, generated_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [sessionId, sessionCode, template_id, category, visitorUrl, token, tokenHash, expiresAt, security_id],
        function (err) {
            if (err) {
                console.error('Error creating session:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json({
                session_id: sessionId,
                session_code: sessionCode,
                visitor_url: visitorUrl,
                expires_at: expiresAt
            });
        }
    );
}));

// New endpoint for server-side QR generation
app.get('/api/qr/generate', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL required');

    try {
        const qrImage = await QRCode.toDataURL(url, {
            scale: 10,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        res.json({ qr_image: qrImage });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// Validate QR token
app.post('/api/qr-sessions/validate', (req, res) => {
    const { session_code, token } = req.body;

    if (!session_code || !token) {
        return res.status(400).json({ valid: false, error: 'Missing session_code or token' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    db.get(`SELECT * FROM visitor_sessions WHERE session_code = ? AND qr_token_hash = ? AND status != 'DESTROYED'`,
        [session_code, tokenHash], (err, row) => {
            if (err) {
                console.error('Error validating session:', err.message);
                return res.status(500).json({ valid: false, error: err.message });
            }

            if (!row) {
                return res.status(400).json({ valid: false, error: 'Invalid or expired QR code' });
            }

            if (row.status === 'EXPIRED') {
                return res.status(400).json({ valid: false, error: 'QR code has expired' });
            }

            if (row.status === 'USED') {
                return res.status(400).json({ valid: false, error: 'QR code already used' });
            }

            res.json({
                valid: true,
                session_id: row.id,
                template_id: row.template_id,
                category: row.category
            });
        });
});

// Submit visitor request
app.post('/api/visitor-requests/submit', asyncHandler(async (req, res) => {
    const { session_id, visitor_name, visitor_phone, visitor_email, form_data, department_id, staff_id } = req.body;

    const err = validate.required(req.body, ['session_id', 'visitor_name', 'visitor_phone', 'staff_id']);
    if (err) return res.status(400).json({ error: err });
    if (!validate.phone(visitor_phone)) return res.status(400).json({ error: 'Invalid phone format' });
    if (visitor_email && !validate.email(visitor_email)) return res.status(400).json({ error: 'Invalid email format' });

    const requestId = 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    db.run(`INSERT INTO visitor_requests (id, session_id, visitor_name, visitor_phone, visitor_email, form_data, department_id, staff_id, approval_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
        [requestId, session_id, visitor_name, visitor_phone, visitor_email || '', JSON.stringify(form_data), department_id, staff_id],
        function (err) {
            if (err) {
                console.error('Error submitting request:', err.message);
                return res.status(500).json({ error: err.message });
            }

            // Mark session as USED
            db.run(`UPDATE visitor_sessions SET status = 'USED' WHERE id = ?`, [session_id]);

            // Send notification to staff (DB)
            db.run(`INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
                    VALUES (?, ?, 'visitor_request', ?, ?, ?, NOW())`,
                ['notif-' + Date.now(), staff_id,
                    'New Visitor Request',
                `${visitor_name} wants to meet you - Purpose: ${form_data.purpose}`,
                JSON.stringify({ request_id: requestId, visitor_name, visitor_phone })]);

            // 📱 Send SMS to staff's phone number
            db.get('SELECT phone, name FROM users WHERE id = ?', [staff_id], (e2, staffUser) => {
                if (staffUser && staffUser.phone) {
                    const smsMsg = `🛡️ VisitorGate: ${visitor_name} (📞 ${visitor_phone}) wants to meet you. Purpose: ${form_data?.purpose || 'General Visit'}. Open your staff portal to respond.`;
                    sendSMS(staffUser.phone, smsMsg, requestId, 'TO_STAFF');
                }
            });

            res.status(201).json({
                success: true,
                request_id: requestId,
                message: 'Request sent to staff',
                sms_sent: SMS_ENABLED,
                status: 'PENDING'
            });
        }
    );
}));

// Get pending visitor requests (for security dashboard)
app.get('/api/visitor-requests/pending', authMiddleware, (req, res) => {
    db.all(`SELECT vr.*, d.name as department_name, u.name as staff_name
            FROM visitor_requests vr
            LEFT JOIN departments d ON vr.department_id = d.id
            LEFT JOIN users u ON vr.staff_id = u.id
            WHERE vr.approval_status IN ('PENDING', 'APPROVED')
            ORDER BY vr.created_at DESC`,
        [], (err, rows) => {
            if (err) {
                console.error('Error fetching pending requests:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json((rows || []).map(r => ({
                ...r,
                form_data: JSON.parse(r.form_data || '{}')
            })));
        });
});

// Get my visitor requests (for staff)
app.get('/api/visitor-requests/my-requests/:staff_id', authMiddleware, async (req, res) => {
    const staff_id = req.params.staff_id;
    try {
        const requests = await new Promise((resolve, reject) => {
            db.all(`SELECT vr.*, d.name as department_name
                FROM visitor_requests vr
                LEFT JOIN departments d ON vr.department_id = d.id
                WHERE vr.staff_id = ?
                ORDER BY vr.created_at DESC`,
                [staff_id], (err, rows) => err ? reject(err) : resolve(rows || []));
        });
        res.json(requests.map(r => ({
            ...r,
            form_data: JSON.parse(r.form_data || '{}')
        })));
    } catch (e) {
        console.error('Error fetching staff requests:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Get visitor history for staff (completed/resolved requests)
app.get('/api/visitor-requests/history/:staff_id', (req, res) => {
    const staff_id = req.params.staff_id;
    db.all(`SELECT vr.*, d.name as department_name,
            c.checkin_time, c.checkout_time, c.duration_minutes
            FROM visitor_requests vr
            LEFT JOIN departments d ON vr.department_id = d.id
            LEFT JOIN checkins c ON c.visitor_request_id = vr.id
            WHERE vr.staff_id = ? AND vr.approval_status IN ('APPROVED','REJECTED','BUSY','CHECKED_IN','COMPLETED')
            ORDER BY vr.created_at DESC
            LIMIT 100`,
        [staff_id], (err, rows) => {
            if (err) {
                console.error('Error fetching visitor history:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json((rows || []).map(r => ({
                ...r,
                form_data: JSON.parse(r.form_data || '{}')
            })));
        });
});

// Approve visitor request
app.post('/api/visitor-requests/:request_id/approve', authMiddleware, (req, res) => {
    const request_id = req.params.request_id;
    const { staff_id } = req.body;

    db.run(`UPDATE visitor_requests SET approval_status = 'APPROVED', approved_by = ?, approval_time = NOW() WHERE id = ?`,
        [staff_id, request_id], function (err) {
            if (err) {
                console.error('Error approving request:', err.message);
                return res.status(500).json({ error: err.message });
            }
            // Send email notification + SMS + Virtual ID Pass to visitor
            db.get(`SELECT vr.*, d.name as department_name, u.name as staff_name 
                    FROM visitor_requests vr 
                    LEFT JOIN departments d ON vr.department_id = d.id
                    LEFT JOIN users u ON vr.staff_id = u.id 
                    WHERE vr.id = ?`, [request_id], (e2, vr) => {
                if (vr) {
                    const formData = JSON.parse(vr.form_data || '{}');
                    vr.form_data = formData;

                    // 1. Send Virtual ID Pass if approved
                    if (vr.visitor_email) {
                        sendVirtualIDPass(vr);
                    }

                    // 2. Standard email log
                    if (vr.visitor_email) {
                        sendEmailLog(db, vr.visitor_email, 'Visit Approved - VisitorGate',
                            `Dear ${vr.visitor_name}, your visit request has been approved. Please proceed to the security gate for check-in.`);
                    }

                    // 3. 📱 Send SMS to visitor
                    if (vr.visitor_phone) {
                        const smsMsg = `✅ VisitorGate: Your visit request has been APPROVED by ${vr.staff_name || 'Staff'}. Please proceed to the security gate for check-in.`;
                        sendSMS(vr.visitor_phone, smsMsg, request_id, 'TO_VISITOR');
                    }
                }
            });
            res.json({ success: true, message: 'Request approved' });
        }
    );
});

// Reject visitor request
app.post('/api/visitor-requests/:request_id/reject', authMiddleware, (req, res) => {
    const request_id = req.params.request_id;
    const { staff_id, reason } = req.body;

    db.run(`UPDATE visitor_requests SET approval_status = 'REJECTED', approved_by = ?, rejection_reason = ?, approval_time = NOW() WHERE id = ?`,
        [staff_id, reason || '', request_id], function (err) {
            if (err) {
                console.error('Error rejecting request:', err.message);
                return res.status(500).json({ error: err.message });
            }
            // Send email + SMS notification to visitor
            db.get('SELECT vr.visitor_name, vr.visitor_email, vr.visitor_phone, u.name as staff_name FROM visitor_requests vr LEFT JOIN users u ON vr.staff_id = u.id WHERE vr.id = ?', [request_id], (e2, vr) => {
                if (vr) {
                    if (vr.visitor_email) {
                        sendEmailLog(db, vr.visitor_email, 'Visit Declined - VisitorGate',
                            `Dear ${vr.visitor_name}, your visit request has been declined. ${reason ? 'Reason: ' + reason : ''}`);
                    }
                    // 📱 Send SMS to visitor
                    if (vr.visitor_phone) {
                        const smsMsg = `❌ VisitorGate: Your visit request has been DECLINED by ${vr.staff_name || 'Staff'}.${reason ? ' Reason: ' + reason : ''} Please contact the reception for further assistance.`;
                        sendSMS(vr.visitor_phone, smsMsg, request_id, 'TO_VISITOR');
                    }
                }
            });
            res.json({ success: true, message: 'Request rejected' });
        }
    );
});

// Analytics Stats
app.get('/api/analytics/stats', authMiddleware, (req, res) => {
    const stats = {
        total: 0,
        approved: 0,
        rejected: 0,
        busy: 0,
        pending: 0,
        dept_dist: [],
        purpose_dist: []
    };

    const queries = [
        // Basic counts
        new Promise((resolve, reject) => {
            db.all("SELECT approval_status, COUNT(*) as count FROM visitor_requests GROUP BY approval_status", [], (err, rows) => {
                if (err) return reject(err);
                rows.forEach(r => {
                    const s = r.approval_status.toLowerCase();
                    if (stats.hasOwnProperty(s)) stats[s] = r.count;
                    stats.total += r.count;
                });
                resolve();
            });
        }),
        // Dept distribution
        new Promise((resolve, reject) => {
            db.all(`SELECT d.name, COUNT(vr.id) as count 
                    FROM departments d 
                    LEFT JOIN visitor_requests vr ON d.id = vr.department_id 
                    GROUP BY d.id`, [], (err, rows) => {
                if (err) return reject(err);
                stats.dept_dist = rows;
                resolve();
            });
        }),
        // Purpose distribution (Basic keyword extraction from JSON)
        new Promise((resolve, reject) => {
            db.all("SELECT form_data FROM visitor_requests", [], (err, rows) => {
                if (err) return reject(err);
                const counts = {};
                rows.forEach(r => {
                    try {
                        const data = JSON.parse(r.form_data);
                        const p = data.purpose || 'Other';
                        counts[p] = (counts[p] || 0) + 1;
                    } catch (e) { }
                });
                stats.purpose_dist = Object.entries(counts).map(([name, count]) => ({ name, count }));
                resolve();
            });
        })
    ];

    Promise.all(queries)
        .then(() => res.json(stats))
        .catch(err => res.status(500).json({ error: err.message }));
});

// Detailed Visitor Report for Admin Export
app.get('/api/analytics/detailed-report', authMiddleware, adminOnly, (req, res) => {
    const query = `
        SELECT 
            vr.id, 
            vr.visitor_name, 
            vr.visitor_phone, 
            vr.visitor_email,
            d.name as department_name, 
            u.name as staff_name, 
            vr.approval_status, 
            vr.created_at,
            vr.form_data,
            c.checkin_time, 
            c.checkout_time, 
            c.duration_minutes,
            c.gate_location,
            c.status as checkin_status
        FROM visitor_requests vr
        LEFT JOIN departments d ON vr.department_id = d.id
        LEFT JOIN users u ON vr.staff_id = u.id
        LEFT JOIN checkins c ON vr.id = c.visitor_request_id
        ORDER BY vr.created_at DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Final processing of rows (parsing JSON form_data)
        const processed = rows.map(r => {
            let purpose = 'N/A';
            try {
                const data = typeof r.form_data === 'string' ? JSON.parse(r.form_data) : r.form_data;
                purpose = data.purpose || 'N/A';
            } catch (e) {}
            return {
                ...r,
                purpose,
                form_data: undefined // remove raw JSON for report
            };
        });
        
        res.json(processed);
    });
});

// Mark visitor request as BUSY
app.post('/api/visitor-requests/:request_id/busy', authMiddleware, (req, res) => {
    const request_id = req.params.request_id;
    const { staff_id } = req.body;

    db.run(`UPDATE visitor_requests SET approval_status = 'BUSY', approved_by = ?, approval_time = NOW() WHERE id = ?`,
        [staff_id, request_id], function (err) {
            if (err) {
                console.error('Error marking as busy:', err.message);
                return res.status(500).json({ error: err.message });
            }
            // Send email + SMS notification to visitor
            db.get('SELECT vr.visitor_name, vr.visitor_email, vr.visitor_phone, u.name as staff_name FROM visitor_requests vr LEFT JOIN users u ON vr.staff_id = u.id WHERE vr.id = ?', [request_id], (e2, vr) => {
                if (vr) {
                    if (vr.visitor_email) {
                        sendEmailLog(db, vr.visitor_email, 'VisitorGate - Staff is Busy',
                            `Dear ${vr.visitor_name}, ${vr.staff_name || 'Staff'} is currently busy. Please wait at the reception.`);
                    }
                    // 📱 Send SMS to visitor
                    if (vr.visitor_phone) {
                        const smsMsg = `⏳ VisitorGate: ${vr.staff_name || 'Staff'} is currently BUSY. Please wait at the reception area. You will be notified when they are available.`;
                        sendSMS(vr.visitor_phone, smsMsg, request_id, 'TO_VISITOR');
                    }
                }
            });
            res.json({ success: true, message: 'Staff is busy' });
        }
    );
});

// Get single visitor request status
app.get('/api/visitor-requests/:request_id', (req, res) => {
    const request_id = req.params.request_id;
    db.get(`SELECT vr.*, d.name as department_name, u.name as staff_name, u.designation as staff_designation
            FROM visitor_requests vr
            LEFT JOIN departments d ON vr.department_id = d.id
            LEFT JOIN users u ON vr.staff_id = u.id
            WHERE vr.id = ?`,
        [request_id], (err, row) => {
            if (err) {
                console.error('Error fetching request status:', err.message);
                return res.status(500).json({ error: err.message });
            }
            if (!row) return res.status(404).json({ error: 'Request not found' });

            res.json({
                ...row,
                form_data: JSON.parse(row.form_data || '{}')
            });
        });
});

// ===== SMS NOTIFICATION HISTORY =====
app.get('/api/sms-notifications/:request_id', (req, res) => {
    const request_id = req.params.request_id;
    db.all(`SELECT id, recipient_phone, message, direction, status, twilio_sid, error_message, created_at
            FROM sms_notifications WHERE request_id = ? ORDER BY created_at ASC`,
        [request_id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        });
});

// ===== VISITOR PASS INFO =====
app.get('/api/visitor-requests/:id', (req, res) => {
    const id = req.params.id;
    db.get(`SELECT vr.*, d.name as department_name, u.name as staff_name, u.designation as staff_designation
            FROM visitor_requests vr
            LEFT JOIN departments d ON vr.department_id = d.id
            LEFT JOIN users u ON vr.staff_id = u.id
            WHERE vr.id = ?`, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Request not found' });
        
        row.form_data = JSON.parse(row.form_data || '{}');
        res.json(row);
    });
});

// Check in visitor
app.post('/api/checkins', authMiddleware, (req, res) => {
    const { visitor_request_id, session_id, security_id, gate_location } = req.body;

    if (!visitor_request_id || !security_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Validate request status
    db.get('SELECT approval_status, visitor_name FROM visitor_requests WHERE id = ?', [visitor_request_id], (err, request) => {
        if (err) return res.status(500).json({ error: 'Database error: ' + err.message });
        if (!request) return res.status(404).json({ error: 'Visitor request not found' });

        if (request.approval_status !== 'APPROVED') {
            const msg = request.approval_status === 'CHECKED_IN' ? 'Visitor is already checked in.' :
                request.approval_status === 'COMPLETED' ? 'Visitor has already completed their visit.' :
                    'Request is not approved yet (Current status: ' + request.approval_status + ')';
            return res.status(400).json({ error: msg });
        }

        const checkinId = 'checkin-' + Date.now();

        // 2. Atomic-like update (sequence)
        db.serialize(() => {
            // Insert check-in record
            db.run(`INSERT INTO checkins (id, visitor_request_id, session_id, checkin_time, security_checkin_id, gate_location, status, created_at)
                    VALUES (?, ?, ?, NOW(), ?, ?, 'INSIDE', NOW())`,
                [checkinId, visitor_request_id, session_id || '', security_id, gate_location || 'Main Gate'], (e1) => {
                    if (e1) return res.status(500).json({ error: 'Check-in failed: ' + e1.message });

                    // Update request status to CHECKED_IN
                    db.run(`UPDATE visitor_requests SET approval_status = 'CHECKED_IN' WHERE id = ?`, [visitor_request_id], (e2) => {
                        if (e2) console.error('[DB] Failed to update request status:', e2.message);

                        console.log(`[CHECK-IN] ✅ ${request.visitor_name} checked in at ${gate_location || 'Main Gate'}`);
                        res.json({ success: true, checkin_id: checkinId, visitor_name: request.visitor_name });
                    });
                }
            );
        });
    });
});

// Check out visitor
app.post('/api/checkins/:id/checkout', authMiddleware, (req, res) => {
    const checkin_id = req.params.id;
    const { security_id } = req.body;

    db.get('SELECT * FROM checkins WHERE id = ?', [checkin_id], (err, checkin) => {
        if (err || !checkin) {
            return res.status(404).json({ error: 'Check-in record not found' });
        }

        if (checkin.status === 'EXITED') {
            return res.status(400).json({ error: 'Visitor has already checked out.' });
        }

        const checkoutTime = new Date();
        const checkinTime = new Date(checkin.checkin_time);
        const durationMinutes = Math.round((checkoutTime - checkinTime) / 60000);

        db.serialize(() => {
            // 1. Update checkin record
            db.run(`UPDATE checkins SET checkout_time = NOW(), duration_minutes = ?, security_checkout_id = ?, status = 'EXITED' WHERE id = ?`,
                [durationMinutes, security_id, checkin_id], (e1) => {
                    if (e1) return res.status(500).json({ error: 'Check-out update failed: ' + e1.message });

                    // 2. Update request status to COMPLETED
                    db.run(`UPDATE visitor_requests SET approval_status = 'COMPLETED' WHERE id = ?`, [checkin.visitor_request_id], (e2) => {
                        if (e2) console.error('[DB] Failed to mark request as COMPLETED:', e2.message);
                    });

                    // 3. Destroy QR session if exists
                    if (checkin.session_id) {
                        db.run(`UPDATE visitor_sessions SET status = 'DESTROYED' WHERE id = ?`, [checkin.session_id]);
                    }

                    console.log(`[CHECK-OUT] 🚪 Visitor ${checkin.visitor_request_id} checked out. Duration: ${durationMinutes} mins.`);
                    res.json({
                        success: true,
                        checkout_time: checkoutTime.toISOString(),
                        duration_minutes: durationMinutes
                    });
                }
            );
        });
    });
});

// Get visitors currently inside
app.get('/api/checkins/active', authMiddleware, (req, res) => {
    db.all(`SELECT c.*, vr.visitor_name, vr.visitor_phone, d.name as department_name, u.name as staff_name
            FROM checkins c
            JOIN visitor_requests vr ON c.visitor_request_id = vr.id
            LEFT JOIN departments d ON vr.department_id = d.id
            LEFT JOIN users u ON vr.staff_id = u.id
            WHERE c.status = 'INSIDE'
            ORDER BY c.checkin_time DESC`,
        [], (err, rows) => {
            if (err) {
                console.error('Error fetching active checkins:', err.message);
                return res.status(500).json({ error: err.message });
            }
            res.json(rows || []);
        });
});

// ===== GET ALL USERS =====
app.get('/api/users', authMiddleware, (req, res) => {
    const { role } = req.query;
    let query = 'SELECT u.id, u.staff_id, u.email, u.name, u.phone, u.role, u.department_id, u.designation, u.is_active, u.availability_status, u.created_at, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.is_active = 1';
    const params = [];
    if (role) { query += ' AND u.role = ?'; params.push(role); }
    query += ' ORDER BY u.name';
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Update user
app.put('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
    const { name, email, phone, department_id, designation, staff_id } = req.body;

    // Validation
    const err = validate.required(req.body, ['name', 'email', 'role']);
    if (err) return res.status(400).json({ error: err });
    if (!validate.email(email)) return res.status(400).json({ error: 'Invalid email format' });

    db.run(`UPDATE users SET name = ?, email = ?, phone = ?, department_id = ?, designation = ?, staff_id = ? WHERE id = ?`,
        [name, email, phone, department_id, designation, staff_id, req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Get single department
app.get('/api/departments/:id', (req, res) => {
    db.get('SELECT * FROM departments WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Department not found' });
        res.json(row);
    });
});

// Update department
app.put('/api/departments/:id', authMiddleware, adminOnly, (req, res) => {
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });

    db.run(`UPDATE departments SET name = ?, code = ?, description = ? WHERE id = ?`,
        [name, code.toUpperCase(), description || '', req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Delete department (soft-delete)
app.delete('/api/departments/:id', authMiddleware, adminOnly, (req, res) => {
    const id = req.params.id;
    // Check for linked active staff
    db.get('SELECT COUNT(*) as count FROM users WHERE department_id = ? AND is_active = 1', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row.count > 0) {
            return res.status(400).json({ error: `Cannot delete: ${row.count} active staff member(s) are linked to this department. Reassign or remove them first.` });
        }
        db.run('UPDATE departments SET is_active = 0 WHERE id = ?', [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// Delete user (soft-delete)
app.delete('/api/users/:id', authMiddleware, adminOnly, (req, res) => {
    db.run('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Update form template
app.put('/api/form-templates/:id', authMiddleware, adminOnly, (req, res) => {
    const { name, category, description, fields } = req.body;
    if (!name) return res.status(400).json({ error: 'Template name required' });
    db.run('UPDATE form_templates SET name = ?, category = ?, description = ?, fields = ? WHERE id = ?',
        [name, category || 'other', description || '', JSON.stringify(fields || []), req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Delete form template
app.delete('/api/form-templates/:id', authMiddleware, adminOnly, (req, res) => {
    db.run('DELETE FROM form_templates WHERE id = ?', [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Update event
app.put('/api/events/:id', authMiddleware, adminOnly, (req, res) => {
    const { name, description, event_date, event_time, venue, max_participants, custom_fields } = req.body;
    if (!name || !event_date) return res.status(400).json({ error: 'Event name and date are required' });
    db.run(`UPDATE events SET name = ?, description = ?, event_date = ?, event_time = ?, venue = ?, max_participants = ?, custom_fields = ? WHERE id = ?`,
        [name, description || '', event_date, event_time || '', venue || '', max_participants || 0, JSON.stringify(custom_fields || null), req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Delete event (soft-delete by cancelling)
app.delete('/api/events/:id', authMiddleware, adminOnly, (req, res) => {
    db.run("UPDATE events SET status = 'CANCELLED' WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ===== CREATE FORM TEMPLATE =====
app.post('/api/form-templates', authMiddleware, adminOnly, (req, res) => {
    const { name, category, description, fields } = req.body;
    if (!name) return res.status(400).json({ error: 'Template name required' });
    const id = 'tmpl-' + Date.now();
    db.run('INSERT INTO form_templates (id, name, category, description, fields, is_default, created_at) VALUES (?,?,?,?,?,0, NOW())',
        [id, name, category || 'other', description || '', JSON.stringify(fields || [])], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, name, category });
        });
});

// ===== EVENTS =====
app.get('/api/events', (req, res) => {
    db.all(`SELECT e.*, 
            (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as total_registrations,
            (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND approval_status = 'APPROVED') as approved_count
            FROM events e ORDER BY e.event_date DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.post('/api/events', authMiddleware, adminOnly, (req, res) => {
    const { name, description, event_date, event_time, venue, max_participants, created_by, custom_fields } = req.body;
    if (!name || !event_date) return res.status(400).json({ error: 'Event name and date are required' });
    const id = 'evt-' + Date.now();
    const qr_token = crypto.randomBytes(16).toString('hex');
    db.run(`INSERT INTO events (id, name, description, event_date, event_time, venue, max_participants, qr_token, custom_fields, status, created_by, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,'ACTIVE',?,NOW())`,
        [id, name, description || '', event_date, event_time || '', venue || '', max_participants || 0, qr_token, JSON.stringify(custom_fields || null), created_by || 'admin'],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, name, qr_token, status: 'ACTIVE' });
        });
});

// ===== EVENT REGISTRATIONS =====
app.get('/api/event-registrations', (req, res) => {
    const { event_id } = req.query;
    let query = `SELECT er.*, e.name as event_name, e.event_date, e.venue FROM event_registrations er LEFT JOIN events e ON er.event_id = e.id`;
    const params = [];
    if (event_id) { query += ' WHERE er.event_id = ?'; params.push(event_id); }
    query += ' ORDER BY er.created_at DESC';
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.get('/api/event-registrations/status/:id', (req, res) => {
    db.get(`SELECT er.*, e.name as event_name, e.event_date, e.venue 
            FROM event_registrations er LEFT JOIN events e ON er.event_id = e.id
            WHERE er.id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Registration not found' });
        res.json(row);
    });
});

app.get('/api/event-registrations/verify', (req, res) => {
    const { token, id } = req.query;
    let query = `SELECT er.*, e.name as event_name, e.event_date, e.venue,
            (SELECT COUNT(*) > 0 FROM event_checkins ec WHERE ec.registration_id = er.id AND ec.checkout_time IS NULL) as is_inside
            FROM event_registrations er LEFT JOIN events e ON er.event_id = e.id`;
    let params = [];

    if (token) {
        query += ' WHERE er.pass_token = ?';
        params.push(token);
    } else if (id && id.startsWith('VG-E-')) {
        query += ' WHERE er.pass_id = ?';
        params.push(id);
    } else if (id) {
        query += ' WHERE er.id = ?';
        params.push(id);
    } else {
        return res.status(400).json({ error: 'Token or ID required' });
    }

    db.get(query, params, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Invalid pass or registration' });
        res.json(row);
    });
});

app.post('/api/event-registrations/:id/approve', (req, res) => {
    const { approved_by } = req.body;
    const pass_token = crypto.randomBytes(16).toString('hex');
    const pass_id = 'VG-E-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    
    db.run(`UPDATE event_registrations SET approval_status = 'APPROVED', approved_by = ?, pass_token = ?, pass_id = ?, approval_time = NOW() WHERE id = ?`,
        [approved_by || 'admin', pass_token, pass_id, req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            db.get('SELECT * FROM event_registrations WHERE id = ?', [req.params.id], (err2, row) => {
                if (row && row.visitor_email) {
                    const passUrl = `${req.protocol}://${req.get('host')}/event-pass.html?token=${pass_token}`;
                    sendEmailLog(db, row.visitor_email, 'Your Virtual ID Pass - VisitorGate',
                        `Congratulations! Your registration for the event has been approved. \n\nView your Virtual ID Pass here: ${passUrl}`);

                    res.json({
                        success: true,
                        pass_token,
                        pass_url: '/event-pass.html?token=' + pass_token,
                        visitor_email: row.visitor_email
                    });
                } else {
                    res.json({ success: true, pass_token });
                }
            });
        });
});

app.post('/api/event-registrations/:id/reject', (req, res) => {
    const { approved_by, reason } = req.body;
    db.run(`UPDATE event_registrations SET approval_status = 'REJECTED', approved_by = ?, rejection_reason = ?, approval_time = NOW() WHERE id = ?`,
        [approved_by || 'admin', reason || '', req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// Bulk Approve Event Registrations
app.post('/api/event-registrations/bulk-approve', authMiddleware, (req, res) => {
    const { ids, approved_by } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });

    db.serialize(() => {
        const stmt = db.prepare(`UPDATE event_registrations SET approval_status = 'APPROVED', approved_by = ?, pass_token = ?, approval_time = NOW() WHERE id = ?`);
        ids.forEach(id => {
            const pass_token = crypto.randomBytes(16).toString('hex');
            stmt.run([approved_by || 'admin', pass_token, id], (err) => {
                if (!err) {
                    db.get('SELECT visitor_email, visitor_name FROM event_registrations WHERE id = ?', [id], (e2, row) => {
                        if (row && row.visitor_email) {
                            const passUrl = `${req.protocol}://${req.get('host')}/event-pass.html?token=${pass_token}`;
                            sendEmailLog(db, row.visitor_email, 'Your Virtual ID Pass - VisitorGate',
                                `Hi ${row.visitor_name}, your event registration is approved. \n\nPass: ${passUrl}`);
                        }
                    });
                }
            });
        });
        stmt.finalize();
        res.json({ success: true, count: ids.length });
    });
});

// Bulk Reject Event Registrations
app.post('/api/event-registrations/bulk-reject', authMiddleware, (req, res) => {
    const { ids, approved_by, reason } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });

    db.serialize(() => {
        const stmt = db.prepare(`UPDATE event_registrations SET approval_status = 'REJECTED', approved_by = ?, rejection_reason = ?, approval_time = NOW() WHERE id = ?`);
        ids.forEach(id => {
            stmt.run([approved_by || 'admin', reason || '', id]);
        });
        stmt.finalize();
        res.json({ success: true, count: ids.length });
    });
});

// ===== EVENT CHECKINS =====
app.post('/api/event-checkins', (req, res) => {
    const { registration_id, event_id, security_id, gate_location } = req.body;
    if (!registration_id) return res.status(400).json({ error: 'Registration ID required' });
    const id = 'echk-' + Date.now();
    db.run(`INSERT INTO event_checkins (id, registration_id, event_id, checkin_time, security_id, gate_location, created_at) VALUES (?,?,?,NOW(),?,?,NOW())`,
        [id, registration_id, event_id || '', security_id || '', gate_location || 'Main Gate'], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id });
        });
});

app.get('/api/event-checkins/active', (req, res) => {
    db.all(`SELECT ec.*, er.visitor_name, er.visitor_phone, er.organization, e.name as event_name 
            FROM event_checkins ec 
            LEFT JOIN event_registrations er ON ec.registration_id = er.id
            LEFT JOIN events e ON ec.event_id = e.id
            WHERE ec.checkout_time IS NULL ORDER BY ec.checkin_time DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.post('/api/event-checkins/:id/checkout', (req, res) => {
    db.run(`UPDATE event_checkins SET checkout_time = NOW() WHERE id = ?`, [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ===== EVENTS BY TOKEN =====
app.get('/api/events/by-token/:token', (req, res) => {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Token required' });
    db.get('SELECT * FROM events WHERE qr_token = ?', [token], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Event not found' });
        // Parse custom_fields JSON
        if (row.custom_fields && typeof row.custom_fields === 'string') {
            try { row.custom_fields = JSON.parse(row.custom_fields); } catch (e) { }
        }
        res.json(row);
    });
});

// ===== EVENT REGISTRATIONS SUBMIT =====
app.post('/api/event-registrations', (req, res) => {
    const { event_id, visitor_name, visitor_email, visitor_phone, organization, designation, custom_data } = req.body;
    if (!event_id || !visitor_name) return res.status(400).json({ error: 'Event ID and name are required' });
    const id = 'ereg-' + Date.now();
    db.run(`INSERT INTO event_registrations (id, event_id, visitor_name, visitor_email, visitor_phone, organization, designation, custom_data, approval_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
        [id, event_id, visitor_name, visitor_email || '', visitor_phone || '', organization || '', designation || '', JSON.stringify(custom_data || null)],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, success: true });
        }
    );
});
app.get('/api/audit-logs', (req, res) => {
    db.all(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});


// Generic Data Endpoints (REST-like wrapper for Supabase compatibility)
app.get('/rest/v1/:table', (req, res) => {
    const table = req.params.table;
    const queryParams = req.query;
    console.log(`[REST] GET /rest/v1/${table} - query:`, queryParams);

    // List of allowed tables for security
    const allowedTables = ['users', 'profiles', 'departments', 'user_roles', 'form_templates', 'visitor_sessions', 'visitor_requests', 'checkins', 'notifications'];
    if (!allowedTables.includes(table)) {
        return res.status(403).json({ error: 'Access denied to table: ' + table });
    }

    let query = `SELECT * FROM ${table}`;
    const params = [];
    const filters = [];

    // Simple parser for standard filters (e.g., ?id=val or ?email=val)
    Object.keys(queryParams).forEach(key => {
        let value = queryParams[key];
        // Handle "eq.value" format if present
        if (typeof value === 'string' && value.startsWith('eq.')) {
            value = value.substring(3);
        }
        filters.push(`${key} = ?`);
        params.push(value);
    });

    if (filters.length > 0) {
        query += ` WHERE ${filters.join(' AND ')}`;
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(`[REST] DB error on ${table}:`, err.message);
            return res.status(500).json({ error: err.message });
        }

        // Post-process JSON fields for specific tables
        const processedRows = rows.map(row => {
            const newRow = { ...row };
            if (table === 'form_templates' && newRow.fields) {
                try { newRow.fields = JSON.parse(newRow.fields); } catch (e) { }
            }
            if (table === 'visitor_requests' && newRow.form_data) {
                try { newRow.form_data = JSON.parse(newRow.form_data); } catch (e) { }
            }
            if (table === 'notifications' && newRow.data) {
                try { newRow.data = JSON.parse(newRow.data); } catch (e) { }
            }
            return newRow;
        });

        res.json(processedRows);
    });
});

// ═══ GLOBAL ERROR HANDLER ═══
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        path: req.url
    });
});

app.listen(port, () => {
    console.log(`\n🚀 VisitorGate Local Backend running at http://localhost:${port}`);
    console.log(`📝 Health Check: http://localhost:${port}/api/health`);
    console.log(`🔑 Auth Endpoint: http://localhost:${port}/auth/v1/token`);
});
