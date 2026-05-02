<template>
  <div class="transactions-container">
    <!-- Header Section -->
    <header class="page-header">
      <div class="header-content">
        <div class="title-group">
          <h1>Riwayat Transaksi</h1>
          <p>Catat dan pantau setiap pengeluaran & pemasukan</p>
        </div>
        <button class="btn-add-premium" @click="openModal()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>Transaksi Baru</span>
        </button>
      </div>
    </header>

    <!-- Currency Tabs -->
    <div class="currency-nav">
      <div class="tabs-container">
        <button :class="{ active: filterCurrency === 'IDR' }" @click="filterCurrency = 'IDR'">
          <span class="tab-flag">🇮🇩</span>
          <span class="tab-label">IDR (Rupiah)</span>
        </button>
        <button :class="{ active: filterCurrency === 'JPY' }" @click="filterCurrency = 'JPY'">
          <span class="tab-flag">🇯🇵</span>
          <span class="tab-label">JPY (Yen)</span>
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-card glass-card">
      <div class="search-wrapper">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="search" placeholder="Cari deskripsi transaksi..." />
      </div>
      <div class="filter-actions">
        <select v-model="filterTipe" class="premium-select-sm">
          <option value="">Semua Tipe</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
        <select v-model="filterMonth" class="premium-select-sm">
          <option value="">Semua Bulan</option>
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <button class="btn-reset" @click="resetFilters" title="Reset Filter">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-body">
      <div v-if="loading" class="state-msg glass-card">
        <div class="skeleton" style="height: 60px; margin-bottom: 10px;"></div>
        <div class="skeleton" style="height: 60px; margin-bottom: 10px;"></div>
        <div class="skeleton" style="height: 60px;"></div>
      </div>
      
      <div v-else-if="filteredTransactions.length === 0" class="state-msg glass-card">
        <div class="empty-illustration">📂</div>
        <h3>Belum ada data</h3>
        <p>Transaksi yang Anda cari tidak ditemukan atau belum dicatat.</p>
      </div>

      <div v-else class="transactions-grouped-list">
        <div v-for="group in groupedTransactions" :key="group.date" class="date-group">
          <div class="date-header">
            <span class="date-badge">{{ group.date }}</span>
          </div>
          <div class="tx-list">
            <div v-for="t in group.transactions" :key="t.id" class="tx-card glass-card">
              <div class="tx-left">
                <div class="tx-icon" :class="t.tipe">
                  <svg v-if="t.tipe === 'income'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                  <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                </div>
                <div class="tx-info">
                  <div class="tx-desc">{{ t.deskripsi }}</div>
                  <div class="tx-meta"><span class="cat-pill">{{ t.kategori }}</span></div>
                </div>
              </div>
              <div class="tx-right">
                <div class="tx-amount" :class="t.tipe">
                  {{ t.tipe === 'income' ? '+' : '-' }}{{ formatCurrency(t.jumlah, t.mata_uang) }}
                </div>
                <div class="tx-actions">
                  <button class="btn-icon" @click="openModal(t)" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="btn-icon danger" @click="confirmDelete(t)" title="Hapus">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide-over Modal Form -->
    <Transition name="slide-over">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="slide-panel glass-card">
          <div class="panel-header">
            <h2>{{ editingId ? 'Update Transaksi' : 'Catat Transaksi' }}</h2>
            <button @click="closeModal" class="close-x"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div class="panel-body">
            <form @submit.prevent="saveTransaction" class="premium-form">
              <div class="form-grid">
                <div class="f-group">
                  <label>Tipe</label>
                  <div class="type-selector">
                    <button type="button" :class="{ active: form.tipe === 'income' }" @click="form.tipe = 'income'">Pemasukan</button>
                    <button type="button" :class="{ active: form.tipe === 'expense' }" @click="form.tipe = 'expense'">Pengeluaran</button>
                  </div>
                </div>
                <div class="f-group">
                  <label>Tanggal</label>
                  <input type="date" v-model="form.tanggal" required />
                </div>
                <div class="f-group full">
                  <label>Kategori</label>
                  <select v-model="form.kategori" required>
                    <option value="" disabled>Pilih Kategori...</option>
                    <template v-if="form.tipe === 'income'">
                      <option v-for="k in kategoriIncome" :key="k" :value="k">{{ k }}</option>
                    </template>
                    <template v-else>
                      <option v-for="k in kategoriExpense" :key="k" :value="k">{{ k }}</option>
                    </template>
                  </select>
                </div>
                <div class="f-group full">
                  <label>Deskripsi</label>
                  <input v-model="form.deskripsi" placeholder="Masukkan keterangan..." required />
                </div>
                <div class="f-group">
                  <label>Mata Uang</label>
                  <select v-model="form.mata_uang" required>
                    <option value="IDR">Rupiah (IDR)</option>
                    <option value="JPY">Yen (JPY)</option>
                  </select>
                </div>
                <div class="f-group">
                  <label>Jumlah</label>
                  <input type="number" v-model="form.jumlah" placeholder="0" min="1" required />
                </div>
              </div>
              <div class="panel-footer">
                <button type="button" class="btn-cancel" @click="closeModal">Batal</button>
                <button type="submit" class="btn-save" :disabled="saving">
                  {{ saving ? 'Menyimpan...' : 'Simpan Transaksi' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirm -->
    <Transition name="fade">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="confirm-box glass-card">
          <div class="warn-icon">⚠️</div>
          <h3>Hapus Transaksi?</h3>
          <p>Tindakan ini permanen dan akan mempengaruhi saldo Anda.</p>
          <div class="confirm-actions">
            <button @click="showDeleteModal = false" class="btn-cancel">Batal</button>
            <button @click="deleteItem" class="btn-danger-fill" :disabled="deleting">
              {{ deleting ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/api.js'

const transactions = ref([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingId = ref(null)
const deletingItem = ref(null)
const search = ref('')
const filterTipe = ref('')
const filterMonth = ref('')
const filterCurrency = ref('IDR')

const now = new Date()
const monthOptions = computed(() => {
  const opts = []
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    opts.push({ value: val, label: d.toLocaleDateString('id-ID', { month:'long', year:'numeric' }) })
  }
  return opts
})

const kategoriIncome = ['Gaji', 'Freelance', 'Investasi', 'Bonus', 'Hadiah', 'Lainnya']
const kategoriExpense = ['Makan & Minum', 'Transportasi', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Pendidikan', 'Tabungan', 'Lainnya']

const form = ref({ tipe: 'expense', tanggal: new Date().toISOString().split('T')[0], kategori: '', deskripsi: '', jumlah: '', mata_uang: 'IDR' })

watch(() => form.value.tipe, (v) => { 
  if (!form.value.kategori || (v === 'income' && !kategoriIncome.includes(form.value.kategori)) || (v === 'expense' && !kategoriExpense.includes(form.value.kategori))) {
    form.value.kategori = '' 
  }
})

const filteredTransactions = computed(() => {
  if (!Array.isArray(transactions.value)) return [];
  return transactions.value.filter(t => {
    const desc = t.deskripsi || '';
    const matchSearch = !search.value || desc.toLowerCase().includes(search.value.toLowerCase())
    const matchTipe = !filterTipe.value || t.tipe === filterTipe.value
    const matchMonth = !filterMonth.value || (t.tanggal && t.tanggal.startsWith(filterMonth.value))
    const matchCurrency = (t.mata_uang || 'IDR') === filterCurrency.value
    return matchSearch && matchTipe && matchMonth && matchCurrency
  })
})

const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })

const groupedTransactions = computed(() => {
  const groups = {};
  filteredTransactions.value.forEach(t => {
    const dateStr = formatDate(t.tanggal);
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(t);
  });
  
  return Object.keys(groups).map(date => ({
    date,
    transactions: groups[date]
  }));
})

const formatCurrency = (v, currency = 'IDR') => {
  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'ja-JP', { 
    style: 'currency', currency: currency, maximumFractionDigits: 0 
  }).format(v || 0)
}

const loadTransactions = async () => {
  loading.value = true
  try {
    const promises = monthOptions.value.map(m => getTransactions({ month: m.value }))
    const results = await Promise.allSettled(promises)
    
    let allData = []
    results.forEach(res => {
      if (res.status === 'fulfilled') {
        const d = res.value.data?.data || res.value.data
        if (Array.isArray(d)) {
          allData = allData.concat(d)
        }
      }
    })
    
    transactions.value = allData.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
  } catch (e) { 
    console.error('Load error:', e) 
  }
  finally { 
    loading.value = false 
  }
}

const openModal = (t = null) => {
  if (t) {
    editingId.value = t.id
    form.value = { tipe: t.tipe, tanggal: t.tanggal?.split('T')[0], kategori: t.kategori, deskripsi: t.deskripsi, jumlah: t.jumlah, mata_uang: t.mata_uang || 'IDR' }
  } else {
    editingId.value = null
    form.value = { tipe: 'expense', tanggal: new Date().toISOString().split('T')[0], kategori: '', deskripsi: '', jumlah: '', mata_uang: 'IDR' }
  }
  showModal.value = true
}

const closeModal = () => { showModal.value = false }

const saveTransaction = async () => {
  saving.value = true
  try {
    if (editingId.value) await updateTransaction(editingId.value, form.value)
    else await createTransaction(form.value)
    await loadTransactions()
    closeModal()
  } catch (e) { alert('Gagal menyimpan: ' + (e.response?.data?.message || e.message)) }
  finally { saving.value = false }
}

const confirmDelete = (t) => { deletingItem.value = t; showDeleteModal.value = true }
const deleteItem = async () => {
  deleting.value = true
  try {
    await deleteTransaction(deletingItem.value.id)
    await loadTransactions()
    showDeleteModal.value = false
  } catch (e) { alert('Gagal menghapus') }
  finally { deleting.value = false }
}

const resetFilters = () => { search.value = ''; filterTipe.value = ''; filterMonth.value = ''; filterCurrency.value = 'IDR'; }
onMounted(loadTransactions)
</script>

<style scoped>
.transactions-container { max-width: 1200px; margin: 0 auto; padding-bottom: 40px; }

/* Header */
.page-header { margin-bottom: 32px; }
.header-content { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
.title-group h1 { font-size: 28px; color: var(--text-main); margin-bottom: 4px; }
.title-group p { color: var(--text-muted); font-size: 15px; }

.btn-add-premium {
  display: flex; align-items: center; gap: 10px; padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white; border: none; border-radius: 14px;
  font-weight: 800; font-size: 15px; cursor: pointer; transition: all 0.2s;
  box-shadow: var(--shadow-glow);
}
.btn-add-premium:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(139, 92, 246, 0.4); }

/* Currency Navigation */
.currency-nav { margin-bottom: 20px; }
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

/* Filters Bar */
.filters-card {
  padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;
  gap: 20px; margin-bottom: 24px;
}
.search-wrapper {
  display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.3);
  padding: 0 16px; border-radius: 12px; flex: 1; border: 1px solid var(--border); transition: all 0.2s;
}
.search-wrapper:focus-within { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-light); }
.search-wrapper input { background: transparent; color: var(--text-main); border: none; padding: 12px 0; outline: none; width: 100%; font-size: 14px; font-weight: 500; }
.search-wrapper input::placeholder { color: var(--text-muted); }
.search-wrapper svg { color: var(--text-muted); }

.filter-actions { display: flex; gap: 10px; align-items: center; }
.premium-select-sm {
  padding: 10px 16px; border-radius: 12px; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-main); font-size: 13px; font-weight: 600; cursor: pointer; outline: none;
  backdrop-filter: blur(10px);
}
.premium-select-sm option { background: var(--bg-main); }
.btn-reset {
  width: 40px; height: 40px; border-radius: 12px; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.btn-reset:hover { color: var(--primary); border-color: var(--primary); background: var(--primary-light); }

/* Main Content: Grouped List */
.content-body { min-height: 400px; }
.state-msg { padding: 80px 20px; text-align: center; color: var(--text-muted); }
.empty-illustration { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }

.transactions-grouped-list { display: flex; flex-direction: column; gap: 32px; }
.date-group { display: flex; flex-direction: column; gap: 16px; }
.date-header { position: sticky; top: 0; z-index: 10; padding: 8px 0; }
.date-badge { 
  display: inline-block; padding: 6px 16px; background: rgba(0,0,0,0.6); 
  backdrop-filter: blur(8px); border: 1px solid var(--border); border-radius: 99px;
  font-size: 12px; font-weight: 700; color: var(--text-main); letter-spacing: 0.5px;
}

.tx-list { display: flex; flex-direction: column; gap: 12px; }
.tx-card {
  display: flex; justify-content: space-between; align-items: center; padding: 16px 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.tx-card:hover { transform: translateX(4px); box-shadow: var(--shadow-glow); border-color: rgba(255,255,255,0.15); }
.tx-left { display: flex; align-items: center; gap: 16px; }
.tx-icon { width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.tx-icon.income { background: var(--success-bg); color: var(--success); }
.tx-icon.expense { background: var(--danger-bg); color: var(--danger); }
.tx-desc { font-weight: 600; color: var(--text-main); font-size: 16px; margin-bottom: 4px; }
.tx-meta { display: flex; align-items: center; gap: 8px; }
.cat-pill { background: rgba(255, 255, 255, 0.05); color: var(--text-muted); padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

.tx-right { display: flex; align-items: center; gap: 24px; }
.tx-amount { font-family: 'Satoshi', sans-serif; font-size: 18px; font-weight: 800; text-align: right; }
.tx-amount.income { color: var(--success); text-shadow: 0 0 10px rgba(16,185,129,0.2); }
.tx-amount.expense { color: var(--text-main); }

.tx-actions { display: flex; gap: 8px; opacity: 0; transition: opacity 0.2s; }
.tx-card:hover .tx-actions { opacity: 1; }
.btn-icon { width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); color: var(--text-muted); cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
.btn-icon:hover { background: var(--primary-light); color: var(--primary); border-color: var(--primary); }
.btn-icon.danger:hover { background: var(--danger-bg); color: var(--danger); border-color: var(--danger); }

/* Slide-over Modal Form */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; justify-content: flex-end; z-index: 1000; }
.slide-panel { 
  width: 100%; max-width: 480px; height: 100vh; border-radius: 24px 0 0 24px; border: none; border-left: 1px solid var(--border);
  display: flex; flex-direction: column; background: rgba(9, 9, 11, 0.95);
}
.panel-header { padding: 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
.panel-header h2 { font-size: 24px; color: var(--text-main); }
.close-x { background: transparent; border: none; color: var(--text-muted); cursor: pointer; transition: color 0.2s; }
.close-x:hover { color: var(--text-main); }

.panel-body { padding: 32px; flex: 1; overflow-y: auto; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.f-group { display: flex; flex-direction: column; gap: 8px; }
.f-group.full { grid-column: span 2; }
.f-group label { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.f-group input, .f-group select { 
  padding: 14px 16px; border-radius: 12px; border: 1px solid var(--border); 
  background: rgba(0,0,0,0.2); color: var(--text-main); font-size: 14px; font-weight: 500; outline: none; transition: all 0.2s; 
}
.f-group input:focus, .f-group select:focus { border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-light); }
.f-group input::placeholder { color: var(--text-muted); }
.f-group select option { background: var(--bg-main); }

.type-selector { display: flex; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 12px; border: 1px solid var(--border); }
.type-selector button { flex: 1; padding: 10px; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; color: var(--text-muted); background: transparent; }
.type-selector button.active { background: var(--bg-card); color: var(--text-main); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

.panel-footer { display: flex; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border); }
.btn-save { flex: 2; padding: 14px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; border: none; border-radius: 14px; font-weight: 800; cursor: pointer; box-shadow: var(--shadow-glow); }
.btn-cancel { flex: 1; padding: 14px; background: transparent; border: 1px solid var(--border); border-radius: 14px; color: var(--text-muted); font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-cancel:hover { background: rgba(255,255,255,0.05); color: var(--text-main); }

/* Delete Confirm Modal */
.confirm-box {
  background: var(--bg-main); padding: 40px 32px; text-align: center; max-width: 360px; width: 100%;
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
}
.warn-icon { font-size: 48px; margin-bottom: 16px; }
.confirm-box h3 { font-size: 20px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; }
.confirm-box p { color: var(--text-muted); font-size: 14px; margin-bottom: 28px; line-height: 1.6; }
.confirm-actions { display: flex; gap: 12px; }
.confirm-actions .btn-cancel { flex: 1; padding: 14px; }
.btn-danger-fill {
  flex: 2; padding: 14px; background: var(--danger); color: white;
  border: none; border-radius: 14px; font-weight: 800; cursor: pointer;
  box-shadow: 0 4px 15px rgba(244, 63, 94, 0.3); transition: background 0.2s;
}
.btn-danger-fill:hover { filter: brightness(1.1); }
.btn-danger-fill:disabled { opacity: 0.6; cursor: not-allowed; }

/* Transitions */
.slide-over-enter-active, .slide-over-leave-active { transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-over-enter-from, .slide-over-leave-to { opacity: 0; transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Responsive */
@media (max-width: 768px) {
  .filters-card { flex-direction: column; align-items: stretch; gap: 16px; }
  .filter-actions { justify-content: space-between; gap: 8px; }
  .premium-select-sm { flex: 1; }
  .tx-actions { opacity: 1; } /* Always show on mobile */
  .tx-right { flex-direction: column; align-items: flex-end; gap: 8px; }
  .tx-amount { font-size: 16px; }
  .btn-icon { width: 32px; height: 32px; }
  
  .slide-panel { max-width: 100%; border-radius: 24px 24px 0 0; height: 90vh; margin-top: 10vh; border-left: none; border-top: 1px solid var(--border); }
  .modal-overlay { justify-content: center; align-items: flex-end; }
  .slide-over-enter-from, .slide-over-leave-to { transform: translateY(100%); opacity: 0; }
}

@media (max-width: 400px) {
  .page-header h1 { font-size: 24px; }
  .btn-add-premium span { display: none; }
  .btn-add-premium { padding: 12px; border-radius: 50%; width: 48px; height: 48px; justify-content: center; }
  .tx-card { padding: 12px; }
  .tx-desc { font-size: 14px; }
  .form-grid { grid-template-columns: 1fr; }
  .f-group.full { grid-column: auto; }
}
</style>