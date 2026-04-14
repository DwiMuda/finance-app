const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Akun hardcode
const USER = {
  username: 'admin',
  password: 'password123' // ganti sesuai keinginan
};

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username !== USER.username || password !== USER.password) {
    return res.status(401).json({ success: false, message: 'Username atau password salah' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
  res.json({ success: true, token });
});

module.exports = router;