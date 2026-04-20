<template>
  <div v-if="isLoginPage" class="login-page">
    <RouterView />
  </div>
  <div v-else class="app-layout">
    <!-- Sidebar / Navigation -->
    <aside class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
      <div class="sidebar-brand">
        <div class="brand-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div class="brand-info">
          <div class="brand-name">FinTrack</div>
          <div class="brand-version">Premium v2.0</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink to="/dashboard" class="nav-item">
          <div class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></div>
          <span>Dashboard</span>
        </RouterLink>
        <RouterLink to="/transaksi" class="nav-item">
          <div class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
          <span>Transaksi</span>
        </RouterLink>
        <RouterLink to="/laporan" class="nav-item">
          <div class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg></div>
          <span>Analisis Laporan</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <!-- Connection Status Pill -->
        <div class="status-indicator" :class="{ connected: isConnected }">
          <div class="pulse-ring"></div>
          <div class="status-dot"></div>
          <span class="status-text">{{ isConnected ? 'Online' : 'Offline' }}</span>
        </div>
        <div class="user-mini-profile" v-if="userName">
          <div class="user-avatar">{{ userName[0] }}</div>
          <div class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">Administrator</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="main-wrapper">
      <div class="mobile-header">
        <div class="brand-logo sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div class="status-indicator sm" :class="{ connected: isConnected }">
          <div class="status-dot"></div>
        </div>
      </div>
      <div class="content-view">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'Login')
const isConnected = ref(false)
const isCollapsed = ref(false)
const userName = ref(localStorage.getItem('nama') || 'User')

let checkInterval = null

const checkConnection = async () => {
  try {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    // Gunakan endpoint /health yang benar
    const healthUrl = apiBase.replace('/api', '/health')
    await axios.get(healthUrl)
    isConnected.value = true
  } catch (e) {
    isConnected.value = false
  }
}

onMounted(() => {
  checkConnection()
  checkInterval = setInterval(checkConnection, 10000) // Check every 10s
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
})
</script>

<style>
/* Global Layout Variables */
:root {
  --sidebar-width: 280px;
  --sidebar-collapsed: 80px;
  --primary-color: #4f46e5;
  --bg-sidebar: #ffffff;
  --bg-main: #f9fafb;
}

.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: var(--bg-main);
  overflow: hidden;
}

/* Sidebar Styling */
.sidebar {
  width: var(--sidebar-width);
  background: var(--bg-sidebar);
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 32px 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 48px;
  padding-left: 8px;
}

.brand-logo {
  width: 44px;
  height: 44px;
  background: var(--primary-color);
  color: white;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
}

.brand-name {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: #111827;
}

.brand-version {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
}

/* Navigation */
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 14px;
  text-decoration: none;
  color: #6b7280;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-icon {
  width: 24px;
  display: flex;
  justify-content: center;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.nav-item.router-link-active {
  background: #eef2ff;
  color: var(--primary-color);
}

/* Footer & Status */
.sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid #f3f4f6;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 99px;
  width: fit-content;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
}

.status-indicator.connected {
  background: #ecfdf5;
  color: #059669;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc2626;
  position: relative;
  z-index: 2;
}

.status-indicator.connected .status-dot {
  background: #10b981;
}

.pulse-ring {
  position: absolute;
  left: 16px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(.33); opacity: 0.8; }
  80%, 100% { transform: scale(3); opacity: 0; }
}

.user-mini-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: #eef2ff;
  color: var(--primary-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
}

.user-name { font-size: 14px; font-weight: 800; color: #111827; }
.user-role { font-size: 11px; font-weight: 600; color: #9ca3af; }

/* Main Area */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-header {
  display: none;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  justify-content: space-between;
  align-items: center;
}

.content-view {
  flex: 1;
  overflow-y: auto;
  padding: 40px;
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    width: 80px;
    padding: 32px 12px;
  }
  .brand-info, .nav-item span, .status-text, .user-info {
    display: none;
  }
  .sidebar-brand, .sidebar-footer {
    justify-content: center;
    padding-left: 0;
  }
  .status-indicator {
    padding: 8px;
  }
  .pulse-ring { left: 8px; }
  .content-view { padding: 24px; }
}

@media (max-width: 640px) {
  .app-layout { flex-direction: column; }
  .sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 65px; /* Lebih pendek */
    flex-direction: row;
    padding: 0 10px;
    border-right: none;
    border-top: 1px solid #e5e7eb;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }
  .sidebar-brand, .sidebar-footer { display: none; }
  .sidebar-nav {
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    width: 100%;
  }
  .nav-item {
    flex-direction: column;
    gap: 2px;
    padding: 6px;
    font-size: 10px; /* Teks sangat kecil untuk HP */
    flex: 1;
    justify-content: center;
  }
  .nav-icon svg { width: 20px; height: 20px; }
  .mobile-header { display: flex; padding: 12px 16px; }
  .content-view { padding: 12px; }
}

@media (max-width: 360px) {
  .nav-item span { display: none; } /* Sembunyikan teks jika HP sangat kecil */
  .nav-icon { margin-bottom: 0; }
}
</style>
