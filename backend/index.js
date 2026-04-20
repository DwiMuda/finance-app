require('dotenv').config();
const express = require('express');
const cors    = require('cors');

require('./config/database');
const transactionRoutes = require('./routes/transactionRoutes');
const authRoutes        = require('./routes/authRoutes');
const authMiddleware    = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'FinTrack API Server is Running',
    version: '2.0.0',
    status: 'online'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', authMiddleware, transactionRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} tidak ditemukan` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📋 Endpoints tersedia:`);
  console.log(`   GET    /api/transactions`);
  console.log(`   GET    /api/transactions/summary`);
  console.log(`   GET    /api/transactions/export`);
  console.log(`   POST   /api/transactions`);
  console.log(`   PUT    /api/transactions/:id`);
  console.log(`   DELETE /api/transactions/:id`);
});