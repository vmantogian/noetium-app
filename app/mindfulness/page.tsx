'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// TYPES
// ============================================

interface BreathingExercise {
  id: string;
  name: string;
  nameEl: string;
  description: string;
  descriptionEl: string;
  pattern: {
    inhale: number;
    hold1?: number;
    exhale: number;
    hold2?: number;
  };
  duration: number; // total seconds
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface Emotion {
  emoji: string;
  label: string;
  labelEl: string;
}

interface NewBadge {
  id: string;
  name: string;
  name_el: string;
  icon: string;
  description_el?: string;
}

// ============================================
// DATA
// ============================================

const exercises: BreathingExercise[] = [
  {
    id: 'simple',
    name: 'Simple Breathing',
    nameEl: 'Απλή Αναπνοή',
    description: 'Basic 4-4 breathing for beginners',
    descriptionEl: 'Βασική αναπνοή 4-4 για αρχάριους',
    pattern: { inhale: 4, exhale: 4 },
    duration: 60,
    difficulty: 'beginner'
  },
  {
    id: 'relaxation',
    name: '4-7-8 Relaxation',
    nameEl: 'Χαλάρωση 4-7-8',
    description: 'Deep relaxation technique',
    descriptionEl: 'Τεχνική βαθιάς χαλάρωσης',
    pattern: { inhale: 4, hold1: 7, exhale: 8 },
    duration: 120,
    difficulty: 'intermediate'
  },
  {
    id: 'box',
    name: 'Box Breathing',
    nameEl: 'Αναπνοή Κουτί',
    description: 'Equal-sided breathing for focus',
    descriptionEl: 'Ισομερής αναπνοή για συγκέντρωση',
    pattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
    duration: 120,
    difficulty: 'intermediate'
  },
  {
    id: 'energizing',
    name: 'Energizing Breath',
    nameEl: 'Ενεργητική Αναπνοή',
    description: 'Quick breathing to boost energy',
    descriptionEl: 'Γρήγορη αναπνοή για ενέργεια',
    pattern: { inhale: 2, exhale: 2 },
    duration: 60,
    difficulty: 'beginner'
  }
];

const emotions: Emotion[] = [
  { emoji: '😊', label: 'Happy', labelEl: 'Χαρούμενος/η' },
  { emoji: '😌', label: 'Calm', labelEl: 'Ήρεμος/η' },
  { emoji: '😔', label: 'Sad', labelEl: 'Λυπημένος/η' },
  { emoji: '😰', label: 'Anxious', labelEl: 'Αγχωμένος/η' },
  { emoji: '😤', label: 'Frustrated', labelEl: 'Απογοητευμένος/η' },
  { emoji: '😴', label: 'Tired', labelEl: 'Κουρασμένος/η' },
  { emoji: '🤔', label: 'Thoughtful', labelEl: 'Σκεπτικός/ή' },
  { emoji: '😁', label: 'Excited', labelEl: 'Ενθουσιασμένος/η' }
];

// ============================================
// BADGE CELEBRATION COMPONENT
// ============================================

function BadgeCelebration({ 
  badges, 
  onClose 
}: { 
  badges: NewBadge[]; 
  onClose: () => void;
}) {
  if (badges.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
      >
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Νέο Badge!
        </h2>
        <div className="space-y-3 mb-6">
          {badges.map((badge) => (
            <div key={badge.id} className="bg-purple-50 rounded-xl p-4">
              <span className="text-4xl">{badge.icon}</span>
              <p className="font-semibold text-purple-700 mt-2">
                {badge.name_el || badge.name}
              </p>
              {badge.description_el && (
                <p className="text-sm text-gray-600 mt-1">{badge.description_el}</p>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600"
        >
          Τέλεια! 🚀
        </button>
      </motion.div>
    </div>
  );
}

// ============================================
// BREATHING EXERCISE COMPONENT
// ============================================

function BreathingSession({ 
  exercise, 
  onComplete, 
  onCancel 
}: { 
  exercise: BreathingExercise;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale');
  const [countdown, setCountdown] = useState(exercise.pattern.inhale);
  const [totalTime, setTotalTime] = useState(exercise.duration);
  const [isActive, setIsActive] = useState(true);

  const getPhaseLabel = () => {
    switch (phase) {
      case 'inhale': return 'Εισπνοή';
      case 'hold1': return 'Κράτα';
      case 'exhale': return 'Εκπνοή';
      case 'hold2': return 'Κράτα';
    }
  };

  const getNextPhase = (): 'inhale' | 'hold1' | 'exhale' | 'hold2' => {
    const { pattern } = exercise;
    switch (phase) {
      case 'inhale':
        return pattern.hold1 ? 'hold1' : 'exhale';
      case 'hold1':
        return 'exhale';
      case 'exhale':
        return pattern.hold2 ? 'hold2' : 'inhale';
      case 'hold2':
        return 'inhale';
    }
  };

  const getPhaseTime = (p: string): number => {
    const { pattern } = exercise;
    switch (p) {
      case 'inhale': return pattern.inhale;
      case 'hold1': return pattern.hold1 || 0;
      case 'exhale': return pattern.exhale;
      case 'hold2': return pattern.hold2 || 0;
      default: return 4;
    }
  };

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          const nextPhase = getNextPhase();
          setPhase(nextPhase);
          return getPhaseTime(nextPhase);
        }
        return prev - 1;
      });

      setTotalTime(prev => {
        if (prev <= 1) {
          setIsActive(false);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, phase]);

  const circleSize = phase === 'inhale' || phase === 'hold1' ? 200 : 120;

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-indigo-900 to-purple-900 flex flex-col items-center justify-center z-40">
      {/* Cancel button */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 text-white/60 hover:text-white p-2"
      >
        ✕ Ακύρωση
      </button>

      {/* Exercise name */}
      <p className="text-white/60 mb-8">{exercise.nameEl}</p>

      {/* Breathing circle */}
      <div className="relative flex items-center justify-center mb-8">
        <motion.div
          animate={{ 
            width: circleSize, 
            height: circleSize,
            opacity: phase.includes('hold') ? 0.7 : 1
          }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center"
        >
          <span className="text-white text-5xl font-light">{countdown}</span>
        </motion.div>
      </div>

      {/* Phase label */}
      <motion.p
        key={phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white text-2xl font-medium mb-4"
      >
        {getPhaseLabel()}
      </motion.p>

      {/* Progress bar */}
      <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white"
          initial={{ width: '100%' }}
          animate={{ width: `${(totalTime / exercise.duration) * 100}%` }}
        />
      </div>
      <p className="text-white/60 mt-2">
        {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
      </p>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function MindfulnessPage() {
  const [view, setView] = useState<'home' | 'exercise' | 'checkin' | 'complete'>('home');
  const [selectedExercise, setSelectedExercise] = useState<BreathingExercise | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [newBadges, setNewBadges] = useState<NewBadge[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [saving, setSaving] = useState(false);

  // Fetch user's mindfulness stats
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/progress?feature=mindfulness');
      if (response.ok) {
        const data = await response.json();
        setSessionCount(data.progress?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const startExercise = (exercise: BreathingExercise) => {
    setSelectedExercise(exercise);
    setView('exercise');
  };

  const handleExerciseComplete = async () => {
    if (!selectedExercise) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: 'mindfulness',
          activity_type: 'breathing',
          activity_id: selectedExercise.id,
          completed: true,
          metadata: {
            exerciseName: selectedExercise.name,
            duration: selectedExercise.duration,
            emotion: selectedEmotion?.label
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.newBadges && data.newBadges.length > 0) {
          setNewBadges(data.newBadges);
        }
        setSessionCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setSaving(false);
    }

    setView('complete');
  };

  const handleCancel = () => {
    setSelectedExercise(null);
    setView('home');
  };

  const closeBadgeCelebration = () => {
    setNewBadges([]);
  };

  // ============================================
  // RENDER: HOME VIEW
  // ============================================
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🧘 Ενσυνειδητότητα</h1>
            <p className="text-gray-600">Ηρέμησε το μυαλό σου με ασκήσεις αναπνοής</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-green-600">{sessionCount}</p>
              <p className="text-sm text-gray-500">Συνεδρίες</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-orange-500">🔥 {currentStreak}</p>
              <p className="text-sm text-gray-500">Streak</p>
            </div>
          </div>

          {/* Emotion Check-in */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Πώς νιώθεις σήμερα;
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {emotions.map((emotion) => (
                <button
                  key={emotion.label}
                  onClick={() => setSelectedEmotion(emotion)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedEmotion?.label === emotion.label
                      ? 'bg-purple-100 ring-2 ring-purple-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">{emotion.emoji}</span>
                  <p className="text-xs text-gray-600 mt-1">{emotion.labelEl}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Exercises */}
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Ασκήσεις Αναπνοής</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {exercises.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => startExercise(exercise)}
                className="bg-white rounded-xl p-5 text-left shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{exercise.nameEl}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    exercise.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                    exercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {exercise.difficulty === 'beginner' ? 'Αρχάριο' :
                     exercise.difficulty === 'intermediate' ? 'Μέτριο' : 'Προχωρημένο'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{exercise.descriptionEl}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>⏱️ {exercise.duration}s</span>
                  <span>
                    Pattern: {exercise.pattern.inhale}
                    {exercise.pattern.hold1 ? `-${exercise.pattern.hold1}` : ''}
                    -{exercise.pattern.exhale}
                    {exercise.pattern.hold2 ? `-${exercise.pattern.hold2}` : ''}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER: EXERCISE VIEW
  // ============================================
  if (view === 'exercise' && selectedExercise) {
    return (
      <BreathingSession
        exercise={selectedExercise}
        onComplete={handleExerciseComplete}
        onCancel={handleCancel}
      />
    );
  }

  // ============================================
  // RENDER: COMPLETE VIEW
  // ============================================
  if (view === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <BadgeCelebration badges={newBadges} onClose={closeBadgeCelebration} />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Μπράβο!</h2>
          <p className="text-gray-600 mb-6">
            Ολοκλήρωσες την άσκηση αναπνοής. Συνέχισε έτσι!
          </p>

          {selectedEmotion && (
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600">Ένιωθες</p>
              <p className="text-2xl">{selectedEmotion.emoji} {selectedEmotion.labelEl}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-purple-600">{sessionCount}</p>
              <p className="text-xs text-gray-500">Συνολικές Συνεδρίες</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-orange-500">+1</p>
              <p className="text-xs text-gray-500">Σήμερα</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setSelectedExercise(null);
                setView('home');
              }}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600"
            >
              Συνέχεια
            </button>
            <button
              onClick={() => setView('home')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200"
            >
              Επιστροφή στην αρχή
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return null;
}
