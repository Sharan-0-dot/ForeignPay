import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { getAnalyticsSummary, getChartData } from '../services/api'

const COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444']

const CATEGORY_COLORS = {
  Food: 'bg-orange-100 text-orange-700',
  Transport: 'bg-blue-100 text-blue-700',
  Shopping: 'bg-purple-100 text-purple-700',
  Entertainment: 'bg-pink-100 text-pink-700',
  Other: 'bg-gray-100 text-gray-600'
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm text-sm">
        <p className="font-medium text-gray-900">₹{parseFloat(payload[0].value).toFixed(2)}</p>
      </div>
    )
  }
  return null
}

const PieCustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm text-sm">
        <p className="font-medium text-gray-900">{payload[0].name}</p>
        <p className="text-gray-500">₹{parseFloat(payload[0].value).toFixed(2)}</p>
      </div>
    )
  }
  return null
}

export default function Analytics() {
  const [summary, setSummary] = useState(null)
  const [charts, setCharts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [summaryRes, chartsRes] = await Promise.all([
        getAnalyticsSummary(),
        getChartData()
      ])
      setSummary(summaryRes.data)
      setCharts(chartsRes.data)
    } catch (err) {
      setError('Could not load analytics. Make sure you have some transactions first.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading analytics…</div>
      </div>
    )
  }

  const isEmpty = !summary || summary.transactionCount === 0

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Track where your rupees are going.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {isEmpty ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-semibold text-gray-700">No data yet</p>
            <p className="text-sm text-gray-400 mt-1">Make your first UPI payment to see spending analytics here.</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">Total Spent</p>
                <p className="text-lg font-bold text-gray-900">₹{parseFloat(summary.totalSpent).toFixed(0)}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">Payments</p>
                <p className="text-lg font-bold text-gray-900">{summary.transactionCount}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="text-xs text-gray-400 mb-1">Avg per txn</p>
                <p className="text-lg font-bold text-gray-900">
                  ₹{summary.transactionCount > 0
                    ? (parseFloat(summary.totalSpent) / summary.transactionCount).toFixed(0)
                    : 0}
                </p>
              </div>
            </div>

            {/* Pie chart — category breakdown */}
            {charts?.pieData && charts.pieData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Spending by category</h2>
                <div className="flex items-center gap-4">
                  <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={72}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {charts.pieData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieCustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex-1 space-y-2">
                    {charts.pieData.map((item, index) => {
                      const pct = ((parseFloat(item.value) / parseFloat(summary.totalSpent)) * 100).toFixed(0)
                      return (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm text-gray-700">{item.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">₹{parseFloat(item.value).toFixed(0)}</span>
                            <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Bar chart — daily spend */}
            {charts?.dailySpend && charts.dailySpend.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                <h2 className="font-semibold text-gray-900 mb-4 text-sm">Daily spending</h2>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.dailySpend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                      <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Category breakdown table */}
            {summary.categories && summary.categories.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h2 className="font-semibold text-gray-900 text-sm">Category breakdown</h2>
                </div>
                <ul className="divide-y divide-gray-50">
                  {summary.categories.map((cat) => {
                    const pct = ((parseFloat(cat.amount) / parseFloat(summary.totalSpent)) * 100).toFixed(0)
                    return (
                      <li key={cat.category} className="px-5 py-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.Other}`}>
                              {cat.category}
                            </span>
                            <span className="text-xs text-gray-400">{cat.count} payment{cat.count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{pct}%</span>
                            <span className="text-sm font-semibold text-gray-900">₹{parseFloat(cat.amount).toFixed(2)}</span>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}