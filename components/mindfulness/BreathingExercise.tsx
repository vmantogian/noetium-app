'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

export interface BreathingPattern {
  id: string;
  name: string;
  nameEl: string;
  description: string;
  descriptionEl: string;
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  recommendedCycles: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  benefits: string[];
  benefitsEl: string[];
}

type Phase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

interface BreathingExerciseProps {
  pattern: BreathingPattern;
  cycles?: number;
  theme?: 'default' | 'nature' | 'ocean' | 'space' | 'minimal';
  locale?: 'en' | 'el';
  showGuide?: boolean;
  onComplete?: (stats: SessionStats) => void;
  onPhaseChange?: (phase: Phase) => void;
  className?: string;
}

interface SessionStats {
  patternId: string;
  completedCycles: number;
  totalDuration: number;
  completedAt: Date;
}

// ============================================================================
// Breathing Patterns Library
// ============================================================================

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    id: 'simple',
    name: 'Simple Breathing',
    nameEl: 'Απλή Αναπνοή',
    description: 'Perfect for beginners. Just breathe in and out.',
    descriptionEl: 'Ιδανική για αρχάριους. Απλά εισπνοή και εκπνοή.',
    inhale: 4,
    holdIn: 0,
    exhale: 4,
    holdOut: 0,
    recommendedCycles: 5,
    difficulty: 'beginner',
    benefits: ['Calms the mind', 'Easy to follow', 'Good for any time'],
    benefitsEl: ['Ηρεμεί το μυαλό', 'Εύκολη να ακολουθήσεις', 'Καλή για κάθε στιγμή']
  },
  {
    id: 'triangle',
    name: 'Triangle Breathing',
    nameEl: 'Τρίγωνη Αναπνοή',
    description: 'Three equal parts: inhale, hold, exhale.',
    descriptionEl: 'Τρία ίσα μέρη: εισπνοή, κράτημα, εκπνοή.',
    inhale: 3,
    holdIn: 3,
    exhale: 3,
    holdOut: 0,
    recommendedCycles: 6,
    difficulty: 'beginner',
    benefits: ['Builds focus', 'Introduces breath holding', 'Creates rhythm'],
    benefitsEl: ['Χτίζει συγκέντρωση', 'Εισάγει το κράτημα αναπνοής', 'Δημιουργεί ρυθμό']
  },
  {
    id: 'box',
    name: 'Box Breathing',
    nameEl: 'Αναπνοή Κουτί',
    description: 'Four equal parts forming a square. Used by Navy SEALs.',
    descriptionEl: 'Τέσσερα ίσα μέρη σε σχήμα τετραγώνου. Χρησιμοποιείται από ειδικές δυνάμεις.',
    inhale: 4,
    holdIn: 4,
    exhale: 4,
    holdOut: 4,
    recommendedCycles: 4,
    difficulty: 'intermediate',
    benefits: ['Reduces stress', 'Improves concentration', 'Regulates nervous system'],
    benefitsEl: ['Μειώνει το άγχος', 'Βελτιώνει τη συγκέντρωση', 'Ρυθμίζει το νευρικό σύστημα']
  },
  {
    id: 'relaxing-478',
    name: '4-7-8 Relaxing',
    nameEl: 'Χαλαρωτική 4-7-8',
    description: 'The relaxing breath. Great for sleep and anxiety.',
    descriptionEl: 'Η χαλαρωτική αναπνοή. Ιδανική για ύπνο και άγχος.',
    inhale: 4,
    holdIn: 7,
    exhale: 8,
    holdOut: 0,
    recommendedCycles: 4,
    difficulty: 'intermediate',
    benefits: ['Promotes sleep', 'Reduces anxiety', 'Natural tranquilizer'],
    benefitsEl: ['Προάγει τον ύπνο', 'Μειώνει το άγχος', 'Φυσικό ηρεμιστικό']
  },
  {
    id: 'energizing',
    name: 'Energizing Breath',
    nameEl: 'Ενεργοποιητική Αναπνοή',
    description: 'Quick breathing to boost energy and alertness.',
    descriptionEl: 'Γρήγορη αναπνοή για ενέργεια και εγρήγορση.',
    inhale: 2,
    holdIn: 0,
    exhale: 2,
    holdOut: 0,
    recommendedCycles: 10,
    difficulty: 'beginner',
    benefits: ['Increases energy', 'Improves alertness', 'Quick reset'],
    benefitsEl: ['Αυξάνει την ενέργεια', 'Βελτιώνει την εγρήγορση', 'Γρήγορη επαναφορά']
  },
  {
    id: 'calming-extended',
    name: 'Extended Exhale',
    nameEl: 'Παρατεταμένη Εκπνοή',
    description: 'Longer exhale activates the parasympathetic system.',
    descriptionEl: 'Η μακρύτερη εκπνοή ενεργοποιεί το παρασυμπαθητικό σύστημα.',
    inhale: 4,
    holdIn: 2,
    exhale: 6,
    holdOut: 2,
    recommendedCycles: 5,
    difficulty: 'intermediate',
    benefits: ['Deep relaxation', 'Activates rest response', 'Calms heart rate'],
    benefitsEl: ['Βαθιά χαλάρωση', 'Ενεργοποιεί την απόκριση ανάπαυσης', 'Ηρεμεί τους καρδιακούς παλμούς']
  }
];

