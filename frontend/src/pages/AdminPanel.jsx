import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPendingKyc, approveKyc, rejectKyc } from '../services/api'

export default function AdminPanel() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)  // id of app being actioned
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // Per-application remarks state
  const [remarks, setRemarks] = useState({})
  // Which application's passport image is being shown (id | null)
  const [viewingPassport, setViewingPassport] = useState(null)

  useEffect(() => {
    fetchPending()
  }, [])

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await getPendingKyc()
      // Backend returns the list directly (not wrapped in { applications: [...] })
      const data = res.data
      setApplications(Array.isArray(data) ? data : data.applications || [])
    } catch (err) {
      setError('Failed to load applications. ' + (err.response?.data?.message || ''))
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleApprove = async (id) => {
    setActionLoading(id)
    try {
      await approveKyc(id, remarks[id] || '')
      setApplications((prev) => prev.filter((a) => (a.applicationId || a.id) !== id))
      showToast('✅ KYC approved successfully')
    } catch (err) {
      setError('Failed to approve: ' + (err.response?.data?.message || 'Unknown error'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id) => {
    if (!remarks[id]?.trim()) {
      setError('Please enter rejection reason before rejecting.')
      return
    }
    setActionLoading(id)
    try {
      await rejectKyc(id, remarks[id])
      setApplications((prev) => prev.filter((a) => (a.applicationId || a.id) !== id))
      showToast('❌ KYC rejected')
    } catch (err) {
      setError('Failed to reject: ' + (err.response?.data?.message || 'Unknown error'))
    } finally {
      setActionLoading(null)
    }
  }

  const passportBeingViewed = viewingPassport
    ? applications.find((a) => (a.applicationId || a.id) === viewingPassport)
    : null

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-xl z-50 shadow-lg">
          {toast}
        </div>
      )}

      {/* Passport modal */}
      {passportBeingViewed && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingPassport(null)}
        >
          <div
            className="bg-white rounded-2xl p-4 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900">{passportBeingViewed.userFullName}</p>
                <p className="text-sm text-gray-400 font-mono">{passportBeingViewed.passportNumber}</p>
              </div>
              <button
                onClick={() => setViewingPassport(null)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <img
              src={passportBeingViewed.passportImageUrl}
              alt="Passport"
              className="w-full rounded-xl object-contain max-h-80"
            />
            <a
              href={passportBeingViewed.passportImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center text-xs text-indigo-600 hover:underline"
            >
              Open full resolution ↗
            </a>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KYC Review Queue</h1>
            <p className="text-gray-500 text-sm mt-1">
              {loading ? 'Loading…' : `${applications.length} application${applications.length !== 1 ? 's' : ''} pending review`}
            </p>
          </div>
          <button
            onClick={fetchPending}
            className="text-sm border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading applications…</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-semibold text-gray-700">All caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No pending KYC applications at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.applicationId || app.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Application header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                      {app.userFullName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{app.userFullName}</p>
                      <p className="text-sm text-gray-400">{app.userEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Submitted</p>
                    <p className="text-sm text-gray-600">
                      {new Date(app.submittedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Application body */}
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Passport details */}
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Passport Number</p>
                      <p className="font-mono text-sm font-medium text-gray-900 tracking-wide">
                        {app.passportNumber}
                      </p>
                    </div>
                    {/* Application ID */}
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Application ID</p>
                      <p className="text-sm text-gray-500">#{app.applicationId || app.id}</p>
                    </div>
                  </div>

                  {/* Passport preview */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-400 mb-2">Passport Image</p>
                    <div className="relative group">
                      <img
                        src={app.passportImageUrl}
                        alt="Passport"
                        className="w-full h-32 object-cover rounded-xl cursor-pointer border border-gray-100"
                        onClick={() => setViewingPassport(app.applicationId || app.id)}
                      />
                      <div
                        className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        onClick={() => setViewingPassport(app.applicationId || app.id)}
                      >
                        <span className="text-white text-sm font-medium">Click to expand</span>
                      </div>
                    </div>
                  </div>

                  {/* Remarks input */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1">
                      Remarks <span className="text-gray-300">(required for rejection)</span>
                    </label>
                    <textarea
                      value={remarks[app.applicationId || app.id] || ''}
                      onChange={(e) => {
                        const appId = app.applicationId || app.id
                        setRemarks((prev) => ({ ...prev, [appId]: e.target.value }))
                      }}
                      placeholder="e.g. All good, or explain the rejection reason…"
                      rows={2}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(app.applicationId || app.id)}
                      disabled={actionLoading === (app.applicationId || app.id)}
                      className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === (app.applicationId || app.id) ? (
                        <span>Processing…</span>
                      ) : (
                        <><span>✓</span> Approve</>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(app.applicationId || app.id)}
                      disabled={actionLoading === (app.applicationId || app.id)}
                      className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                    >
                      {actionLoading === (app.applicationId || app.id) ? (
                        <span>Processing…</span>
                      ) : (
                        <><span>✕</span> Reject</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}