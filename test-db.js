import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'visitorgate'
});

console.log('Attempting to connect to:', process.env.DB_HOST || '127.0.0.1');

connection.connect((err) => {
    if (err) {
        console.error('Connection failed!');
        console.error('Code:', err.code);
        console.error('Message:', err.message);
        process.exit(1);
    }
    console.log('Successfully connected to MySQL!');
    connection.end();
    process.exit(0);
});
