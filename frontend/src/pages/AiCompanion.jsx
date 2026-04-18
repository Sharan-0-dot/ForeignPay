import { useState, useEffect, useRef } from 'react'
import { askCompanion, getInsights } from '../services/api'
import { useAuth } from '../context/AuthContext'

const SUGGESTED_QUESTIONS = [
  'How should I manage my remaining budget?',
  'Which category am I spending the most on?',
  'Give me tips to save money in India.',
  'How long will my wallet balance last?'
]

export default function AiCompanion() {
  const { user } = useAuth()
  const messagesEndRef = useRef(null)

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi ${user?.fullName?.split(' ')[0] || 'there'}! 👋 I'm your AI travel finance companion. I can help you track spending, manage your wallet budget, and give tips for spending smartly in India. What would you like to know?`
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState([])
  const [insightsLoading, setInsightsLoading] = useState(true)

  useEffect(() => {
    fetchInsights()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchInsights = async () => {
    try {
      const res = await getInsights()
      setInsights(res.data.insights || [])
    } catch {
      // No transactions yet — insights won't be available
    } finally {
      setInsightsLoading(false)
    }
  }

  const sendMessage = async (text) => {
    const userText = text || input.trim()
    if (!userText) return

    setMessages((prev) => [...prev, { role: 'user', text: userText }])
    setInput('')
    setLoading(true)

    try {
      const res = await askCompanion(userText)
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I had trouble connecting. Please try again in a moment.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI Companion</h1>
          <p className="text-gray-500 text-sm mt-1">
            Powered by Gemini — personalized spend advice based on your transactions.
          </p>
        </div>

        {/* Insights cards */}
        {!insightsLoading && insights.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">💡 Your spending insights</h2>
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div key={i} className="bg-white border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-indigo-400 mt-0.5 shrink-0">✦</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat window */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col" style={{ minHeight: '480px' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: '480px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm shrink-0 mr-2 mt-0.5">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-3 text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-50 text-gray-800 rounded-bl-sm border border-gray-100'
                    }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm shrink-0 ml-2 mt-0.5">
                    {user?.fullName?.[0] || '?'}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm shrink-0 mr-2">
                  🤖
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-gray-100 p-4 flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your spending, budget tips, or anything travel finance…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              style={{ minHeight: '42px', maxHeight: '120px' }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" style={{ transform: 'rotate(90deg)' }}>
                <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          AI responses are based on your actual transaction data. Not financial advice.
        </p>

      </div>
    </div>
  )
}