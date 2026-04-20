<template>
  <div class="dashboard-wrapper">
    <!-- Header Section -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="welcome-text">
          <h1>Dashboard Keuangan</h1>
          <p>Halo! Pantau aktivitas keuangan Anda hari ini.</p>
        </div>
        <div class="header-actions">
          <div class="select-wrapper">
            <select v-model="selectedMonth" @change="loadData" class="premium-select">
              <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
            </select>
            <div class="select-icon">▼</div>
          </div>
          <button class="btn-logout-circle" @click="logout" title="Keluar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Currency Tabs -->
    <div class="currency-nav">
      <div class="tabs-container">
        <button :class="{ active: activeCurrency === 'IDR' }" @click="activeCurrency = 'IDR'">
          <span class="tab-flag">🇮🇩</span>
          <span class="tab-label">IDR (Rupiah)</span>
        </button>
        <button :class="{ active: activeCurrency === 'JPY' }" @click="activeCurrency = 'JPY'">
          <span class="tab-flag">🇯🇵</span>
          <span class="tab-label">JPY (Yen)</span>
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-container">
      <div class="stat-box income">
        <div class="stat-header">
          <div class="icon-circle"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></div>
          <span>Pemasukan</span>
        </div>
        <div class="stat-body">
          <h2 class="amount-text">{{ formatCurrency(currentSummary.total_income, activeCurrency) }}</h2>
          <div class="stat-meta">{{ currentSummary.income_count }} Transaksi</div>
        </div>
      </div>

      <div class="stat-box expense">
        <div class="stat-header">
          <div class="icon-circle"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></div>
          <span>Pengeluaran</span>
        </div>
        <div class="stat-body">
          <h2 class="amount-text">{{ formatCurrency(currentSummary.total_expense, activeCurrency) }}</h2>
          <div class="stat-meta">{{ currentSummary.expense_count }} Transaksi</div>
        </div>
      </div>

      <div class="stat-box balance" :class="{ 'is-negative': currentSummary.saldo < 0 }">
        <div class="stat-header">
          <div class="icon-circle"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
          <span>Sisa Saldo</span>
        </div>
        <div class="stat-body">
          <h2 class="amount-text">{{ formatCurrency(currentSummary.saldo, activeCurrency) }}</h2>
          <div class="stat-meta">{{ currentSummary.saldo >= 0 ? 'Kondisi Aman' : 'Perlu Hemat' }}</div>
        </div>
      </div>
    </div>

    <!-- Lower Section: Chart & Table -->
    <div class="dashboard-grid">
      <div class="card health-card">
        <div class="card-title">Kesehatan Keuangan</div>
        <div class="health-visual">
          <div class="progress-info">
            <span class="pct">{{ expenseRatio }}%</span>
            <span class="lbl">Tingkat Pengeluaran</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" :style="{ width: expenseRatio + '%', background: getHealthColor }"></div>
          </div>
          <p class="health-note">{{ getHealthNote }}</p>
        </div>
      </div>

      <div class="card recent-card">
        <div class="card-header">
          <div class="card-title">Transaksi Terbaru</div>
          <RouterLink to="/transaksi" class="link-more">Lihat Semua →</RouterLink>
        </div>
        <div v-if="loading" class="loading-placeholder">Memuat data...</div>
        <div v-else-if="recentTransactions.length === 0" class="empty-placeholder">Belum ada transaksi di bulan ini.</div>
        <div v-else class="table-responsive">
          <table class="recent-table">
            <thead>
              <tr>
                <th>Detail</th>
                <th>Kategori</th>
                <th class="text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in recentTransactions" :key="t.id">
                <td>
                  <div class="td-desc">{{ t.deskripsi }}</div>
                  <div class="td-date">{{ formatDate(t.tanggal) }}</div>
                </td>
                <td><span class="cat-tag">{{ t.kategori }}</span></td>
                <td class="text-right" :class="t.tipe === 'income' ? 'c-green' : 'c-red'">
                  <div class="td-amount">{{ t.tipe === 'income' ? '+' : '-' }}{{ formatCurrency(t.jumlah, t.mata_uang) }}</div>
                  <div class="td-badge">{{ t.tipe === 'income' ? 'Masuk' : 'Keluar' }}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { getTransactions, getSummary } from '../services/api.js'

