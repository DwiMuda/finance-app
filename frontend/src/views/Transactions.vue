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

    <!-- Filters Bar -->
    <div class="filters-card">
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
    <div class="content-body card">
      <div v-if="loading" class="state-msg">
        <div class="spinner"></div>
        <p>Menyelaraskan data...</p>
      </div>
      
      <div v-else-if="filteredTransactions.length === 0" class="state-msg">
        <div class="empty-illustration">📂</div>
        <h3>Belum ada data</h3>
        <p>Transaksi yang Anda cari tidak ditemukan atau belum dicatat.</p>
      </div>

      <div v-else class="transactions-list">
        <!-- Desktop Table -->
        <div class="table-responsive desktop-only">
          <table class="premium-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Deskripsi</th>
                <th>Kategori</th>
                <th class="text-right">Jumlah</th>
                <th class="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTransactions" :key="t.id">
                <td class="col-date">{{ formatDate(t.tanggal) }}</td>
                <td class="col-desc">
                  <div class="desc-main">{{ t.deskripsi }}</div>
                  <div class="type-badge" :class="t.tipe">{{ t.tipe === 'income' ? 'Masuk' : 'Keluar' }}</div>
                </td>
                <td><span class="cat-pill">{{ t.kategori }}</span></td>
                <td class="text-right">
                  <div class="amount-val" :class="t.tipe">
                    {{ t.tipe === 'income' ? '+' : '-' }}{{ formatCurrency(t.jumlah, t.mata_uang) }}
                  </div>
                </td>
                <td class="text-center">
                  <div class="action-btns">
                    <button class="btn-edit" @click="openModal(t)">✏️</button>
                    <button class="btn-delete" @click="confirmDelete(t)">🗑️</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Cards -->
        <div class="mobile-only mobile-cards-grid">
          <div v-for="t in filteredTransactions" :key="t.id" class="mobile-transaction-card">
            <div class="card-top">
              <span class="m-date">{{ formatDate(t.tanggal) }}</span>
              <span class="cat-pill">{{ t.kategori }}</span>
            </div>
            <div class="card-mid">
              <div class="m-desc">{{ t.deskripsi }}</div>
              <div class="m-amount" :class="t.tipe">
                {{ t.tipe === 'income' ? '+' : '-' }}{{ formatCurrency(t.jumlah, t.mata_uang) }}
              </div>
            </div>
            <div class="card-bottom">
              <div class="type-badge" :class="t.tipe">{{ t.tipe === 'income' ? 'Masuk' : 'Keluar' }}</div>
              <div class="m-actions">
                <button @click="openModal(t)">Edit</button>
                <button @click="confirmDelete(t)" class="danger">Hapus</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <Transition name="slide-up">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
          <div class="modal-header">
            <h2>{{ editingId ? 'Update Transaksi' : 'Catat Transaksi' }}</h2>
            <button @click="closeModal" class="close-x">✕</button>
          </div>
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
            <div class="modal-footer">
              <button type="button" class="btn-cancel" @click="closeModal">Batal</button>
              <button type="submit" class="btn-save" :disabled="saving">
                {{ saving ? 'Menyimpan...' : 'Simpan Transaksi' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirm -->
    <Transition name="fade">
      <div v-if="showDeleteModal" class="modal-overlay-dark" @click.self="showDeleteModal = false">
        <div class="confirm-box">
          <div class="warn-icon">🗑️</div>
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
  return transactions.value.filter(t => {
    const matchSearch = !search.value || t.deskripsi.toLowerCase().includes(search.value.toLowerCase())
    const matchTipe = !filterTipe.value || t.tipe === filterTipe.value
    const matchMonth = !filterMonth.value || t.tanggal?.startsWith(filterMonth.value)
    return matchSearch && matchTipe && matchMonth
  })
})

const formatCurrency = (v, currency = 'IDR') => {
  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'ja-JP', { 
    style: 'currency', currency: currency, maximumFractionDigits: 0 
  }).format(v || 0)
}
const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })

