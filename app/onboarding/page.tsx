'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

const GRADES = [
  { id: 'a_gymnasiou', name: 'Α\' Γυμνασίου', level: 'Γυμνάσιο' },
  { id: 'b_gymnasiou', name: 'Β\' Γυμνασίου', level: 'Γυμνάσιο' },
  { id: 'g_gymnasiou', name: 'Γ\' Γυμνασίου', level: 'Γυμνάσιο' },
  { id: 'a_lykeiou', name: 'Α\' Λυκείου', level: 'Λύκειο' },
  { id: 'b_lykeiou', name: 'Β\' Λυκείου', level: 'Λύκειο' },
  { id: 'g_lykeiou', name: 'Γ\' Λυκείου', level: 'Λύκειο' },
]

const ASSISTANT_AVATARS = [
  { id: 'owl', emoji: '🦉', name: 'Κουκουβάγια' },
  { id: 'robot', emoji: '🤖', name: 'Ρομπότ' },
  { id: 'brain', emoji: '🧠', name: 'Εγκέφαλος' },
  { id: 'rocket', emoji: '🚀', name: 'Πύραυλος' },
  { id: 'star', emoji: '⭐', name: 'Αστέρι' },
  { id: 'wizard', emoji: '🧙', name: 'Μάγος' },
]

const SUGGESTED_NAMES = ['Σοφία', 'Νους', 'Αθηνά', 'Ερμής', 'Μέντορας', 'Φώτης']

