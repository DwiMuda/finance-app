<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo-circle">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <h1>Selamat Datang</h1>
        <p>Silakan masuk ke akun FinTrack Anda</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Username</label>
          <div class="input-with-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <input v-model="form.username" type="text" placeholder="Masukkan username" required />
          </div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="input-with-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input v-model="form.password" type="password" placeholder="••••••••" required />
          </div>
        </div>

        <div v-if="error" class="error-msg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ error }}
        </div>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? 'Memproses...' : 'Masuk Sekarang' }}
          <svg v-if="!loading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </form>

      <div class="login-footer">
        <p>&copy; 2024 FinTrack Premium</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    // Gunakan localhost:3000 jika env tidak tersedia untuk testing lokal
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    const res = await axios.post(`${apiBase}/auth/login`, form.value)
    
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('nama', res.data.nama)
    
    // Gunakan replace agar history tidak menumpuk
    window.location.replace('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.message || 'Gagal terhubung ke server. Pastikan backend jalan.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02);
  border: 1px solid #f3f4f6;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo-circle {
  width: 64px;
  height: 64px;
  background: #4f46e5;
  color: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
}

.login-header h1 {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.02em;
}

.login-header p {
  color: #6b7280;
  font-size: 14px;
  margin-top: 6px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-icon svg {
  position: absolute;
  left: 14px;
  color: #9ca3af;
}

.input-with-icon input {
  width: 100%;
  padding: 12px 14px 12px 42px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  outline: none;
}

.input-with-icon input:focus {
  background: white;
  border-color: #4f46e5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
}

.btn-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-login:hover {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.2);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.login-footer {
  margin-top: 32px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

@media (max-width: 480px) {
  .login-box {
    padding: 30px 20px;
    border: none;
    box-shadow: none;
    background: transparent;
  }
}
</style>
