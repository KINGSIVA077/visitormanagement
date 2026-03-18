import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'visitorgate',
    waitForConnections: true,
    connectionLimit: 1
});

async function check() {
    const promisePool = pool.promise();
    try {
        const [rows] = await promisePool.query('SELECT id, pass_id, visitor_name FROM event_registrations WHERE approval_status = "APPROVED"');
        rows.forEach(r => console.log(`[PASS_ID] ${r.pass_id} | ${r.visitor_name} (${r.id})`));
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err.message);
        process.exit(1);
    }
}

check();
