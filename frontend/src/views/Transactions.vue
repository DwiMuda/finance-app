<template>
  <div class="transactions-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Transaksi</h1>
        <p class="page-sub">Kelola semua transaksi keuangan Anda</p>
      </div>
      <button class="btn btn-primary" @click="openModal()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Tambah Transaksi
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-bar card" style="padding:16px">
      <div class="filters-inner">
        <input class="input" placeholder="🔍 Cari deskripsi..." v-model="search" style="max-width:240px" />
        <select class="select" v-model="filterTipe" style="max-width:150px">
          <option value="">Semua Tipe</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
        <select class="select" v-model="filterMonth" style="max-width:180px">
          <option value="">Semua Bulan</option>
          <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <button class="btn btn-ghost btn-sm" @click="resetFilters">Reset</button>
      </div>
      <div class="filter-summary">
        <span>{{ filteredTransactions.length }} dari {{ transactions.length }} transaksi</span>
      </div>
    </div>

    <!-- Table -->
    <div class="card" style="padding:0; overflow:hidden">
      <div v-if="loading" class="empty-state">Memuat data...</div>
      <div v-else-if="filteredTransactions.length === 0" class="empty-state">
        <div style="font-size:32px;margin-bottom:8px">📭</div>
        Tidak ada transaksi ditemukan
      </div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Deskripsi</th>
              <th>Kategori</th>
              <th>Tipe</th>
              <th style="text-align:right">Jumlah</th>
              <th style="text-align:center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in filteredTransactions" :key="t.id">
              <td>{{ formatDate(t.tanggal) }}</td>
              <td>
                <div class="desc-cell">{{ t.deskripsi }}</div>
              </td>
              <td><span class="kategori-chip">{{ t.kategori }}</span></td>
              <td><span class="badge" :class="t.tipe">{{ t.tipe === 'income' ? 'Pemasukan' : 'Pengeluaran' }}</span></td>
              <td style="text-align:right" :class="t.tipe === 'income' ? 'amount-income' : 'amount-expense'">
                {{ t.tipe === 'income' ? '+' : '-' }}{{ formatRupiah(t.jumlah) }}
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn btn-ghost btn-sm" @click="openModal(t)" title="Edit">✏️</button>
                  <button class="btn btn-danger btn-sm" @click="confirmDelete(t)" title="Hapus">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">{{ editingId ? 'Edit Transaksi' : 'Tambah Transaksi' }}</h2>
            <button class="btn btn-ghost btn-sm" @click="closeModal">✕</button>
          </div>
          <form class="modal-form" @submit.prevent="saveTransaction">
            <div class="form-row">
              <div class="form-group">
                <label>Tipe *</label>
                <select class="select" v-model="form.tipe" required>
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tanggal *</label>
                <input type="date" class="input" v-model="form.tanggal" required />
              </div>
            </div>
            <div class="form-group">
              <label>Kategori *</label>
              <select class="select" v-model="form.kategori" required>
                <optgroup label="Pemasukan" v-if="form.tipe === 'income'">
                  <option v-for="k in kategoriIncome" :key="k">{{ k }}</option>
                </optgroup>
                <optgroup label="Pengeluaran" v-if="form.tipe === 'expense'">
                  <option v-for="k in kategoriExpense" :key="k">{{ k }}</option>
                </optgroup>
              </select>
            </div>
            <div class="form-group">
              <label>Deskripsi *</label>
              <input class="input" v-model="form.deskripsi" placeholder="Masukkan keterangan..." required />
            </div>
            <div class="form-group">
              <label>Jumlah (Rp) *</label>
              <input type="number" class="input" v-model="form.jumlah" placeholder="0" min="1" required />
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-ghost" @click="closeModal">Batal</button>
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Transaksi') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirm Modal -->
    <Transition name="fade">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal" style="max-width:380px">
          <div style="text-align:center;padding:8px 0">
            <div style="font-size:48px;margin-bottom:12px">🗑️</div>
            <h3 style="font-family:var(--font-head);font-size:18px;margin-bottom:8px">Hapus Transaksi?</h3>
            <p style="color:var(--muted);font-size:13px;margin-bottom:24px">Tindakan ini tidak dapat dibatalkan.</p>
            <div style="display:flex;gap:10px;justify-content:center">
              <button class="btn btn-ghost" @click="showDeleteModal = false">Batal</button>
              <button class="btn btn-danger" @click="deleteItem" :disabled="deleting">
                {{ deleting ? 'Menghapus...' : 'Ya, Hapus' }}
              </button>
            </div>
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
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    opts.push({ value: val, label: d.toLocaleDateString('id-ID', { month:'long', year:'numeric' }) })
  }
  return opts
})

const kategoriIncome = ['Gaji', 'Freelance', 'Investasi', 'Bonus', 'Hadiah', 'Lainnya']
const kategoriExpense = ['Makan & Minum', 'Transportasi', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Pendidikan', 'Tabungan', 'Lainnya']

const form = ref({ tipe: 'expense', tanggal: new Date().toISOString().split('T')[0], kategori: '', deskripsi: '', jumlah: '' })

watch(() => form.value.tipe, (v) => { form.value.kategori = '' })

const filteredTransactions = computed(() => {
  return transactions.value.filter(t => {
    const matchSearch = !search.value || t.deskripsi.toLowerCase().includes(search.value.toLowerCase())
    const matchTipe = !filterTipe.value || t.tipe === filterTipe.value
    const matchMonth = !filterMonth.value || t.tanggal?.startsWith(filterMonth.value)
    return matchSearch && matchTipe && matchMonth
  })
})

const formatRupiah = (v) => new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(v || 0)
const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })

const loadTransactions = async () => {
  loading.value = true
  try {
    const res = await getTransactions()
    transactions.value = res.data.data || res.data
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

const openModal = (t = null) => {
  if (t) {
    editingId.value = t.id
    form.value = { tipe: t.tipe, tanggal: t.tanggal?.split('T')[0], kategori: t.kategori, deskripsi: t.deskripsi, jumlah: t.jumlah }
  } else {
    editingId.value = null
    form.value = { tipe: 'expense', tanggal: new Date().toISOString().split('T')[0], kategori: '', deskripsi: '', jumlah: '' }
  }
  showModal.value = true
}

const closeModal = () => { showModal.value = false }

const saveTransaction = async () => {
  saving.value = true
  try {
    if (editingId.value) {
      await updateTransaction(editingId.value, form.value)
    } else {
      await createTransaction(form.value)
    }
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
.transactions-page { padding:32px; max-width:1100px; }
.page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
.page-title { font-family:var(--font-head); font-size:26px; font-weight:800; }
.page-sub { color:var(--muted); font-size:13px; margin-top:2px; }

.filters-bar { margin-bottom:20px; }
.filters-inner { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px; }
.filter-summary { font-size:12px; color:var(--muted); }

.table-wrap { overflow-x:auto; }
.empty-state { text-align:center; color:var(--muted); padding:60px 0; }
.kategori-chip { background:var(--bg3); color:var(--muted2); padding:3px 9px; border-radius:6px; font-size:12px; }
.amount-income  { color:var(--green); font-weight:600; }
.amount-expense { color:var(--red);   font-weight:600; }
.desc-cell { max-width:220px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.action-btns { display:flex; gap:6px; justify-content:center; }

.modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
.modal-title { font-family:var(--font-head); font-size:18px; font-weight:700; }
.modal-form { display:flex; flex-direction:column; gap:16px; }
.form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.form-actions { display:flex; gap:10px; justify-content:flex-end; padding-top:8px; }
</style>
