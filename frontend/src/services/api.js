import axios from 'axios'

const BASE = import.meta.env.VITE_SPRING_URL

// Auth header helper — reads fresh from localStorage each call
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// ─── Auth ──────────────────────────────────────────────────────────────
export const register = (data) =>
  axios.post(`${BASE}/api/auth/register`, data)

export const login = (data) =>
  axios.post(`${BASE}/api/auth/login`, data)

// ─── KYC ───────────────────────────────────────────────────────────────
export const submitKyc = (formData) =>
  axios.post(`${BASE}/api/kyc/apply`, formData, {
    headers: {
      ...authHeader().headers,
      'Content-Type': 'multipart/form-data'
    }
  })

export const getKycStatus = () =>
  axios.get(`${BASE}/api/kyc/status`, authHeader())

// ─── User ──────────────────────────────────────────────────────────────
export const getProfile = () =>
  axios.get(`${BASE}/api/user/profile`, authHeader())

// ─── Top-up ────────────────────────────────────────────────────────────
export const createTopupOrder = (amountUsd) =>
  axios.post(`${BASE}/api/topup/create-order`, { amountUsd }, authHeader())

export const verifyTopup = (data) =>
  axios.post(`${BASE}/api/topup/verify`, data, authHeader())

// ─── UPI Payment ───────────────────────────────────────────────────────
export const initiatePayment = (data) =>
  axios.post(`${BASE}/api/payment/initiate`, data, authHeader())

export const getPaymentHistory = () =>
  axios.get(`${BASE}/api/payment/history`, authHeader())

// ─── Analytics ─────────────────────────────────────────────────────────
export const getAnalyticsSummary = () =>
  axios.get(`${BASE}/api/analytics/summary`, authHeader())

export const getChartData = () =>
  axios.get(`${BASE}/api/analytics/charts`, authHeader())

// ─── AI Companion ──────────────────────────────────────────────────────
export const askCompanion = (message) =>
  axios.post(`${BASE}/api/ai/companion`, { message }, authHeader())

export const getInsights = () =>
  axios.get(`${BASE}/api/ai/insights`, authHeader())

// ─── Admin ─────────────────────────────────────────────────────────────
export const getPendingKyc = () =>
  axios.get(`${BASE}/api/admin/kyc/pending`, authHeader())

export const approveKyc = (id, remarks) =>
  axios.post(`${BASE}/api/admin/kyc/${id}/approve`, { remarks }, authHeader())

export const rejectKyc = (id, remarks) =>
  axios.post(`${BASE}/api/admin/kyc/${id}/reject`, { remarks }, authHeader())