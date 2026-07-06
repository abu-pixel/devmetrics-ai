'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { AiChat } from '@/components/ai-chat/AiChat';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/auth/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f0f14]">
      <Sidebar />
      <main className="flex-1 ml-[240px] overflow-y-auto">
        {children}
      </main>
      {/* AI Chat Sidebar */}
      <div className="w-[320px] border-l border-zinc-800 flex flex-col bg-zinc-950 flex-shrink-0">
        <div className="px-4 py-3.5 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-200">AI Assistant</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Powered by GPT-4o mini</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <AiChat />
        </div>
      </div>
    </div>
  );
}
