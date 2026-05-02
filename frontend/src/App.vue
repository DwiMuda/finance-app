<template>
  <div v-if="isLoginPage" class="login-page">
    <RouterView />
  </div>
  <div v-else class="app-layout">
    <!-- Sidebar / Navigation -->
    <aside class="sidebar glass-panel" :class="{ 'is-collapsed': isCollapsed }">
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
      <div class="mobile-header glass-panel">
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
    const healthUrl = apiBase.replace('/api', '/health')
    await axios.get(healthUrl)
    isConnected.value = true
  } catch (e) {
    isConnected.value = false
  }
}

onMounted(() => {
  checkConnection()
  checkInterval = setInterval(checkConnection, 10000)
})

onUnmounted(() => {
  if (checkInterval) clearInterval(checkInterval)
})
</script>

<style>
:root {
  --sidebar-width: 280px;
}

.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: transparent;
  overflow: hidden;
}

/* Glassmorphism Panel Utilities */
.glass-panel {
  background: var(--bg-card);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  border-right: 1px solid var(--border);
}

/* Sidebar Styling */
.sidebar {
  width: var(--sidebar-width);
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
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-glow);
}

.brand-logo.sm {
  width: 32px;
  height: 32px;
  border-radius: 10px;
}

.brand-name {
  font-family: 'Satoshi', sans-serif;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--text-main);
}

.brand-version {
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  padding: 14px 16px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-icon {
  width: 24px;
  display: flex;
  justify-content: center;
  transition: transform 0.3s ease;
}

.nav-item:hover {
  background: var(--bg-card-hover);
  color: var(--text-main);
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-item.router-link-active {
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 700;
}
.nav-item.router-link-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 60%;
  width: 4px;
  background: var(--primary);
  border-radius: 0 4px 4px 0;
  box-shadow: 0 0 10px var(--primary);
}

/* Footer & Status */
.sidebar-footer {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: var(--danger-bg);
  color: var(--danger);
  border-radius: 99px;
  width: fit-content;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  border: 1px solid rgba(244, 63, 94, 0.2);
}

.status-indicator.connected {
  background: var(--success-bg);
  color: var(--success);
  border-color: rgba(16, 185, 129, 0.2);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  position: relative;
  z-index: 2;
  box-shadow: 0 0 10px var(--danger);
}

.status-indicator.connected .status-dot {
  background: var(--success);
  box-shadow: 0 0 10px var(--success);
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
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-main);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Satoshi', sans-serif;
  font-weight: 800;
  font-size: 16px;
}

.user-name { font-size: 14px; font-weight: 700; color: var(--text-main); }
.user-role { font-size: 12px; font-weight: 500; color: var(--text-muted); }

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
  border-bottom: 1px solid var(--border);
  justify-content: space-between;
  align-items: center;
  z-index: 90;
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
    bottom: 16px;
    left: 16px;
    right: 16px;
    width: auto;
    height: 65px;
    flex-direction: row;
    padding: 0 10px;
    border-radius: 20px;
    border: 1px solid var(--border);
    border-right: 1px solid var(--border); /* override */
    box-shadow: var(--shadow-glass);
    z-index: 100;
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
    gap: 4px;
    padding: 8px;
    font-size: 10px;
    flex: 1;
    justify-content: center;
    border-radius: 12px;
  }
  .nav-item.router-link-active {
    background: transparent;
  }
  .nav-item.router-link-active::before {
    display: none; /* No side border on mobile */
  }
  .nav-item.router-link-active .nav-icon {
    color: var(--primary);
    filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.6));
  }
  .nav-icon svg { width: 22px; height: 22px; }
  .mobile-header { display: flex; padding: 12px 16px; }
  .content-view { padding: 16px; padding-bottom: 100px; }
}

@media (max-width: 360px) {
  .nav-item span { display: none; }
}
</style>
