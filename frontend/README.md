# FinTrack - Frontend Vue.js

## Cara Menjalankan

### 1. Install dependencies
```bash
npm install
```

### 2. Buat file .env
```bash
cp .env.example .env
```
Edit `.env` dan sesuaikan URL backend:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Jalankan development server
```bash
npm run dev
```
Akses di: http://localhost:3000

### 4. Build untuk production
```bash
npm run build
```

---

## Struktur Folder

```
frontend/
├── src/
│   ├── App.vue              # Layout utama (sidebar + routing)
│   ├── main.js              # Entry point
│   ├── style.css            # Global CSS design system
│   ├── router/
│   │   └── index.js         # Vue Router (3 halaman)
│   ├── services/
│   │   └── api.js           # Semua panggilan ke backend API
│   └── views/
│       ├── Dashboard.vue    # Ringkasan + transaksi terbaru
│       ├── Transactions.vue # CRUD transaksi lengkap
│       └── Laporan.vue      # Laporan bulanan + export Excel
├── .env                     # Konfigurasi URL backend
├── .env.example
└── vite.config.js           # Konfigurasi Vite + proxy
```

---

## Koneksi ke Backend

Frontend memanggil endpoint berikut dari backend:

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| GET | /api/transactions | Ambil semua transaksi (support ?month=&limit=) |
| POST | /api/transactions | Tambah transaksi baru |
| PUT | /api/transactions/:id | Edit transaksi |
| DELETE | /api/transactions/:id | Hapus transaksi |
| GET | /api/transactions/summary | Ringkasan (totalIncome, totalExpense, saldo) |
| GET | /api/transactions/export | Download file Excel |

---

## Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variable di Vercel dashboard:
# VITE_API_URL = https://your-backend.railway.app/api
```

Atau drag & drop folder `dist/` ke https://vercel.com/new

---

## Deploy ke Netlify

```bash
npm run build
# Upload folder dist/ ke Netlify
```

Tambahkan file `public/_redirects`:
```
/* /index.html 200
```
