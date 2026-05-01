<template>
  <div class="reports-container">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="title-group">
          <h1>Analisis Laporan</h1>
          <p>Visualisasi dan rincian performa keuangan Anda</p>
        </div>
      </div>
    </header>

    <!-- Filters & Export -->
    <div class="filters-card">
      <div class="filter-group">
        <select v-model="selectedMonth" @change="loadData" class="premium-select">
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
      </div>
      <div class="export-actions">
        <button @click="exportData" class="btn-export" :disabled="exporting">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          {{ exporting ? 'Mengekspor...' : 'Unduh Excel' }}
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="report-card">
        <div class="card-label">Rasio Tabungan</div>
        <div class="card-value">{{ savingRatio }}%</div>
        <div class="progress-mini"><div class="fill" :style="{ width: savingRatio + '%' }"></div></div>
      </div>
      <div class="report-card">
        <div class="card-label">Rata-rata Harian</div>
        <div class="card-value">{{ formatCurrency(dailyAverage, activeCurrency) }}</div>
        <div class="card-note">Bulan ini</div>
      </div>
      <div class="report-card primary">
        <div class="currency-toggle">
          <button :class="{ active: activeCurrency === 'IDR' }" @click="activeCurrency = 'IDR'">IDR</button>
          <button :class="{ active: activeCurrency === 'JPY' }" @click="activeCurrency = 'JPY'">JPY</button>
        </div>
        <div class="card-label">Total Saldo Bersih</div>
        <div class="card-value big">{{ formatCurrency(currentSummary.saldo, activeCurrency) }}</div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-layout">
      <div class="card chart-card main-chart">
        <div class="card-header">
          <h3>Perbandingan Arus Kas</h3>
        </div>
        <div class="chart-container">
          <!-- Placeholder for Chart - In real app use Chart.js or similar -->
          <div class="bar-chart-mock">
            <div class="bar-group">
              <div class="bar income" :style="{ height: getIncomeHeight + '%' }"></div>
              <div class="bar expense" :style="{ height: getExpenseHeight + '%' }"></div>
            </div>
            <div class="bar-labels">
              <span>Pemasukan</span>
              <span>Pengeluaran</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card chart-card category-list">
        <div class="card-header">
          <h3>Pengeluaran per Kategori</h3>
        </div>
        <div v-if="loading" class="loading-small">Menganalisis...</div>
        <div v-else-if="categoryBreakdown.length === 0" class="empty-small">Tidak ada data pengeluaran.</div>
        <div v-else class="cat-items">
          <div v-for="cat in categoryBreakdown" :key="cat.name" class="cat-item">
            <div class="cat-info">
              <span class="cat-name">{{ cat.name }}</span>
              <span class="cat-val">{{ formatCurrency(cat.value, activeCurrency) }}</span>
            </div>
            <div class="cat-bar"><div class="cat-fill" :style="{ width: cat.percent + '%' }"></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTransactions, getSummary, exportExcel } from '../services/api.js'

const loading = ref(true)
const exporting = ref(false)
const connectionStatus = ref('online')
const activeCurrency = ref('IDR')
const transactions = ref([])
const summary = ref({
  IDR: { total_income: 0, total_expense: 0, saldo: 0 },
  JPY: { total_income: 0, total_expense: 0, saldo: 0 }
})

const currentSummary = computed(() => summary.value[activeCurrency.value])

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

const savingRatio = computed(() => {
  const s = currentSummary.value
  if (!s.total_income || s.total_income <= 0) return 0
  const ratio = ((s.total_income - s.total_expense) / s.total_income) * 100
  return Math.max(0, Math.round(ratio))
})

const dailyAverage = computed(() => {
  const s = currentSummary.value
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return Math.round(s.total_expense / daysInMonth)
})

const getIncomeHeight = computed(() => {
  const s = currentSummary.value
  const max = Math.max(s.total_income, s.total_expense) || 1
  return (s.total_income / max) * 100
})

const getExpenseHeight = computed(() => {
  const s = currentSummary.value
  const max = Math.max(s.total_income, s.total_expense) || 1
  return (s.total_expense / max) * 100
})

const categoryBreakdown = computed(() => {
  const expenses = transactions.value.filter(t => t.tipe === 'expense' && t.mata_uang === activeCurrency.value)
  const groups = {}
  let total = 0
  
  expenses.forEach(t => {
    groups[t.kategori] = (groups[t.kategori] || 0) + Number(t.jumlah)
    total += Number(t.jumlah)
  })

  return Object.entries(groups).map(([name, value]) => ({
    name, value, percent: total > 0 ? Math.round((value / total) * 100) : 0
  })).sort((a, b) => b.value - a.value)
})

const formatCurrency = (val, currency = 'IDR') => {
  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'ja-JP', { 
    style: 'currency', currency: currency, maximumFractionDigits: 0 
  }).format(val || 0)
}

