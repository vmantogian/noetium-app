'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ReactMarkdown from 'react-markdown'
import Logo from '@/components/Logo'
import type { User } from '@supabase/supabase-js'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  timestamp: Date
}

interface Source {
  bookName: string
  similarity: number
}

const SUBJECTS = [
  { id: 'fysiki', name: 'Φυσική', emoji: '🔬' },
  { id: 'mathimatika', name: 'Μαθηματικά', emoji: '📐' },
  { id: 'chimeia', name: 'Χημεία', emoji: '⚗️' },
  { id: 'viologia', name: 'Βιολογία', emoji: '🧬' },
  { id: 'istoria', name: 'Ιστορία', emoji: '📜' },
  { id: 'neoelliniki', name: 'Νεοελληνική', emoji: '📖' },
  { id: 'archaia_ellinika', name: 'Αρχαία', emoji: '🏛️' },
]

export default function ChatInterface({ user }: { user: User }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false) // Hidden by default on mobile
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const supabase = createClient()

  // Check screen size for sidebar default state
  useEffect(() => {
    const checkScreenSize = () => {
      setShowSidebar(window.innerWidth >= 768)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Close sidebar on mobile after sending
    if (window.innerWidth < 768) {
      setShowSidebar(false)
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          subject,
          history: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources?.map((s: any) => ({
          bookName: s.bookName || 'Σχολικό Βιβλίο',
          similarity: s.similarity,
        })),
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

      // Auto-detect subject from response
      if (data.detected_subject && !subject) {
        setSubject(data.detected_subject)
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Συγγνώμη, κάτι πήγε στραβά. Προσπάθησε ξανά.',
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setSubject(null)
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Μαθητής'

  return (
    <div className="flex h-screen bg-[#191308] overflow-hidden">
      {/* Overlay for mobile sidebar */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-30 h-full
        ${showSidebar ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'} 
        bg-[#1E1E24] border-r border-[#454551] transition-all duration-300 overflow-hidden flex flex-col
      `}>
        <div className="p-4 border-b border-[#454551]">
          <div className="flex items-center gap-3 mb-4">
            <Logo size={32} />
            <span className="text-xl font-heading font-semibold text-white">Noetium</span>
          </div>
          <button
            onClick={clearChat}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#4EA6DC] to-[#113285] hover:from-[#87F1FF] hover:to-[#4EA6DC] text-white py-2 px-4 rounded-lg transition-all font-body text-sm"
          >
            <span>+</span>
            <span>Νέα Συνομιλία</span>
          </button>
        </div>

        {/* Subject Filter */}
        <div className="p-4 border-b border-[#454551] overflow-y-auto flex-1">
          <p className="text-sm font-body font-medium text-[#D8D9DC] mb-2">Μάθημα</p>
          <div className="space-y-1">
            <button
              onClick={() => setSubject(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-body ${
                !subject 
                  ? 'bg-[#4EA6DC]/20 text-[#87F1FF] border border-[#4EA6DC]/30' 
                  : 'hover:bg-[#454551]/50 text-[#D8D9DC]'
              }`}
            >
              📚 Όλα τα μαθήματα
            </button>
            {SUBJECTS.map(s => (
              <button
                key={s.id}
                onClick={() => setSubject(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-body ${
                  subject === s.id 
                    ? 'bg-[#4EA6DC]/20 text-[#87F1FF] border border-[#4EA6DC]/30' 
                    : 'hover:bg-[#454551]/50 text-[#D8D9DC]'
                }`}
              >
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-[#454551]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#E32D91] to-[#C830CC] rounded-full flex items-center justify-center">
              <span className="text-white font-body font-medium text-sm">
                {userName[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium text-white truncate">
                {userName}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#D8D9DC] hover:bg-[#454551]/50 transition-colors font-body"
          >
            Αποσύνδεση
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-[#1E1E24] border-b border-[#454551] flex items-center px-4 shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-[#454551]/50 rounded-lg mr-2 transition-colors"
          >
            <svg className="w-5 h-5 text-[#D8D9DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-heading font-semibold text-white text-sm sm:text-base truncate">
            {subject ? SUBJECTS.find(s => s.id === subject)?.name : 'Ρώτα ό,τι θέλεις'}
          </h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <Logo size={60} className="mb-4 sm:w-20 sm:h-20" />
              <h2 className="text-xl sm:text-2xl font-heading font-semibold text-white mb-2">
                Γεια σου, {userName}!
              </h2>
              <p className="text-sm sm:text-base text-[#D8D9DC] mb-6 sm:mb-8 max-w-md font-body">
                Είμαι ο Noetium, ο έξυπνος βοηθός για τα μαθήματά σου. 
                Ρώτησέ με οτιδήποτε!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-lg w-full">
                {[
                  'Εξήγησέ μου τους νόμους του Νεύτωνα',
                  'Πώς λύνω εξισώσεις 2ου βαθμού;',
                  'Τι είναι η φωτοσύνθεση;',
                  'Βάλε μου μια άσκηση Φυσικής',
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="text-left p-3 bg-[#1E1E24] border border-[#454551] rounded-xl hover:border-[#4EA6DC] transition-all text-xs sm:text-sm text-[#D8D9DC] font-body hover:-translate-y-0.5"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} message-fade-in`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-[#E32D91] to-[#C830CC] text-white'
                    : 'bg-[#1E1E24] border border-[#454551] text-white'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none font-body text-sm sm:text-base">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap font-body text-sm sm:text-base">{message.content}</p>
                )}

                {/* Sources with proper book names */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#454551]">
                    <p className="text-xs text-[#D8D9DC] mb-2 font-body">📚 Πηγές:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {message.sources.slice(0, 3).map((source, i) => (
                        <span
                          key={i}
                          className="text-xs bg-[#191308] text-[#87F1FF] px-2 py-1 rounded font-body"
                        >
                          {source.bookName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start message-fade-in">
              <div className="bg-[#1E1E24] border border-[#454551] rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-[#4EA6DC] rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-[#4EA6DC] rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-[#4EA6DC] rounded-full typing-dot"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-4 bg-[#1E1E24] border-t border-[#454551] shrink-0">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Γράψε την ερώτησή σου..."
              className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-12 bg-[#191308] border border-[#454551] rounded-xl resize-none focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent text-white placeholder-[#454551] font-body text-sm sm:text-base"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="absolute right-2 bottom-1.5 sm:bottom-2 p-2 bg-gradient-to-r from-[#E32D91] to-[#C830CC] hover:from-[#C830CC] hover:to-[#E32D91] disabled:from-[#454551] disabled:to-[#454551] text-white rounded-lg transition-all"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-[#454551] mt-2 font-body">
            Το Noetium μπορεί να κάνει λάθη. Επαλήθευε τις απαντήσεις.
          </p>
        </div>
      </main>
    </div>
  )
}
