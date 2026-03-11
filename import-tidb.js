import fs from 'fs';
import mysql from 'mysql2/promise';

async function importDatabase() {
    // Generate a password first in TiDB UI and paste it here
    const password = '70Nfy4u8P40OXABm';

    const connection = await mysql.createConnection({
        host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
        port: 4000,
        user: '2PnSmWMj9qdCtdd.root',
        password: password,
        database: 'test',
        ssl: {
            rejectUnauthorized: true
        },
        multipleStatements: true,
    });

    console.log('Connected to TiDB database!');

    try {
        const sql = fs.readFileSync('visitorgate.sql', 'utf8');
        console.log('Executing SQL file... please wait. This might take a minute.');

        await connection.query(sql);
        console.log('✅ Successfully imported visitorgate.sql to TiDB Cloud!');
    } catch (err) {
        console.error('❌ Error executing SQL:', err);
    } finally {
        await connection.end();
    }
}

importDatabase().catch(console.error);
