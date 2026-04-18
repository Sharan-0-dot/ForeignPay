import { Link } from 'react-router-dom'

const features = [
  {
    icon: '🪪',
    title: 'KYC Verification',
    desc: 'Upload your passport once. Our team verifies your identity quickly and securely.'
  },
  {
    icon: '💳',
    title: 'International Card Top-up',
    desc: 'Load INR to your wallet using Visa, Mastercard, or Amex. We handle the conversion.'
  },
  {
    icon: '📱',
    title: 'Scan Any UPI QR',
    desc: 'Pay at 500M+ merchants across India — street food, autos, hotels, shopping malls.'
  },
  {
    icon: '📊',
    title: 'Expense Analytics',
    desc: 'Track where your rupees go. Category breakdown and daily spend charts included.'
  },
  {
    icon: '🤖',
    title: 'AI Spend Companion',
    desc: 'Get personalised budget advice based on your actual spending patterns in India.'
  },
  {
    icon: '🔒',
    title: 'Secure & Compliant',
    desc: 'Bank-grade security. Your passport data is encrypted. Payments are fully audited.'
  }
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">FP</span>
            </div>
            <span className="font-semibold text-gray-900">ForeignPay</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
          Now live — UPI payments for international tourists
        </div>

        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Pay like a local,<br />
          <span className="text-indigo-600">anywhere in India</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          No Indian bank account. No Indian SIM card. Just scan any UPI QR code and pay — from chai stalls to 5-star hotels.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            to="/register"
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-base font-medium hover:bg-indigo-700 transition-colors"
          >
            Create free account
          </Link>
          <Link
            to="/login"
            className="text-gray-600 border border-gray-200 px-8 py-3 rounded-xl text-base hover:border-gray-300 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gray-50 border-y border-gray-100 py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">500M+</p>
            <p className="text-sm text-gray-500 mt-1">UPI merchants</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">₹0</p>
            <p className="text-sm text-gray-500 mt-1">Hidden fees</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">2%</p>
            <p className="text-sm text-gray-500 mt-1">Commission only</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
          Everything you need to spend in India
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to explore India?</h2>
        <p className="text-indigo-200 mb-8">Get set up in under 5 minutes.</p>
        <Link
          to="/register"
          className="bg-white text-indigo-600 font-medium px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          Create your account
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400">
        © 2026 ForeignPay. Built with ♥ for travellers.
      </footer>
    </div>
  )
}