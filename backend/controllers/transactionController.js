const TransactionModel = require('../models/transactionModel');

const TransactionController = {

  async getAll(req, res) {
    try {
      const { bulan, tahun, tipe } = req.query;
      const user_id = req.user.id;
      const transactions = await TransactionModel.getAll({ bulan, tahun, tipe, user_id });
      res.json({ success: true, count: transactions.length, data: transactions });
    } catch (err) {
      console.error('getAll error:', err);
      res.status(500).json({ success: false, message: 'Gagal mengambil data transaksi' });
    }
  },

  async getSummary(req, res) {
    try {
      const now   = new Date();
      const bulan = req.query.bulan || now.getMonth() + 1;
      const tahun = req.query.tahun || now.getFullYear();
      const user_id = req.user.id;

      const summaryRows = await TransactionModel.getSummary({ bulan, tahun, user_id });
      
      // Default summary structure
      const data = {
        IDR: { total_income: 0, total_expense: 0, saldo: 0, income_count: 0, expense_count: 0 },
        JPY: { total_income: 0, total_expense: 0, saldo: 0, income_count: 0, expense_count: 0 }
      };

      summaryRows.forEach(row => {
        if (data[row.mata_uang]) {
          data[row.mata_uang] = {
            total_income:  parseFloat(row.total_income)  || 0,
            total_expense: parseFloat(row.total_expense) || 0,
            saldo:         parseFloat(row.saldo)         || 0,
            income_count:  parseInt(row.income_count)    || 0,
            expense_count: parseInt(row.expense_count)   || 0
          };
        }
      });

      res.json({
        success: true, bulan, tahun,
        data: data
      });
    } catch (err) {
      console.error('getSummary error:', err);
      res.status(500).json({ success: false, message: 'Gagal mengambil ringkasan' });
    }
  },

  async create(req, res) {
    try {
      const { tanggal, kategori, deskripsi, jumlah, tipe, mata_uang } = req.body;
      const user_id = req.user.id;

      if (!tanggal || !kategori || !jumlah || !tipe)
        return res.status(400).json({ success: false, message: 'Field tanggal, kategori, jumlah, dan tipe wajib diisi' });

      if (!['income', 'expense'].includes(tipe))
        return res.status(400).json({ success: false, message: 'Tipe harus "income" atau "expense"' });

      if (mata_uang && !['IDR', 'JPY'].includes(mata_uang))
        return res.status(400).json({ success: false, message: 'Mata uang harus IDR atau JPY' });

      if (isNaN(jumlah) || jumlah <= 0)
        return res.status(400).json({ success: false, message: 'Jumlah harus angka positif' });

      const newTransaction = await TransactionModel.create({ tanggal, kategori, deskripsi, jumlah, tipe, user_id, mata_uang: mata_uang || 'IDR' });
      res.status(201).json({ success: true, message: 'Transaksi berhasil ditambahkan', data: newTransaction });
    } catch (err) {
      console.error('create error:', err);
      res.status(500).json({ success: false, message: 'Gagal menyimpan transaksi' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;
      const { tanggal, kategori, deskripsi, jumlah, tipe, mata_uang } = req.body;

      const existing = await TransactionModel.getById(id, user_id);
      if (!existing)
        return res.status(404).json({ success: false, message: `Transaksi tidak ditemukan` });

      const updated = await TransactionModel.update(id, { tanggal, kategori, deskripsi, jumlah, tipe, mata_uang: mata_uang || 'IDR' }, user_id);
      res.json({ success: true, message: 'Transaksi berhasil diupdate', data: updated });
    } catch (err) {
      console.error('update error:', err);
      res.status(500).json({ success: false, message: 'Gagal update transaksi' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      const user_id = req.user.id;

      const existing = await TransactionModel.getById(id, user_id);
      if (!existing)
        return res.status(404).json({ success: false, message: `Transaksi tidak ditemukan` });

      await TransactionModel.delete(id, user_id);
      res.json({ success: true, message: 'Transaksi berhasil dihapus' });
    } catch (err) {
      console.error('delete error:', err);
      res.status(500).json({ success: false, message: 'Gagal menghapus transaksi' });
    }
  }
};

module.exports = TransactionController;