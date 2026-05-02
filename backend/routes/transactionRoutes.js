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
    const user_id = req.user.id
    const { bulan, tahun } = req.query
    let where  = 'WHERE user_id = $1'
    const params = [user_id]

    if (bulan) { params.push(bulan); where += ` AND EXTRACT(MONTH FROM tanggal) = $${params.length}` }
    if (tahun) { params.push(tahun); where += ` AND EXTRACT(YEAR  FROM tanggal) = $${params.length}` }

    const result = await pool.query(
      `SELECT * FROM transactions ${where} ORDER BY tanggal DESC`, params
    )
    const rows = result.rows

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Laporan Keuangan')

    ws.columns = [
      { header: 'No',        key: 'no',        width: 6  },
      { header: 'Tanggal',   key: 'tanggal',   width: 18 },
      { header: 'Kategori',  key: 'kategori',  width: 22 },
      { header: 'Deskripsi', key: 'deskripsi', width: 35 },
      { header: 'Tipe',      key: 'tipe',      width: 16 },
      { header: 'Mata Uang', key: 'mata_uang', width: 12 },
      { header: 'Jumlah',    key: 'jumlah',    width: 20 },
    ]

    // Style the header row
    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      }
    })

    rows.forEach((r, i) => ws.addRow({
      no:        i + 1,
      tanggal:   new Date(r.tanggal).toLocaleDateString('id-ID'),
      kategori:  r.kategori,
      deskripsi: r.deskripsi,
      tipe:      r.tipe === 'income' ? 'Pemasukan' : 'Pengeluaran',
      mata_uang: r.mata_uang || 'IDR',
      jumlah:    Number(r.jumlah)
    }))

    // Style data rows
    ws.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          // Hanya tambahkan border untuk kolom 1 sampai 7
          if (colNumber <= 7) {
            cell.border = {
              top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
            }
          }
          if (colNumber === 1 || colNumber === 5 || colNumber === 6) {
            cell.alignment = { horizontal: 'center' }
          }
        })
        row.getCell(7).numFmt = '#,##0'
      }
    })

    ws.addRow([])

    const currencies = [...new Set(rows.map(r => r.mata_uang || 'IDR'))]

    let saldoSebelumnya = {}
    if (bulan && tahun) {
      const prevParams = [user_id, bulan, tahun]
      const prevQuery = `
        SELECT mata_uang,
               SUM(CASE WHEN tipe = 'income' THEN jumlah ELSE -jumlah END) AS saldo_sebelumnya
        FROM transactions
        WHERE user_id = $1
          AND (
            (EXTRACT(YEAR FROM tanggal) < $3) OR
            (EXTRACT(YEAR FROM tanggal) = $3 AND EXTRACT(MONTH FROM tanggal) < $2)
          )
        GROUP BY mata_uang
      `
      const prevResult = await pool.query(prevQuery, prevParams)
      prevResult.rows.forEach(r => {
        saldoSebelumnya[r.mata_uang || 'IDR'] = Number(r.saldo_sebelumnya)
      })
    }

    currencies.forEach(cur => {
      const curRows = rows.filter(r => (r.mata_uang || 'IDR') === cur)
      const tInc = curRows.filter(r => r.tipe === 'income').reduce((s,r) => s+Number(r.jumlah), 0)
      const tExp = curRows.filter(r => r.tipe === 'expense').reduce((s,r) => s+Number(r.jumlah), 0)
      const sSeb = saldoSebelumnya[cur] || 0
      
      const r0 = ws.addRow(['', '', '', '', 'Saldo Sebelumnya', cur, sSeb])
      const r1 = ws.addRow(['', '', '', '', 'Pemasukan Bulan Ini', cur, tInc])
      const r2 = ws.addRow(['', '', '', '', 'Pengeluaran Bulan Ini', cur, tExp])
      const r3 = ws.addRow(['', '', '', '', 'Saldo Akhir', cur, sSeb + tInc - tExp])
      
      const summaryRows = [r0, r1, r2, r3]
      summaryRows.forEach(row => {
        [5, 6, 7].forEach(c => {
          row.getCell(c).font = { bold: true }
          row.getCell(c).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
        })
        row.getCell(7).numFmt = '#,##0'
      })
      r3.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: (sSeb + tInc - tExp) >= 0 ? 'FF10B981' : 'FFF43F5E' } }
      r3.getCell(7).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      ws.addRow([])
    })

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