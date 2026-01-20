'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Exercise {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  parameters: Record<string, number>;
}

const gradeOptions = [
  'Ε\' Δημοτικού', 'ΣΤ\' Δημοτικού',
  'Α\' Γυμνασίου', 'Β\' Γυμνασίου', 'Γ\' Γυμνασίου',
  'Α\' Λυκείου', 'Β\' Λυκείου', 'Γ\' Λυκείου',
];

const subjectOptions = [
  { id: 'math', name: 'Μαθηματικά', icon: '🔢' },
  { id: 'physics', name: 'Φυσική', icon: '⚡' },
  { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
  { id: 'biology', name: 'Βιολογία', icon: '🧬' },
];

const exerciseTypes = [
  { id: 'equations', name: 'Εξισώσεις', subject: 'math' },
  { id: 'inequalities', name: 'Ανισώσεις', subject: 'math' },
  { id: 'fractions', name: 'Κλάσματα', subject: 'math' },
  { id: 'percentages', name: 'Ποσοστά', subject: 'math' },
  { id: 'geometry', name: 'Γεωμετρία', subject: 'math' },
  { id: 'kinematics', name: 'Κινηματική', subject: 'physics' },
  { id: 'dynamics', name: 'Δυναμική', subject: 'physics' },
  { id: 'stoichiometry', name: 'Στοιχειομετρία', subject: 'chemistry' },
];

// Demo generated exercises
const demoExercises: Exercise[] = [
  {
    id: '1',
    question: 'Να λυθεί η εξίσωση: 3x + 7 = 22',
    answer: 'x = 5',
    difficulty: 'easy',
    parameters: { a: 3, b: 7, c: 22 },
  },
  {
    id: '2',
    question: 'Να λυθεί η εξίσωση: 5x - 12 = 28',
    answer: 'x = 8',
    difficulty: 'easy',
    parameters: { a: 5, b: -12, c: 28 },
  },
  {
    id: '3',
    question: 'Να λυθεί η εξίσωση: 2x + 15 = 31',
    answer: 'x = 8',
    difficulty: 'easy',
    parameters: { a: 2, b: 15, c: 31 },
  },
  {
    id: '4',
    question: 'Να λυθεί η εξίσωση: 4x - 9 = 23',
    answer: 'x = 8',
    difficulty: 'medium',
    parameters: { a: 4, b: -9, c: 23 },
  },
  {
    id: '5',
    question: 'Να λυθεί η εξίσωση: 7x + 3 = 52',
    answer: 'x = 7',
    difficulty: 'medium',
    parameters: { a: 7, b: 3, c: 52 },
  },
];

export default function ExerciseGeneratorPage() {
  const [step, setStep] = useState(1);
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [exerciseType, setExerciseType] = useState('');
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'mixed' | 'easy' | 'medium' | 'hard'>('mixed');
  const [showAnswers, setShowAnswers] = useState(true);
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');

  const filteredTypes = exerciseTypes.filter(t => !subject || t.subject === subject);

  const generateExercises = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, this would call the API
    setExercises(demoExercises.slice(0, count));
    setStep(3);
    setLoading(false);
  };

  const regenerateExercise = (id: string) => {
    // Regenerate a single exercise with new parameters
    setExercises(prev => prev.map(ex => {
      if (ex.id === id) {
        const newA = Math.floor(Math.random() * 9) + 2;
        const newX = Math.floor(Math.random() * 10) + 1;
        const newB = Math.floor(Math.random() * 20) - 10;
        const newC = newA * newX + newB;
        return {
          ...ex,
          question: `Να λυθεί η εξίσωση: ${newA}x ${newB >= 0 ? '+' : ''} ${newB} = ${newC}`,
          answer: `x = ${newX}`,
          parameters: { a: newA, b: newB, c: newC },
        };
      }
      return ex;
    }));
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
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🔢</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-gray-800">Γεννήτρια Ασκήσεων</h1>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Νέο
                  </span>
                </div>
                <p className="text-sm text-gray-500">Exercise Generator</p>
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
        <div className="bg-green-100 rounded-2xl p-8 mb-8 text-center">
          <span className="text-4xl">🔢</span>
          <h2 className="text-2xl font-bold text-gray-800 mt-4">Γεννήτρια Ασκήσεων</h2>
          <p className="text-gray-600 mt-2">
            Δημιουργήστε παραμετρικές ασκήσεις με πολλαπλές παραλλαγές
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Subject & Type */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                Επιλέξτε τύπο άσκησης
              </h3>

              {/* Grade */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Τάξη *
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Επιλέξτε τάξη...</option>
                  {gradeOptions.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Μάθημα *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {subjectOptions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSubject(s.id)}
                      className={`p-4 rounded-xl text-center transition-all ${
                        subject === s.id
                          ? 'bg-green-100 ring-2 ring-green-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-2xl">{s.icon}</span>
                      <p className="text-sm mt-1">{s.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercise Type */}
              {subject && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Τύπος Άσκησης *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredTypes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setExerciseType(t.id)}
                        className={`p-3 rounded-xl text-left transition-all ${
                          exerciseType === t.id
                            ? 'bg-green-100 ring-2 ring-green-500'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <p className="font-medium">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Prompt */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ή περιγράψτε τι θέλετε (προαιρετικό)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="π.χ. Ασκήσεις με εξισώσεις που περιέχουν παρενθέσεις..."
                  rows={2}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {/* Continue Button */}
              <button
                onClick={() => setStep(2)}
                disabled={!grade || (!exerciseType && !customPrompt)}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  grade && (exerciseType || customPrompt)
                    ? 'bg-green-600 text-white hover:bg-green-700'
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
                <h3 className="text-lg font-semibold text-gray-800">Ρυθμίσεις</h3>
                <button onClick={() => setStep(1)} className="text-green-600 hover:underline">
                  ← Πίσω
                </button>
              </div>

              {/* Number of Exercises */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Αριθμός ασκήσεων
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <span className="w-12 text-center font-bold text-green-600">{count}</span>
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Δυσκολία
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'mixed', label: 'Μεικτή', icon: '🎲' },
                    { id: 'easy', label: 'Εύκολη', icon: '🟢' },
                    { id: 'medium', label: 'Μέτρια', icon: '🟡' },
                    { id: 'hard', label: 'Δύσκολη', icon: '🔴' },
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id as any)}
                      className={`p-3 rounded-xl text-center transition-all ${
                        difficulty === d.id
                          ? 'bg-green-100 ring-2 ring-green-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span>{d.icon}</span>
                      <p className="text-sm mt-1">{d.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Show Answers Toggle */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAnswers}
                    onChange={(e) => setShowAnswers(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="font-medium text-gray-700">Συμπερίληψη απαντήσεων</span>
                </label>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateExercises}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  loading
                    ? 'bg-gray-300 cursor-wait'
                    : 'bg-green-600 text-white hover:bg-green-700'
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
                    Δημιουργία {count} ασκήσεων...
                  </span>
                ) : (
                  `✨ Δημιουργία ${count} Ασκήσεων`
                )}
              </button>
            </motion.div>
          )}

          {/* Step 3: Results */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Ασκήσεις ({exercises.length})
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setStep(2)} 
                      className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      ← Ρυθμίσεις
                    </button>
                    <button 
                      onClick={generateExercises}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      🔄 Αναδημιουργία
                    </button>
                  </div>
                </div>

                {/* Exercises List */}
                <div className="space-y-4">
                  {exercises.map((ex, index) => (
                    <motion.div
                      key={ex.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              ex.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              ex.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {ex.difficulty === 'easy' ? 'Εύκολη' :
                               ex.difficulty === 'medium' ? 'Μέτρια' : 'Δύσκολη'}
                            </span>
                          </div>
                          <p className="text-gray-800 font-medium">{ex.question}</p>
                          {showAnswers && (
                            <p className="text-green-600 mt-2">
                              <span className="text-gray-500">Απάντηση:</span> {ex.answer}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => regenerateExercise(ex.id)}
                          className="ml-4 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Αναδημιουργία με νέες τιμές"
                        >
                          🔄
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h4 className="font-medium text-gray-800 mb-4">Εξαγωγή</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 text-center">
                    <span className="text-2xl">📄</span>
                    <p className="text-sm mt-1">PDF</p>
                  </button>
                  <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 text-center">
                    <span className="text-2xl">📝</span>
                    <p className="text-sm mt-1">Word</p>
                  </button>
                  <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 text-center">
                    <span className="text-2xl">🖨️</span>
                    <p className="text-sm mt-1">Εκτύπωση</p>
                  </button>
                  <button className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 text-center">
                    <span className="text-2xl">📋</span>
                    <p className="text-sm mt-1">Αντιγραφή</p>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
