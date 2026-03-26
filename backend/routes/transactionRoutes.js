// routes/transactionRoutes.js
const express    = require('express')
const router     = express.Router()
const ctrl       = require('../controllers/transactionController')
const ExcelJS    = require('exceljs')
const pool       = require('../config/database')

// ⚠️ PENTING: /summary dan /export harus di atas /:id
router.get('/summary', ctrl.getSummary)
router.get('/export',  async (req, res) => {
  try {
    const { bulan, tahun } = req.query
    let where  = 'WHERE 1=1'
    const params = []

    if (bulan) { params.push(bulan); where += ` AND EXTRACT(MONTH FROM tanggal) = $${params.length}` }
    if (tahun) { params.push(tahun); where += ` AND EXTRACT(YEAR  FROM tanggal) = $${params.length}` }

    const result = await pool.query(
      `SELECT * FROM transactions ${where} ORDER BY tanggal DESC`, params
    )
    const rows = result.rows

    const totalIncome  = rows.filter(r => r.tipe==='income') .reduce((s,r) => s+Number(r.jumlah), 0)
    const totalExpense = rows.filter(r => r.tipe==='expense').reduce((s,r) => s+Number(r.jumlah), 0)

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Laporan Keuangan')

    ws.columns = [
      { header: 'No',        key: 'no',        width: 5  },
      { header: 'Tanggal',   key: 'tanggal',   width: 16 },
      { header: 'Kategori',  key: 'kategori',  width: 18 },
      { header: 'Deskripsi', key: 'deskripsi', width: 30 },
      { header: 'Tipe',      key: 'tipe',      width: 14 },
      { header: 'Jumlah',    key: 'jumlah',    width: 18 },
    ]
    ws.getRow(1).font = { bold: true }

    rows.forEach((r, i) => ws.addRow({
      no:        i + 1,
      tanggal:   new Date(r.tanggal).toLocaleDateString('id-ID'),
      kategori:  r.kategori,
      deskripsi: r.deskripsi,
      tipe:      r.tipe === 'income' ? 'Pemasukan' : 'Pengeluaran',
      jumlah:    Number(r.jumlah)
    }))

    ws.addRow({})
    ws.addRow({ deskripsi: 'Total Pemasukan',  jumlah: totalIncome  })
    ws.addRow({ deskripsi: 'Total Pengeluaran', jumlah: totalExpense })
    ws.addRow({ deskripsi: 'Saldo Akhir',       jumlah: totalIncome - totalExpense })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="laporan.xlsx"`)
    await wb.xlsx.write(res)
    res.end()
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/',     ctrl.getAll)
router.post('/',    ctrl.create)
router.put('/:id',  ctrl.update)
router.delete('/:id', ctrl.delete)

module.exports = router