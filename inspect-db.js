// Database schema inspection
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database('./visitorgate.db');

console.log('\n=== VISITORGATE DATABASE SCHEMA ===\n');

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, tables) => {
    if (err) {
        console.error('Error:', err);
        db.close();
        return;
    }

    console.log('TABLES:');
    tables.forEach(t => console.log(`  ✅ ${t.name}`));

    // Get table details
    console.log('\n=== TABLE DETAILS ===\n');
    
    let completed = 0;
    tables.forEach(t => {
        db.all(`PRAGMA table_info(${t.name})`, (err, cols) => {
            console.log(`${t.name}:`);
            cols.forEach(col => {
                const nullable = col.notnull ? '' : '(nullable)';
                console.log(`  - ${col.name}: ${col.type.toUpperCase()} ${nullable}`);
            });
            console.log('');
            
            completed++;
            if (completed === tables.length) {
                // Get data counts
                console.log('=== DATA COUNTS ===\n');
                let dataDone = 0;
                tables.forEach(t => {
                    db.get(`SELECT COUNT(*) as count FROM ${t.name}`, (err, row) => {
                        console.log(`${t.name}: ${row?.count || 0} records`);
                        dataDone++;
                        if (dataDone === tables.length) {
                            db.close();
                        }
                    });
                });
            }
        });
    });
});
