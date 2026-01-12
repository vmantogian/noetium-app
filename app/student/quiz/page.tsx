'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface QuizState {
  currentQuestion: number
  answers: number[]
  showResults: boolean
}

const QUIZ_SOURCES = [
  { id: 'notes', name: 'Σημειώσεις', icon: '📝', description: 'Επικόλλησε τις σημειώσεις σου' },
  { id: 'pdf', name: 'PDF', icon: '📄', description: 'Ανέβασε αρχείο PDF' },
  { id: 'topic', name: 'Θέμα', icon: '📚', description: 'Γράψε ένα θέμα' },
  { id: 'photo', name: 'Φωτογραφία', icon: '📸', description: 'Φωτογράφισε τις σημειώσεις σου' },
]

export default function QuizMakerPage() {
  const [step, setStep] = useState<'source' | 'input' | 'settings' | 'quiz' | 'results'>('source')
  const [source, setSource] = useState('')
  const [content, setContent] = useState('')
  const [subject, setSubject] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState('medium')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    answers: [],
    showResults: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type === 'application/pdf') {
      // For PDF, we'd need to extract text - simplified for now
      setContent(`[Περιεχόμενο από: ${file.name}]`)
      setStep('settings')
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setContent(reader.result as string)
        setStep('settings')
      }
      reader.readAsDataURL(file)
    }
  }

  const generateQuiz = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          subject,
          questionCount,
          difficulty,
          source,
        }),
      })

      if (!response.ok) throw new Error('Failed to generate quiz')

      const data = await response.json()
      setQuestions(data.questions)
      setQuizState({ currentQuestion: 0, answers: [], showResults: false })
      setStep('quiz')
    } catch (error) {
      console.error('Error generating quiz:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectAnswer = (answerIndex: number) => {
    const newAnswers = [...quizState.answers]
    newAnswers[quizState.currentQuestion] = answerIndex
    setQuizState({ ...quizState, answers: newAnswers })
  }

  const nextQuestion = () => {
    if (quizState.currentQuestion < questions.length - 1) {
      setQuizState({ ...quizState, currentQuestion: quizState.currentQuestion + 1 })
    } else {
      setQuizState({ ...quizState, showResults: true })
      setStep('results')
    }
  }

  const prevQuestion = () => {
    if (quizState.currentQuestion > 0) {
      setQuizState({ ...quizState, currentQuestion: quizState.currentQuestion - 1 })
    }
  }

  const calculateScore = () => {
    let correct = 0
    questions.forEach((q, i) => {
      if (quizState.answers[i] === q.correctAnswer) correct++
    })
    return correct
  }

  const resetQuiz = () => {
    setStep('source')
    setContent('')
    setQuestions([])
    setQuizState({ currentQuestion: 0, answers: [], showResults: false })
  }

  return (
    <div className="min-h-screen bg-[#191308]">
      {/* Header */}
      <nav className="bg-[#1E1E24] border-b border-[#454551]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/student" className="flex items-center gap-2 text-[#D8D9DC] hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-body text-sm">Πίσω</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-[#C830CC]/20">📝</div>
            <span className="font-heading font-semibold text-white text-sm">AI Quiz Maker</span>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        {step !== 'quiz' && step !== 'results' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['source', 'input', 'settings'].map((s, i) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-all ${
                  s === step ? 'bg-[#C830CC]' : 
                  ['source', 'input', 'settings'].indexOf(step) > i ? 'bg-[#C830CC]/50' : 'bg-[#454551]'
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1: Select Source */}
        {step === 'source' && (
          <div className="text-center">
            <h1 className="text-2xl font-heading font-semibold text-white mb-2">
              Δημιούργησε Quiz! 🎯
            </h1>
            <p className="text-[#D8D9DC] font-body mb-8">
              Από πού θέλεις να δημιουργήσεις το quiz;
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {QUIZ_SOURCES.map(src => (
                <button
                  key={src.id}
                  onClick={() => {
                    setSource(src.id)
                    if (src.id === 'pdf' || src.id === 'photo') {
                      fileInputRef.current?.click()
                    } else {
                      setStep('input')
                    }
                  }}
                  className="p-6 rounded-xl border border-[#454551] bg-[#1E1E24] hover:border-[#C830CC] transition-all text-left group"
                >
                  <div className="text-3xl mb-3">{src.icon}</div>
                  <h3 className="font-heading font-semibold text-white mb-1">{src.name}</h3>
                  <p className="text-sm text-[#454551] font-body">{src.description}</p>
                </button>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={source === 'pdf' ? '.pdf' : 'image/*'}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Input Content */}
        {step === 'input' && (
          <div>
            <h1 className="text-2xl font-heading font-semibold text-white mb-2 text-center">
              {source === 'notes' ? 'Επικόλλησε τις σημειώσεις σου' : 'Γράψε το θέμα'}
            </h1>
            <p className="text-[#D8D9DC] font-body mb-6 text-center">
              {source === 'notes' 
                ? 'Αντίγραψε το κείμενο από τις σημειώσεις σου'
                : 'Περιέγραψε το θέμα για το οποίο θέλεις quiz'}
            </p>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={source === 'notes' 
                ? 'Επικόλλησε εδώ τις σημειώσεις σου...'
                : 'π.χ. Νόμοι της θερμοδυναμικής, Φυσική Β\' Λυκείου'}
              className="w-full h-48 px-4 py-3 rounded-xl border border-[#454551] bg-[#1E1E24] text-white placeholder-[#454551] focus:ring-2 focus:ring-[#C830CC] focus:border-transparent font-body resize-none mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep('source')}
                className="flex-1 bg-[#1E1E24] hover:bg-[#2a2a32] text-[#D8D9DC] py-3 rounded-xl font-body border border-[#454551]"
              >
                Πίσω
              </button>
              <button
                onClick={() => setStep('settings')}
                disabled={!content.trim()}
                className="flex-1 bg-gradient-to-r from-[#C830CC] to-[#E32D91] hover:from-[#E32D91] hover:to-[#C830CC] disabled:from-[#454551] disabled:to-[#454551] text-white py-3 rounded-xl font-body font-medium"
              >
                Συνέχεια
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Quiz Settings */}
        {step === 'settings' && (
          <div>
            <h1 className="text-2xl font-heading font-semibold text-white mb-2 text-center">
              Ρυθμίσεις Quiz ⚙️
            </h1>
            <p className="text-[#D8D9DC] font-body mb-8 text-center">
              Προσάρμοσε το quiz στις ανάγκες σου
            </p>

            <div className="space-y-6 mb-8">
              {/* Subject */}
              <div>
                <label className="block text-sm font-body font-medium text-[#D8D9DC] mb-2">
                  Μάθημα
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#454551] bg-[#1E1E24] text-white font-body focus:ring-2 focus:ring-[#C830CC]"
                >
                  <option value="">Αυτόματη ανίχνευση</option>
                  <option value="fysiki">Φυσική</option>
                  <option value="mathimatika">Μαθηματικά</option>
                  <option value="chimeia">Χημεία</option>
                  <option value="viologia">Βιολογία</option>
                  <option value="istoria">Ιστορία</option>
                </select>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-body font-medium text-[#D8D9DC] mb-2">
                  Αριθμός ερωτήσεων: {questionCount}
                </label>
                <input
                  type="range"
                  min="3"
                  max="15"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="w-full accent-[#C830CC]"
                />
                <div className="flex justify-between text-xs text-[#454551] font-body">
                  <span>3</span>
                  <span>15</span>
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-body font-medium text-[#D8D9DC] mb-2">
                  Δυσκολία
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'easy', name: 'Εύκολο', emoji: '😊' },
                    { id: 'medium', name: 'Μέτριο', emoji: '🤔' },
                    { id: 'hard', name: 'Δύσκολο', emoji: '😤' },
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`p-3 rounded-xl border transition-all font-body ${
                        difficulty === d.id
                          ? 'bg-[#C830CC]/20 border-[#C830CC] text-[#C830CC]'
                          : 'bg-[#1E1E24] border-[#454551] text-[#D8D9DC] hover:border-[#C830CC]/50'
                      }`}
                    >
                      <div className="text-xl mb-1">{d.emoji}</div>
                      <div className="text-sm">{d.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('input')}
                className="flex-1 bg-[#1E1E24] hover:bg-[#2a2a32] text-[#D8D9DC] py-3 rounded-xl font-body border border-[#454551]"
              >
                Πίσω
              </button>
              <button
                onClick={generateQuiz}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#C830CC] to-[#E32D91] hover:from-[#E32D91] hover:to-[#C830CC] disabled:from-[#454551] disabled:to-[#454551] text-white py-3 rounded-xl font-body font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Δημιουργία...
                  </span>
                ) : (
                  'Δημιούργησε Quiz! 🎯'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Quiz */}
        {step === 'quiz' && questions.length > 0 && (
          <div>
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#D8D9DC] font-body">
                Ερώτηση {quizState.currentQuestion + 1} από {questions.length}
              </span>
              <div className="flex gap-1">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i === quizState.currentQuestion ? 'bg-[#C830CC]' :
                      quizState.answers[i] !== undefined ? 'bg-[#4EA6DC]' : 'bg-[#454551]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-[#1E1E24] rounded-2xl border border-[#454551] p-6 mb-6">
              <h2 className="text-lg font-heading font-semibold text-white mb-6">
                {questions[quizState.currentQuestion].question}
              </h2>

              <div className="space-y-3">
                {questions[quizState.currentQuestion].options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(i)}
                    className={`w-full text-left p-4 rounded-xl border transition-all font-body ${
                      quizState.answers[quizState.currentQuestion] === i
                        ? 'bg-[#C830CC]/20 border-[#C830CC] text-white'
                        : 'bg-[#191308] border-[#454551] text-[#D8D9DC] hover:border-[#C830CC]/50'
                    }`}
                  >
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#454551] text-white text-sm mr-3">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={prevQuestion}
                disabled={quizState.currentQuestion === 0}
                className="flex-1 bg-[#1E1E24] hover:bg-[#2a2a32] disabled:opacity-50 text-[#D8D9DC] py-3 rounded-xl font-body border border-[#454551]"
              >
                ← Προηγούμενη
              </button>
              <button
                onClick={nextQuestion}
                disabled={quizState.answers[quizState.currentQuestion] === undefined}
                className="flex-1 bg-gradient-to-r from-[#C830CC] to-[#E32D91] hover:from-[#E32D91] hover:to-[#C830CC] disabled:from-[#454551] disabled:to-[#454551] text-white py-3 rounded-xl font-body font-medium"
              >
                {quizState.currentQuestion === questions.length - 1 ? 'Τέλος Quiz' : 'Επόμενη →'}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'results' && (
          <div className="text-center">
            <div className="text-6xl mb-4">
              {calculateScore() === questions.length ? '🏆' : 
               calculateScore() >= questions.length * 0.7 ? '🎉' : 
               calculateScore() >= questions.length * 0.5 ? '👍' : '💪'}
            </div>
            <h1 className="text-2xl font-heading font-semibold text-white mb-2">
              {calculateScore() === questions.length ? 'Τέλειο!' : 
               calculateScore() >= questions.length * 0.7 ? 'Πολύ καλά!' : 
               calculateScore() >= questions.length * 0.5 ? 'Καλή προσπάθεια!' : 'Συνέχισε την προσπάθεια!'}
            </h1>
            <p className="text-[#D8D9DC] font-body mb-8">
              Σκορ: <span className="text-[#C830CC] font-semibold">{calculateScore()}/{questions.length}</span>
            </p>

            {/* Review Answers */}
            <div className="space-y-4 mb-8 text-left">
              {questions.map((q, i) => {
                const isCorrect = quizState.answers[i] === q.correctAnswer
                return (
                  <div 
                    key={q.id}
                    className={`p-4 rounded-xl border ${
                      isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`text-lg ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                        {isCorrect ? '✓' : '✗'}
                      </span>
                      <p className="text-white font-body">{q.question}</p>
                    </div>
                    {!isCorrect && (
                      <p className="text-sm text-[#D8D9DC] font-body ml-6">
                        Σωστή απάντηση: <span className="text-green-400">{q.options[q.correctAnswer]}</span>
                      </p>
                    )}
                    <p className="text-xs text-[#454551] font-body ml-6 mt-1">
                      {q.explanation}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setQuizState({ currentQuestion: 0, answers: [], showResults: false })
                  setStep('quiz')
                }}
                className="flex-1 bg-[#1E1E24] hover:bg-[#2a2a32] text-[#D8D9DC] py-3 rounded-xl font-body border border-[#454551]"
              >
                Ξαναπροσπάθησε
              </button>
              <button
                onClick={resetQuiz}
                className="flex-1 bg-gradient-to-r from-[#C830CC] to-[#E32D91] hover:from-[#E32D91] hover:to-[#C830CC] text-white py-3 rounded-xl font-body font-medium"
              >
                Νέο Quiz
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
