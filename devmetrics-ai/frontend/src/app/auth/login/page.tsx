'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GitBranch, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('demo@devmetrics.ai');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard/overview');
    } catch {
      toast.error('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f14] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <GitBranch size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">DevMetrics AI</h1>
            <p className="text-xs text-zinc-500">Engineering Analytics</p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-zinc-100 mb-1">Sign in</h2>
          <p className="text-xs text-zinc-500 mb-5">Continue to your dashboard</p>

          {/* Demo hint */}
          <div className="bg-indigo-950/40 border border-indigo-900/50 rounded-lg px-3 py-2 mb-5 text-xs text-indigo-300">
            <strong>Demo:</strong> demo@devmetrics.ai / password123
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@company.com" required />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-1">
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-zinc-600 mt-4 text-center">
            No account?{' '}
            <Link href="/auth/register" className="text-indigo-400 hover:text-indigo-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
