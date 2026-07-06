'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { Bot, Send, Plus, FileText, Loader2, Sparkles, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api, streamChat, streamWeeklyReport } from '@/lib/api'
import { format } from 'date-fns'
import clsx from 'clsx'
import toast from 'react-hot-toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiSession {
  id: string
  title: string
  updatedAt: string
  messages: AiMessage[]
}

interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTED = [
  'Generate a weekly engineering report',
  'Which team had the most PRs this month?',
  'What are our DORA metrics looking like?',
  'Flag any anomalies in the last 30 days',
  'Compare team productivity this week vs last week',
]

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: AiMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={clsx('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={clsx(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser
          ? 'bg-brand-500/20 text-brand-400'
          : 'bg-violet-500/20 text-violet-400',
      )}>
        {isUser ? (
          <span className="text-xs font-semibold">U</span>
        ) : (
          <Bot size={13} />
        )}
      </div>

      {/* Content */}
      <div className={clsx(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
        isUser
          ? 'bg-brand-500 text-white rounded-tr-sm'
          : 'card rounded-tl-sm',
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Streaming bubble ─────────────────────────────────────────────────────────

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot size={13} />
      </div>
      <div className="max-w-[80%] card rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed">
        {content ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse [animation-delay:0.4s]" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AiPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { data: sessions, mutate: mutateSessions } = useSWR<AiSession[]>(
    '/api/ai/sessions',
    () => api.get('/api/ai/sessions'),
  )

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId) return
    api.get<AiSession>(`/api/ai/sessions/${activeSessionId}/messages`).then((s) => {
      setMessages(s.messages)
    })
  }, [activeSessionId])

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamContent])

  // ── Create new session ─────────────────────────────────────────────────────
  async function newSession() {
    const session = await api.post<AiSession>('/api/ai/sessions')
    await mutateSessions()
    setActiveSessionId(session.id)
    setMessages([])
    setInput('')
    inputRef.current?.focus()
  }

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || streaming) return

    let sessionId = activeSessionId
    if (!sessionId) {
      const session = await api.post<AiSession>('/api/ai/sessions')
      await mutateSessions()
      setActiveSessionId(session.id)
      sessionId = session.id
    }

    // Optimistically add user message
    const userMsg: AiMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: msg,
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setStreaming(true)
    setStreamContent('')

    try {
      await streamChat(
        sessionId,
        msg,
        (token) => setStreamContent((c) => c + token),
        () => {
          setStreaming(false)
          // Reload messages from server (includes the saved assistant message)
          api.get<AiSession>(`/api/ai/sessions/${sessionId}/messages`).then((s) => {
            setMessages(s.messages)
            setStreamContent('')
          })
          mutateSessions()
        },
      )
    } catch {
      toast.error('AI service error. Check your API key.')
      setStreaming(false)
      setStreamContent('')
    }
  }, [input, streaming, activeSessionId, mutateSessions])

  // ── Weekly report ─────────────────────────────────────────────────────────
  async function generateReport() {
    setGeneratingReport(true)
    let sessionId = activeSessionId

    if (!sessionId) {
      const session = await api.post<AiSession>('/api/ai/sessions')
      await mutateSessions()
      setActiveSessionId(session.id)
      sessionId = session.id
    }

    const promptMsg: AiMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: 'Generate a comprehensive weekly engineering report.',
      createdAt: new Date().toISOString(),
    }
    setMessages((m) => [...m, promptMsg])
    setStreaming(true)
    setStreamContent('')

    try {
      await streamWeeklyReport(
        (token) => setStreamContent((c) => c + token),
        () => {
          setStreaming(false)
          setGeneratingReport(false)
          api.get<AiSession>(`/api/ai/sessions/${sessionId}/messages`).then((s) => {
            setMessages(s.messages)
            setStreamContent('')
          })
          mutateSessions()
        },
      )
    } catch {
      toast.error('Report generation failed')
      setStreaming(false)
      setGeneratingReport(false)
      setStreamContent('')
    }
  }

  // ── Key handler ────────────────────────────────────────────────────────────
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const hasMessages = messages.length > 0 || streaming

  return (
    <div className="flex h-full">
      {/* ── Sessions sidebar ── */}
      <aside className="w-56 flex flex-col border-r" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
        <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={newSession} className="btn-secondary w-full flex items-center gap-2 justify-center">
            <Plus size={14} />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {/* Weekly report button */}
          <button
            onClick={generateReport}
            disabled={generatingReport || streaming}
            className={clsx(
              'flex items-center gap-2 text-xs px-3 py-2 rounded-lg w-full text-left transition-colors',
              'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20',
              (generatingReport || streaming) && 'opacity-50 cursor-not-allowed',
            )}
          >
            {generatingReport ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            Weekly report
          </button>

          <div className="h-px my-1" style={{ background: 'var(--border)' }} />

          {/* Session list */}
          {(sessions ?? []).map((session) => (
            <button
              key={session.id}
              onClick={() => { setActiveSessionId(session.id); setStreamContent('') }}
              className={clsx(
                'flex items-start gap-2 text-xs px-3 py-2 rounded-lg w-full text-left transition-colors group',
                activeSessionId === session.id
                  ? 'bg-[var(--surface-2)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]',
              )}
            >
              <FileText size={12} className="mt-0.5 flex-shrink-0" />
              <span className="truncate flex-1">{session.title}</span>
            </button>
          ))}

          {!sessions?.length && (
            <p className="text-xs text-[var(--text-muted)] px-3 py-4 text-center">No conversations yet</p>
          )}
        </div>
      </aside>

      {/* ── Chat main ── */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-7 h-7 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center">
            <Bot size={14} />
          </div>
          <div>
            <h1 className="text-sm font-semibold">DevMetrics AI</h1>
            <p className="text-xs text-[var(--text-muted)]">Powered by GPT-4o · Has access to your real metrics</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {!hasMessages && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/20">
                <Bot size={24} className="text-violet-400" />
              </div>
              <h2 className="text-base font-semibold mb-1">Ask anything about your team</h2>
              <p className="text-sm text-[var(--text-muted)] text-center mb-6 max-w-xs">
                I have access to your real metrics, teams, and GitHub data. Ask me for insights.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {SUGGESTED.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="flex items-center gap-2 text-left text-xs px-3 py-2.5 card rounded-lg hover:border-brand-500/40 transition-colors"
                  >
                    <ChevronRight size={12} className="text-brand-400 flex-shrink-0" />
                    <span className="text-[var(--text-secondary)]">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {streaming && <StreamingBubble content={streamContent} />}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex gap-2 items-end card p-2 focus-within:border-brand-500/50 transition-colors">
            <textarea
              ref={inputRef}
              className="flex-1 bg-transparent text-sm resize-none outline-none placeholder-[var(--text-muted)] py-1 px-1 max-h-32 min-h-[36px]"
              placeholder="Ask about your team metrics..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={streaming}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
              className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                input.trim() && !streaming
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'bg-[var(--surface-3)] text-[var(--text-muted)] cursor-not-allowed',
              )}
            >
              {streaming ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] text-center mt-2">
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>
    </div>
  )
}
