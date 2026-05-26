import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/admin.service'
import { naira } from '../../services/api'
import { useTheme } from '../../context/ThemeContext'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { UserPlus, TrendingUp, Database } from 'lucide-react'

const periods = [
  { key: 'today',     label: 'Today'      },
  { key: 'yesterday', label: 'Yesterday'  },
  { key: 'days30',    label: 'This Month' },
]

const formatHour = (h) => {
  if (h === 0)  return '12AM'
  if (h === 12) return '12PM'
  return h < 12 ? `${h}AM` : `${h - 12}PM`
}

const fillHourly = (raw) =>
  Array.from({ length: 24 }, (_, h) => {
    const found = raw.find(d => d._id === h)
    return { label: formatHour(h), profit: found?.profit || 0, count: found?.count || 0 }
  })

const fillDaily = (days, raw) =>
  Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    const key = date.toISOString().split('T')[0]
    const found = raw.find(d => d._id === key)
    return {
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      profit: found?.profit || 0,
      count: found?.count || 0,
    }
  })

const CHART_VIEWS = [
  { key: 'today',     label: 'Today'     },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'days7',     label: '7 Days'    },
  { key: 'days30',    label: '30 Days'   },
]

export default function AdminDashboard() {
  const theme = useTheme()
  const [chartView, setChartView] = useState('today')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminService.getDashboard().then(r => r.data),
  })

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ['profit-analytics'],
    queryFn: () => adminService.getProfitAnalytics().then(r => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const fmtGb = (v) => `${(v ?? 0).toFixed(2)} GB`

  const stats = [
    { label: 'New Users Today',   value: data?.usersToday ?? 0,        icon: UserPlus, color: 'bg-blue-50 text-blue-600'      },
    { label: 'GB Sold Today',     value: fmtGb(data?.gbSoldToday),     icon: Database, color: 'bg-purple-50 text-purple-600'  },
    { label: 'GB Sold This Month',value: fmtGb(data?.gbSoldThisMonth), icon: Database, color: 'bg-emerald-50 text-emerald-600'},
  ]

  // Build chart data per view
  const chartMap = {
    today:     { data: fillHourly(analytics?.hourlyBreakdown || []),          title: 'Profit flow — today (hourly)',       empty: 'No transactions yet today'     },
    yesterday: { data: fillHourly(analytics?.hourlyBreakdownYesterday || []), title: 'Profit flow — yesterday (hourly)',   empty: 'No transactions yesterday'     },
    days7:     { data: fillDaily(7,  analytics?.dailyBreakdown || []),        title: 'Profit flow — last 7 days',         empty: 'No data for the last 7 days'   },
    days30:    { data: fillDaily(30, analytics?.dailyBreakdown || []),        title: 'Profit flow — last 30 days',        empty: 'No data for the last 30 days'  },
    allTime:   {
      data: (analytics?.monthlyBreakdown || []).map(d => ({ label: d._id, profit: d.profit, count: d.count })),
      title: 'Profit flow — all time (monthly)',
      empty: 'No transaction history yet',
    },
  }
  const { data: chartData, title: chartTitle, empty: chartEmpty } = chartMap[chartView]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Dashboard Overview</h2>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={22} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Profit period tiles */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Profit Analytics
          </div>
        </Card.Header>
        <Card.Body>
          {loadingAnalytics ? (
            <div className="flex justify-center py-4"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {periods.map(({ key, label }) => {
                const d = analytics?.[key] || {}
                return (
                  <div key={key} className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-2 font-medium">{label}</p>
                    <p className={`text-lg font-bold ${d.profit > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {naira(d.profit ?? 0)}
                    </p>
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-0.5">
                      <p className="text-xs text-gray-500">Vol: <span className="font-medium text-gray-700">{naira(d.volume ?? 0)}</span></p>
                      <p className="text-xs text-gray-500">Txns: <span className="font-medium text-gray-700">{d.count ?? 0}</span></p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Full-width flow chart — bleeds to page edges */}
      <div className="-mx-4 lg:-mx-6 bg-white border-y border-gray-100">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div>
              <p className="text-sm font-semibold text-gray-900">{chartTitle}</p>
              <p className="text-xs text-gray-400 mt-0.5">Successful transactions only</p>
            </div>
            <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-semibold">
              {CHART_VIEWS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setChartView(key)}
                  className="px-3.5 py-1.5 transition-colors"
                  style={chartView === key
                    ? { background: theme.colors.primary, color: '#fff' }
                    : { background: '#fff', color: '#6b7280' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loadingAnalytics ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : (
            <FlowChart
              data={chartData}
              primaryColor={theme.colors.primary}
              emptyMsg={chartEmpty}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SVG Flow Chart ──────────────────────────────────────────────────────────

function FlowChart({ data, primaryColor, emptyMsg }) {
  const [hovered, setHovered] = useState(null)
  const svgRef = useRef(null)

  const W = 1200
  const H = 260
  const PAD = { left: 62, right: 24, top: 22, bottom: 34 }
  const cW = W - PAD.left - PAD.right   // chart width
  const cH = H - PAD.top  - PAD.bottom  // chart height

  const hasData = data.some(d => d.profit > 0)
  const maxProfit = Math.max(...data.map(d => d.profit), 1)

  // Map each datum to an SVG (x, y) point
  const points = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * cW,
    y: PAD.top  + cH - (d.profit / maxProfit) * cH,
    d,
  }))

  // Smooth cubic-bezier line: control points sit at midpoint-X of adjacent nodes
  const linePath = points.length > 1
    ? points.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`
        const prev = points[i - 1]
        const mx = ((prev.x + p.x) / 2).toFixed(1)
        return `${acc} C ${mx},${prev.y.toFixed(1)} ${mx},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`
      }, '')
    : ''

  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)},${(PAD.top + cH).toFixed(1)} L ${PAD.left},${(PAD.top + cH).toFixed(1)} Z`
    : ''

  // Y-axis tick levels (0%, 25%, 50%, 75%, 100%)
  const yTicks = [0, 0.25, 0.5, 0.75, 1]

  const formatY = (v) => {
    if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000)     return `₦${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}K`
    return `₦${Math.round(v)}`
  }

  // X labels: show at most ~8, evenly spaced
  const step = Math.max(1, Math.ceil(data.length / 8))

  const handleMouseMove = (e) => {
    if (!svgRef.current || !points.length) return
    const rect = svgRef.current.getBoundingClientRect()
    const svgX  = ((e.clientX - rect.left) / rect.width) * W
    let closest = points[0]
    let minDist  = Infinity
    for (const p of points) {
      const dist = Math.abs(p.x - svgX)
      if (dist < minDist) { minDist = dist; closest = p }
    }
    setHovered(closest)
  }

  if (!hasData) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 h-[240px] sm:h-[280px]">
        <p className="text-sm text-gray-400">{emptyMsg}</p>
      </div>
    )
  }

  // Tooltip position as % of container
  const tooltipLeft = hovered ? `${(hovered.x / W) * 100}%` : '0'
  const tooltipTop  = hovered ? `${(hovered.y  / H) * 100}%` : '0'

  return (
    <div className="relative w-full select-none h-[240px] sm:h-[280px] md:h-[320px]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="flow-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={primaryColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0"    />
          </linearGradient>
          {/* Glow filter for active dot */}
          <filter id="dot-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Y-axis grid lines + labels ── */}
        {yTicks.map((t, i) => {
          const y   = PAD.top + (1 - t) * cH
          const val = t * maxProfit
          const isBase = i === 0
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke={isBase ? '#d1d5db' : '#f3f4f6'}
                strokeWidth={isBase ? 1.5 : 1}
              />
              <text
                x={PAD.left - 6} y={y + 3.5}
                textAnchor="end" fontSize="9.5" fill="#9ca3af"
                fontFamily="system-ui, -apple-system, sans-serif">
                {formatY(val)}
              </text>
            </g>
          )
        })}

        {/* ── Area fill ── */}
        <path d={areaPath} fill="url(#flow-area-grad)" />

        {/* ── Line ── */}
        <path
          d={linePath} fill="none"
          stroke={primaryColor} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        />

        {/* ── X-axis labels ── */}
        {points.map((p, i) => {
          if (i % step !== 0 && i !== points.length - 1) return null
          return (
            <text
              key={i} x={p.x} y={H - 5}
              textAnchor="middle" fontSize="9" fill="#9ca3af"
              fontFamily="system-ui, -apple-system, sans-serif">
              {p.d.label}
            </text>
          )
        })}

        {/* ── Hover: vertical guide + dot ── */}
        {hovered && (
          <>
            <line
              x1={hovered.x} y1={PAD.top}
              x2={hovered.x} y2={PAD.top + cH}
              stroke={primaryColor} strokeWidth="1"
              strokeDasharray="4 3" opacity="0.5"
            />
            <circle
              cx={hovered.x} cy={hovered.y} r="5"
              fill={primaryColor} stroke="white" strokeWidth="2.5"
              filter="url(#dot-glow)"
            />
          </>
        )}

        {/* Invisible hover capture rect */}
        <rect
          x={PAD.left} y={PAD.top}
          width={cW} height={cH}
          fill="transparent" style={{ cursor: 'crosshair' }}
        />
      </svg>

      {/* ── Floating tooltip ── */}
      {hovered && (
        <div
          className="absolute pointer-events-none z-20 bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-2xl"
          style={{
            left: tooltipLeft,
            top: tooltipTop,
            transform: 'translate(-50%, calc(-100% - 12px))',
            whiteSpace: 'nowrap',
          }}>
          <p className="font-bold text-white mb-1">{hovered.d.label}</p>
          <p className="text-green-400 font-semibold">Profit: {naira(hovered.d.profit)}</p>
          <p className="text-gray-400 mt-0.5">Txns: {hovered.d.count}</p>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
            style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #111827' }} />
        </div>
      )}
    </div>
  )
}
