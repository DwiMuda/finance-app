// models/transactionModel.js
const pool = require('../config/database');

const TransactionModel = {

  // Ambil semua transaksi dengan filter opsional
  async getAll({ bulan, tahun, tipe }) {
    let query = `
      SELECT * FROM transactions
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (bulan && tahun) {
      query += ` AND EXTRACT(MONTH FROM tanggal) = $${idx++}
                 AND EXTRACT(YEAR  FROM tanggal) = $${idx++}`;
      params.push(bulan, tahun);
    }

    if (tipe) {
      query += ` AND tipe = $${idx++}`;
      params.push(tipe);
    }

    query += ' ORDER BY tanggal DESC, id DESC';

    const result = await pool.query(query, params);
    return result.rows;
  },

  // Ambil satu transaksi berdasarkan ID
  async getById(id) {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  // Tambah transaksi baru
  async create({ tanggal, kategori, deskripsi, jumlah, tipe }) {
    const result = await pool.query(
      `INSERT INTO transactions (tanggal, kategori, deskripsi, jumlah, tipe)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tanggal, kategori, deskripsi, jumlah, tipe]
    );
    return result.rows[0];
  },

  // Update transaksi
  async update(id, { tanggal, kategori, deskripsi, jumlah, tipe }) {
    const result = await pool.query(
      `UPDATE transactions
       SET tanggal = $1, kategori = $2, deskripsi = $3,
           jumlah = $4, tipe = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [tanggal, kategori, deskripsi, jumlah, tipe, id]
    );
    return result.rows[0];
  },

  // Hapus transaksi
  async delete(id) {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // Hitung ringkasan (total income, expense, saldo) per bulan
  async getSummary({ bulan, tahun }) {
    const result = await pool.query(
      `SELECT
        SUM(CASE WHEN tipe = 'income'  THEN jumlah ELSE 0 END) AS total_income,
        SUM(CASE WHEN tipe = 'expense' THEN jumlah ELSE 0 END) AS total_expense,
        SUM(CASE WHEN tipe = 'income'  THEN jumlah
                 WHEN tipe = 'expense' THEN -jumlah ELSE 0 END) AS saldo
       FROM transactions
       WHERE EXTRACT(MONTH FROM tanggal) = $1
         AND EXTRACT(YEAR  FROM tanggal) = $2`,
      [bulan, tahun]
    );
    return result.rows[0];
  }
};

module.exports = TransactionModel;