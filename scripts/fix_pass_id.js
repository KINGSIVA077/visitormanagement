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

async function migrate() {
    const promisePool = pool.promise();
    try {
        console.log('Checking for pass_id column...');
        const [columns] = await promisePool.query('SHOW COLUMNS FROM event_registrations LIKE "pass_id"');
        
        if (columns.length === 0) {
            console.log('Adding pass_id column...');
            await promisePool.query('ALTER TABLE event_registrations ADD COLUMN pass_id VARCHAR(20) AFTER pass_token');
            console.log('Column added.');
        } else {
            console.log('pass_id column already exists.');
        }

        console.log('Backfilling pass_id for approved registrations...');
        const [rows] = await promisePool.query('SELECT id FROM event_registrations WHERE approval_status = "APPROVED" AND (pass_id IS NULL OR pass_id = "")');
        
        for (const row of rows) {
            const pass_id = 'VG-E-' + Math.random().toString(36).substring(2, 7).toUpperCase();
            await promisePool.query('UPDATE event_registrations SET pass_id = ? WHERE id = ?', [pass_id, row.id]);
            console.log(`Backfilled ID ${pass_id} for registration ${row.id}`);
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
