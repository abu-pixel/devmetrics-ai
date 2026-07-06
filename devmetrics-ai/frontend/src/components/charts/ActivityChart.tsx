'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TimelinePoint } from '@/types';
import { format, parseISO } from 'date-fns';

interface Props { data: TimelinePoint[]; }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-zinc-400 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-zinc-300 capitalize">{p.name}: <span className="font-medium text-zinc-100">{p.value}</span></span>
        </div>
      ))}
    </div>
  );
};

export function ActivityChart({ data }: Props) {
  const formatted = data.map(d => ({
    ...d,
    date: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPRs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px', color: '#71717a' }} />
        <Area type="monotone" dataKey="commits" stroke="#6366f1" strokeWidth={2} fill="url(#colorCommits)" />
        <Area type="monotone" dataKey="pullRequests" stroke="#10b981" strokeWidth={2} fill="url(#colorPRs)" />
        <Area type="monotone" dataKey="deployments" stroke="#f59e0b" strokeWidth={2} fill="none" strokeDasharray="5 5" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