const SUBJECTS = [
  { id: 'fysiki', name: 'Φυσική', emoji: '🔬' },
  { id: 'mathimatika', name: 'Μαθηματικά', emoji: '📐' },
  { id: 'chimeia', name: 'Χημεία', emoji: '⚗️' },
  { id: 'viologia', name: 'Βιολογία', emoji: '🧬' },
  { id: 'istoria', name: 'Ιστορία', emoji: '📜' },
  { id: 'neoelliniki', name: 'Νεοελληνική', emoji: '📖' },
  { id: 'archaia', name: 'Αρχαία', emoji: '🏛️' },
  { id: 'geografia', name: 'Γεωγραφία', emoji: '🌍' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [grade, setGrade] = useState('')
  const [assistantName, setAssistantName] = useState('')
  const [assistantAvatar, setAssistantAvatar] = useState('owl')
  const [subjects, setSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const toggleSubject = (subjectId: string) => {
    setSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(s => s !== subjectId)
        : [...prev, subjectId]
    )
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Save to user profile
      const { error } = await supabase
        .from('student_profiles')
        .upsert({
          user_id: user.id,
          grade: grade,
          assistant_name: assistantName || 'Νους',
          assistant_avatar: assistantAvatar,
          favorite_subjects: subjects,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          grade: grade,
          assistant_name: assistantName || 'Νους',
          assistant_avatar: assistantAvatar,
          onboarding_completed: true,
        }
      })

      router.push('/student')
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#191308] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-8 bg-[#4EA6DC]' : s < step ? 'w-8 bg-[#4EA6DC]/50' : 'w-8 bg-[#454551]'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Grade Selection */}
        {step === 1 && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size={60} />
            </div>
            <h1 className="text-2xl font-heading font-semibold text-white mb-2">
              Καλώς ήρθες στο Noetium! 🎉
            </h1>
            <p className="text-[#D8D9DC] font-body mb-8">
              Σε ποια τάξη είσαι;
            </p>

            <div className="space-y-4 mb-8">
              <div>
                <p className="text-sm text-[#87F1FF] font-body text-left mb-2">Γυμνάσιο</p>
                <div className="grid grid-cols-3 gap-2">
                  {GRADES.filter(g => g.level === 'Γυμνάσιο').map(g => (
                    <button
                      key={g.id}
                      onClick={() => setGrade(g.id)}
                      className={`p-3 rounded-xl border transition-all font-body text-sm ${
                        grade === g.id
                          ? 'bg-[#4EA6DC]/20 border-[#4EA6DC] text-[#87F1FF]'
                          : 'bg-[#1E1E24] border-[#454551] text-[#D8D9DC] hover:border-[#4EA6DC]/50'
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm text-[#E32D91] font-body text-left mb-2">Λύκειο</p>
                <div className="grid grid-cols-3 gap-2">
                  {GRADES.filter(g => g.level === 'Λύκειο').map(g => (
                    <button
                      key={g.id}
                      onClick={() => setGrade(g.id)}
                      className={`p-3 rounded-xl border transition-all font-body text-sm ${
                        grade === g.id
                          ? 'bg-[#E32D91]/20 border-[#E32D91] text-[#E32D91]'
                          : 'bg-[#1E1E24] border-[#454551] text-[#D8D9DC] hover:border-[#E32D91]/50'
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!grade}
              className="w-full bg-gradient-to-r from-[#4EA6DC] to-[#113285] hover:from-[#87F1FF] hover:to-[#4EA6DC] disabled:from-[#454551] disabled:to-[#454551] text-white py-3 rounded-xl font-body font-medium transition-all"
            >
              Συνέχεια
            </button>
          </div>
        )}

        {/* Step 2: Customize Assistant */}
        {step === 2 && (
          <div className="text-center">
            <h1 className="text-2xl font-heading font-semibold text-white mb-2">
              Γνώρισε τον βοηθό σου! 🤖
            </h1>
            <p className="text-[#D8D9DC] font-body mb-8">
              Δώσε του ένα όνομα και διάλεξε avatar
            </p>

            {/* Avatar Selection */}
            <div className="grid grid-cols-6 gap-2 mb-6">
              {ASSISTANT_AVATARS.map(avatar => (
                <button
                  key={avatar.id}
                  onClick={() => setAssistantAvatar(avatar.id)}
                  className={`p-3 rounded-xl border transition-all text-2xl ${
                    assistantAvatar === avatar.id
                      ? 'bg-[#E32D91]/20 border-[#E32D91] scale-110'
                      : 'bg-[#1E1E24] border-[#454551] hover:border-[#E32D91]/50'
                  }`}
                  title={avatar.name}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>

            {/* Name Input */}
            <div className="mb-4">
              <input
                type="text"
                value={assistantName}
                onChange={(e) => setAssistantName(e.target.value)}
                placeholder="Δώσε όνομα στον βοηθό σου..."
                className="w-full px-4 py-3 rounded-xl border border-[#454551] bg-[#1E1E24] text-white text-center placeholder-[#454551] focus:ring-2 focus:ring-[#E32D91] focus:border-transparent font-body"
                maxLength={20}
              />
            </div>

            {/* Suggested Names */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {SUGGESTED_NAMES.map(name => (
                <button
                  key={name}
                  onClick={() => setAssistantName(name)}
                  className={`px-3 py-1 rounded-full text-sm font-body transition-all ${
                    assistantName === name
                      ? 'bg-[#E32D91] text-white'
                      : 'bg-[#1E1E24] text-[#D8D9DC] border border-[#454551] hover:border-[#E32D91]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="bg-[#1E1E24] rounded-xl p-4 mb-8 border border-[#454551]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#E32D91] to-[#C830CC] rounded-full flex items-center justify-center text-2xl">
                  {ASSISTANT_AVATARS.find(a => a.id === assistantAvatar)?.emoji}
                </div>
                <div className="text-left">
                  <p className="text-white font-body font-medium">
                    {assistantName || 'Νους'}
                  </p>
                  <p className="text-[#D8D9DC] text-sm font-body">
                    Γεια! Είμαι εδώ για να σε βοηθήσω! 👋
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-[#1E1E24] hover:bg-[#2a2a32] text-[#D8D9DC] py-3 rounded-xl font-body border border-[#454551] transition-colors"
              >
                Πίσω
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-gradient-to-r from-[#E32D91] to-[#C830CC] hover:from-[#C830CC] hover:to-[#E32D91] text-white py-3 rounded-xl font-body font-medium transition-all"
              >
                Συνέχεια
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Select Subjects */}
        {step === 3 && (
          <div className="text-center">
            <h1 className="text-2xl font-heading font-semibold text-white mb-2">
              Ποια μαθήματα σε ενδιαφέρουν; 📚
            </h1>
            <p className="text-[#D8D9DC] font-body mb-8">
              Διάλεξε τα αγαπημένα σου (μπορείς να αλλάξεις αργότερα)
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {SUBJECTS.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`p-4 rounded-xl border transition-all font-body text-left flex items-center gap-3 ${
                    subjects.includes(subject.id)
                      ? 'bg-[#4EA6DC]/20 border-[#4EA6DC] text-[#87F1FF]'
                      : 'bg-[#1E1E24] border-[#454551] text-[#D8D9DC] hover:border-[#4EA6DC]/50'
                  }`}
                >
                  <span className="text-2xl">{subject.emoji}</span>
                  <span>{subject.name}</span>
                  {subjects.includes(subject.id) && (
                    <svg className="w-5 h-5 ml-auto text-[#4EA6DC]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-[#1E1E24] hover:bg-[#2a2a32] text-[#D8D9DC] py-3 rounded-xl font-body border border-[#454551] transition-colors"
              >
                Πίσω
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#4EA6DC] to-[#113285] hover:from-[#87F1FF] hover:to-[#4EA6DC] disabled:from-[#454551] disabled:to-[#454551] text-white py-3 rounded-xl font-body font-medium transition-all"
              >
                {loading ? 'Αποθήκευση...' : 'Ας ξεκινήσουμε! 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
