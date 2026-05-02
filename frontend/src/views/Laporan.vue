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
    <div class="filters-card glass-card">
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
      <div class="report-card glass-card">
        <div class="card-label">Rasio Tabungan</div>
        <div class="card-value">{{ savingRatio }}%</div>
        <div class="progress-mini"><div class="fill" :style="{ width: savingRatio + '%' }"></div></div>
      </div>
      <div class="report-card glass-card">
        <div class="card-label">Rata-rata Harian</div>
        <div class="card-value">{{ formatCurrency(dailyAverage, activeCurrency) }}</div>
        <div class="card-note">Pengeluaran bulan ini</div>
      </div>
      <div class="report-card primary-gradient glass-card">
        <div class="currency-toggle">
          <button :class="{ active: activeCurrency === 'IDR' }" @click="activeCurrency = 'IDR'">IDR</button>
          <button :class="{ active: activeCurrency === 'JPY' }" @click="activeCurrency = 'JPY'">JPY</button>
        </div>
        <div class="card-label-light">Total Saldo Bersih</div>
        <div class="card-value-light big animate-count">{{ formatCurrency(currentSummary.saldo, activeCurrency) }}</div>
        
        <!-- Decoration -->
        <div class="card-glow"></div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-layout">
      <div class="chart-card glass-card main-chart">
        <div class="card-header">
          <h3>Perbandingan Arus Kas</h3>
        </div>
        <div class="chart-container">
          <!-- Placeholder for Chart - In real app use Chart.js or similar -->
          <div class="bar-chart-mock">
            <div class="bar-group">
              <div class="bar income" :style="{ height: getIncomeHeight + '%' }"><div class="bar-glow"></div></div>
              <div class="bar expense" :style="{ height: getExpenseHeight + '%' }"><div class="bar-glow"></div></div>
            </div>
            <div class="bar-labels">
              <span>Pemasukan</span>
              <span>Pengeluaran</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-card glass-card category-list">
        <div class="card-header">
          <h3>Pengeluaran per Kategori</h3>
        </div>
        <div v-if="loading" class="loading-state">
          <div class="skeleton" style="height: 40px; margin-bottom: 12px;" v-for="i in 4" :key="i"></div>
        </div>
        <div v-else-if="categoryBreakdown.length === 0" class="empty-state">Tidak ada data pengeluaran.</div>
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
  if (!Array.isArray(transactions.value)) return [];
  const expenses = transactions.value.filter(t => t.tipe === 'expense' && (t.mata_uang || 'IDR') === activeCurrency.value)
  const groups = {}
  let total = 0
  
  expenses.forEach(t => {
    const cat = t.kategori || 'Lainnya';
    groups[cat] = (groups[cat] || 0) + Number(t.jumlah || 0)
    total += Number(t.jumlah || 0)
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

/* Header */
.page-header { margin-bottom: 32px; }
.header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.title-group h1 { font-size: 28px; font-family: 'Satoshi', sans-serif; font-weight: 900; color: var(--text-main); margin-bottom: 4px; }
.title-group p { color: var(--text-muted); font-size: 15px; }

/* Filters */
.filters-card {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 24px; margin-bottom: 24px;
}
.premium-select {
  padding: 10px 40px 10px 16px; border-radius: 12px; border: 1px solid var(--border);
  background: rgba(0,0,0,0.3); color: var(--text-main); font-weight: 700; font-size: 14px; cursor: pointer;
  appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23a1a1aa%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat; background-position: right 14px top 50%; background-size: 10px auto;
  transition: all 0.2s; outline: none;
}
.premium-select:focus { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-light); }
.premium-select option { background: var(--bg-main); }

.btn-export {
  display: flex; align-items: center; gap: 10px; padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05); color: var(--text-main); border: 1px solid var(--border); border-radius: 12px;
  font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s;
}
.btn-export:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

