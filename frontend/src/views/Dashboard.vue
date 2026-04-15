<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-sub">Ringkasan keuangan Anda</p>
      </div>
      <div class="header-actions">
        <select class="select" style="width:auto" v-model="selectedMonth" @change="loadData">
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <button class="logout-btn" @click="logout">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card income-card">
        <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></div>
        <div class="stat-label">Pemasukan</div>
        <div class="stat-value">{{ formatRupiah(summary.totalIncome) }}</div>
        <div class="stat-sub">{{ summary.incomeCount }} transaksi</div>
      </div>
      <div class="stat-card expense-card">
        <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></div>
        <div class="stat-label">Pengeluaran</div>
        <div class="stat-value">{{ formatRupiah(summary.totalExpense) }}</div>
        <div class="stat-sub">{{ summary.expenseCount }} transaksi</div>
      </div>
      <div class="stat-card saldo-card" :class="summary.saldo >= 0 ? 'positive' : 'negative'">
        <div class="stat-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
        <div class="stat-label">Saldo Akhir</div>
        <div class="stat-value">{{ formatRupiah(summary.saldo) }}</div>
        <div class="stat-sub">{{ summary.saldo >= 0 ? '▲ Surplus' : '▼ Defisit' }}</div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="card" style="margin-bottom:24px">
      <div class="progress-header">
        <span class="prog-label">Rasio Pengeluaran</span>
        <span class="prog-pct">{{ expenseRatio }}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: expenseRatio + '%', background: expenseRatio > 80 ? 'var(--red)' : expenseRatio > 60 ? 'var(--gold)' : 'var(--green)' }"></div>
      </div>
      <div class="progress-note">{{ expenseRatio > 80 ? '⚠️ Pengeluaran terlalu tinggi!' : expenseRatio > 60 ? '⚡ Mulai perhatikan pengeluaran' : '✅ Keuangan sehat' }}</div>
    </div>

    <!-- Recent Transactions -->
    <div class="card">
      <div class="section-header">
        <h2 class="section-title">Transaksi Terbaru</h2>
        <RouterLink to="/transaksi" class="btn btn-ghost btn-sm">Lihat Semua →</RouterLink>
      </div>
      <div v-if="loading" class="empty-state">Memuat data...</div>
      <div v-else-if="recentTransactions.length === 0" class="empty-state">Belum ada transaksi bulan ini</div>
      <table v-else>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Deskripsi</th>
            <th>Kategori</th>
            <th>Tipe</th>
            <th style="text-align:right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in recentTransactions" :key="t.id">
            <td>{{ formatDate(t.tanggal) }}</td>
            <td>{{ t.deskripsi }}</td>
            <td><span class="kategori-chip">{{ t.kategori }}</span></td>
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
import { RouterLink, useRouter } from 'vue-router'
import { getTransactions, getSummary } from '../services/api.js'

const router = useRouter()

const loading = ref(true)
const recentTransactions = ref([])
const summary = ref({ totalIncome: 0, totalExpense: 0, saldo: 0, incomeCount: 0, expenseCount: 0 })

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
  if (!summary.value.totalIncome) return 0
  return Math.min(100, Math.round((summary.value.totalExpense / summary.value.totalIncome) * 100))
})

const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(val || 0)
}

const formatDate = (d) => {
  return new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
}

const loadData = async () => {
  loading.value = true
  try {
    const [txRes, sumRes] = await Promise.all([
      getTransactions({ month: selectedMonth.value, limit: 8 }),
      getSummary({ month: selectedMonth.value })
    ])
    recentTransactions.value = txRes.data.data || txRes.data
    summary.value = sumRes.data
  } catch (e) {
    console.error(e)
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
.dashboard { padding: 32px; max-width: 1100px; }
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
.page-title { font-family:var(--font-head); font-size:26px; font-weight:800; }
.page-sub { color:var(--muted); font-size:13px; margin-top:2px; }
.header-actions { display:flex; gap:10px; align-items:center; }

.logout-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 14px; border-radius: var(--radius-sm);
  background: transparent; border: 1px solid var(--border);
  cursor: pointer; color: var(--muted2);
  font-size: 13px; font-weight: 500;
  transition: all var(--transition);
}
.logout-btn:hover { background: #ff444415; color: #ff4444; border-color: #ff444440; }

.stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:20px; }
.stat-card { background:var(--bg2); border:1px solid var(--border); border-radius:var(--radius); padding:22px; }
.stat-icon { width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
.income-card .stat-icon  { background:var(--green-dim); color:var(--green); }
.expense-card .stat-icon { background:var(--red-dim);   color:var(--red); }
.saldo-card.positive .stat-icon { background:var(--blue-dim); color:var(--blue); }
.saldo-card.negative .stat-icon { background:var(--red-dim); color:var(--red); }
.stat-label { font-size:12px; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.05em; }
.stat-value { font-family:var(--font-head); font-size:22px; font-weight:700; margin:6px 0 4px; }
.income-card  .stat-value { color:var(--green); }
.expense-card .stat-value { color:var(--red); }
.saldo-card.positive .stat-value { color:var(--blue); }
.saldo-card.negative .stat-value { color:var(--red); }
.stat-sub { font-size:12px; color:var(--muted); }

.progress-header { display:flex; justify-content:space-between; margin-bottom:10px; }
.prog-label { font-size:13px; font-weight:500; }
.prog-pct { font-family:var(--font-head); font-weight:700; font-size:15px; }
.progress-track { height:8px; background:var(--bg3); border-radius:99px; overflow:hidden; }
.progress-fill { height:100%; border-radius:99px; transition:width 0.6s ease; }
.progress-note { margin-top:8px; font-size:12px; color:var(--muted); }

.section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.section-title { font-family:var(--font-head); font-weight:700; font-size:16px; }
.empty-state { text-align:center; color:var(--muted); padding:40px 0; }
.kategori-chip { background:var(--bg3); color:var(--muted2); padding:3px 9px; border-radius:6px; font-size:12px; }
.amount-income  { color:var(--green); font-weight:600; font-family:var(--font-head); }
.amount-expense { color:var(--red);   font-weight:600; font-family:var(--font-head); }
</style>