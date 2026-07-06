'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { ChatMessage } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STARTER_PROMPTS = [
  'How is my team performing this week?',
  'Who has the highest merge rate?',
  'What days are most productive?',
  'How many deployments this month?',
];

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "Hi! I'm DevMetrics AI. Ask me anything about your team's productivity, commit patterns, or engineering velocity." }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const history = messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0);
    
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setIsStreaming(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, history }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
        
        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') break;
          try {
            const { text: t } = JSON.parse(data);
            fullContent += t;
            setMessages(prev => {
              const copy = [...prev];
              copy[copy.length - 1] = { role: 'assistant', content: fullContent };
              return copy;
            });
          } catch {}
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/ai/report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setWeeklyReport(data.report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Weekly Report */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-sm font-medium text-zinc-200">Weekly AI Report</span>
          </div>
          <button
            onClick={generateReport}
            disabled={isGeneratingReport}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={11} className={isGeneratingReport ? 'animate-spin' : ''} />
            {isGeneratingReport ? 'Generating...' : 'Generate'}
          </button>
        </div>
        {weeklyReport ? (
          <div className="text-xs text-zinc-400 leading-relaxed bg-zinc-800/50 rounded-lg p-3 max-h-40 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
            {weeklyReport}
          </div>
        ) : (
          <p className="text-xs text-zinc-600 italic">Click generate to get your AI-powered weekly summary</p>
        )}
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex gap-2.5', msg.role === 'user' ? 'flex-row-reverse' : '')}>
            <div className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-zinc-800'
            )}>
              {msg.role === 'user' ? <User size={12} className="text-white" /> : <Bot size={12} className="text-indigo-400" />}
            </div>
            <div className={clsx(
              'max-w-[85%] text-xs leading-relaxed rounded-xl px-3.5 py-2.5',
              msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'
            )}>
              {msg.content || (isStreaming && i === messages.length - 1 ? (
                <span className="inline-flex gap-1">
                  <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              ) : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Starters */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {STARTER_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMessage(p)}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 px-2.5 py-1.5 rounded-lg transition-colors border border-zinc-700">
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-zinc-800">
        <div className="flex gap-2 items-end bg-zinc-800 rounded-xl border border-zinc-700 focus-within:border-indigo-500 transition-colors p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your team metrics..."
            rows={1}
            className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 resize-none outline-none leading-relaxed"
            style={{ maxHeight: '80px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send size={12} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
