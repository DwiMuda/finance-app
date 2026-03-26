<template>
  <div class="laporan-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Laporan Bulanan</h1>
        <p class="page-sub">Analisis detail keuangan per bulan</p>
      </div>
      <div class="header-actions">
        <select class="select" v-model="selectedMonth" @change="loadData" style="width:auto">
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <button class="btn btn-blue" @click="doExport" :disabled="exporting">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {{ exporting ? 'Mengekspor...' : 'Export Excel' }}
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="sum-card">
        <div class="sum-label">Total Pemasukan</div>
        <div class="sum-value income">{{ formatRupiah(summary.totalIncome) }}</div>
      </div>
      <div class="sum-card">
        <div class="sum-label">Total Pengeluaran</div>
        <div class="sum-value expense">{{ formatRupiah(summary.totalExpense) }}</div>
      </div>
      <div class="sum-card">
        <div class="sum-label">Saldo Akhir</div>
        <div class="sum-value" :class="summary.saldo >= 0 ? 'income' : 'expense'">{{ formatRupiah(summary.saldo) }}</div>
      </div>
      <div class="sum-card">
        <div class="sum-label">Total Transaksi</div>
        <div class="sum-value blue">{{ (summary.incomeCount || 0) + (summary.expenseCount || 0) }}</div>
      </div>
    </div>

    <!-- Category Breakdown -->
    <div class="breakdown-grid">
      <div class="card">
        <h3 class="section-title">Pemasukan per Kategori</h3>
        <div v-if="incomeByCategory.length === 0" class="empty-small">Tidak ada data</div>
        <div v-else class="category-list">
          <div class="cat-item" v-for="c in incomeByCategory" :key="c.kategori">
            <div class="cat-info">
              <span class="cat-name">{{ c.kategori }}</span>
              <span class="cat-count">{{ c.count }} transaksi</span>
            </div>
            <div class="cat-bar-wrap">
              <div class="cat-bar income-bar" :style="{ width: (c.total / summary.totalIncome * 100) + '%' }"></div>
            </div>
            <div class="cat-amount income">{{ formatRupiah(c.total) }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="section-title">Pengeluaran per Kategori</h3>
        <div v-if="expenseByCategory.length === 0" class="empty-small">Tidak ada data</div>
        <div v-else class="category-list">
          <div class="cat-item" v-for="c in expenseByCategory" :key="c.kategori">
            <div class="cat-info">
              <span class="cat-name">{{ c.kategori }}</span>
              <span class="cat-count">{{ c.count }} transaksi</span>
            </div>
            <div class="cat-bar-wrap">
              <div class="cat-bar expense-bar" :style="{ width: (c.total / summary.totalExpense * 100) + '%' }"></div>
            </div>
            <div class="cat-amount expense">{{ formatRupiah(c.total) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Full Transaction Table -->
    <div class="card" style="padding:0;overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid var(--border)">
        <h3 class="section-title">Semua Transaksi Bulan Ini</h3>
      </div>
      <div v-if="loading" class="empty-state">Memuat data...</div>
      <div v-else-if="transactions.length === 0" class="empty-state">Tidak ada transaksi</div>
      <table v-else>
        <thead>
          <tr>
            <th>#</th>
            <th>Tanggal</th>
            <th>Kategori</th>
            <th>Deskripsi</th>
            <th>Tipe</th>
            <th style="text-align:right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(t, i) in transactions" :key="t.id">
            <td style="color:var(--muted)">{{ i+1 }}</td>
            <td>{{ formatDate(t.tanggal) }}</td>
            <td><span class="kategori-chip">{{ t.kategori }}</span></td>
            <td>{{ t.deskripsi }}</td>
            <td><span class="badge" :class="t.tipe">{{ t.tipe === 'income' ? 'Pemasukan' : 'Pengeluaran' }}</span></td>
            <td style="text-align:right" :class="t.tipe === 'income' ? 'amount-income' : 'amount-expense'">
              {{ t.tipe === 'income' ? '+' : '-' }}{{ formatRupiah(t.jumlah) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTransactions, getSummary, exportExcel } from '../services/api.js'

const loading = ref(true)
const exporting = ref(false)
const transactions = ref([])
const summary = ref({ totalIncome:0, totalExpense:0, saldo:0, incomeCount:0, expenseCount:0 })

const now = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`)

const monthOptions = computed(() => {
  const opts = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    opts.push({ value: val, label: d.toLocaleDateString('id-ID', { month:'long', year:'numeric' }) })
  }
  return opts
})

const incomeByCategory = computed(() => {
  const map = {}
  transactions.value.filter(t => t.tipe === 'income').forEach(t => {
    if (!map[t.kategori]) map[t.kategori] = { kategori: t.kategori, total: 0, count: 0 }
    map[t.kategori].total += Number(t.jumlah)
    map[t.kategori].count++
  })
  return Object.values(map).sort((a,b) => b.total - a.total)
})

const expenseByCategory = computed(() => {
  const map = {}
  transactions.value.filter(t => t.tipe === 'expense').forEach(t => {
    if (!map[t.kategori]) map[t.kategori] = { kategori: t.kategori, total: 0, count: 0 }
    map[t.kategori].total += Number(t.jumlah)
    map[t.kategori].count++
  })
  return Object.values(map).sort((a,b) => b.total - a.total)
})

const formatRupiah = (v) => new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(v || 0)
const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })

const loadData = async () => {
  loading.value = true
  try {
    const [txRes, sumRes] = await Promise.all([
      getTransactions({ month: selectedMonth.value }),
      getSummary({ month: selectedMonth.value })
    ])
    transactions.value = txRes.data.data || txRes.data
    summary.value = sumRes.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const doExport = async () => {
  exporting.value = true
  try { await exportExcel({ month: selectedMonth.value }) }
  catch (e) { alert('Gagal export: ' + e.message) }
  finally { exporting.value = false }
}

onMounted(loadData)
</script>

<style scoped>
.laporan-page { padding:32px; max-width:1100px; }
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
.page-title { font-family:var(--font-head); font-size:26px; font-weight:800; }
.page-sub { color:var(--muted); font-size:13px; margin-top:2px; }
.header-actions { display:flex; gap:10px; }

.summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:20px; }
.sum-card { background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius); padding:18px 20px; }
.sum-label { font-size:12px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; }
.sum-value { font-family:var(--font-head); font-size:18px; font-weight:700; }
.sum-value.income  { color:var(--green); }
.sum-value.expense { color:var(--red); }
.sum-value.blue    { color:var(--blue); }

.breakdown-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
.section-title { font-family:var(--font-head); font-weight:700; font-size:15px; margin-bottom:16px; }
.empty-small { color:var(--muted); font-size:13px; padding:20px 0; text-align:center; }
.empty-state { text-align:center; color:var(--muted); padding:40px 0; }

.category-list { display:flex; flex-direction:column; gap:14px; }
.cat-item { display:grid; grid-template-columns:1fr auto; gap:8px; align-items:center; }
.cat-info { grid-column:1/-1; display:flex; justify-content:space-between; }
.cat-name { font-size:13px; font-weight:500; }
.cat-count { font-size:11.5px; color:var(--muted); }
.cat-bar-wrap { background:var(--bg3); height:6px; border-radius:99px; overflow:hidden; }
.cat-bar { height:100%; border-radius:99px; transition:width 0.5s ease; }
.income-bar  { background:var(--green); }
.expense-bar { background:var(--red); }
.cat-amount { font-size:13px; font-weight:600; white-space:nowrap; }
.cat-amount.income  { color:var(--green); }
.cat-amount.expense { color:var(--red); }

.kategori-chip { background:var(--bg3); color:var(--muted2); padding:3px 9px; border-radius:6px; font-size:12px; }
.amount-income  { color:var(--green); font-weight:600; }
.amount-expense { color:var(--red);   font-weight:600; }
</style>
