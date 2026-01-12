'use client'

import { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

const GRADE_LEVELS = [
  { id: 'a_gymnasiou', name: 'Α\' Γυμνασίου' },
  { id: 'b_gymnasiou', name: 'Β\' Γυμνασίου' },
  { id: 'g_gymnasiou', name: 'Γ\' Γυμνασίου' },
  { id: 'a_lykeiou', name: 'Α\' Λυκείου' },
  { id: 'b_lykeiou', name: 'Β\' Λυκείου' },
  { id: 'g_lykeiou', name: 'Γ\' Λυκείου' },
]

const SUBJECTS = [
  { id: 'fysiki', name: 'Φυσική' },
  { id: 'mathimatika', name: 'Μαθηματικά' },
  { id: 'chimeia', name: 'Χημεία' },
  { id: 'viologia', name: 'Βιολογία' },
  { id: 'istoria', name: 'Ιστορία' },
  { id: 'neoelliniki', name: 'Νεοελληνική Γλώσσα' },
  { id: 'archaia', name: 'Αρχαία Ελληνικά' },
]

export default function LessonPlanPage() {
  const [topic, setTopic] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState('45')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic || !gradeLevel || !subject) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/tools/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          gradeLevel,
          subject,
          duration,
          additionalInfo,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate')
      
      const data = await response.json()
      setResult(data.content)
    } catch (error) {
      console.error('Error:', error)
      setResult('Κάτι πήγε στραβά. Προσπάθησε ξανά.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#191308]">
      {/* Navigation */}
      <nav className="bg-[#1E1E24] border-b border-[#454551]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 gap-4">
            <Link href="/tools" className="flex items-center gap-2 text-[#D8D9DC] hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-body text-sm">Πίσω</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: '#4EA6DC20' }}>
                📋
              </div>
              <span className="font-heading font-semibold text-white text-sm">Σχέδιο Μαθήματος</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8 p-6 rounded-2xl" style={{ backgroundColor: '#4EA6DC20' }}>
          <div className="text-4xl mb-3">📋</div>
          <h1 className="text-2xl font-heading font-semibold text-white mb-2">
            Σχέδιο Μαθήματος
          </h1>
          <p className="text-[#D8D9DC] font-body">
            Δημιούργησε δομημένα σχέδια μαθήματος προσαρμοσμένα στις ανάγκες της τάξης σου.
          </p>
        </div>

        {!result ? (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-body font-medium text-[#D8D9DC] mb-2">
                Θέμα μαθήματος <span className="text-[#E32D91]">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="π.χ. Οι νόμοι του Νεύτωνα"
                className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#1E1E24] text-white placeholder-[#454551] focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent font-body"
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-body font-medium text-[#D8D9DC] mb-2">
                  Τάξη <span className="text-[#E32D91]">*</span>
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#1E1E24] text-white focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent font-body"
                  required
                >
                  <option value="">Επέλεξε τάξη...</option>
                  {GRADE_LEVELS.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-body font-medium text-[#D8D9DC] mb-2">
                  Μάθημα <span className="text-[#E32D91]">*</span>
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#1E1E24] text-white focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent font-body"
                  required
                >
                  <option value="">Επέλεξε μάθημα...</option>
                  {SUBJECTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-[#D8D9DC] mb-2">
                Διάρκεια (λεπτά)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#1E1E24] text-white focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent font-body"
              >
                <option value="30">30 λεπτά</option>
                <option value="45">45 λεπτά (1 διδακτική ώρα)</option>
                <option value="90">90 λεπτά (2 διδακτικές ώρες)</option>
                <option value="135">135 λεπτά (3 διδακτικές ώρες)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-body font-medium text-[#D8D9DC] mb-2">
                Επιπλέον πληροφορίες (προαιρετικά)
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="π.χ. Οι μαθητές έχουν ήδη διδαχθεί την κινηματική..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-[#454551] bg-[#1E1E24] text-white placeholder-[#454551] focus:ring-2 focus:ring-[#4EA6DC] focus:border-transparent font-body resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !topic || !gradeLevel || !subject}
              className="w-full bg-gradient-to-r from-[#4EA6DC] to-[#113285] hover:from-[#87F1FF] hover:to-[#4EA6DC] disabled:from-[#454551] disabled:to-[#454551] text-white py-3 rounded-lg font-body font-medium transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Δημιουργία...
                </span>
              ) : (
                'Δημιούργησε Σχέδιο Μαθήματος'
              )}
            </button>
          </form>
        ) : (
          /* Result */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-white">
                Σχέδιο Μαθήματος - {topic}
              </h2>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm font-body text-[#D8D9DC] hover:text-white border border-[#454551] rounded-lg transition-colors">
                  Εκτύπωση
                </button>
                <button className="px-4 py-2 text-sm font-body text-[#D8D9DC] hover:text-white border border-[#454551] rounded-lg transition-colors">
                  Εξαγωγή
                </button>
              </div>
            </div>
            
            <div className="bg-[#1E1E24] rounded-xl border border-[#454551] p-6">
              <p className="text-xs text-[#87F1FF] mb-4 font-body italic">
                ⚠️ Αυτό το εργαλείο χρειάζεται την εμπειρογνωμοσύνη σου! Βεβαιώσου ότι ελέγχεις το περιεχόμενο για ακρίβεια.
              </p>
              <div className="prose prose-invert max-w-none font-body">
                <div className="whitespace-pre-wrap text-[#D8D9DC]">{result}</div>
              </div>
            </div>

            <button
              onClick={() => setResult(null)}
              className="w-full bg-[#1E1E24] hover:bg-[#2a2a32] text-[#D8D9DC] py-3 rounded-lg font-body border border-[#454551] transition-colors"
            >
              ← Δημιούργησε νέο σχέδιο
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
