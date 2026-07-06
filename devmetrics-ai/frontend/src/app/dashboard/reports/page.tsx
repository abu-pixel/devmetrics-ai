'use client';
import { useState, useEffect } from 'react';
import { FileText, Sparkles, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

interface Report { id: string; title: string; content: string; generatedAt: string; periodStart: string; periodEnd: string; }

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);

  useEffect(() => {
    api.get('/ai/reports')
      .then(r => { setReports(r.data); if (r.data.length) setSelected(r.data[0]); })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">AI Reports</h1>
        <p className="text-sm text-zinc-500 mt-1">Weekly AI-generated productivity summaries</p>
      </div>

      <div className="flex gap-6">
        {/* Report list */}
        <div className="w-64 flex-shrink-0 space-y-2">
          {reports.length === 0 ? (
            <div className="card text-center py-8">
              <Sparkles size={20} className="text-indigo-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">No reports yet. Use the AI Assistant to generate your first weekly report.</p>
            </div>
          ) : reports.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
              className={`w-full text-left p-3.5 rounded-xl border transition-colors ${selected?.id === r.id ? 'bg-indigo-600/10 border-indigo-600/40' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <FileText size={12} className="text-indigo-400" />
                <span className="text-xs font-medium text-zinc-200 truncate">{r.title}</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-600">
                <Calendar size={10} />
                <span className="text-xs">{format(new Date(r.generatedAt), 'MMM d, yyyy')}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Report content */}
        {selected ? (
          <div className="flex-1 card">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-zinc-800">
              <div className="p-2 rounded-lg bg-indigo-500/10">
                <Sparkles size={14} className="text-indigo-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-200">{selected.title}</h2>
                <p className="text-xs text-zinc-500">
                  {format(new Date(selected.periodStart), 'MMM d')} – {format(new Date(selected.periodEnd), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{selected.content}</div>
          </div>
        ) : (
          <div className="flex-1 card flex items-center justify-center">
            <p className="text-zinc-600 text-sm">Select a report to view</p>
          </div>
        )}
      </div>
    </div>
  );
}
