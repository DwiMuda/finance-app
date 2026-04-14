<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand-icon">₿</div>
      <h1>FinTrack</h1>
      <p>Masuk ke akun Anda</p>

      <form @submit.prevent="handleLogin">
        <input v-model="form.username" class="input" placeholder="Username" required />
        <input v-model="form.password" class="input" type="password" placeholder="Password" required />
        <p v-if="error" style="color:red;font-size:13px">{{ error }}</p>
        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Masuk...' : 'Masuk' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const form = ref({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, form.value)
    localStorage.setItem('token', res.data.token)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.message || 'Login gagal'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap { display:flex; justify-content:center; align-items:center; height:100vh; }
.login-card { background:var(--card); padding:40px; border-radius:16px; width:100%; max-width:360px; display:flex; flex-direction:column; gap:16px; text-align:center; }
.brand-icon { font-size:40px; }
.input { width:100%; margin-bottom:8px; }
.btn { width:100%; }
</style>