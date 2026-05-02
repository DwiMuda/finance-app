const pool = require('../config/database');

const TransactionModel = {

  async getAll({ bulan, tahun, tipe, user_id, limit } = {}) {
    let query = `SELECT * FROM transactions WHERE user_id = $1`;
    const params = [user_id];
    let idx = 2;

    if (bulan && tahun) {
      query += ` AND EXTRACT(MONTH FROM tanggal) = $${idx++} AND EXTRACT(YEAR FROM tanggal) = $${idx++}`;
      params.push(bulan, tahun);
    }

    if (tipe) {
      query += ` AND tipe = $${idx++}`;
      params.push(tipe);
    }

    query += ' ORDER BY tanggal DESC, id DESC';

    if (limit) {
      query += ` LIMIT $${idx++}`;
      params.push(parseInt(limit));
    }

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getById(id, user_id) {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );
    return result.rows[0];
  },

  async create({ tanggal, kategori, deskripsi, jumlah, tipe, user_id, mata_uang = 'IDR' } = {}) {
    const result = await pool.query(
      `INSERT INTO transactions (tanggal, kategori, deskripsi, jumlah, tipe, user_id, mata_uang)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tanggal, kategori, deskripsi, jumlah, tipe, user_id, mata_uang]
    );
    return result.rows[0];
  },

  async update(id, { tanggal, kategori, deskripsi, jumlah, tipe, mata_uang } = {}, user_id) {
    const result = await pool.query(
      `UPDATE transactions
       SET tanggal = $1, kategori = $2, deskripsi = $3,
           jumlah = $4, tipe = $5, mata_uang = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [tanggal, kategori, deskripsi, jumlah, tipe, mata_uang, id, user_id]
    );
    return result.rows[0];
  },

  async delete(id, user_id) {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );
    return result.rows[0];
  },

  async getSummary({ bulan, tahun, user_id } = {}) {
    let query = ``;
    let params = [user_id];
    
    if (bulan && tahun) {
      query = `SELECT
        mata_uang,
        SUM(CASE WHEN tipe = 'income' AND EXTRACT(MONTH FROM tanggal) = $2 AND EXTRACT(YEAR FROM tanggal) = $3 THEN jumlah ELSE 0 END) AS total_income,
        SUM(CASE WHEN tipe = 'expense' AND EXTRACT(MONTH FROM tanggal) = $2 AND EXTRACT(YEAR FROM tanggal) = $3 THEN jumlah ELSE 0 END) AS total_expense,
        SUM(CASE WHEN tipe = 'income'  THEN jumlah WHEN tipe = 'expense' THEN -jumlah ELSE 0 END) AS saldo,
        COUNT(CASE WHEN tipe = 'income' AND EXTRACT(MONTH FROM tanggal) = $2 AND EXTRACT(YEAR FROM tanggal) = $3 THEN 1 END) AS income_count,
        COUNT(CASE WHEN tipe = 'expense' AND EXTRACT(MONTH FROM tanggal) = $2 AND EXTRACT(YEAR FROM tanggal) = $3 THEN 1 END) AS expense_count
       FROM transactions
       WHERE user_id = $1
         AND (
           (EXTRACT(YEAR FROM tanggal) < $3) OR
           (EXTRACT(YEAR FROM tanggal) = $3 AND EXTRACT(MONTH FROM tanggal) <= $2)
         )
       GROUP BY mata_uang`;
       params.push(bulan, tahun);
    } else {
      query = `SELECT
        mata_uang,
        SUM(CASE WHEN tipe = 'income'  THEN jumlah ELSE 0 END) AS total_income,
        SUM(CASE WHEN tipe = 'expense' THEN jumlah ELSE 0 END) AS total_expense,
        SUM(CASE WHEN tipe = 'income'  THEN jumlah WHEN tipe = 'expense' THEN -jumlah ELSE 0 END) AS saldo,
        COUNT(CASE WHEN tipe = 'income'  THEN 1 END) AS income_count,
        COUNT(CASE WHEN tipe = 'expense' THEN 1 END) AS expense_count
       FROM transactions
       WHERE user_id = $1
       GROUP BY mata_uang`;
    }

    const result = await pool.query(query, params);
    return result.rows;
  }
};

module.exports = TransactionModel;