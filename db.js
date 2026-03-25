const { Pool } = require('pg');
require('dotenv').config();

// Mengambil data dari file .env
const pool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,

    ssl: { rejectUnauthorized: false }
});

// Mengetes koneksi saat file ini dijalankan
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Gagal konek ke database:', err.stack);
    }
    console.log('Berhasil koneksi ke database PostgreSQL!');
    release();
});

module.exports = pool;