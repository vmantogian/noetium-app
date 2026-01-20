'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface CurriculumItem {
  id: string;
  grade: string;
  subject: string;
  topic: string;
  code: string;
}

const curriculumSuggestions: CurriculumItem[] = [
  { id: '1', grade: 'Α\' Γυμνασίου', subject: 'Μαθηματικά', topic: 'Ακέραιοι αριθμοί - Πρόσθεση', code: 'ΜΑΘ.Α.1.1' },
  { id: '2', grade: 'Α\' Γυμνασίου', subject: 'Μαθηματικά', topic: 'Ακέραιοι αριθμοί - Αφαίρεση', code: 'ΜΑΘ.Α.1.2' },
  { id: '3', grade: 'Β\' Γυμνασίου', subject: 'Μαθηματικά', topic: 'Εξισώσεις πρώτου βαθμού', code: 'ΜΑΘ.Β.2.1' },
  { id: '4', grade: 'Α\' Λυκείου', subject: 'Μαθηματικά', topic: 'Ανισώσεις δευτέρου βαθμού', code: 'ΜΑΘ.Α.3.1' },
  { id: '5', grade: 'Β\' Λυκείου', subject: 'Φυσική', topic: 'Νόμοι του Νεύτωνα', code: 'ΦΥΣ.Β.1.1' },
  { id: '6', grade: 'Γ\' Γυμνασίου', subject: 'Χημεία', topic: 'Περιοδικός πίνακας', code: 'ΧΗΜ.Γ.1.1' },
];

const gradeOptions = [
  'Ε\' Δημοτικού', 'ΣΤ\' Δημοτικού',
  'Α\' Γυμνασίου', 'Β\' Γυμνασίου', 'Γ\' Γυμνασίου',
  'Α\' Λυκείου', 'Β\' Λυκείου', 'Γ\' Λυκείου',
];

const subjectOptions = [
  'Μαθηματικά', 'Φυσική', 'Χημεία', 'Βιολογία',
  'Νεοελληνική Γλώσσα', 'Αρχαία Ελληνικά', 'Ιστορία',
  'Γεωγραφία', 'Αγγλικά', 'Πληροφορική',
];

const durationOptions = ['30 λεπτά', '45 λεπτά', '60 λεπτά', '90 λεπτά'];

export default function LessonPlanPage() {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState<CurriculumItem | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState('45 λεπτά');
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);

  const filteredCurriculum = curriculumSuggestions.filter(item =>
    item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateLessonPlan = async () => {
    setLoading(true);
    
    const topic = selectedCurriculum?.topic || customTopic;
    const gradeLevel = selectedCurriculum?.grade || grade;
    
    try {
      const response = await fetch('/api/teacher/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          grade: gradeLevel,
          subject: selectedCurriculum?.subject || subject,
          duration,
          additionalContext,
          curriculumCode: selectedCurriculum?.code,
        }),
      });

      const data = await response.json();
      setLessonPlan(data.lessonPlan);
      setStep(3);
    } catch (error) {
      console.error('Error generating lesson plan:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/teacher" className="text-gray-400 hover:text-gray-600">
                ← Πίσω
              </Link>
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📝</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-800">Σχέδιο Μαθήματος</h1>
                <p className="text-sm text-gray-500">Lesson Plan</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                🖨️ Εκτύπωση
              </button>
              <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                📤 Εξαγωγή
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="bg-purple-100 rounded-2xl p-8 mb-8 text-center">
          <span className="text-4xl">📝</span>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Σχέδιο Μαθήματος</h2>
          <p className="text-gray-600 mt-2">
            Δημιουργήστε δομημένα σχέδια μαθήματος προσαρμοσμένα στο πρόγραμμα σπουδών
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-12 h-1 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Topic */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Περιγράψτε το θέμα
              </h3>
              <p className="text-gray-500 mb-4">Τι σκοπεύετε να διδάξετε;</p>

              {/* Search Input */}
              <div className="relative mb-4">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="π.χ. Εξισώσεις πρώτου βαθμού"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Curriculum Suggestions */}
              {searchQuery && (
                <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
                  {filteredCurriculum.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedCurriculum(item);
                        setSearchQuery(item.topic);
                      }}
                      className={`w-full p-4 text-left border-b border-gray-100 last:border-0 hover:bg-purple-50 transition-colors ${
                        selectedCurriculum?.id === item.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      <p className="text-xs text-gray-400 uppercase">{item.grade}</p>
                      <p className="font-medium text-purple-600">{item.topic}</p>
                      <p className="text-sm text-gray-500">{item.subject} • {item.code}</p>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedCurriculum(null);
                      setCustomTopic(searchQuery);
                    }}
                    className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <span>✨</span>
                    <span className="text-gray-600">Χρήση δικού σας περιεχομένου...</span>
                  </button>
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={() => setStep(2)}
                disabled={!searchQuery && !selectedCurriculum}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  searchQuery || selectedCurriculum
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Συνέχεια →
              </button>
            </motion.div>
          )}

          {/* Step 2: Configure */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Ρυθμίσεις Μαθήματος</h3>
                <button onClick={() => setStep(1)} className="text-purple-600 hover:underline">
                  ← Πίσω
                </button>
              </div>

              {/* Selected Topic */}
              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-500">Επιλεγμένο θέμα:</p>
                <p className="font-medium text-purple-700">
                  {selectedCurriculum?.topic || customTopic || searchQuery}
                </p>
                {selectedCurriculum && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedCurriculum.subject} • {selectedCurriculum.code}
                  </p>
                )}
              </div>

              {/* Grade (if custom topic) */}
              {!selectedCurriculum && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Τάξη *
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Επιλέξτε τάξη...</option>
                    {gradeOptions.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject (if custom topic) */}
              {!selectedCurriculum && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Μάθημα *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Επιλέξτε μάθημα...</option>
                    {subjectOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Duration */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Διάρκεια
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {durationOptions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Additional Context */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Πρόσθετες οδηγίες (προαιρετικό)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="π.χ. Οι μαθητές έχουν ήδη κατανοήσει τις βασικές πράξεις..."
                  rows={3}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateLessonPlan}
                disabled={loading || (!selectedCurriculum && (!grade || !subject))}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  loading
                    ? 'bg-gray-300 cursor-wait'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      ⏳
                    </motion.span>
                    Δημιουργία...
                  </span>
                ) : (
                  '✨ Δημιουργία Σχεδίου Μαθήματος'
                )}
              </button>
            </motion.div>
          )}

          {/* Step 3: Result */}
          {step === 3 && lessonPlan && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Σχέδιο Μαθήματος</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setStep(2)} 
                    className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                  >
                    ← Επεξεργασία
                  </button>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    📥 Αποθήκευση
                  </button>
                </div>
              </div>

              {/* Lesson Plan Content */}
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700">
                  {lessonPlan}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setLessonPlan(null);
                    setSearchQuery('');
                    setSelectedCurriculum(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
                >
                  + Νέο Σχέδιο
                </button>
                <button className="flex-1 py-3 bg-green-100 text-green-700 rounded-xl font-medium hover:bg-green-200">
                  📄 Εξαγωγή PDF
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
