'use client';
import { useState, useCallback } from 'react';
import { GitCommitHorizontal, GitPullRequest, Bug, Rocket, Code, Star } from 'lucide-react';
import { useOverview } from '@/hooks/useMetrics';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth';
import { StatCard } from '@/components/ui/StatCard';
import { ActivityChart } from '@/components/charts/ActivityChart';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const PERIODS = [{ label: '7d', value: 7 }, { label: '30d', value: 30 }, { label: '90d', value: 90 }];

export default function OverviewPage() {
  const [period, setPeriod] = useState(30);
  const { data, isLoading, error, refetch } = useOverview(period);
  const { org } = useAuthStore();

  const handleMetricUpdate = useCallback(() => {
    toast.success('New metrics received!', { icon: '📊' });
    refetch();
  }, [refetch]);

  useSocket(org?.id, handleMetricUpdate);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="p-8 text-rose-400">{error}</div>;
  if (!data) return null;

  const { totals, timeline } = data;
  const prMergeRate = totals.pullRequests > 0 ? Math.round((totals.mergedPRs / totals.pullRequests) * 100) : 0;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">Engineering activity across all projects</p>
        </div>
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p.value ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Commits" value={totals.commits} icon={GitCommitHorizontal} color="indigo" trend={8} />
        <StatCard label="Pull Requests" value={totals.pullRequests} icon={GitPullRequest} color="emerald" trend={12} />
        <StatCard label="Issues Closed" value={totals.issuesClosed} icon={Bug} color="amber" trend={-3} />
        <StatCard label="Deployments" value={totals.deployments} icon={Rocket} color="rose" trend={5} />
      </div>

      {/* Chart */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Activity Timeline</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Commits, PRs, and deployments over time</p>
          </div>
        </div>
        <ActivityChart data={timeline} />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">PR Health</p>
          <div className="text-3xl font-semibold text-zinc-100 mb-1">{prMergeRate}%</div>
          <p className="text-xs text-zinc-500">merge rate ({totals.mergedPRs}/{totals.pullRequests})</p>
          <div className="mt-4 bg-zinc-800 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${prMergeRate}%` }} />
          </div>
        </div>

        <div className="card">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Code Volume</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5"><Code size={11} className="text-emerald-400" />Lines added</span>
              <span className="text-xs font-mono text-emerald-400">+{totals.linesAdded.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5"><Code size={11} className="text-rose-400" />Lines removed</span>
              <span className="text-xs font-mono text-rose-400">-{totals.linesRemoved.toLocaleString()}</span>
            </div>
            <div className="border-t border-zinc-800 pt-2 flex justify-between">
              <span className="text-xs text-zinc-500">Net change</span>
              <span className="text-xs font-mono text-zinc-300">+{(totals.linesAdded - totals.linesRemoved).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">Velocity Score</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-semibold text-zinc-100">
              {Math.min(100, Math.round((totals.commits * 0.5 + totals.mergedPRs * 2 + totals.deployments * 3) / period * 10))}
            </span>
            <span className="text-sm text-zinc-500 mb-1">/100</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star size={11} className="text-amber-400" />
            <p className="text-xs text-zinc-500">Based on commits, PRs, and deployments</p>
          </div>
        </div>
      </div>
    </div>
  );
}
