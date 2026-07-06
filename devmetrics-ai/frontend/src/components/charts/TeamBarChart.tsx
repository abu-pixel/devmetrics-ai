'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TeamMember } from '@/types';

interface Props { data: TeamMember[]; }

export function TeamBarChart({ data }: Props) {
  const top = data.slice(0, 8).map(m => ({
    name: m.name.split(' ')[0],
    commits: m.commits,
    PRs: m.mergedPRs,
    reviews: m.reviewsGiven,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={top} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', fontSize: '12px' }} />
        <Bar dataKey="commits" fill="#6366f1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="PRs" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="reviews" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