const loadTransactions = async () => {
  loading.value = true
  try {
    const res = await getTransactions()
    transactions.value = res.data.data || res.data
  } catch (e) { console.error('Load error:', e) }
  finally { loading.value = false }
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

const resetFilters = () => { search.value = ''; filterTipe.value = ''; filterMonth.value = '' }
onMounted(loadTransactions)
</script>

<style scoped>
.transactions-container { max-width: 1200px; margin: 0 auto; padding-bottom: 40px; }

/* Header */
.page-header { margin-bottom: 32px; }
.header-content { display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
.title-group h1 { font-size: 28px; font-weight: 900; letter-spacing: -0.03em; color: #111827; }
.title-group p { color: #6b7280; font-size: 15px; margin-top: 4px; }

.btn-add-premium {
  display: flex; align-items: center; gap: 10px; padding: 12px 24px;
  background: #4f46e5; color: white; border: none; border-radius: 14px;
  font-weight: 800; font-size: 15px; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.2);
}
.btn-add-premium:hover { background: #4338ca; transform: translateY(-2px); box-shadow: 0 15px 20px -5px rgba(79, 70, 229, 0.3); }

/* Filters Bar */
.filters-card {
  background: white; border-radius: 20px; padding: 16px 20px;
  display: flex; justify-content: space-between; align-items: center;
  gap: 20px; margin-bottom: 24px; border: 1px solid #f3f4f6;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}
.search-wrapper {
  display: flex; align-items: center; gap: 12px; background: #f9fafb;
  padding: 0 16px; border-radius: 12px; flex: 1; border: 1px solid transparent;
}
.search-wrapper:focus-within { border-color: #4f46e5; background: white; }
.search-wrapper input { background: transparent; border: none; padding: 12px 0; outline: none; width: 100%; font-size: 14px; font-weight: 500; }
.search-wrapper svg { color: #9ca3af; }

.filter-actions { display: flex; gap: 10px; align-items: center; }
.premium-select-sm {
  padding: 10px 16px; border-radius: 12px; border: 1px solid #e5e7eb;
  background: #fff; color: #374151; font-size: 13px; font-weight: 700; cursor: pointer; outline: none;
}
.btn-reset {
  width: 40px; height: 40px; border-radius: 12px; border: 1px solid #e5e7eb;
  background: white; color: #6b7280; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.btn-reset:hover { color: #4f46e5; border-color: #4f46e5; background: #f5f3ff; }

/* Desktop Table */
.table-responsive { width: 100%; overflow-x: auto; border-radius: 16px; }
.premium-table { width: 100%; border-collapse: collapse; background: white; }
.premium-table th { text-align: left; padding: 16px 24px; font-size: 11px; font-weight: 800; color: #9ca3af; text-transform: uppercase; border-bottom: 1px solid #f3f4f6; }
.premium-table td { padding: 20px 24px; border-bottom: 1px solid #f9fafb; vertical-align: middle; }
.col-date { font-weight: 700; color: #6b7280; font-size: 13px; }
.desc-main { font-weight: 800; color: #111827; font-size: 15px; margin-bottom: 4px; }
.type-badge { display: inline-block; font-size: 10px; font-weight: 900; text-transform: uppercase; padding: 2px 8px; border-radius: 6px; }
.type-badge.income { background: #ecfdf5; color: #059669; }
.type-badge.expense { background: #fef2f2; color: #dc2626; }
.cat-pill { background: #f3f4f6; color: #4b5563; padding: 4px 12px; border-radius: 10px; font-size: 12px; font-weight: 700; }
.amount-val { font-size: 16px; font-weight: 900; font-family: 'Inter', sans-serif; }
.amount-val.income { color: #059669; }
.amount-val.expense { color: #dc2626; }

.action-btns { display: flex; gap: 8px; justify-content: center; }
.action-btns button {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e5e7eb;
  background: white; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.btn-edit:hover { border-color: #4f46e5; background: #f5f3ff; color: #4f46e5; }
.btn-delete:hover { border-color: #ef4444; background: #fef2f2; color: #ef4444; }

/* Mobile Cards */
.mobile-cards-grid { display: flex; flex-direction: column; gap: 16px; }
.mobile-transaction-card { background: white; padding: 20px; border-radius: 20px; border: 1px solid #f3f4f6; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.m-date { font-size: 12px; font-weight: 700; color: #9ca3af; }
.card-mid { margin-bottom: 16px; }
.m-desc { font-size: 16px; font-weight: 800; color: #111827; margin-bottom: 4px; }
.m-amount { font-size: 18px; font-weight: 900; }
.m-amount.income { color: #059669; }
.m-amount.expense { color: #dc2626; }
.card-bottom { display: flex; justify-content: space-between; align-items: center; }
.m-actions { display: flex; gap: 12px; }
.m-actions button { background: none; border: none; font-weight: 800; font-size: 13px; color: #4f46e5; cursor: pointer; }
.m-actions button.danger { color: #dc2626; }

/* Modals & Utils */
.modal-overlay { position: fixed; inset: 0; background: rgba(17, 24, 39, 0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.modal-card { background: white; width: 100%; max-width: 500px; border-radius: 28px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px; }
.modal-header h2 { font-size: 22px; font-weight: 900; color: #111827; }
.close-x { background: #f3f4f6; border: none; width: 32px; height: 32px; border-radius: 50%; color: #6b7280; font-weight: 800; cursor: pointer; }

.f-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.f-group.full { grid-column: span 2; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 20px; }
.f-group label { font-size: 12px; font-weight: 800; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
.f-group input, .f-group select { padding: 12px 16px; border-radius: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-size: 14px; font-weight: 600; outline: none; transition: all 0.2s; }
.f-group input:focus { border-color: #4f46e5; background: white; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }

.type-selector { display: flex; background: #f3f4f6; padding: 4px; border-radius: 12px; }
.type-selector button { flex: 1; padding: 8px; border: none; border-radius: 8px; font-weight: 800; font-size: 12px; cursor: pointer; transition: all 0.2s; color: #6b7280; }
.type-selector button.active { background: white; color: #4f46e5; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.modal-footer { display: flex; gap: 12px; margin-top: 10px; }
.btn-save { flex: 2; padding: 14px; background: #4f46e5; color: white; border: none; border-radius: 14px; font-weight: 800; cursor: pointer; }
.btn-cancel { flex: 1; padding: 14px; background: white; border: 1px solid #e5e7eb; border-radius: 14px; color: #6b7280; font-weight: 700; cursor: pointer; }

/* Responsive */
.mobile-only { display: none; }
@media (max-width: 1024px) {
  .transactions-container { padding: 20px; }
}
@media (max-width: 768px) {
  .desktop-only { display: none; }
  .mobile-only { display: block; }
  .filters-card { flex-direction: column; align-items: stretch; gap: 12px; padding: 12px; }
  .filter-actions { justify-content: space-between; gap: 6px; }
  .premium-select-sm { flex: 1; padding: 8px 10px; font-size: 12px; }
  .form-grid { grid-template-columns: 1fr; }
  .f-group.full { grid-column: auto; }
}

@media (max-width: 400px) {
  .page-header h1 { font-size: 20px; }
  .btn-add-premium span { display: none; }
  .btn-add-premium { padding: 10px; border-radius: 50%; width: 44px; height: 44px; justify-content: center; }
  .m-desc { font-size: 14px; }
  .m-amount { font-size: 16px; }
  .modal-card { padding: 20px; }
}

.text-right { text-align: right; }
.text-center { text-align: center; }
.state-msg { padding: 80px 20px; text-align: center; color: #9ca3af; }
.spinner { width: 32px; height: 32px; border: 4px solid #f3f4f6; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
