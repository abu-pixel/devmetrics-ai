'use client';
import { useTeamMetrics } from '@/hooks/useMetrics';
import { TeamBarChart } from '@/components/charts/TeamBarChart';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GitCommitHorizontal, GitPullRequest, Star } from 'lucide-react';

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-purple-600', 'bg-cyan-600'];

export default function TeamPage() {
  const { data, isLoading } = useTeamMetrics(30);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Team</h1>
        <p className="text-sm text-zinc-500 mt-1">Individual contributor metrics — last 30 days</p>
      </div>

      {/* Bar Chart */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-zinc-200 mb-5">Contribution Breakdown</h2>
        <div className="flex gap-4 text-xs text-zinc-500 mb-4">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" />Commits</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />Merged PRs</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" />Reviews</span>
        </div>
        <TeamBarChart data={data} />
      </div>

      {/* Member table */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-200">Member Rankings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-zinc-500 font-medium">Developer</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Commits</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">PRs</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Merged</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Reviews</th>
                <th className="text-right px-4 py-3 text-zinc-500 font-medium">Deploys</th>
                <th className="text-right px-5 py-3 text-zinc-500 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((member, i) => {
                const score = Math.round(member.commits * 0.5 + member.mergedPRs * 2 + member.reviewsGiven * 1.5 + member.deployments * 3);
                return (
                  <tr key={member.email} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white font-medium text-xs flex-shrink-0`}>
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-200">{member.name}</p>
                          <p className="text-zinc-600">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="flex items-center justify-end gap-1 text-zinc-300">
                        <GitCommitHorizontal size={11} className="text-indigo-400" />{member.commits}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-300">{member.pullRequests}</td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-emerald-400 font-medium">{member.mergedPRs}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-300">
                      <span className="flex items-center justify-end gap-1">
                        <GitPullRequest size={11} className="text-amber-400" />{member.reviewsGiven}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-300">{member.deployments}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {i === 0 && <Star size={11} className="text-amber-400" />}
                        <span className={`font-semibold font-mono ${i === 0 ? 'text-amber-400' : 'text-zinc-300'}`}>{score}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
