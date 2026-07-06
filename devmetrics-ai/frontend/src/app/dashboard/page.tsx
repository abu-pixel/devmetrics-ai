'use client'

import { useCallback } from 'react'
import useSWR from 'swr'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { useMetricUpdates } from '@/hooks/useSocket'
import { useAuthStore } from '@/store/auth'
import clsx from 'clsx'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricStat { total: number; avg: number; trend: number }
interface MetricsResponse {
  aggregated: Record<string, MetricStat>
  timeSeries: Array<Record<string, string | number>>
  period: { days: number }
}
interface LeaderboardEntry {
  team: { id: string; name: string; color: string; memberCount: number }
  metrics: { commits: number; prs: number; reviews: number }
  score: number
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, trend, unit = '',
}: { label: string; value: number; trend: number; unit?: string }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendClass = trend > 0 ? 'trend-up' : trend < 0 ? 'trend-down' : 'text-[var(--text-muted)]'

  return (
    <div className="metric-card">
      <span className="stat-label">{label}</span>
      <div className="flex items-end justify-between">
        <span className="stat-value">{value.toLocaleString()}{unit}</span>
        <div className={clsx('flex items-center gap-1', trendClass)}>
          <TrendIcon size={12} />
          <span>{Math.abs(trend)}%</span>
        </div>
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-2 p-3 text-xs shadow-xl">
      <p className="text-[var(--text-muted)] mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: p.color }} />
          {p.name}: <strong>{Number(p.value).toFixed(0)}</strong>
        </p>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { workspace } = useAuthStore()

  const { data: metrics, mutate: mutateMetrics } = useSWR<MetricsResponse>(
    '/api/metrics?days=30',
    () => api.get('/api/metrics?days=30'),
    { refreshInterval: 60000 },
  )

  const { data: leaderboard } = useSWR<LeaderboardEntry[]>(
    '/api/metrics/leaderboard',
    () => api.get('/api/metrics/leaderboard'),
  )

  // Live metric updates via WebSocket
  useMetricUpdates(useCallback(() => {
    mutateMetrics()
  }, [mutateMetrics]))

  const agg = metrics?.aggregated
  const series = (metrics?.timeSeries ?? []).map((d) => ({
    ...d,
    date: format(parseISO(d.date as string), 'MMM d'),
  }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Last 30 days · {workspace?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Live
          </div>
          <Link href="/dashboard/ai" className="btn-primary flex items-center gap-1.5">
            <Zap size={14} />
            AI Report
          </Link>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Commits" value={agg?.COMMITS?.total ?? 0} trend={agg?.COMMITS?.trend ?? 0} />
        <StatCard label="PRs Merged" value={agg?.PRS_MERGED?.total ?? 0} trend={agg?.PRS_MERGED?.trend ?? 0} />
        <StatCard label="Code Reviews" value={agg?.CODE_REVIEWS?.total ?? 0} trend={agg?.CODE_REVIEWS?.trend ?? 0} />
        <StatCard label="Issues Closed" value={agg?.ISSUES_CLOSED?.total ?? 0} trend={agg?.ISSUES_CLOSED?.trend ?? 0} />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Area chart — spans 2 cols */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-medium mb-4">Commit activity</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={series} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#71717a' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone" dataKey="COMMITS" name="Commits"
                stroke="#6366f1" strokeWidth={2}
                fill="url(#commitGrad)"
              />
              <Area
                type="monotone" dataKey="PRS_MERGED" name="PRs"
                stroke="#10b981" strokeWidth={2}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="card p-5">
          <h2 className="text-sm font-medium mb-4">Reviews vs PRs</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={series.slice(-14)} margin={{ left: -20, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="CODE_REVIEWS" name="Reviews" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="PRS_OPENED" name="PRs" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Team Leaderboard ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">Team leaderboard</h2>
          <span className="text-xs text-[var(--text-muted)]">30-day score</span>
        </div>
        <div className="flex flex-col gap-3">
          {(leaderboard ?? []).map((entry, i) => (
            <div key={entry.team.id} className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-muted)] w-4 flex-shrink-0">#{i + 1}</span>
              <div
                className="w-2 h-8 rounded-full flex-shrink-0"
                style={{ background: entry.team.color }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{entry.team.name}</span>
                  <span className="text-sm font-semibold text-brand-400">{entry.score}</span>
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {entry.metrics.commits} commits · {entry.metrics.prs} PRs · {entry.metrics.reviews} reviews
                </div>
                {/* Score bar */}
                <div className="mt-1.5 h-1 bg-[var(--surface-3)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      background: entry.team.color,
                      width: `${Math.min(100, (entry.score / ((leaderboard?.[0]?.score ?? 1) || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
          {!leaderboard?.length && (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">No team data yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