const loadData = async () => {
  loading.value = true
  try {
    const [txRes, sumRes] = await Promise.all([
      getTransactions({ month: selectedMonth.value }),
      getSummary({ month: selectedMonth.value })
    ])
    transactions.value = txRes.data.data || txRes.data
    if (sumRes.data.data) summary.value = sumRes.data.data
    connectionStatus.value = 'online'
  } catch (e) {
    console.error(e)
    connectionStatus.value = 'offline'
  } finally {
    loading.value = false
  }
}

const exportData = async () => {
  exporting.value = true
  try {
    await exportExcel({ month: selectedMonth.value })
  } catch (e) {
    console.error(e)
    alert('Gagal mengekspor data.')
  } finally {
    exporting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.reports-container { max-width: 1200px; margin: 0 auto; padding-bottom: 40px; }

/* Header & Status */
.page-header { margin-bottom: 32px; }
.header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.title-group h1 { font-size: 28px; font-weight: 900; color: #111827; }
.title-group p { color: #6b7280; font-size: 15px; }

.status-pill {
  display: flex; align-items: center; gap: 8px; padding: 8px 16px;
  background: white; border-radius: 99px; font-size: 12px; font-weight: 700;
  border: 1px solid #e5e7eb; box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.status-pill .dot { width: 8px; height: 8px; border-radius: 50%; }
.status-pill.online { color: #059669; }
.status-pill.online .dot { background: #10b981; box-shadow: 0 0 8px #10b981; }
.status-pill.offline { color: #dc2626; }
.status-pill.offline .dot { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

/* Filters */
.filters-card {
  display: flex; justify-content: space-between; align-items: center;
  background: white; padding: 16px 24px; border-radius: 20px;
  margin-bottom: 24px; border: 1px solid #f3f4f6;
}
.premium-select {
  padding: 10px 16px; border-radius: 12px; border: 1px solid #e5e7eb;
  font-weight: 700; font-size: 14px; color: #374151; cursor: pointer;
}
.btn-export {
  display: flex; align-items: center; gap: 10px; padding: 10px 20px;
  background: #111827; color: white; border: none; border-radius: 12px;
  font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s;
}
.btn-export:hover { background: #1f2937; transform: translateY(-1px); }

/* Summary Cards */
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
.report-card { background: white; padding: 24px; border-radius: 24px; border: 1px solid #f3f4f6; position: relative; }
.report-card.primary { background: #4f46e5; color: white; border: none; }
.card-label { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; }
.primary .card-label { color: rgba(255,255,255,0.7); }
.card-value { font-size: 24px; font-weight: 900; color: #111827; }
.card-value.big { font-size: 32px; letter-spacing: -0.03em; }
.primary .card-value { color: white; }
.progress-mini { height: 6px; background: #f3f4f6; border-radius: 99px; margin-top: 12px; overflow: hidden; }
.progress-mini .fill { height: 100%; background: #4f46e5; border-radius: 99px; }

.currency-toggle { display: flex; gap: 4px; background: rgba(0,0,0,0.1); padding: 3px; border-radius: 8px; width: fit-content; margin-bottom: 16px; }
.currency-toggle button {
  padding: 4px 10px; border: none; background: transparent; color: white;
  font-size: 11px; font-weight: 800; cursor: pointer; border-radius: 6px;
}
.currency-toggle button.active { background: white; color: #4f46e5; }

/* Charts Layout */
.charts-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
.chart-card { padding: 24px; height: 100%; }
.chart-card h3 { font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 24px; }

.bar-chart-mock { height: 200px; display: flex; flex-direction: column; justify-content: flex-end; gap: 20px; padding: 0 40px; }
.bar-group { display: flex; align-items: flex-end; justify-content: center; gap: 40px; height: 100%; border-bottom: 2px solid #f3f4f6; }
.bar { width: 40px; border-radius: 8px 8px 0 0; transition: height 1s ease; }
.bar.income { background: #10b981; }
.bar.expense { background: #ef4444; }
.bar-labels { display: flex; justify-content: center; gap: 40px; font-size: 11px; font-weight: 700; color: #9ca3af; padding-top: 8px; }

.cat-items { display: flex; flex-direction: column; gap: 16px; }
.cat-item { display: flex; flex-direction: column; gap: 6px; }
.cat-info { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; }
.cat-name { color: #374151; }
.cat-val { color: #111827; }
.cat-bar { height: 8px; background: #f3f4f6; border-radius: 99px; overflow: hidden; }
.cat-fill { height: 100%; background: #4f46e5; border-radius: 99px; opacity: 0.7; }

/* Responsive */
@media (max-width: 1024px) {
  .charts-layout { grid-template-columns: 1fr; }
  .summary-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .filters-card { flex-direction: column; gap: 16px; align-items: stretch; }
  .btn-export { justify-content: center; }
}

.loading-small, .empty-small { padding: 40px; text-align: center; color: #9ca3af; font-weight: 600; font-size: 14px; }
</style>
