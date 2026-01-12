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
  image?: string
}

interface Source {
  bookName: string
  similarity: number
}

const ACTIVITIES = [
  { 
    id: 'tutor', 
    name: 'Ρώτα τον Βοηθό', 
    icon: '💬', 
    description: 'Κάνε ερωτήσεις για τα μαθήματά σου',
    color: '#4EA6DC'
  },
  { 
    id: 'photo-exercise', 
    name: 'Λύσε Άσκηση', 
    icon: '📸', 
    description: 'Ανέβασε φωτογραφία άσκησης',
    color: '#E32D91'
  },
  { 
    id: 'quiz', 
    name: 'Κάνε Quiz', 
    icon: '📝', 
    description: 'Δημιούργησε quiz από τις σημειώσεις σου',
    color: '#C830CC'
  },
  { 
    id: 'notes', 
    name: 'Σημειώσεις', 
    icon: '📓', 
    description: 'Οργάνωσε τις σημειώσεις σου',
    color: '#87F1FF'
  },
  { 
    id: 'visual-explainer', 
    name: 'Οπτική Εξήγηση', 
    icon: '🎨', 
    description: 'Κατανόησε έννοιες με εικόνες',
    color: '#113285'
  },
]

const SUBJECTS = [
  { id: 'fysiki', name: 'Φυσική', emoji: '🔬' },
  { id: 'mathimatika', name: 'Μαθηματικά', emoji: '📐' },
  { id: 'chimeia', name: 'Χημεία', emoji: '⚗️' },
  { id: 'viologia', name: 'Βιολογία', emoji: '🧬' },
  { id: 'istoria', name: 'Ιστορία', emoji: '📜' },
  { id: 'neoelliniki', name: 'Νεοελληνική', emoji: '📖' },
  { id: 'archaia_ellinika', name: 'Αρχαία', emoji: '🏛️' },
]

interface StudentDashboardProps {
  user: User
  profile?: {
    grade?: string
    assistant_name?: string
    assistant_avatar?: string
  }
}

