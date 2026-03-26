import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import Transactions from '../views/Transactions.vue'
import Laporan from '../views/Laporan.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/transaksi', name: 'Transactions', component: Transactions },
  { path: '/laporan', name: 'Laporan', component: Laporan }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
