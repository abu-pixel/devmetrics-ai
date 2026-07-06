'use client';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Zap, CreditCard, Shield, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, org } = useAuthStore();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data } = await api.post('/stripe/checkout');
      window.location.href = data.url;
    } catch {
      toast.error('Failed to start checkout');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">Manage your organization and billing</p>
      </div>

      {/* Org info */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Organization</h2>
        </div>
        <div className="space-y-3">
          {[{ label: 'Organization name', value: org?.name }, { label: 'Slug', value: org?.slug }, { label: 'Your name', value: user?.name }, { label: 'Email', value: user?.email }].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
              <span className="text-xs text-zinc-500">{label}</span>
              <span className="text-xs font-medium text-zinc-200 font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Billing */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={14} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Plan &amp; Billing</h2>
        </div>

        <div className={`rounded-xl p-4 border mb-4 ${org?.plan === 'PRO' ? 'border-indigo-600/40 bg-indigo-950/20' : 'border-zinc-700 bg-zinc-800/40'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {org?.plan === 'PRO' && <Zap size={14} className="text-indigo-400" />}
              <span className="text-sm font-semibold text-zinc-200">{org?.plan} plan</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${org?.plan === 'PRO' ? 'bg-indigo-600 text-white' : 'bg-zinc-700 text-zinc-400'}`}>
              {org?.plan === 'PRO' ? 'Active' : 'Current'}
            </span>
          </div>
          <div className="text-xs text-zinc-500 space-y-1">
            {org?.plan === 'FREE' ? (
              <>
                <p>✓ Up to 3 projects</p>
                <p>✓ 30 days of history</p>
                <p>✗ AI reports (Pro only)</p>
                <p>✗ Unlimited team members</p>
              </>
            ) : (
              <>
                <p>✓ Unlimited projects</p>
                <p>✓ 1 year of history</p>
                <p>✓ AI-powered reports</p>
                <p>✓ Unlimited team members</p>
              </>
            )}
          </div>
        </div>

        {org?.plan === 'FREE' && (
          <div>
            <div className="flex items-start gap-2 bg-amber-950/30 border border-amber-900/40 rounded-lg p-3 mb-4">
              <AlertCircle size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-300/80">Upgrade to Pro to unlock AI reports, unlimited history, and priority support.</p>
            </div>
            <button onClick={handleUpgrade} disabled={isUpgrading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              <Zap size={14} />
              {isUpgrading ? 'Redirecting...' : 'Upgrade to Pro — $29/mo'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