export default function StudentDashboard({ user, profile }: StudentDashboardProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [subject, setSubject] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeActivity, setActiveActivity] = useState('tutor')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const assistantName = profile?.assistant_name || user.user_metadata?.assistant_name || 'Νους'
  const assistantAvatar = profile?.assistant_avatar || user.user_metadata?.assistant_avatar || 'owl'
  const userGrade = profile?.grade || user.user_metadata?.grade || ''
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Μαθητής'

  const AVATARS: Record<string, string> = {
    owl: '🦉', robot: '🤖', brain: '🧠', rocket: '🚀', star: '⭐', wizard: '🧙'
  }

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => setShowSidebar(window.innerWidth >= 1024)
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Auto-scroll
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
        setActiveActivity('photo-exercise')
      }
      reader.readAsDataURL(file)
    }
  }

  const sendMessage = async () => {
    if ((!input.trim() && !uploadedImage) || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || 'Βοήθησέ με με αυτή την άσκηση',
      image: uploadedImage || undefined,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setUploadedImage(null)
    setLoading(true)

    if (window.innerWidth < 1024) setShowSidebar(false)

    try {
      const endpoint = uploadedImage ? '/api/chat/photo' : '/api/chat'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          image: uploadedImage,
          subject,
          grade: userGrade,
          activity: activeActivity,
          history: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

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
    setUploadedImage(null)
  }

  const selectActivity = (activityId: string) => {
    setActiveActivity(activityId)
    if (activityId === 'quiz') {
      router.push('/student/quiz')
    } else if (activityId === 'notes') {
      router.push('/student/notes')
    }
    if (window.innerWidth < 1024) setShowSidebar(false)
  }

  const getSuggestions = () => {
    if (activeActivity === 'photo-exercise') {
      return [
        'Εξήγησέ μου βήμα-βήμα',
        'Ποιος τύπος χρειάζεται;',
        'Δώσε μου hint',
        'Έλεγξε τη λύση μου',
      ]
    }
    return [
      'Εξήγησέ μου τους νόμους του Νεύτωνα',
      'Πώς λύνω εξισώσεις 2ου βαθμού;',
      'Τι είναι η φωτοσύνθεση;',
      'Βάλε μου μια άσκηση Φυσικής',
    ]
  }

  return (
    <div className="flex h-screen bg-[#191308] overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Overlay for mobile */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Left Sidebar - Activities */}
      <aside className={`
        fixed lg:relative z-30 h-full
        ${showSidebar ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-72 lg:translate-x-0'} 
        bg-[#1E1E24] border-r border-[#454551] transition-all duration-300 overflow-hidden flex flex-col
      `}>
        {/* Header */}
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

        {/* Activities */}
        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-xs text-[#454551] font-body uppercase tracking-wider mb-3">Δραστηριότητες</p>
          <div className="space-y-2">
            {ACTIVITIES.map(activity => (
              <button
                key={activity.id}
                onClick={() => selectActivity(activity.id)}
                className={`w-full text-left p-3 rounded-xl transition-all font-body group ${
                  activeActivity === activity.id
                    ? 'bg-[#4EA6DC]/20 border border-[#4EA6DC]/50'
                    : 'hover:bg-[#454551]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${activity.color}20` }}
                  >
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      activeActivity === activity.id ? 'text-[#87F1FF]' : 'text-white'
                    }`}>
                      {activity.name}
                    </p>
                    <p className="text-xs text-[#454551] truncate">{activity.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <div className="mt-6">
            <p className="text-xs text-[#454551] font-body uppercase tracking-wider mb-3">Μάθημα</p>
            <div className="space-y-1">
              <button
                onClick={() => setSubject(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-body ${
                  !subject ? 'bg-[#454551]/50 text-[#87F1FF]' : 'hover:bg-[#454551]/30 text-[#D8D9DC]'
                }`}
              >
                📚 Όλα
              </button>
              {SUBJECTS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSubject(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-body ${
                    subject === s.id ? 'bg-[#454551]/50 text-[#87F1FF]' : 'hover:bg-[#454551]/30 text-[#D8D9DC]'
                  }`}
                >
                  {s.emoji} {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-[#454551]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#E32D91] to-[#C830CC] rounded-full flex items-center justify-center">
              <span className="text-white font-body font-medium">
                {userName[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-[#454551] font-body">{userGrade.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/student/settings')}
              className="flex-1 text-center px-3 py-2 rounded-lg text-xs text-[#D8D9DC] hover:bg-[#454551]/50 transition-colors font-body"
            >
              ⚙️ Ρυθμίσεις
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 text-center px-3 py-2 rounded-lg text-xs text-[#D8D9DC] hover:bg-[#454551]/50 transition-colors font-body"
            >
              Έξοδος
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-[#1E1E24] border-b border-[#454551] flex items-center px-4 shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-[#454551]/50 rounded-lg mr-2 transition-colors lg:hidden"
          >
            <svg className="w-5 h-5 text-[#D8D9DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#E32D91] to-[#C830CC] rounded-full flex items-center justify-center text-lg">
              {AVATARS[assistantAvatar] || '🦉'}
            </div>
            <div>
              <h1 className="font-heading font-semibold text-white text-sm">{assistantName}</h1>
              <p className="text-xs text-[#454551]">{ACTIVITIES.find(a => a.id === activeActivity)?.name}</p>
            </div>
          </div>
          
          {/* Photo Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="ml-auto p-2 hover:bg-[#454551]/50 rounded-lg transition-colors"
            title="Ανέβασε φωτογραφία"
          >
            <svg className="w-5 h-5 text-[#D8D9DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#E32D91] to-[#C830CC] rounded-full flex items-center justify-center text-4xl mb-4">
                {AVATARS[assistantAvatar] || '🦉'}
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-semibold text-white mb-2">
                Γεια σου, {userName}! 👋
              </h2>
              <p className="text-sm sm:text-base text-[#D8D9DC] mb-6 max-w-md font-body">
                Είμαι ο {assistantName}, ο προσωπικός σου βοηθός! 
                {activeActivity === 'photo-exercise' 
                  ? ' Ανέβασε μια φωτογραφία άσκησης και θα σε βοηθήσω να τη λύσεις!' 
                  : ' Ρώτησέ με οτιδήποτε ή διάλεξε μια δραστηριότητα!'}
              </p>
              
              {/* Suggestion Bubbles */}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {getSuggestions().map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-2 bg-[#1E1E24] border border-[#454551] rounded-full hover:border-[#4EA6DC] transition-all text-sm text-[#D8D9DC] font-body"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Upload Photo CTA */}
              {activeActivity === 'photo-exercise' && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E32D91] to-[#C830CC] text-white rounded-xl font-body font-medium hover:-translate-y-1 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Ανέβασε Φωτογραφία Άσκησης
                </button>
              )}
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} message-fade-in`}
            >
              <div className={`max-w-[85%] sm:max-w-[75%] ${message.role === 'assistant' ? 'flex gap-2' : ''}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-[#E32D91] to-[#C830CC] rounded-full flex items-center justify-center text-sm shrink-0">
                    {AVATARS[assistantAvatar] || '🦉'}
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[#4EA6DC] to-[#113285] text-white'
                      : 'bg-[#1E1E24] border border-[#454551] text-white'
                  }`}
                >
                  {/* Show uploaded image */}
                  {message.image && (
                    <img 
                      src={message.image} 
                      alt="Uploaded exercise" 
                      className="max-w-full rounded-lg mb-2 max-h-64 object-contain"
                    />
                  )}
                  
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none font-body text-sm sm:text-base">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap font-body text-sm sm:text-base">{message.content}</p>
                  )}

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#454551]">
                      <p className="text-xs text-[#D8D9DC] mb-2 font-body">📚 Πηγές:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.sources.slice(0, 3).map((source, i) => (
                          <span key={i} className="text-xs bg-[#191308] text-[#87F1FF] px-2 py-1 rounded font-body">
                            {source.bookName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex justify-start message-fade-in">
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#E32D91] to-[#C830CC] rounded-full flex items-center justify-center text-sm">
                  {AVATARS[assistantAvatar] || '🦉'}
                </div>
                <div className="bg-[#1E1E24] border border-[#454551] rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#4EA6DC] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-[#4EA6DC] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-[#4EA6DC] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Uploaded Image Preview */}
        {uploadedImage && (
          <div className="px-4 py-2 bg-[#1E1E24] border-t border-[#454551]">
            <div className="flex items-center gap-3">
              <img src={uploadedImage} alt="Preview" className="h-16 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="text-sm text-white font-body">Φωτογραφία άσκησης</p>
                <p className="text-xs text-[#454551] font-body">Έτοιμη για ανάλυση</p>
              </div>
              <button
                onClick={() => setUploadedImage(null)}
                className="p-2 hover:bg-[#454551]/50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-[#D8D9DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 sm:p-4 bg-[#1E1E24] border-t border-[#454551] shrink-0">
          <div className="max-w-4xl mx-auto relative flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-[#191308] border border-[#454551] rounded-xl hover:border-[#4EA6DC] transition-colors shrink-0"
              title="Ανέβασε φωτογραφία"
            >
              <svg className="w-5 h-5 text-[#D8D9DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={uploadedImage ? "Περιέγραψε την άσκηση ή πάτα Enter..." : "Γράψε την ερώτησή σου..."}
                className="w-full px-4 py-3 pr-12 bg-[#191308] border border-[#454551] rounded-xl resize-none focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent text-white placeholder-[#454551] font-body text-sm sm:text-base"
                rows={1}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !uploadedImage)}
                className="absolute right-2 bottom-2 p-2 bg-gradient-to-r from-[#E32D91] to-[#C830CC] hover:from-[#C830CC] hover:to-[#E32D91] disabled:from-[#454551] disabled:to-[#454551] text-white rounded-lg transition-all"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-[#454551] mt-2 font-body">
            Ο {assistantName} μπορεί να κάνει λάθη. Επαλήθευε τις απαντήσεις.
          </p>
        </div>
      </main>
    </div>
  )
}
