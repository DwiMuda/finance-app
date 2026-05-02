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
              <option value="">Semua Bulan</option>
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
      <div class="stat-box glass-card income">
        <div class="stat-header">
          <div class="icon-circle"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></div>
          <span>Pemasukan</span>
        </div>
        <div class="stat-body">
          <h2 class="amount-text animate-count">{{ formatCurrency(currentSummary.total_income, activeCurrency) }}</h2>
          <div class="stat-meta">{{ currentSummary.income_count }} Transaksi</div>
        </div>
      </div>

      <div class="stat-box glass-card expense">
        <div class="stat-header">
          <div class="icon-circle"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></div>
          <span>Pengeluaran</span>
        </div>
        <div class="stat-body">
          <h2 class="amount-text animate-count">{{ formatCurrency(currentSummary.total_expense, activeCurrency) }}</h2>
          <div class="stat-meta">{{ currentSummary.expense_count }} Transaksi</div>
        </div>
      </div>

      <div class="stat-box glass-card balance" :class="{ 'is-negative': currentSummary.saldo < 0 }">
        <div class="stat-header">
          <div class="icon-circle"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
          <span>Sisa Saldo</span>
        </div>
        <div class="stat-body">
          <h2 class="amount-text animate-count">{{ formatCurrency(currentSummary.saldo, activeCurrency) }}</h2>
          <div class="stat-meta">{{ currentSummary.saldo >= 0 ? 'Kondisi Aman' : 'Perlu Hemat' }}</div>
        </div>
      </div>
    </div>

    <!-- Lower Section: Chart & Table -->
    <div class="dashboard-grid">
      <div class="health-card glass-card">
        <div class="card-title">Kesehatan Keuangan</div>
        <div class="health-visual">
          <div class="circular-progress">
            <svg viewBox="0 0 36 36" class="circular-chart">
              <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path class="circle" :stroke-dasharray="expenseRatio + ', 100'" :style="{ stroke: getHealthColor }" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div class="progress-info">
              <span class="pct">{{ expenseRatio }}%</span>
              <span class="lbl">Pengeluaran</span>
            </div>
          </div>
        </div>
      </div>

      <div class="recent-card glass-card">
        <div class="card-header">
          <div class="card-title">Transaksi Terbaru</div>
          <RouterLink to="/transaksi" class="link-more">Lihat Semua &rarr;</RouterLink>
        </div>
        
        <div v-if="loading" class="loading-state">
          <div class="skeleton" style="height: 60px; margin-bottom: 10px;"></div>
          <div class="skeleton" style="height: 60px; margin-bottom: 10px;"></div>
          <div class="skeleton" style="height: 60px;"></div>
        </div>
        <div v-else-if="recentTransactions.length === 0" class="empty-state">
          Belum ada transaksi di bulan ini.
        </div>
        <div v-else class="transaction-list">
          <div v-for="t in recentTransactions.slice(0, 5)" :key="t.id" class="tx-item">
            <div class="tx-icon" :class="t.tipe">
              <svg v-if="t.tipe === 'income'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
            </div>
            <div class="tx-info">
              <div class="tx-desc">{{ t.deskripsi }}</div>
              <div class="tx-meta">{{ formatDate(t.tanggal) }} &bull; <span class="cat-pill">{{ t.kategori }}</span></div>
            </div>
            <div class="tx-amount" :class="t.tipe">
              {{ t.tipe === 'income' ? '+' : '-' }}{{ formatCurrency(t.jumlah, t.mata_uang) }}
            </div>
          </div>
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
  // Total dana yang tersedia bulan ini = Sisa Saldo akhir + Pengeluaran bulan ini
  // (karena sisa saldo = dana awal + pemasukan - pengeluaran)
  const total_available = Number(s.saldo) + Number(s.total_expense)
  
  if (total_available <= 0) {
    return s.total_expense > 0 ? 100 : 0
  }
  return Math.min(100, Math.round((Number(s.total_expense) / total_available) * 100))
})

const getHealthColor = computed(() => {
  const r = expenseRatio.value
  if (r > 80) return 'var(--danger)'
  if (r > 60) return 'var(--warning)'
  return 'var(--success)'
})

