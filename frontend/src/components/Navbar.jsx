import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) =>
    location.pathname === path
      ? 'text-indigo-600 font-medium'
      : 'text-gray-500 hover:text-gray-800'

  if (!user) return null

  const isAdmin = user.role === 'ADMIN'

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">FP</span>
          </div>
          <span className="font-semibold text-gray-900">ForeignPay</span>
        </Link>

        {/* Nav links — user only */}
        {!isAdmin && (
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <Link to="/dashboard" className={isActive('/dashboard')}>Dashboard</Link>
            <Link to="/kyc" className={`relative ${isActive('/kyc')}`}>
              KYC
              {/* Status dot */}
              {user?.kycStatus !== 'APPROVED' && (
                <span className={`absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full ${
                  user?.kycStatus === 'REJECTED' ? 'bg-red-500'
                  : user?.kycStatus === 'PENDING' ? 'bg-yellow-500'
                  : 'bg-indigo-500'
                }`} />
              )}
            </Link>
            <Link to="/scan" className={isActive('/scan')}>Scan & Pay</Link>
            <Link to="/topup" className={isActive('/topup')}>Top Up</Link>
            <Link to="/analytics" className={isActive('/analytics')}>Analytics</Link>
            <Link to="/ai" className={isActive('/ai')}>AI Companion</Link>
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-4">
          {!isAdmin && user.walletBalance !== undefined && (
            <div className="hidden sm:flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-medium">
              <span>₹</span>
              <span>{parseFloat(user.walletBalance).toFixed(2)}</span>
            </div>
          )}
          <div className="text-sm text-gray-500 hidden sm:block">
            {isAdmin ? 'Admin' : user.fullName?.split(' ')[0]}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}