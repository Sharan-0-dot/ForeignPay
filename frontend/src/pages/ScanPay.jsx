import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { initiatePayment } from '../services/api'
import { BrowserQRCodeReader } from '@zxing/library'

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Other']

const CATEGORY_ICONS = {
  Food: '🍜',
  Transport: '🚌',
  Shopping: '🛍️',
  Entertainment: '🎭',
  Other: '💼'
}

export default function ScanPay() {
  const { user, updateUser } = useAuth()

  // Step: 'scan' | 'confirm' | 'processing' | 'success' | 'error'
  const [step, setStep] = useState('scan')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')

  // QR data
  const [merchantUpiId, setMerchantUpiId] = useState('')
  const [merchantName, setMerchantName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')

  // Result
  const [utr, setUtr] = useState('')
  const [remainingBalance, setRemainingBalance] = useState(null)

  const codeReaderRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    return () => {
      // Clean up scanner on unmount
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
    }
  }, [])

  const startScanner = async () => {
    setError('')
    setScanning(true)
    try {
      const codeReader = new BrowserQRCodeReader()
      codeReaderRef.current = codeReader

      await codeReader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
        if (result) {
          const qrText = result.getText()
          parseQrCode(qrText)
          codeReader.reset()
          setScanning(false)
        }
        // err can fire frequently (no QR in frame) — ignore
      })
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions and try again.')
      setScanning(false)
    }
  }

  const stopScanner = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    setScanning(false)
  }

  const parseQrCode = (qrText) => {
    try {
      // UPI format: upi://pay?pa=merchant@okaxis&pn=Merchant+Name&am=150&cu=INR
      const cleaned = qrText.replace('upi://pay?', '')
      const params = new URLSearchParams(cleaned)
      const pa = params.get('pa') || ''
      const pn = params.get('pn') || 'Merchant'
      const am = params.get('am') || ''

      if (!pa) {
        setError('Invalid QR code. Please scan a valid UPI QR code.')
        return
      }

      setMerchantUpiId(pa)
      setMerchantName(decodeURIComponent(pn.replace(/\+/g, ' ')))
      setAmount(am)
      setStep('confirm')
    } catch {
      setError('Could not read QR code. Please try again.')
    }
  }

  // Manual entry fallback
  const handleManualEntry = () => {
    setMerchantUpiId('demo@okaxis')
    setMerchantName('Demo Merchant')
    setAmount('50')
    setStep('confirm')
  }

  const handlePay = async () => {
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount.')
      return
    }
    if (parsedAmount > parseFloat(user?.walletBalance || 0)) {
      setError(`Insufficient balance. Your wallet has ₹${parseFloat(user?.walletBalance || 0).toFixed(2)}`)
      return
    }
    // Move to review/confirmation step before actually paying
    setError('')
    setStep('review')
  }

  const confirmAndPay = async () => {
    setStep('processing')
    try {
      const res = await initiatePayment({
        merchantUpiId,
        merchantName,
        amount: parseFloat(amount),
        category
      })
      const data = res.data
      setUtr(data.utr)
      setRemainingBalance(data.remainingBalance)
      updateUser({ walletBalance: data.remainingBalance })
      setStep('success')
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment failed. Please try again.'
      setError(msg)
      setStep('error')
    }
  }

  const reset = () => {
    setStep('scan')
    setMerchantUpiId('')
    setMerchantName('')
    setAmount('')
    setCategory('Food')
    setUtr('')
    setRemainingBalance(null)
    setError('')
    setScanning(false)
  }

  // ── REVIEW SCREEN — final confirmation before money moves ─────────────
  if (step === 'review') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💸</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Confirm Payment</h2>
            <p className="text-gray-400 text-sm mt-1">Please review before confirming</p>
          </div>

          {/* Payment summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Paying to</span>
              <span className="font-semibold text-gray-900">{merchantName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">UPI ID</span>
              <span className="text-gray-500 font-mono text-xs">{merchantUpiId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Category</span>
              <span className="text-gray-700">{CATEGORY_ICONS[category]} {category}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-indigo-600">₹{parseFloat(amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Balance after */}
          <div className="flex justify-between text-xs text-gray-400 mb-6 px-1">
            <span>Current balance: ₹{parseFloat(user?.walletBalance || 0).toFixed(2)}</span>
            <span>After: ₹{(parseFloat(user?.walletBalance || 0) - parseFloat(amount)).toFixed(2)}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:border-gray-300 transition-colors"
            >
              ← Edit
            </button>
            <button
              onClick={confirmAndPay}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              Pay Now
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SUCCESS SCREEN ────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Payment Successful!</h2>
          <p className="text-gray-500 text-sm mb-6">Your payment has been processed.</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Paid to</span>
              <span className="font-medium text-gray-900">{merchantName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-semibold text-red-600">−₹{parseFloat(amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Category</span>
              <span className="text-gray-700">{CATEGORY_ICONS[category]} {category}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
              <span className="text-gray-500">Remaining balance</span>
              <span className="font-semibold text-gray-900">₹{parseFloat(remainingBalance).toFixed(2)}</span>
            </div>
          </div>

          {/* UTR reference */}
          <div className="bg-indigo-50 rounded-xl p-3 mb-6">
            <p className="text-xs text-indigo-500 mb-1">UPI Transaction Reference</p>
            <p className="font-mono text-sm font-bold text-indigo-800 tracking-wider">{utr}</p>
          </div>

          <button
            onClick={reset}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Make another payment
          </button>
        </div>
      </div>
    )
  }

  // ── PROCESSING SCREEN ─────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-3xl">💸</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Processing payment…</h2>
          <p className="text-gray-500 text-sm">Sending ₹{parseFloat(amount).toFixed(2)} to {merchantName}</p>
          <div className="mt-4 flex items-center justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── CONFIRM SCREEN ────────────────────────────────────────────────────
  if (step === 'confirm' || step === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={reset} className="text-gray-400 hover:text-gray-700">
              ← Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">Confirm Payment</h1>
          </div>

          {/* Merchant info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                🏪
              </div>
              <div>
                <p className="font-semibold text-gray-900">{merchantName}</p>
                <p className="text-sm text-gray-400 font-mono">{merchantUpiId}</p>
              </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {user?.walletBalance && (
                <p className="text-xs text-gray-400 mt-1">
                  Available: ₹{parseFloat(user.walletBalance).toFixed(2)}
                </p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all
                      ${category === cat
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-300'
                      }`}
                  >
                    <span>{CATEGORY_ICONS[cat]}</span>
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Pay button */}
          <button
            onClick={handlePay}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Pay ₹{amount ? parseFloat(amount).toFixed(2) : '0.00'}
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            Payment will be deducted from your ForeignPay wallet
          </p>
        </div>
      </div>
    )
  }

  // ── SCAN SCREEN ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Scan & Pay</h1>
          <p className="text-gray-500 text-sm mt-1">Point camera at any UPI QR code in India.</p>
        </div>

        {/* Balance chip */}
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-lg">
            Balance: ₹{parseFloat(user?.walletBalance || 0).toFixed(2)}
          </div>
          {user?.kycStatus !== 'APPROVED' && (
            <div className="bg-yellow-50 text-yellow-700 text-xs px-3 py-1.5 rounded-lg border border-yellow-200">
              KYC required to pay
            </div>
          )}
        </div>

        {/* Camera viewfinder */}
        <div className="bg-black rounded-2xl overflow-hidden mb-4 relative" style={{ aspectRatio: '1' }}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ display: scanning ? 'block' : 'none' }}
          />

          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <div className="text-6xl mb-4">📷</div>
              <p className="text-white text-sm opacity-70">Camera preview will appear here</p>
            </div>
          )}

          {/* Scanning overlay — corner guides */}
          {scanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-8 border-2 border-white/40 rounded-lg">
                {/* Corner decorations */}
                {[
                  'top-0 left-0 border-t-2 border-l-2',
                  'top-0 right-0 border-t-2 border-r-2',
                  'bottom-0 left-0 border-b-2 border-l-2',
                  'bottom-0 right-0 border-b-2 border-r-2'
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-6 h-6 border-white rounded-sm ${cls}`} />
                ))}
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-white text-xs bg-black/50 px-3 py-1 rounded-full">
                  Scanning for QR code…
                </span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* Controls */}
        {!scanning ? (
          <div className="space-y-3">
            <button
              onClick={startScanner}
              disabled={user?.kycStatus !== 'APPROVED'}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <span>📷</span> Start Camera
            </button>
            <button
              onClick={handleManualEntry}
              disabled={user?.kycStatus !== 'APPROVED'}
              className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Use demo QR (for testing)
            </button>
          </div>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:border-red-300 hover:text-red-600 transition-colors"
          >
            Cancel Scanning
          </button>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-white rounded-xl border border-gray-100">
          <p className="text-xs font-medium text-gray-700 mb-2">Supported QR formats</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Any UPI QR code — PhonePe, GPay, Paytm, BHIM, or merchant-generated codes. Look for the UPI logo or QR code at any payment counter.
          </p>
        </div>

      </div>
    </div>
  )
}