/* Summary Cards */
.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
.report-card { padding: 24px; }
.report-card.primary-gradient { 
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(79, 70, 229, 0.8));
  border: 1px solid rgba(255,255,255,0.2);
  box-shadow: 0 10px 30px rgba(79, 70, 229, 0.4);
}
.card-glow {
  position: absolute; width: 100px; height: 100px; background: white; filter: blur(60px); 
  border-radius: 50%; top: -20px; right: -20px; opacity: 0.15; pointer-events: none;
}

.card-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 8px; }
.card-label-light { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.8); margin-bottom: 8px; }

.card-value { font-family: 'Satoshi', sans-serif; font-size: 28px; font-weight: 900; color: var(--text-main); }
.card-value-light { font-family: 'Satoshi', sans-serif; font-weight: 900; color: white; }
.card-value-light.big { font-size: 36px; letter-spacing: -0.03em; }

.card-note { font-size: 12px; color: var(--text-muted); margin-top: 8px; }

.progress-mini { height: 6px; background: rgba(0,0,0,0.3); border-radius: 99px; margin-top: 16px; overflow: hidden; }
.progress-mini .fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--indigo-glow)); border-radius: 99px; box-shadow: 0 0 10px var(--primary); }

.currency-toggle { display: flex; gap: 4px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 10px; width: fit-content; margin-bottom: 20px; position: relative; z-index: 2; }
.currency-toggle button {
  padding: 4px 12px; border: none; background: transparent; color: rgba(255,255,255,0.6);
  font-size: 12px; font-weight: 800; cursor: pointer; border-radius: 6px; transition: all 0.2s;
}
.currency-toggle button.active { background: white; color: var(--primary-dark); box-shadow: 0 2px 4px rgba(0,0,0,0.2); }

/* Charts Layout */
.charts-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; }
.chart-card { padding: 24px; display: flex; flex-direction: column; }
.chart-card h3 { font-size: 18px; color: var(--text-main); margin-bottom: 24px; }

.chart-container { flex: 1; display: flex; align-items: center; justify-content: center; }
.bar-chart-mock { width: 100%; height: 240px; display: flex; flex-direction: column; justify-content: flex-end; gap: 20px; padding: 0 20px; }
.bar-group { display: flex; align-items: flex-end; justify-content: center; gap: 60px; height: 100%; border-bottom: 1px solid var(--border); position: relative; }
.bar { width: 50px; border-radius: 8px 8px 0 0; transition: height 1s cubic-bezier(0.16, 1, 0.3, 1); position: relative; }
.bar.income { background: linear-gradient(0deg, var(--success-bg), var(--success)); }
.bar.expense { background: linear-gradient(0deg, var(--danger-bg), var(--danger)); }
.bar-glow { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 20px; height: 20px; border-radius: 50%; filter: blur(15px); }
.bar.income .bar-glow { background: var(--success); }
.bar.expense .bar-glow { background: var(--danger); }
.bar-labels { display: flex; justify-content: center; gap: 60px; font-size: 12px; font-weight: 700; color: var(--text-muted); padding-top: 12px; }

.cat-items { display: flex; flex-direction: column; gap: 20px; flex: 1; justify-content: center; }
.cat-item { display: flex; flex-direction: column; gap: 8px; }
.cat-info { display: flex; justify-content: space-between; font-size: 14px; font-weight: 600; }
.cat-name { color: var(--text-muted); }
.cat-val { color: var(--text-main); font-family: 'Satoshi', sans-serif; font-weight: 800; }
.cat-bar { height: 6px; background: rgba(0,0,0,0.3); border-radius: 99px; overflow: hidden; }
.cat-fill { height: 100%; background: linear-gradient(90deg, var(--primary-light), var(--primary)); border-radius: 99px; }

.loading-state, .empty-state { padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px; }

/* Responsive */
@media (max-width: 1024px) {
  .charts-layout { grid-template-columns: 1fr; }
  .summary-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .filters-card { flex-direction: column; gap: 16px; align-items: stretch; }
  .filter-group { display: flex; flex-direction: column; }
  .btn-export { justify-content: center; }
  .card-value { font-size: 24px; }
  .card-value-light.big { font-size: 28px; }
}
</style>
