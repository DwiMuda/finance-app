const pool = require('./config/database');

async function migrate() {
  try {
    console.log('⏳ Memulai migrasi database...');
    
    // Periksa apakah kolom mata_uang sudah ada
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='transactions' AND column_name='mata_uang';
    `);

    if (checkColumn.rows.length === 0) {
      console.log('➕ Menambahkan kolom mata_uang...');
      await pool.query("ALTER TABLE transactions ADD COLUMN mata_uang VARCHAR(5) DEFAULT 'IDR';");
      console.log('✅ Kolom mata_uang berhasil ditambahkan!');
    } else {
      console.log('ℹ️ Kolom mata_uang sudah ada, tidak ada perubahan dilakukan.');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Terjadi kesalahan saat migrasi:', err.message);
    process.exit(1);
  }
}

migrate();
