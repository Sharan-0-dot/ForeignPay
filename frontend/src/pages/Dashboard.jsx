import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProfile, getPaymentHistory } from '../services/api'

const CATEGORY_COLORS = {
  Food: 'bg-orange-100 text-orange-700',
  Transport: 'bg-blue-100 text-blue-700',
  Shopping: 'bg-purple-100 text-purple-700',
  Entertainment: 'bg-pink-100 text-pink-700',
  Other: 'bg-gray-100 text-gray-600'
}

export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [profileRes, txRes] = await Promise.all([
        getProfile(),
        getPaymentHistory().catch(() => ({ data: [] }))  // don't crash dashboard if history fails
      ])
      setProfile(profileRes.data)
      updateUser({
        walletBalance: profileRes.data.walletBalance,
        kycStatus: profileRes.data.kycStatus
      })
      // Backend may return array directly or wrapped in { transactions: [...] }
      const txData = txRes.data
      const txList = Array.isArray(txData)
        ? txData
        : txData.transactions || txData.payments || []
      setTransactions(txList.slice(0, 5))
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading dashboard…</div>
      </div>
    )
  }

  const kycStatus = profile?.kycStatus || user?.kycStatus
  const walletBalance = profile?.walletBalance ?? user?.walletBalance ?? 0
  const isApproved = kycStatus === 'APPROVED'

  const quickActions = [
    {
      icon: '📱',
      label: 'Scan & Pay',
      to: '/scan',
      disabled: !isApproved,
      color: 'bg-indigo-600 text-white hover:bg-indigo-700'
    },
    {
      icon: '💳',
      label: 'Top Up',
      to: '/topup',
      disabled: false,
      color: 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
    },
    {
      icon: '📊',
      label: 'Analytics',
      to: '/analytics',
      disabled: false,
      color: 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
    },
    {
      icon: '🤖',
      label: 'AI Companion',
      to: '/ai',
      disabled: false,
      color: 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Hey, {profile?.fullName?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's your wallet overview</p>
        </div>

        {/* KYC Banner — always shown when not APPROVED */}
        {kycStatus !== 'APPROVED' && (
          <div className={`rounded-2xl border p-4 mb-5 ${
            kycStatus === 'REJECTED' ? 'bg-red-50 border-red-200'
            : kycStatus === 'PENDING' ? 'bg-yellow-50 border-yellow-200'
            : 'bg-indigo-50 border-indigo-200'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl shrink-0">
                  {kycStatus === 'REJECTED' ? '❌' : kycStatus === 'PENDING' ? '⏳' : '🪪'}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${
                    kycStatus === 'REJECTED' ? 'text-red-800'
                    : kycStatus === 'PENDING' ? 'text-yellow-800'
                    : 'text-indigo-800'
                  }`}>
                    {kycStatus === 'REJECTED' ? 'KYC rejected — resubmit required'
                      : kycStatus === 'PENDING' ? 'KYC under review'
                      : 'Complete KYC to unlock payments'}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    kycStatus === 'REJECTED' ? 'text-red-600'
                    : kycStatus === 'PENDING' ? 'text-yellow-700'
                    : 'text-indigo-600'
                  }`}>
                    {kycStatus === 'REJECTED'
                      ? 'Your passport was rejected. Upload a clearer image to continue.'
                      : kycStatus === 'PENDING'
                      ? 'Our team is reviewing your passport. Usually takes a few hours.'
                      : 'Upload your passport photo to verify your identity.'}
                  </p>
                </div>
              </div>
              <Link
                to="/kyc"
                className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  kycStatus === 'REJECTED' ? 'bg-red-600 text-white hover:bg-red-700'
                  : kycStatus === 'PENDING' ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {kycStatus === 'REJECTED' ? 'Resubmit' : kycStatus === 'PENDING' ? 'View status' : 'Start KYC'}
              </Link>
            </div>
          </div>
        )}

        {/* Wallet Card */}
        <div className="bg-indigo-600 rounded-2xl p-6 mb-5 text-white relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />

          <div className="relative">
            <p className="text-indigo-200 text-sm font-medium mb-1">Wallet Balance</p>
            <p className="text-4xl font-bold">
              ₹{parseFloat(walletBalance).toFixed(2)}
            </p>
            <p className="text-indigo-300 text-xs mt-2">Indian Rupees • {profile?.currency || 'INR'}</p>
          </div>

          <div className="relative mt-6 flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-xs">Status</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${isApproved ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <p className="text-white text-sm font-medium">
                  {isApproved ? 'Verified' : kycStatus === 'PENDING' ? 'Pending KYC' : 'KYC Required'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-indigo-200 text-xs">Country</p>
              <p className="text-white text-sm font-medium mt-0.5">{profile?.country || '—'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => !action.disabled && navigate(action.to)}
              disabled={action.disabled}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all text-left font-medium text-sm
                ${action.color}
                ${action.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="text-xl">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 text-sm">Recent payments</h2>
            <Link to="/analytics" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>

          {transactions.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-3xl mb-2">💸</p>
              <p className="text-sm text-gray-500">No payments yet</p>
              <p className="text-xs text-gray-400 mt-1">
                {isApproved ? 'Scan a UPI QR code to make your first payment' : 'Complete KYC first'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <li key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                      🏪
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.merchantName || 'Merchant'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.Other}`}>
                          {tx.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">−₹{parseFloat(tx.amount).toFixed(2)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}