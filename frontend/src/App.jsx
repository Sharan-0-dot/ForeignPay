import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Navbar from './components/Navbar'

import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import KycForm from './pages/KycForm'
import Dashboard from './pages/Dashboard'
import TopUp from './pages/TopUp'
import ScanPay from './pages/ScanPay'
import Analytics from './pages/Analytics'
import AiCompanion from './pages/AiCompanion'
import AdminPanel from './pages/AdminPanel'

function AppRoutes() {
  const { token, user } = useAuth()

  return (
    <>
      {/* Show navbar on all pages except landing, login, register */}
      {token && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route path="/kyc" element={<ProtectedRoute><KycForm /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/topup" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
        <Route path="/scan" element={<ProtectedRoute><ScanPay /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/ai" element={<ProtectedRoute><AiCompanion /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}