const getHealthNote = computed(() => {
  const r = expenseRatio.value
  if (r > 80) return 'Pengeluaran hampir melebihi pendapatan!'
  if (r > 60) return 'Hati-hati, pengeluaran cukup tinggi.'
  return 'Keuangan Anda bulan ini sangat sehat dan stabil.'
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
    if (!selectedMonth.value) {
      const txPromises = monthOptions.value.map(m => getTransactions({ month: m.value }))
      const sumPromises = monthOptions.value.map(m => getSummary({ month: m.value }))
      
      const txResults = await Promise.allSettled(txPromises)
      const sumResults = await Promise.allSettled(sumPromises)

      let allTx = []
      txResults.forEach(res => {
        if (res.status === 'fulfilled') {
          const d = res.value.data?.data || res.value.data
          if (Array.isArray(d)) allTx = allTx.concat(d)
        }
      })
      recentTransactions.value = allTx.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))

      let aggSum = {
        IDR: { total_income: 0, total_expense: 0, saldo: 0, income_count: 0, expense_count: 0 },
        JPY: { total_income: 0, total_expense: 0, saldo: 0, income_count: 0, expense_count: 0 }
      }
      
      sumResults.forEach(res => {
        if (res.status === 'fulfilled' && res.value.data?.data) {
          const sumData = res.value.data.data
          ;['IDR', 'JPY'].forEach(cur => {
            if (sumData[cur]) {
              aggSum[cur].total_income += Number(sumData[cur].total_income || 0)
              aggSum[cur].total_expense += Number(sumData[cur].total_expense || 0)
              aggSum[cur].saldo += Number(sumData[cur].saldo || 0)
              aggSum[cur].income_count += Number(sumData[cur].income_count || 0)
              aggSum[cur].expense_count += Number(sumData[cur].expense_count || 0)
            }
          })
        }
      })
      summary.value = aggSum

    } else {
      const [tahun, bulan] = selectedMonth.value.split('-')
      const [txRes, sumRes] = await Promise.allSettled([
        getTransactions({ bulan, tahun }),
        getSummary({ bulan, tahun })
      ])

      if (txRes.status === 'fulfilled') {
        const txData = txRes.value.data
        recentTransactions.value = txData.data || txData || []
      } else {
        recentTransactions.value = []
      }

      if (sumRes.status === 'fulfilled') {
        const sumData = sumRes.value.data
        if (sumData && sumData.data) {
          summary.value = {
            IDR: { ...sumData.data.IDR },
            JPY: { ...sumData.data.JPY }
          }
        }
      }
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
.welcome-text h1 { font-size: 28px; color: var(--text-main); margin-bottom: 4px; }
.welcome-text p { color: var(--text-muted); font-size: 15px; }

.header-actions { display: flex; align-items: center; gap: 12px; }

.select-wrapper { position: relative; display: flex; align-items: center; }
.premium-select {
  appearance: none; 
  background: var(--bg-card); 
  border: 1px solid var(--border); 
  border-radius: 12px;
  color: var(--text-main);
  padding: 10px 40px 10px 16px; 
  font-weight: 600; font-size: 14px; 
  cursor: pointer;
  box-shadow: var(--shadow-glass); 
  transition: all 0.2s;
  backdrop-filter: blur(10px);
}
.premium-select:hover { border-color: var(--primary); }
.premium-select option { background: var(--bg-main); color: var(--text-main); }
.select-icon { position: absolute; right: 14px; pointer-events: none; font-size: 10px; color: var(--text-muted); }

.btn-logout-circle {
  width: 42px; height: 42px; border-radius: 50%; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-muted); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.btn-logout-circle:hover { color: var(--danger); border-color: rgba(244, 63, 94, 0.3); background: var(--danger-bg); }

/* Currency Navigation */
.currency-nav { margin-bottom: 24px; }
.tabs-container {
  display: flex; gap: 8px; background: rgba(0,0,0,0.2); padding: 6px; border-radius: 14px; width: fit-content;
  border: 1px solid var(--border);
}
.tabs-container button {
  padding: 10px 18px; border-radius: 10px; border: none; background: transparent;
  display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s;
  color: var(--text-muted); font-weight: 600; font-size: 13px;
}
.tabs-container button.active { background: var(--bg-card); color: var(--text-main); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.tab-flag { font-size: 18px; }

/* Stats Grid */
.stats-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
.stat-box {
  padding: 24px; 
  display: flex; flex-direction: column; gap: 16px; transition: transform 0.2s, box-shadow 0.2s;
}
.stat-box:hover { transform: translateY(-4px); box-shadow: var(--shadow-glow); border-color: rgba(255,255,255,0.15); }
.stat-header { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
.icon-circle { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }

.income .icon-circle { background: var(--success-bg); color: var(--success); box-shadow: 0 0 15px rgba(16, 185, 129, 0.2); }
.income .amount-text { color: var(--success); text-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
.expense .icon-circle { background: var(--danger-bg); color: var(--danger); box-shadow: 0 0 15px rgba(244, 63, 94, 0.2); }
.expense .amount-text { color: var(--danger); text-shadow: 0 0 20px rgba(244, 63, 94, 0.3); }
.balance .icon-circle { background: var(--primary-light); color: var(--primary); box-shadow: 0 0 15px rgba(139, 92, 246, 0.2); }
.balance .amount-text { color: var(--text-main); }
.balance.is-negative .amount-text { color: var(--danger); }

.amount-text { font-size: 32px; font-weight: 900; letter-spacing: -0.02em; }
.animate-count { animation: countUp 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.stat-meta { font-size: 13px; font-weight: 500; color: var(--text-muted); }

/* Lower Grid */
.dashboard-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 24px; }
.health-card, .recent-card { padding: 24px; }

.card-title { font-size: 18px; color: var(--text-main); margin-bottom: 20px; }
.health-visual { text-align: center; display: flex; justify-content: center; align-items: center; padding: 20px 0; }

.circular-progress { position: relative; width: 160px; height: 160px; }
.circular-chart { display: block; margin: 0 auto; max-width: 100%; max-height: 250px; }
.circle-bg { fill: none; stroke: rgba(255, 255, 255, 0.05); stroke-width: 3.8; }
.circle { fill: none; stroke-width: 3.5; stroke-linecap: round; animation: progress 1s ease-out forwards; }
@keyframes progress { 0% { stroke-dasharray: 0 100; } }

.progress-info { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; }
.progress-info .pct { font-size: 32px; font-family: 'Satoshi', sans-serif; font-weight: 900; color: var(--text-main); line-height: 1; }
.progress-info .lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-top: 4px; }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.link-more { font-size: 13px; font-weight: 600; color: var(--primary); text-decoration: none; transition: color 0.2s; }
.link-more:hover { color: var(--primary-dark); text-shadow: 0 0 10px var(--primary); }

.transaction-list { display: flex; flex-direction: column; gap: 12px; }
.tx-item { display: flex; align-items: center; gap: 16px; padding: 12px; border-radius: 16px; transition: background 0.2s; border: 1px solid transparent; }
.tx-item:hover { background: rgba(255, 255, 255, 0.02); border-color: var(--border); }
.tx-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
.tx-icon.income { background: var(--success-bg); color: var(--success); }
.tx-icon.expense { background: var(--danger-bg); color: var(--danger); }
.tx-info { flex: 1; }
.tx-desc { font-weight: 600; color: var(--text-main); font-size: 15px; margin-bottom: 4px; }
.tx-meta { font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
.cat-pill { background: rgba(255, 255, 255, 0.05); padding: 2px 8px; border-radius: 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
.tx-amount { font-family: 'Satoshi', sans-serif; font-weight: 800; font-size: 16px; }
.tx-amount.income { color: var(--success); text-shadow: 0 0 10px rgba(16,185,129,0.2); }
.tx-amount.expense { color: var(--text-main); }

.loading-state, .empty-state { padding: 40px; text-align: center; color: var(--text-muted); font-size: 14px; }

/* Responsive Breakpoints */
@media (max-width: 1024px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .stats-container { grid-template-columns: 1fr; gap: 16px; }
  .welcome-text h1 { font-size: 24px; }
  .amount-text { font-size: 28px; }
}
@media (max-width: 480px) {
  .header-content { flex-direction: column; align-items: flex-start; }
  .header-actions { width: 100%; justify-content: space-between; }
  .tabs-container button { padding: 8px 12px; }
  .tab-label { display: none; }
}
</style>