// ============================================================================
// Theme Configuration
// ============================================================================

const THEMES = {
  default: {
    background: 'bg-gradient-to-b from-slate-900 to-slate-800',
    circle: {
      inhale: '#4ECDC4',
      holdIn: '#45B7D1',
      exhale: '#96CEB4',
      holdOut: '#FFEAA7'
    },
    text: 'text-white',
    secondary: 'text-slate-300'
  },
  nature: {
    background: 'bg-gradient-to-b from-green-900 to-emerald-800',
    circle: {
      inhale: '#86EFAC',
      holdIn: '#4ADE80',
      exhale: '#22C55E',
      holdOut: '#16A34A'
    },
    text: 'text-white',
    secondary: 'text-green-200'
  },
  ocean: {
    background: 'bg-gradient-to-b from-blue-900 to-cyan-800',
    circle: {
      inhale: '#67E8F9',
      holdIn: '#22D3EE',
      exhale: '#06B6D4',
      holdOut: '#0891B2'
    },
    text: 'text-white',
    secondary: 'text-cyan-200'
  },
  space: {
    background: 'bg-gradient-to-b from-purple-900 to-indigo-900',
    circle: {
      inhale: '#C4B5FD',
      holdIn: '#A78BFA',
      exhale: '#8B5CF6',
      holdOut: '#7C3AED'
    },
    text: 'text-white',
    secondary: 'text-purple-200'
  },
  minimal: {
    background: 'bg-white',
    circle: {
      inhale: '#3B82F6',
      holdIn: '#2563EB',
      exhale: '#1D4ED8',
      holdOut: '#1E40AF'
    },
    text: 'text-slate-800',
    secondary: 'text-slate-500'
  }
};

// ============================================================================
// Phase Labels
// ============================================================================

const PHASE_LABELS: Record<Phase, { en: string; el: string }> = {
  inhale: { en: 'Breathe In', el: 'Εισπνοή' },
  holdIn: { en: 'Hold', el: 'Κράτησε' },
  exhale: { en: 'Breathe Out', el: 'Εκπνοή' },
  holdOut: { en: 'Hold', el: 'Κράτησε' }
};

const PHASE_ICONS: Record<Phase, string> = {
  inhale: '↑',
  holdIn: '●',
  exhale: '↓',
  holdOut: '○'
};

// ============================================================================
// Main Component
// ============================================================================

