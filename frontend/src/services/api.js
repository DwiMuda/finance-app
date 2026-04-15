import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

const parseMonth = (month) => {
  if (!month) return {}
  const [tahun, bulan] = month.split('-')
  return { bulan: parseInt(bulan), tahun: parseInt(tahun) }
}

export const getTransactions = (params = {}) => {
  const { month, limit, ...rest } = params
  return api.get('/transactions', { params: { ...parseMonth(month), limit, ...rest } })
}

export const createTransaction = (data) => api.post('/transactions', data)
export const updateTransaction  = (id, data) => api.put(`/transactions/${id}`, data)
export const deleteTransaction  = (id) => api.delete(`/transactions/${id}`)

export const getSummary = async (params = {}) => {
  const { month } = params
  const res = await api.get('/transactions/summary', { params: parseMonth(month) })
  const d = res.data.data || res.data
  return {
    data: {
      totalIncome:   d.total_income  || d.totalIncome  || 0,
      totalExpense:  d.total_expense || d.totalExpense  || 0,
      saldo:         d.saldo         || 0,
      incomeCount:   d.income_count  || d.incomeCount   || 0,
      expenseCount:  d.expense_count || d.expenseCount  || 0,
    }
  }
}

export const exportExcel = async (params = {}) => {
  const { month } = params
  const response = await api.get('/transactions/export', {
    params: parseMonth(month),
    responseType: 'blob'
  })
  const url  = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href  = url
  link.setAttribute('download', `laporan-keuangan-${params.month || 'semua'}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export default api