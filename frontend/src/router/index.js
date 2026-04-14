import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Transactions from '../views/Transactions.vue'
import Laporan from '../views/Laporan.vue'
import Login from '../views/Login.vue'

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/transaksi', name: 'Transactions', component: Transactions },
  { path: '/laporan', name: 'Laporan', component: Laporan }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.name !== 'Login' && !token) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router