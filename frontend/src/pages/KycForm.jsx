import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { submitKyc, getKycStatus } from '../services/api'

const STATUS_CONFIG = {
  PENDING: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: '⏳',
    title: 'Verification in progress',
    text: 'Our team is reviewing your passport. This usually takes a few hours.',
    textColor: 'text-yellow-800',
    action: { label: 'View status', to: '/kyc' }
  },
  APPROVED: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: '✅',
    title: 'KYC Approved',
    text: 'You are verified. You can now top up your wallet and make payments.',
    textColor: 'text-green-800'
  },
  REJECTED: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: '❌',
    title: 'KYC Rejected',
    text: null,
    textColor: 'text-red-800'
  }
}

export default function KycForm() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()

  const [status, setStatus] = useState(null)       // current KYC status from API
  const [latestApp, setLatestApp] = useState(null) // latest application details
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [passportNumber, setPassportNumber] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await getKycStatus()
      setStatus(res.data.kycStatus)
      setLatestApp(res.data.latestApplication)
    } catch {
      // If no application exists yet, status stays null
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (!selected) return
    setFile(selected)
    // Preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(selected)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select your passport image.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('passportNumber', passportNumber)
      formData.append('passportFile', file)

      await submitKyc(formData)
      setSuccess('KYC application submitted! Our team will review it shortly.')
      updateUser({ kycStatus: 'PENDING' })
      await fetchStatus()
      setPassportNumber('')
      setFile(null)
      setPreview(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    )
  }

  const config = status ? STATUS_CONFIG[status] : null

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-xl mx-auto pt-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-gray-500 text-sm mt-1">
            Verify your identity to unlock wallet top-up and payments.
          </p>
        </div>

        {/* Status banner */}
        {config && (
          <div className={`rounded-2xl border p-5 mb-6 ${config.bg} ${config.border}`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">{config.icon}</span>
              <div>
                <p className={`font-semibold ${config.textColor}`}>{config.title}</p>
                {config.text && (
                  <p className={`text-sm mt-1 ${config.textColor} opacity-80`}>{config.text}</p>
                )}
                {status === 'REJECTED' && latestApp?.adminRemarks && (
                  <p className="text-sm mt-1 text-red-700">
                    Reason: {latestApp.adminRemarks}
                  </p>
                )}
                {status === 'APPROVED' && (
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-3 text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Show form if not approved */}
        {status !== 'APPROVED' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8">
            <h2 className="font-semibold text-gray-900 mb-1">
              {status === 'REJECTED' ? 'Resubmit Application' : 'Submit Application'}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Upload a clear photo of your passport's data page.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport number</label>
                <input
                  type="text"
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value)}
                  placeholder="e.g. A1234567"
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-wide"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport image</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-300 transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {preview ? (
                    <img src={preview} alt="Passport preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                  ) : (
                    <div>
                      <p className="text-4xl mb-2">🪪</p>
                      <p className="text-sm text-gray-500">Click or drag your passport photo here</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                    </div>
                  )}
                </div>
                {file && (
                  <p className="text-xs text-gray-400 mt-1">{file.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit for verification'}
              </button>
            </form>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '📷', text: 'Clear photo' },
            { icon: '🔒', text: 'Encrypted storage' },
            { icon: '⚡', text: 'Quick review' }
          ].map((item) => (
            <div key={item.text} className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-xs text-gray-500">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}