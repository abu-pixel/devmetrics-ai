'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GitBranch, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();
  const router = useRouter();

  const handleChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(form.name, form.email, form.password, form.orgName);
      router.push('/dashboard/overview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f14] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
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
          <h2 className="text-base font-semibold text-zinc-100 mb-1">Create account</h2>
          <p className="text-xs text-zinc-500 mb-5">Set up your team workspace</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {[
              { key: 'name', label: 'Your name', placeholder: 'Alex Rivera', type: 'text' },
              { key: 'orgName', label: 'Organization name', placeholder: 'Acme Engineering', type: 'text' },
              { key: 'email', label: 'Work email', placeholder: 'alex@acme.com', type: 'email' },
              { key: 'password', label: 'Password', placeholder: '••••••••', type: 'password' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-xs font-medium text-zinc-400 block mb-1.5">{label}</label>
                <input type={type} value={form[key as keyof typeof form]}
                  onChange={handleChange(key as keyof typeof form)}
                  className="input" placeholder={placeholder} required />
              </div>
            ))}
            <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 mt-1">
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-xs text-zinc-600 mt-4 text-center">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
