require('dotenv').config();
const express = require('express');
const cors    = require('cors');

require('./config/database');
const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes        = require('./routes/authRoutes');
const authMiddleware    = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

// 1. CORS dulu
app.use(cors({
  origin: [
    'https://finance-app-hcrr-9k06kc2e6-dwimudas-projects.vercel.app',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// 2. Body parser — HARUS sebelum routes
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 3. Routes
app.get('/health', (req, res) => res.json({ status: 'ok' }))
app.get('/', (req, res) => res.json({ success: true, message: 'FinTrack API Running' }))

app.use('/api/auth', authRoutes)
app.use('/api/transactions', authMiddleware, transactionRoutes)

app.use(cors({
  origin: [
    'https://finance-app-hcrr-9k06kc2e6-dwimudas-projects.vercel.app',
    'https://finance-app-hcrr.vercel.app',  // ← tambah ini
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

// 4. Error handlers
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} tidak ditemukan` })
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ success: false, message: 'Internal server error', debug: err.message })
})

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`)
})