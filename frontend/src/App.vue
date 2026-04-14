<template>
  <div v-if="isLoginPage" class="login-page">
    <RouterView />
  </div>
  <div v-else class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">₿</div>
        <div>
          <div class="brand-name">FinTrack</div>
          <div class="brand-sub">Manajemen Keuangan</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <RouterLink to="/dashboard" class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          Dashboard
        </RouterLink>
        <RouterLink to="/transaksi" class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Transaksi
        </RouterLink>
        <RouterLink to="/laporan" class="nav-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Laporan
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <div class="connection-dot" :class="{ connected: isConnected }"></div>
        <span>{{ isConnected ? 'Terhubung ke server' : 'Tidak terhubung' }}</span>
      </div>
    </aside>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'Login')
const isConnected = ref(false)

onMounted(async () => {
  if (isLoginPage.value) return
  try {
    const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    await axios.get(BASE.replace('/api', '/health'))
    isConnected.value = true
  }
  catch { isConnected.value = false }
})
</script>

<style scoped>
.login-page { height:100vh; background:var(--bg); }
.app-layout { display:flex; height:100vh; overflow:hidden; }
.sidebar { width:var(--sidebar-w); min-width:var(--sidebar-w); background:var(--bg2); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:24px 16px; gap:32px; }
.sidebar-brand { display:flex; align-items:center; gap:12px; padding:0 8px; }
.brand-icon { width:38px; height:38px; background:var(--green); color:#0d0f14; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; font-family:var(--font-head); font-weight:800; flex-shrink:0; }
.brand-name { font-family:var(--font-head); font-weight:800; font-size:17px; }
.brand-sub { font-size:10.5px; color:var(--muted); margin-top:-2px; }
.sidebar-nav { display:flex; flex-direction:column; gap:4px; flex:1; }
.nav-item { display:flex; align-items:center; gap:11px; padding:10px 14px; border-radius:var(--radius-sm); color:var(--muted2); text-decoration:none; font-size:13.5px; font-weight:500; transition:all var(--transition); }
.nav-item:hover { background:var(--bg3); color:var(--text); }
.nav-item.router-link-active { background:var(--green-dim); color:var(--green); border:1px solid #00e5a025; }
.sidebar-footer { display:flex; align-items:center; gap:8px; padding:0 8px; font-size:12px; color:var(--muted); }
.connection-dot { width:8px; height:8px; border-radius:50%; background:var(--muted); animation:pulse-dot 2s infinite; }
.connection-dot.connected { background:var(--green); }
@keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }
.main-content { flex:1; overflow-y:auto; background:var(--bg); }
</style>