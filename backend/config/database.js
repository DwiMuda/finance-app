// config/database.js
const { Pool } = require('pg');
require('dotenv').config();

// Pool connection - lebih efisien dari single connection
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Untuk production (Neon/Supabase), tambahkan SSL:
  // ssl: { rejectUnauthorized: false }
});

// Test koneksi saat server pertama kali jalan
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Gagal konek ke PostgreSQL:', err.message);
    return;
  }
  console.log('✅ PostgreSQL terhubung!');
  release();
});

module.exports = pool;