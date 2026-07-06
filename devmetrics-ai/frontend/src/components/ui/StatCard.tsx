import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose';
}

const colors = {
  indigo: 'text-indigo-400 bg-indigo-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
  amber: 'text-amber-400 bg-amber-500/10',
  rose: 'text-rose-400 bg-rose-500/10',
};

export function StatCard({ label, value, icon: Icon, trend, color = 'indigo' }: StatCardProps) {
  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</p>
        <div className={clsx('p-2 rounded-lg', colors[color])}>
          <Icon size={14} className={colors[color].split(' ')[0]} />
        </div>
      </div>
      <p className="text-2xl font-semibold text-zinc-100">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {trend !== undefined && (
        <p className={clsx('text-xs mt-1', trend >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
        </p>
      )}
    </div>
  );
}
