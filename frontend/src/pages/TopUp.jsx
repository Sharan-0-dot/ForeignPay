import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createTopupOrder, verifyTopup } from '../services/api'

const PRESET_AMOUNTS = [10, 20, 50, 100]

export default function TopUp() {
  const { user, updateUser } = useAuth()

  // Block top-up entirely until KYC is approved
  if (user?.kycStatus !== 'APPROVED') {
    const isRejected = user?.kycStatus === 'REJECTED'
    const isPending = user?.kycStatus === 'PENDING'
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-10 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">{isRejected ? '❌' : isPending ? '⏳' : '🪪'}</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isRejected ? 'KYC Rejected' : isPending ? 'KYC Pending' : 'KYC Required'}
          </h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            {isRejected
              ? 'Your KYC was rejected. Please resubmit with a clearer passport image before topping up.'
              : isPending
              ? 'Your passport is being reviewed. You can top up your wallet once our team approves your KYC.'
              : 'You need to complete identity verification before you can add money to your wallet.'}
          </p>
          <Link
            to="/kyc"
            className="inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            {isRejected ? 'Resubmit KYC' : isPending ? 'View KYC Status' : 'Complete KYC'}
          </Link>
        </div>
      </div>
    )
  }

  const [amountUsd, setAmountUsd] = useState('')
  const [preview, setPreview] = useState(null)   // { amountInr, previewCredited }
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('form')        // 'form' | 'success'
  const [successData, setSuccessData] = useState(null)
  const [error, setError] = useState('')

  const handleAmountChange = (val) => {
    setAmountUsd(val)
    setError('')
    // Rough preview: 84 INR per USD, 2% commission
    if (val && parseFloat(val) > 0) {
      const inr = parseFloat(val) * 84
      const credited = inr * 0.98
      setPreview({ amountInr: inr.toFixed(2), previewCredited: credited.toFixed(2) })
    } else {
      setPreview(null)
    }
  }

  const handleTopUp = async () => {
    const amount = parseFloat(amountUsd)
    if (!amount || amount < 1) {
      setError('Please enter a valid amount (minimum $1)')
      return
    }
    if (amount > 10000) {
      setError('Maximum top-up is $10,000 per transaction')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Step 1: Create Razorpay order via Spring Boot
      const orderRes = await createTopupOrder(amount)
      const { orderId, amountInPaise, currency, previewCredited } = orderRes.data

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: amountInPaise,
        currency: currency || 'INR',
        order_id: orderId,
        name: 'ForeignPay',
        description: `Wallet Top-up — $${amount}`,
        prefill: {
          email: user?.email || ''
        },
        handler: async function (response) {
          // Step 3: Verify payment with Spring Boot
          try {
            const verifyRes = await verifyTopup({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amountUsd: amount
            })
            const data = verifyRes.data
            setSuccessData({
              creditedInr: data.creditedInr,
              newBalance: data.newBalance,
              transactionId: data.transactionId
            })
            updateUser({ walletBalance: data.newBalance })
            setStep('success')
          } catch (verifyErr) {
            setError('Payment verification failed. Contact support if amount was deducted.')
          }
          setLoading(false)
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          }
        },
        theme: { color: '#6366f1' }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again.')
        setLoading(false)
      })
      rzp.open()

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate top-up. Try again.')
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Wallet Topped Up!</h2>
          <p className="text-gray-500 text-sm mb-6">Your balance has been updated instantly.</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount credited</span>
              <span className="font-semibold text-green-600">+₹{parseFloat(successData.creditedInr).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">New balance</span>
              <span className="font-semibold text-gray-900">₹{parseFloat(successData.newBalance).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transaction ID</span>
              <span className="text-gray-400 text-xs">#{successData.transactionId}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('form'); setAmountUsd(''); setPreview(null) }}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:border-gray-300 transition-colors"
            >
              Top up again
            </button>
            <button
              onClick={() => window.location.href = '/scan'}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm hover:bg-indigo-700 transition-colors"
            >
              Scan & Pay
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto pt-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Top Up Wallet</h1>
          <p className="text-gray-500 text-sm mt-1">Add INR to your wallet using an international card.</p>
        </div>

        {/* Current balance */}
        <div className="bg-indigo-50 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-indigo-500 text-xs font-medium">Current Balance</p>
            <p className="text-indigo-900 text-xl font-bold mt-0.5">
              ₹{parseFloat(user?.walletBalance || 0).toFixed(2)}
            </p>
          </div>
          <div className="text-3xl">👛</div>
        </div>

        {/* Amount input */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Amount in USD</label>

          {/* Preset buttons */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                onClick={() => handleAmountChange(String(amt))}
                className={`py-2 text-sm rounded-lg border transition-colors font-medium
                  ${amountUsd == amt
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
              >
                ${amt}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            <input
              type="number"
              value={amountUsd}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Custom amount"
              min="1"
              max="10000"
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Live INR preview */}
          {preview && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount in INR</span>
                <span className="text-gray-700">≈ ₹{preview.amountInr}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform fee (2%)</span>
                <span className="text-gray-500">−₹{(parseFloat(preview.amountInr) * 0.02).toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-gray-700">You get</span>
                <span className="text-green-600">₹{preview.previewCredited}</span>
              </div>
              <p className="text-xs text-gray-400">* Final amount depends on live exchange rate</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Pay button */}
        <button
          onClick={handleTopUp}
          disabled={loading || !amountUsd}
          className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing…
            </>
          ) : (
            <>💳 Pay with Razorpay</>
          )}
        </button>

        {/* Info */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '🔒', text: 'Secure payment' },
            { icon: '⚡', text: 'Instant credit' },
            { icon: '💱', text: 'Live FX rate' }
          ].map((item) => (
            <div key={item.text} className="bg-white rounded-xl p-3 border border-gray-100">
              <div className="text-lg mb-1">{item.icon}</div>
              <p className="text-xs text-gray-500">{item.text}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}