export function BreathingExercise({
  pattern,
  cycles = pattern.recommendedCycles,
  theme = 'default',
  locale = 'el',
  showGuide = true,
  onComplete,
  onPhaseChange,
  className = ''
}: BreathingExerciseProps) {
  // State
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [phase, setPhase] = useState<Phase>('inhale');
  const [countdown, setCountdown] = useState(pattern.inhale);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [totalSeconds, setTotalSeconds] = useState(0);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  
  // Theme
  const themeConfig = THEMES[theme];
  
  // Get phase duration
  const getPhaseDuration = useCallback((p: Phase): number => {
    switch (p) {
      case 'inhale': return pattern.inhale;
      case 'holdIn': return pattern.holdIn;
      case 'exhale': return pattern.exhale;
      case 'holdOut': return pattern.holdOut;
    }
  }, [pattern]);
  
  // Get next phase (skipping phases with 0 duration)
  const getNextPhase = useCallback((currentPhase: Phase): { phase: Phase; isNewCycle: boolean } => {
    const phases: Phase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];
    let currentIndex = phases.indexOf(currentPhase);
    let isNewCycle = false;
    
    do {
      currentIndex = (currentIndex + 1) % 4;
      if (currentIndex === 0) isNewCycle = true;
    } while (getPhaseDuration(phases[currentIndex]) === 0);
    
    return { phase: phases[currentIndex], isNewCycle };
  }, [getPhaseDuration]);
  
  // Calculate circle scale based on phase
  const getCircleScale = useCallback((): number => {
    switch (phase) {
      case 'inhale': return 1.5;
      case 'holdIn': return 1.5;
      case 'exhale': return 1;
      case 'holdOut': return 1;
    }
  }, [phase]);
  
  // Handle phase transition
  const advancePhase = useCallback(() => {
    const { phase: nextPhase, isNewCycle } = getNextPhase(phase);
    
    if (isNewCycle) {
      if (currentCycle >= cycles) {
        // Exercise complete
        setIsActive(false);
        const stats: SessionStats = {
          patternId: pattern.id,
          completedCycles: cycles,
          totalDuration: totalSeconds,
          completedAt: new Date()
        };
        onComplete?.(stats);
        return;
      }
      setCurrentCycle(prev => prev + 1);
    }
    
    setPhase(nextPhase);
    setCountdown(getPhaseDuration(nextPhase));
    onPhaseChange?.(nextPhase);
  }, [phase, currentCycle, cycles, pattern.id, totalSeconds, getNextPhase, getPhaseDuration, onComplete, onPhaseChange]);
  
  // Timer effect
  useEffect(() => {
    if (!isActive || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    
    timerRef.current = setInterval(() => {
      setTotalSeconds(prev => prev + 1);
      setCountdown(prev => {
        if (prev <= 1) {
          advancePhase();
          return getPhaseDuration(phase);
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, phase, advancePhase, getPhaseDuration]);
  
  // Start exercise
  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
    setPhase('inhale');
    setCountdown(pattern.inhale);
    setCurrentCycle(1);
    setTotalSeconds(0);
    startTimeRef.current = new Date();
    onPhaseChange?.('inhale');
  };
  
  // Pause/Resume
  const handlePauseResume = () => {
    setIsPaused(prev => !prev);
  };
  
  // Stop exercise
  const handleStop = () => {
    setIsActive(false);
    setIsPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };
  
  // Calculate total exercise duration
  const totalDuration = (pattern.inhale + pattern.holdIn + pattern.exhale + pattern.holdOut) * cycles;
  
  // Get phase label
  const phaseLabel = locale === 'el' ? PHASE_LABELS[phase].el : PHASE_LABELS[phase].en;
  
  return (
    <div className={`flex flex-col items-center justify-center min-h-[500px] p-8 rounded-3xl ${themeConfig.background} ${className}`}>
      {/* Header */}
      <div className={`text-center mb-8 ${themeConfig.text}`}>
        <h2 className="text-2xl font-bold mb-2">
          {locale === 'el' ? pattern.nameEl : pattern.name}
        </h2>
        {showGuide && !isActive && (
          <p className={`text-sm ${themeConfig.secondary}`}>
            {locale === 'el' ? pattern.descriptionEl : pattern.description}
          </p>
        )}
      </div>
      
      {/* Breathing Circle */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outer pulsing ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 280,
            height: 280,
            border: `2px solid ${themeConfig.circle[phase]}`,
            opacity: 0.3
          }}
          animate={isActive && !isPaused ? {
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.1, 0.3]
          } : {}}
          transition={{
            duration: getPhaseDuration(phase),
            ease: 'easeInOut',
            repeat: Infinity
          }}
        />
        
        {/* Glow effect */}
        <motion.div
          className="absolute rounded-full blur-2xl"
          style={{
            width: 200,
            height: 200,
            backgroundColor: themeConfig.circle[phase]
          }}
          animate={{
            opacity: isActive ? [0.2, 0.4, 0.2] : 0.2,
            scale: isActive ? getCircleScale() : 1
          }}
          transition={{
            duration: getPhaseDuration(phase),
            ease: phase === 'exhale' || phase === 'holdOut' ? 'easeOut' : 'easeIn'
          }}
        />
        
        {/* Main breathing circle */}
        <motion.div
          className="relative rounded-full flex items-center justify-center shadow-2xl"
          style={{
            width: 200,
            height: 200,
            backgroundColor: themeConfig.circle[phase]
          }}
          animate={{
            scale: isActive ? getCircleScale() : 1
          }}
          transition={{
            duration: getPhaseDuration(phase),
            ease: phase === 'exhale' || phase === 'holdOut' ? 'easeOut' : 'easeIn'
          }}
        >
          {/* Inner content */}
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-white"
              >
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl font-light mb-1"
                >
                  {phaseLabel}
                </motion.p>
                <p className="text-5xl font-bold">{countdown}</p>
                <p className="text-2xl mt-1">{PHASE_ICONS[phase]}</p>
              </motion.div>
            ) : (
              <motion.div
                key="inactive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-white"
              >
                <p className="text-lg opacity-80">
                  {locale === 'el' ? 'Πάτησε για να ξεκινήσεις' : 'Tap to start'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Pattern visualization */}
      {showGuide && (
        <div className={`flex items-center gap-2 mb-6 ${themeConfig.secondary} text-sm`}>
          <span>{locale === 'el' ? 'Εισπνοή' : 'In'}: {pattern.inhale}s</span>
          {pattern.holdIn > 0 && (
            <span>• {locale === 'el' ? 'Κράτημα' : 'Hold'}: {pattern.holdIn}s</span>
          )}
          <span>• {locale === 'el' ? 'Εκπνοή' : 'Out'}: {pattern.exhale}s</span>
          {pattern.holdOut > 0 && (
            <span>• {locale === 'el' ? 'Κράτημα' : 'Hold'}: {pattern.holdOut}s</span>
          )}
        </div>
      )}
      
      {/* Cycle progress */}
      {isActive && (
        <div className="flex gap-2 mb-6">
          {Array.from({ length: cycles }).map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: i < currentCycle 
                  ? themeConfig.circle.inhale 
                  : 'rgba(255,255,255,0.3)'
              }}
              animate={i === currentCycle - 1 ? {
                scale: [1, 1.2, 1]
              } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
          ))}
        </div>
      )}
      
      {/* Controls */}
      <div className="flex gap-4">
        {!isActive ? (
          <motion.button
            className="px-8 py-4 rounded-full text-white text-lg font-medium shadow-lg"
            style={{ backgroundColor: themeConfig.circle.inhale }}
            onClick={handleStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {locale === 'el' ? 'Ξεκίνα' : 'Start'}
          </motion.button>
        ) : (
          <>
            <motion.button
              className="px-6 py-3 rounded-full text-white font-medium"
              style={{ backgroundColor: isPaused ? themeConfig.circle.inhale : themeConfig.circle.holdIn }}
              onClick={handlePauseResume}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPaused 
                ? (locale === 'el' ? 'Συνέχισε' : 'Resume')
                : (locale === 'el' ? 'Παύση' : 'Pause')
              }
            </motion.button>
            <motion.button
              className="px-6 py-3 rounded-full bg-red-500/80 text-white font-medium"
              onClick={handleStop}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {locale === 'el' ? 'Τέλος' : 'Stop'}
            </motion.button>
          </>
        )}
      </div>
      
      {/* Duration info */}
      {!isActive && (
        <p className={`mt-4 text-sm ${themeConfig.secondary}`}>
          {locale === 'el' 
            ? `${cycles} κύκλοι • ~${Math.ceil(totalDuration / 60)} λεπτά`
            : `${cycles} cycles • ~${Math.ceil(totalDuration / 60)} minutes`
          }
        </p>
      )}
      
      {/* Active duration */}
      {isActive && (
        <p className={`mt-4 text-sm ${themeConfig.secondary}`}>
          {Math.floor(totalSeconds / 60)}:{(totalSeconds % 60).toString().padStart(2, '0')}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Pattern Selector Component
// ============================================================================

interface PatternSelectorProps {
  patterns?: BreathingPattern[];
  selectedId?: string;
  onSelect: (pattern: BreathingPattern) => void;
  locale?: 'en' | 'el';
  className?: string;
}

export function BreathingPatternSelector({
  patterns = BREATHING_PATTERNS,
  selectedId,
  onSelect,
  locale = 'el',
  className = ''
}: PatternSelectorProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {patterns.map((pattern) => (
        <motion.button
          key={pattern.id}
          className={`p-4 rounded-xl text-left transition-all ${
            selectedId === pattern.id
              ? 'bg-teal-500 text-white shadow-lg'
              : 'bg-white hover:bg-gray-50 border border-gray-200'
          }`}
          onClick={() => onSelect(pattern)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">
              {locale === 'el' ? pattern.nameEl : pattern.name}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${
              selectedId === pattern.id
                ? 'bg-white/20'
                : pattern.difficulty === 'beginner'
                  ? 'bg-green-100 text-green-700'
                  : pattern.difficulty === 'intermediate'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
            }`}>
              {pattern.difficulty === 'beginner' 
                ? (locale === 'el' ? 'Αρχάριο' : 'Beginner')
                : pattern.difficulty === 'intermediate'
                  ? (locale === 'el' ? 'Μεσαίο' : 'Intermediate')
                  : (locale === 'el' ? 'Προχωρημένο' : 'Advanced')
              }
            </span>
          </div>
          
          <p className={`text-sm mb-3 ${
            selectedId === pattern.id ? 'text-white/80' : 'text-gray-600'
          }`}>
            {locale === 'el' ? pattern.descriptionEl : pattern.description}
          </p>
          
          <div className={`flex gap-2 text-xs ${
            selectedId === pattern.id ? 'text-white/70' : 'text-gray-500'
          }`}>
            <span>{pattern.inhale}s</span>
            {pattern.holdIn > 0 && <span>• {pattern.holdIn}s</span>}
            <span>• {pattern.exhale}s</span>
            {pattern.holdOut > 0 && <span>• {pattern.holdOut}s</span>}
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default BreathingExercise;