const router = useRouter()
const loading = ref(true)
const recentTransactions = ref([])
const activeCurrency = ref('IDR')
const summary = ref({
  IDR: { total_income: 0, total_expense: 0, saldo: 0, income_count: 0, expense_count: 0 },
  JPY: { total_income: 0, total_expense: 0, saldo: 0, income_count: 0, expense_count: 0 }
})

const currentSummary = computed(() => summary.value[activeCurrency.value])

const now = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`)

const monthOptions = computed(() => {
  const opts = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    const label = d.toLocaleDateString('id-ID', { month:'long', year:'numeric' })
    opts.push({ value: val, label })
  }
  return opts
})

const expenseRatio = computed(() => {
  const s = currentSummary.value
  if (!s.total_income) return 0
  return Math.min(100, Math.round((s.total_expense / s.total_income) * 100))
})

const getHealthColor = computed(() => {
  const r = expenseRatio.value
  if (r > 80) return '#ef4444'
  if (r > 60) return '#f59e0b'
  return '#10b981'
})

const getHealthNote = computed(() => {
  const r = expenseRatio.value
  if (r > 80) return '⚠️ Pengeluaran hampir melebihi pendapatan!'
  if (r > 60) return '⚡ Hati-hati, pengeluaran cukup tinggi.'
  return '✅ Keuangan Anda bulan ini dalam kondisi sehat.'
})

const formatCurrency = (val, currency = 'IDR') => {
  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'ja-JP', {
    style: 'currency', currency: currency, maximumFractionDigits: 0
  }).format(val || 0)
}

const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short' })

const loadData = async () => {
  loading.value = true
  try {
    const [tahun, bulan] = selectedMonth.value.split('-')

    // Pisah pakai allSettled agar kalau satu gagal, yang lain tetap jalan
    const [txRes, sumRes] = await Promise.allSettled([
      getTransactions({ bulan, tahun, limit: 6 }),
      getSummary({ bulan, tahun })
    ])

    if (txRes.status === 'fulfilled') {
      recentTransactions.value = txRes.value.data.data || txRes.value.data || []
    } else {
      console.error('Gagal load transaksi:', txRes.reason)
      recentTransactions.value = []
    }

    if (sumRes.status === 'fulfilled') {
      if (sumRes.value.data.data) summary.value = sumRes.value.data.data
    } else {
      console.error('Gagal load summary:', sumRes.reason)
    }

  } catch (e) {
    console.error('loadData error:', e)
  } finally {
    loading.value = false
  }
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('nama')
  router.push('/login')
}

onMounted(loadData)
</script>

<style scoped>
.dashboard-wrapper { max-width: 1200px; margin: 0 auto; padding-bottom: 40px; }

/* Header */
.dashboard-header { margin-bottom: 32px; }
.header-content { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
.welcome-text h1 { font-size: 28px; font-weight: 900; letter-spacing: -0.03em; color: #111827; }
.welcome-text p { color: #6b7280; font-size: 15px; margin-top: 4px; }
.header-actions { display: flex; align-items: center; gap: 12px; }

.select-wrapper { position: relative; display: flex; align-items: center; }
.premium-select {
  appearance: none; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 10px 40px 10px 16px; font-weight: 600; font-size: 14px; cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.2s;
}
.premium-select:hover { border-color: #4f46e5; }
.select-icon { position: absolute; right: 14px; pointer-events: none; font-size: 10px; color: #9ca3af; }

.btn-logout-circle {
  width: 42px; height: 42px; border-radius: 50%; border: 1px solid #e5e7eb;
  background: white; color: #6b7280; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.btn-logout-circle:hover { color: #ef4444; border-color: #fee2e2; background: #fef2f2; }

/* Currency Navigation */
.currency-nav { margin-bottom: 24px; }
.tabs-container {
  display: flex; gap: 8px; background: #f3f4f6; padding: 6px; border-radius: 14px; width: fit-content;
}
.tabs-container button {
  padding: 10px 18px; border-radius: 10px; border: none; background: transparent;
  display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;
  color: #6b7280; font-weight: 700; font-size: 13px;
}
.tabs-container button.active { background: white; color: #4f46e5; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.tab-flag { font-size: 18px; }

/* Stats Grid */
.stats-container {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px;
}
.stat-box {
  background: white; border-radius: 24px; padding: 24px; border: 1px solid #f3f4f6;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.02), 0 8px 10px -6px rgba(0,0,0,0.02);
  display: flex; flex-direction: column; gap: 16px; transition: transform 0.2s;
}
.stat-box:hover { transform: translateY(-4px); }
.stat-header { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; }
.icon-circle { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }

.income .icon-circle { background: #ecfdf5; color: #059669; }
.income .amount-text { color: #059669; }
.expense .icon-circle { background: #fef2f2; color: #dc2626; }
.expense .amount-text { color: #dc2626; }
.balance .icon-circle { background: #eff6ff; color: #2563eb; }
.balance .amount-text { color: #2563eb; }
.balance.is-negative .amount-text { color: #dc2626; }

.amount-text { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; }
.stat-meta { font-size: 12px; font-weight: 500; color: #9ca3af; }

/* Lower Grid */
.dashboard-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 24px; }

.card-title { font-size: 18px; font-weight: 800; color: #111827; }
.health-visual { margin-top: 24px; text-align: center; }
.progress-info { display: flex; flex-direction: column; margin-bottom: 16px; }
.progress-info .pct { font-size: 36px; font-weight: 900; color: #111827; line-height: 1; }
.progress-info .lbl { font-size: 13px; font-weight: 600; color: #6b7280; margin-top: 4px; }
.progress-bar-container { height: 12px; background: #f3f4f6; border-radius: 99px; overflow: hidden; margin-bottom: 12px; }
.progress-bar-fill { height: 100%; border-radius: 99px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }
.health-note { font-size: 13px; font-weight: 600; color: #6b7280; }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.link-more { font-size: 13px; font-weight: 700; color: #4f46e5; text-decoration: none; }

.table-responsive { width: 100%; overflow-x: auto; }
.recent-table { width: 100%; border-collapse: collapse; }
.recent-table th { text-align: left; font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
.recent-table td { padding: 16px; border-bottom: 1px solid #f9fafb; vertical-align: middle; }
.td-desc { font-weight: 700; color: #1f2937; font-size: 14px; }
.td-date { font-size: 12px; color: #9ca3af; font-weight: 500; margin-top: 2px; }
.cat-tag { background: #f3f4f6; color: #4b5563; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.text-right { text-align: right; }
.td-amount { font-weight: 800; font-size: 15px; }
.td-badge { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-top: 2px; }
.c-green { color: #059669; }
.c-red { color: #dc2626; }

/* Responsive Breakpoints */
@media (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .stats-container { grid-template-columns: 1fr; gap: 12px; }
  .welcome-text h1 { font-size: 22px; }
  .amount-text { font-size: 20px; }
  .stat-box { padding: 18px; }
}

@media (max-width: 480px) {
  .header-content { flex-direction: column; align-items: flex-start; gap: 12px; }
  .header-actions { width: 100%; justify-content: space-between; }
  .premium-select { padding: 8px 30px 8px 12px; font-size: 13px; }
  .tab-label { display: none; }
  .tabs-container button { padding: 8px 12px; }
  .amount-text { font-size: 18px; }
  .card-title { font-size: 16px; }
  .recent-table th, .recent-table td { padding: 12px 8px; font-size: 12px; }
  .td-desc { font-size: 13px; }
}

@media (max-width: 350px) {
  .welcome-text h1 { font-size: 20px; }
  .amount-text { font-size: 16px; }
  .stat-header span { font-size: 11px; }
}

.loading-placeholder, .empty-placeholder { padding: 40px; text-align: center; color: #9ca3af; font-weight: 600; font-size: 14px; }
</style>
