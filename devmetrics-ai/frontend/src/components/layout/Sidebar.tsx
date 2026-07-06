'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, Zap, LogOut, GitBranch } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { clsx } from 'clsx';

const nav = [
  { href: '/dashboard/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/reports', label: 'AI Reports', icon: FileText },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, org, logout } = useAuthStore();

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-zinc-950 border-r border-zinc-800 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <GitBranch size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">DevMetrics AI</p>
          <p className="text-xs text-zinc-500 truncate">{org?.name}</p>
        </div>
      </div>

      {/* Plan badge */}
      <div className="px-5 py-3">
        <span className={clsx(
          'text-xs font-medium px-2.5 py-1 rounded-full',
          org?.plan === 'PRO' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' : 'bg-zinc-800 text-zinc-400'
        )}>
          {org?.plan || 'FREE'} plan
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              active ? 'bg-indigo-600/15 text-indigo-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            )}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* AI hint */}
      <div className="mx-3 mb-3 p-3 rounded-lg bg-indigo-950/40 border border-indigo-900/50">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={12} className="text-indigo-400" />
          <span className="text-xs font-medium text-indigo-400">AI Assistant</span>
        </div>
        <p className="text-xs text-zinc-500">Ask anything about your team's metrics</p>
      </div>

      {/* User */}
      <div className="border-t border-zinc-800 p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-indigo-400">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-zinc-200 truncate">{user?.name}</p>
          <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
        </div>
        <button onClick={logout} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
