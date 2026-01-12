'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

interface Note {
  id: string
  title: string
  content: string
  subject: string
  grade: string
  type: 'text' | 'photo'
  imageUrl?: string
  createdAt: Date
  updatedAt: Date
}

const SUBJECTS = [
  { id: 'fysiki', name: 'Φυσική', emoji: '🔬', color: '#4EA6DC' },
  { id: 'mathimatika', name: 'Μαθηματικά', emoji: '📐', color: '#E32D91' },
  { id: 'chimeia', name: 'Χημεία', emoji: '⚗️', color: '#C830CC' },
  { id: 'viologia', name: 'Βιολογία', emoji: '🧬', color: '#87F1FF' },
  { id: 'istoria', name: 'Ιστορία', emoji: '📜', color: '#113285' },
  { id: 'neoelliniki', name: 'Νεοελληνική', emoji: '📖', color: '#4EA6DC' },
  { id: 'archaia', name: 'Αρχαία', emoji: '🏛️', color: '#E32D91' },
  { id: 'geografia', name: 'Γεωγραφία', emoji: '🌍', color: '#C830CC' },
]

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [showNewNoteModal, setShowNewNoteModal] = useState(false)
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    subject: '',
    type: 'text' as 'text' | 'photo',
    imageUrl: '',
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewNote({
          ...newNote,
          type: 'photo',
          imageUrl: reader.result as string,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const createNote = () => {
    if (!newNote.title || !newNote.subject) return

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      subject: newNote.subject,
      grade: 'a_lykeiou', // Would come from user profile
      type: newNote.type,
      imageUrl: newNote.imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setNotes([note, ...notes])
    setShowNewNoteModal(false)
    setNewNote({ title: '', content: '', subject: '', type: 'text', imageUrl: '' })
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id))
  }

  const filteredNotes = selectedSubject 
    ? notes.filter(n => n.subject === selectedSubject)
    : notes

  const getSubjectInfo = (subjectId: string) => {
    return SUBJECTS.find(s => s.id === subjectId) || { name: 'Άλλο', emoji: '📝', color: '#454551' }
  }

  return (
    <div className="min-h-screen bg-[#191308]">
      {/* Header */}
      <nav className="bg-[#1E1E24] border-b border-[#454551]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/student" className="flex items-center gap-2 text-[#D8D9DC] hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-body text-sm hidden sm:inline">Πίσω</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-[#87F1FF]/20">📓</div>
              <span className="font-heading font-semibold text-white text-sm">Οι Σημειώσεις μου</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-[#454551]/50 rounded-lg transition-colors"
            >
              {viewMode === 'grid' ? (
                <svg className="w-5 h-5 text-[#D8D9DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-[#D8D9DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setShowNewNoteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#4EA6DC] to-[#113285] hover:from-[#87F1FF] hover:to-[#4EA6DC] text-white rounded-lg font-body text-sm transition-all"
            >
              <span>+</span>
              <span className="hidden sm:inline">Νέα Σημείωση</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Subject Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedSubject(null)}
            className={`px-4 py-2 rounded-full text-sm font-body whitespace-nowrap transition-all ${
              !selectedSubject
                ? 'bg-[#4EA6DC] text-white'
                : 'bg-[#1E1E24] text-[#D8D9DC] border border-[#454551] hover:border-[#4EA6DC]'
            }`}
          >
            📚 Όλα ({notes.length})
          </button>
          {SUBJECTS.map(subject => {
            const count = notes.filter(n => n.subject === subject.id).length
            return (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`px-4 py-2 rounded-full text-sm font-body whitespace-nowrap transition-all ${
                  selectedSubject === subject.id
                    ? 'text-white'
                    : 'bg-[#1E1E24] text-[#D8D9DC] border border-[#454551] hover:border-[#4EA6DC]'
                }`}
                style={selectedSubject === subject.id ? { backgroundColor: subject.color } : {}}
              >
                {subject.emoji} {subject.name} ({count})
              </button>
            )
          })}
        </div>

        {/* Notes Grid/List */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-heading font-semibold text-white mb-2">
              Δεν έχεις σημειώσεις ακόμα
            </h2>
            <p className="text-[#D8D9DC] font-body mb-6">
              Δημιούργησε την πρώτη σου σημείωση!
            </p>
            <button
              onClick={() => setShowNewNoteModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#4EA6DC] to-[#113285] text-white rounded-xl font-body font-medium"
            >
              + Νέα Σημείωση
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {filteredNotes.map(note => {
              const subjectInfo = getSubjectInfo(note.subject)
              return (
                <div
                  key={note.id}
                  className={`bg-[#1E1E24] rounded-xl border border-[#454551] overflow-hidden hover:border-[#4EA6DC] transition-all group ${
                    viewMode === 'list' ? 'flex items-center' : ''
                  }`}
                >
                  {/* Image Preview */}
                  {note.type === 'photo' && note.imageUrl && (
                    <div className={viewMode === 'grid' ? 'h-32' : 'w-24 h-24 shrink-0'}>
                      <img 
                        src={note.imageUrl} 
                        alt={note.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-6 h-6 rounded flex items-center justify-center text-sm"
                          style={{ backgroundColor: `${subjectInfo.color}20` }}
                        >
                          {subjectInfo.emoji}
                        </span>
                        <span className="text-xs text-[#454551] font-body">{subjectInfo.name}</span>
                      </div>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#454551]/50 rounded transition-all"
                      >
                        <svg className="w-4 h-4 text-[#454551]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <h3 className="font-heading font-semibold text-white mb-1 truncate">{note.title}</h3>
                    {note.content && (
                      <p className="text-sm text-[#D8D9DC] font-body line-clamp-2">{note.content}</p>
                    )}
                    <p className="text-xs text-[#454551] font-body mt-2">
                      {new Date(note.createdAt).toLocaleDateString('el-GR')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* New Note Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1E24] rounded-2xl border border-[#454551] w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-heading font-semibold text-white">Νέα Σημείωση</h2>
                <button
                  onClick={() => setShowNewNoteModal(false)}
                  className="p-2 hover:bg-[#454551]/50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-[#D8D9DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-body font-medium text-[#D8D9DC] mb-1">
                    Τίτλος *
                  </label>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="π.χ. Νόμοι του Νεύτωνα"
                    className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#191308] text-white placeholder-[#454551] focus:ring-2 focus:ring-[#4EA6DC] font-body"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-body font-medium text-[#D8D9DC] mb-1">
                    Μάθημα *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {SUBJECTS.map(subject => (
                      <button
                        key={subject.id}
                        onClick={() => setNewNote({ ...newNote, subject: subject.id })}
                        className={`p-2 rounded-lg border transition-all text-center ${
                          newNote.subject === subject.id
                            ? 'border-[#4EA6DC] bg-[#4EA6DC]/20'
                            : 'border-[#454551] hover:border-[#4EA6DC]/50'
                        }`}
                      >
                        <div className="text-xl">{subject.emoji}</div>
                        <div className="text-xs text-[#D8D9DC] font-body mt-1">{subject.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type Selection */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewNote({ ...newNote, type: 'text', imageUrl: '' })}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      newNote.type === 'text'
                        ? 'border-[#4EA6DC] bg-[#4EA6DC]/20 text-[#87F1FF]'
                        : 'border-[#454551] text-[#D8D9DC] hover:border-[#4EA6DC]/50'
                    }`}
                  >
                    📝 Κείμενο
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex-1 p-3 rounded-lg border transition-all ${
                      newNote.type === 'photo'
                        ? 'border-[#4EA6DC] bg-[#4EA6DC]/20 text-[#87F1FF]'
                        : 'border-[#454551] text-[#D8D9DC] hover:border-[#4EA6DC]/50'
                    }`}
                  >
                    📸 Φωτογραφία
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Image Preview */}
                {newNote.imageUrl && (
                  <div className="relative">
                    <img 
                      src={newNote.imageUrl} 
                      alt="Preview" 
                      className="w-full h-48 object-contain rounded-lg bg-[#191308]"
                    />
                    <button
                      onClick={() => setNewNote({ ...newNote, imageUrl: '', type: 'text' })}
                      className="absolute top-2 right-2 p-1 bg-[#191308]/80 rounded-full"
                    >
                      <svg className="w-4 h-4 text-[#D8D9DC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Content */}
                {newNote.type === 'text' && (
                  <div>
                    <label className="block text-sm font-body font-medium text-[#D8D9DC] mb-1">
                      Περιεχόμενο
                    </label>
                    <textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      placeholder="Γράψε τις σημειώσεις σου..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#191308] text-white placeholder-[#454551] focus:ring-2 focus:ring-[#4EA6DC] font-body resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewNoteModal(false)}
                  className="flex-1 bg-[#191308] hover:bg-[#454551]/50 text-[#D8D9DC] py-3 rounded-lg font-body border border-[#454551]"
                >
                  Ακύρωση
                </button>
                <button
                  onClick={createNote}
                  disabled={!newNote.title || !newNote.subject}
                  className="flex-1 bg-gradient-to-r from-[#4EA6DC] to-[#113285] hover:from-[#87F1FF] hover:to-[#4EA6DC] disabled:from-[#454551] disabled:to-[#454551] text-white py-3 rounded-lg font-body font-medium"
                >
                  Αποθήκευση
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
