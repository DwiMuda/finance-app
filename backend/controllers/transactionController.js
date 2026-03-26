// controllers/transactionController.js
const TransactionModel = require('../models/transactionModel');

const TransactionController = {

  // GET /transactions
  async getAll(req, res) {
    try {
      const { bulan, tahun, tipe } = req.query;
      const transactions = await TransactionModel.getAll({ bulan, tahun, tipe });

      res.json({
        success: true,
        count: transactions.length,
        data: transactions
      });
    } catch (err) {
      console.error('getAll error:', err);
      res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi' });
    }
  },

  // GET /transactions/summary
  async getSummary(req, res) {
    try {
      const now   = new Date();
      const bulan = req.query.bulan || now.getMonth() + 1;
      const tahun = req.query.tahun || now.getFullYear();

      const summary = await TransactionModel.getSummary({ bulan, tahun });

      res.json({
        success: true,
        bulan, tahun,
        data: {
          total_income:  parseFloat(summary.total_income)  || 0,
          total_expense: parseFloat(summary.total_expense) || 0,
          saldo:         parseFloat(summary.saldo)         || 0
        }
      });
    } catch (err) {
      console.error('getSummary error:', err);
      res.status(500).json({ success: false, message: 'Gagal mengambil ringkasan' });
    }
  },

  // POST /transactions
  async create(req, res) {
    try {
      const { tanggal, kategori, deskripsi, jumlah, tipe } = req.body;

      // Validasi input
      if (!tanggal || !kategori || !jumlah || !tipe) {
        return res.status(400).json({
          success: false,
          message: 'Field tanggal, kategori, jumlah, dan tipe wajib diisi'
        });
      }

      if (!['income', 'expense'].includes(tipe)) {
        return res.status(400).json({
          success: false,
          message: 'Tipe harus "income" atau "expense"'
        });
      }

      if (isNaN(jumlah) || jumlah <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Jumlah harus angka positif'
        });
      }

      const newTransaction = await TransactionModel.create({
        tanggal, kategori, deskripsi, jumlah, tipe
      });

      res.status(201).json({
        success: true,
        message: 'Transaksi berhasil ditambahkan',
        data: newTransaction
      });
    } catch (err) {
      console.error('create error:', err);
      res.status(500).json({ success: false, message: 'Gagal menyimpan transaksi' });
    }
  },

  // PUT /transactions/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const { tanggal, kategori, deskripsi, jumlah, tipe } = req.body;

      // Cek apakah transaksi ada
      const existing = await TransactionModel.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Transaksi dengan ID ${id} tidak ditemukan`
        });
      }

      const updated = await TransactionModel.update(id, {
        tanggal, kategori, deskripsi, jumlah, tipe
      });

      res.json({
        success: true,
        message: 'Transaksi berhasil diupdate',
        data: updated
      });
    } catch (err) {
      console.error('update error:', err);
      res.status(500).json({ success: false, message: 'Gagal update transaksi' });
    }
  },

  // DELETE /transactions/:id
  async delete(req, res) {
    try {
      const { id } = req.params;

      const existing = await TransactionModel.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: `Transaksi dengan ID ${id} tidak ditemukan`
        });
      }

      await TransactionModel.delete(id);

      res.json({
        success: true,
        message: 'Transaksi berhasil dihapus'
      });
    } catch (err) {
      console.error('delete error:', err);
      res.status(500).json({ success: false, message: 'Gagal menghapus transaksi' });
    }
  }
};

module.exports = TransactionController;