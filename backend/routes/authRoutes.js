const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const USERS = [
  { id: 1, username: 'admin1', password: 'Admin1@2024', nama: 'Keuangan 1' },
  { id: 2, username: 'admin2', password: 'Admin2@2024', nama: 'Keuangan 2' },
  { id: 3, username: 'admin3', password: 'Admin3@2024', nama: 'Keuangan 3' },
  { id: 4, username: 'admin4', password: 'Admin4@2024', nama: 'Keuangan 4' },
];

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Username atau password salah' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, nama: user.nama },
    process.env.JWT_SECRET || 'secret123',
    { expiresIn: '7d' }
  );

  res.json({ success: true, token, nama: user.nama });
});

module.exports = router;