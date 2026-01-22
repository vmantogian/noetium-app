'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

export type Emotion = 
  | 'happy' | 'sad' | 'angry' | 'scared' | 'anxious' | 'calm'
  | 'excited' | 'tired' | 'confused' | 'proud' | 'grateful' 
  | 'loved' | 'frustrated' | 'hopeful' | 'lonely' | 'embarrassed';

export interface EmotionData {
  id: Emotion;
  emoji: string;
  color: string;
  labelEn: string;
  labelEl: string;
  description?: string;
  descriptionEl?: string;
}

export interface EmotionCheckInData {
  primaryEmotion: Emotion;
  intensity: number; // 1-5
  secondaryEmotion?: Emotion;
  bodyLocations: string[];
  trigger?: string;
  notes?: string;
  timestamp: Date;
}

interface EmotionCheckInProps {
  onComplete: (data: EmotionCheckInData) => void;
  onCancel?: () => void;
  locale?: 'en' | 'el';
  variant?: 'full' | 'simple' | 'quick';
  showBodyMap?: boolean;
  className?: string;
}

// ============================================================================
// Emotion Data
// ============================================================================

export const EMOTIONS: EmotionData[] = [
  { 
    id: 'happy', 
    emoji: '😊', 
    color: '#FFD93D', 
    labelEn: 'Happy', 
    labelEl: 'Χαρούμενος/η',
    descriptionEl: 'Νιώθω χαρά και ευτυχία'
  },
  { 
    id: 'sad', 
    emoji: '😢', 
    color: '#6C9BCF', 
    labelEn: 'Sad', 
    labelEl: 'Λυπημένος/η',
    descriptionEl: 'Νιώθω θλίψη'
  },
  { 
    id: 'angry', 
    emoji: '😠', 
    color: '#FF6B6B', 
    labelEn: 'Angry', 
    labelEl: 'Θυμωμένος/η',
    descriptionEl: 'Νιώθω θυμό'
  },
  { 
    id: 'scared', 
    emoji: '😨', 
    color: '#A78BFA', 
    labelEn: 'Scared', 
    labelEl: 'Φοβισμένος/η',
    descriptionEl: 'Νιώθω φόβο'
  },
  { 
    id: 'anxious', 
    emoji: '😰', 
    color: '#F97316', 
    labelEn: 'Anxious', 
    labelEl: 'Αγχωμένος/η',
    descriptionEl: 'Νιώθω άγχος ή ανησυχία'
  },
  { 
    id: 'calm', 
    emoji: '😌', 
    color: '#4ADE80', 
    labelEn: 'Calm', 
    labelEl: 'Ήρεμος/η',
    descriptionEl: 'Νιώθω γαλήνη'
  },
  { 
    id: 'excited', 
    emoji: '🤩', 
    color: '#FB7185', 
    labelEn: 'Excited', 
    labelEl: 'Ενθουσιασμένος/η',
    descriptionEl: 'Νιώθω ενθουσιασμό'
  },
  { 
    id: 'tired', 
    emoji: '😴', 
    color: '#94A3B8', 
    labelEn: 'Tired', 
    labelEl: 'Κουρασμένος/η',
    descriptionEl: 'Νιώθω κούραση'
  },
  { 
    id: 'confused', 
    emoji: '😕', 
    color: '#A1A1AA', 
    labelEn: 'Confused', 
    labelEl: 'Μπερδεμένος/η',
    descriptionEl: 'Νιώθω σύγχυση'
  },
  { 
    id: 'proud', 
    emoji: '🥹', 
    color: '#FBBF24', 
    labelEn: 'Proud', 
    labelEl: 'Περήφανος/η',
    descriptionEl: 'Νιώθω περηφάνια'
  },
  { 
    id: 'grateful', 
    emoji: '🙏', 
    color: '#34D399', 
    labelEn: 'Grateful', 
    labelEl: 'Ευγνώμων',
    descriptionEl: 'Νιώθω ευγνωμοσύνη'
  },
  { 
    id: 'loved', 
    emoji: '🥰', 
    color: '#F472B6', 
    labelEn: 'Loved', 
    labelEl: 'Αγαπημένος/η',
    descriptionEl: 'Νιώθω αγάπη'
  },
  { 
    id: 'frustrated', 
    emoji: '😤', 
    color: '#EF4444', 
    labelEn: 'Frustrated', 
    labelEl: 'Απογοητευμένος/η',
    descriptionEl: 'Νιώθω απογοήτευση'
  },
  { 
    id: 'hopeful', 
    emoji: '🌟', 
    color: '#FCD34D', 
    labelEn: 'Hopeful', 
    labelEl: 'Αισιόδοξος/η',
    descriptionEl: 'Νιώθω ελπίδα'
  },
  { 
    id: 'lonely', 
    emoji: '🥺', 
    color: '#818CF8', 
    labelEn: 'Lonely', 
    labelEl: 'Μοναχικός/η',
    descriptionEl: 'Νιώθω μοναξιά'
  },
  { 
    id: 'embarrassed', 
    emoji: '😳', 
    color: '#FDA4AF', 
    labelEn: 'Embarrassed', 
    labelEl: 'Ντροπιασμένος/η',
    descriptionEl: 'Νιώθω αμηχανία'
  }
];

// Body locations for emotion mapping
const BODY_LOCATIONS = [
  { id: 'head', labelEn: 'Head', labelEl: 'Κεφάλι', x: 50, y: 8 },
  { id: 'face', labelEn: 'Face', labelEl: 'Πρόσωπο', x: 50, y: 15 },
  { id: 'throat', labelEn: 'Throat', labelEl: 'Λαιμός', x: 50, y: 22 },
  { id: 'chest', labelEn: 'Chest', labelEl: 'Στήθος', x: 50, y: 32 },
  { id: 'stomach', labelEn: 'Stomach', labelEl: 'Στομάχι', x: 50, y: 45 },
  { id: 'hands', labelEn: 'Hands', labelEl: 'Χέρια', x: 20, y: 50 },
  { id: 'legs', labelEn: 'Legs', labelEl: 'Πόδια', x: 50, y: 75 },
  { id: 'whole_body', labelEn: 'Whole Body', labelEl: 'Όλο το σώμα', x: 85, y: 50 }
];

// ============================================================================
// Sub-Components
// ============================================================================

interface EmotionPickerProps {
  emotions: EmotionData[];
  selectedEmotion?: Emotion;
  onSelect: (emotion: Emotion) => void;
  locale: 'en' | 'el';
  variant?: 'grid' | 'wheel';
}

function EmotionPicker({ emotions, selectedEmotion, onSelect, locale, variant = 'grid' }: EmotionPickerProps) {
  if (variant === 'wheel') {
    // Circular emotion wheel
    return (
      <div className="relative w-72 h-72 mx-auto">
        {emotions.map((emotion, index) => {
          const angle = (index / emotions.length) * 2 * Math.PI - Math.PI / 2;
          const radius = 100;
          const x = 50 + radius * Math.cos(angle) * 0.9;
          const y = 50 + radius * Math.sin(angle) * 0.9;
          const isSelected = selectedEmotion === emotion.id;
          
          return (
            <motion.button
              key={emotion.id}
              className={`absolute w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-md transition-all ${
                isSelected ? 'ring-4 ring-offset-2 scale-110' : ''
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: emotion.color,
                // Use boxShadow for ring effect when selected
                boxShadow: isSelected 
                  ? `0 0 0 4px white, 0 0 0 8px ${emotion.color}` 
                  : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              onClick={() => onSelect(emotion.id)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              title={locale === 'el' ? emotion.labelEl : emotion.labelEn}
            >
              {emotion.emoji}
            </motion.button>
          );
        })}
        
        {/* Center indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-inner flex items-center justify-center">
          {selectedEmotion ? (
            <span className="text-3xl">
              {emotions.find(e => e.id === selectedEmotion)?.emoji}
            </span>
          ) : (
            <span className="text-gray-400 text-sm text-center">
              {locale === 'el' ? 'Πώς νιώθεις;' : 'How do you feel?'}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default grid layout
  return (
    <div className="grid grid-cols-4 gap-3">
      {emotions.map((emotion) => {
        const isSelected = selectedEmotion === emotion.id;
        return (
          <motion.button
            key={emotion.id}
            className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
              isSelected ? 'ring-2 ring-offset-2' : 'hover:bg-gray-50'
            }`}
            style={{
              backgroundColor: isSelected ? `${emotion.color}20` : undefined,
              // Use boxShadow instead of ringColor for the ring effect
              boxShadow: isSelected ? `0 0 0 2px ${emotion.color}` : undefined
            }}
            onClick={() => onSelect(emotion.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-3xl">{emotion.emoji}</span>
            <span className="text-xs text-gray-600">
              {locale === 'el' ? emotion.labelEl : emotion.labelEn}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Intensity Slider
// ============================================================================

interface IntensitySliderProps {
  value: number;
  onChange: (value: number) => void;
  locale: 'en' | 'el';
  color?: string;
}

function IntensitySlider({ value, onChange, locale, color = '#4ADE80' }: IntensitySliderProps) {
  const labels = {
    en: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
    el: ['Πολύ χαμηλή', 'Χαμηλή', 'Μέτρια', 'Υψηλή', 'Πολύ υψηλή']
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {[1, 2, 3, 4, 5].map((level) => (
          <motion.button
            key={level}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium transition-all ${
              value === level ? 'text-white scale-110' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: value === level ? color : undefined,
              boxShadow: value === level ? `0 4px 14px ${color}40` : undefined
            }}
            onClick={() => onChange(level)}
            whileHover={{ scale: value === level ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {level}
          </motion.button>
        ))}
      </div>
      
      <div className="text-center">
        <span className="text-sm text-gray-500">
          {labels[locale][value - 1]}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Body Map Component
// ============================================================================

interface BodyMapProps {
  selectedLocations: string[];
  onToggle: (location: string) => void;
  locale: 'en' | 'el';
  color?: string;
}

function BodyMap({ selectedLocations, onToggle, locale, color = '#4ADE80' }: BodyMapProps) {
  return (
    <div className="relative w-48 h-72 mx-auto">
      {/* Simple body silhouette using CSS */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 100 150" className="w-full h-full text-gray-200">
          {/* Head */}
          <circle cx="50" cy="15" r="12" fill="currentColor" />
          {/* Body */}
          <ellipse cx="50" cy="55" rx="20" ry="30" fill="currentColor" />
          {/* Arms */}
          <ellipse cx="22" cy="55" rx="8" ry="25" fill="currentColor" />
          <ellipse cx="78" cy="55" rx="8" ry="25" fill="currentColor" />
          {/* Legs */}
          <ellipse cx="40" cy="115" rx="10" ry="35" fill="currentColor" />
          <ellipse cx="60" cy="115" rx="10" ry="35" fill="currentColor" />
        </svg>
      </div>
      
      {/* Interactive points */}
      {BODY_LOCATIONS.map((location) => {
        const isSelected = selectedLocations.includes(location.id);
        return (
          <motion.button
            key={location.id}
            className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              isSelected ? 'text-white' : 'bg-white border-2 border-gray-300 text-gray-500'
            }`}
            style={{
              left: `${location.x}%`,
              top: `${location.y}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: isSelected ? color : undefined,
              borderColor: isSelected ? color : undefined
            }}
            onClick={() => onToggle(location.id)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            title={locale === 'el' ? location.labelEl : location.labelEn}
          >
            {isSelected ? '✓' : ''}
          </motion.button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EmotionCheckIn({
  onComplete,
  onCancel,
  locale = 'el',
  variant = 'full',
  showBodyMap = true,
  className = ''
}: EmotionCheckInProps) {
  const [step, setStep] = useState(1);
  const [primaryEmotion, setPrimaryEmotion] = useState<Emotion | undefined>();
  const [intensity, setIntensity] = useState(3);
  const [secondaryEmotion, setSecondaryEmotion] = useState<Emotion | undefined>();
  const [bodyLocations, setBodyLocations] = useState<string[]>([]);
  const [trigger, setTrigger] = useState('');
  const [notes, setNotes] = useState('');

  const selectedEmotionData = EMOTIONS.find(e => e.id === primaryEmotion);

  // Calculate total steps based on variant
  const getTotalSteps = () => {
    if (variant === 'quick') return 1;
    if (variant === 'simple') return 2;
    return showBodyMap ? 5 : 4;
  };
  const totalSteps = getTotalSteps();

  const toggleBodyLocation = (location: string) => {
    setBodyLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const canProceed = () => {
    if (step === 1) return !!primaryEmotion;
    return true;
  };

  const nextStep = () => {
    if (step === totalSteps) {
      // Complete check-in
      onComplete({
        primaryEmotion: primaryEmotion!,
        intensity,
        secondaryEmotion,
        bodyLocations,
        trigger: trigger || undefined,
        notes: notes || undefined,
        timestamp: new Date()
      });
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step === 1) {
      onCancel?.();
    } else {
      setStep(step - 1);
    }
  };

  return (
    <div className={`bg-white rounded-2xl p-6 ${className}`}>
      {/* Progress indicator */}
      {variant !== 'quick' && (
        <div className="flex gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all"
              style={{
                backgroundColor: i < step ? (selectedEmotionData?.color || '#4ADE80') : '#E5E7EB'
              }}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Primary Emotion */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-gray-800 text-center">
              {locale === 'el' ? 'Πώς νιώθεις τώρα;' : 'How are you feeling?'}
            </h2>
            <p className="text-gray-500 text-center text-sm">
              {locale === 'el' 
                ? 'Επίλεξε το συναίσθημα που σε περιγράφει καλύτερα' 
                : 'Choose the emotion that best describes you'
              }
            </p>
            
            <EmotionPicker
              emotions={EMOTIONS}
              selectedEmotion={primaryEmotion}
              onSelect={setPrimaryEmotion}
              locale={locale}
              variant={variant === 'quick' ? 'wheel' : 'grid'}
            />
          </motion.div>
        )}
        
        {/* Step 2: Intensity */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <span className="text-5xl">{selectedEmotionData?.emoji}</span>
              <h2 className="text-xl font-semibold text-gray-800 mt-2">
                {locale === 'el' ? selectedEmotionData?.labelEl : selectedEmotionData?.labelEn}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {locale === 'el' 
                  ? 'Πόσο έντονο είναι αυτό το συναίσθημα;' 
                  : 'How intense is this feeling?'
                }
              </p>
            </div>
            
            <IntensitySlider
              value={intensity}
              onChange={setIntensity}
              locale={locale}
              color={selectedEmotionData?.color}
            />
          </motion.div>
        )}
        
        {/* Step 3: Body Map (if enabled) */}
        {step === 3 && showBodyMap && variant === 'full' && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <p className="text-gray-600 text-center">
              {locale === 'el' 
                ? 'Πού νιώθεις αυτό το συναίσθημα στο σώμα σου;' 
                : 'Where do you feel this emotion in your body?'
              }
            </p>
            
            <BodyMap
              selectedLocations={bodyLocations}
              onToggle={toggleBodyLocation}
              locale={locale}
              color={selectedEmotionData?.color || '#4ADE80'}
            />
            
            {/* Selected locations chips */}
            {bodyLocations.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {bodyLocations.map(loc => {
                  const location = BODY_LOCATIONS.find(l => l.id === loc);
                  return (
                    <span
                      key={loc}
                      className="px-3 py-1 rounded-full text-sm text-white"
                      style={{ backgroundColor: selectedEmotionData?.color }}
                    >
                      {locale === 'el' ? location?.labelEl : location?.labelEn}
                    </span>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
        
        {/* Step 4: Trigger (what caused it) */}
        {step === (showBodyMap && variant === 'full' ? 4 : 3) && variant !== 'quick' && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <p className="text-gray-600 text-center">
              {locale === 'el' 
                ? 'Τι προκάλεσε αυτό το συναίσθημα; (προαιρετικό)' 
                : 'What caused this feeling? (optional)'
              }
            </p>
            
            <textarea
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder={locale === 'el' ? 'Π.χ. Ένα διαγώνισμα, μια συζήτηση...' : 'E.g., A test, a conversation...'}
              className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={3}
            />
          </motion.div>
        )}
        
        {/* Step 5: Notes */}
        {step === totalSteps && variant === 'full' && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <p className="text-gray-600 text-center">
              {locale === 'el' 
                ? 'Θέλεις να προσθέσεις κάτι άλλο;' 
                : 'Anything else you want to add?'
              }
            </p>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={locale === 'el' ? 'Γράψε ελεύθερα...' : 'Write freely...'}
              className="w-full p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              rows={4}
            />
            
            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-2">
                {locale === 'el' ? 'Σύνοψη:' : 'Summary:'}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedEmotionData?.emoji}</span>
                <div>
                  <p className="font-medium" style={{ color: selectedEmotionData?.color }}>
                    {locale === 'el' ? selectedEmotionData?.labelEl : selectedEmotionData?.labelEn}
                  </p>
                  <p className="text-sm text-gray-500">
                    {locale === 'el' ? 'Ένταση' : 'Intensity'}: {intensity}/5
                    {bodyLocations.length > 0 && ` • ${bodyLocations.length} ${locale === 'el' ? 'σημεία' : 'areas'}`}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <motion.button
          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium"
          onClick={prevStep}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {step === 1 
            ? (locale === 'el' ? 'Ακύρωση' : 'Cancel')
            : (locale === 'el' ? 'Πίσω' : 'Back')
          }
        </motion.button>
        
        <motion.button
          className={`flex-1 py-3 rounded-xl text-white font-medium transition-all ${
            canProceed() 
              ? 'bg-teal-500 hover:bg-teal-600' 
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          onClick={nextStep}
          disabled={!canProceed()}
          whileHover={canProceed() ? { scale: 1.02 } : {}}
          whileTap={canProceed() ? { scale: 0.98 } : {}}
        >
          {step === totalSteps 
            ? (locale === 'el' ? 'Ολοκλήρωση' : 'Complete')
            : (locale === 'el' ? 'Επόμενο' : 'Next')
          }
        </motion.button>
      </div>
    </div>
  );
}

// ============================================================================
// Quick Emotion Button (for daily check-ins)
// ============================================================================

interface QuickEmotionButtonProps {
  onSelect: (emotion: Emotion, intensity: number) => void;
  locale?: 'en' | 'el';
}

export function QuickEmotionButton({ onSelect, locale = 'el' }: QuickEmotionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const quickEmotions = EMOTIONS.slice(0, 6); // First 6 common emotions
  
  return (
    <div className="relative">
      <motion.button
        className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white text-2xl shadow-lg flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? '✕' : '😊'}
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-16 right-0 bg-white rounded-xl shadow-xl p-4 w-64"
          >
            <p className="text-sm text-gray-500 mb-3">
              {locale === 'el' ? 'Πώς νιώθεις τώρα;' : 'How do you feel now?'}
            </p>
            
            <div className="grid grid-cols-3 gap-2">
              {quickEmotions.map((emotion) => (
                <motion.button
                  key={emotion.id}
                  className="p-2 rounded-lg hover:bg-gray-50 flex flex-col items-center"
                  onClick={() => {
                    onSelect(emotion.id, 3);
                    setIsOpen(false);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-2xl">{emotion.emoji}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {locale === 'el' ? emotion.labelEl : emotion.labelEn}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Emotion History Display
// ============================================================================

interface EmotionHistoryProps {
  checkIns: EmotionCheckInData[];
  locale?: 'en' | 'el';
  limit?: number;
}

export function EmotionHistory({ checkIns, locale = 'el', limit = 7 }: EmotionHistoryProps) {
  const displayCheckIns = checkIns.slice(0, limit);
  
  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-800">
        {locale === 'el' ? 'Πρόσφατα Συναισθήματα' : 'Recent Feelings'}
      </h3>
      
      <div className="flex gap-2 overflow-x-auto pb-2">
        {displayCheckIns.map((checkIn, index) => {
          const emotionData = EMOTIONS.find(e => e.id === checkIn.primaryEmotion);
          const date = new Date(checkIn.timestamp);
          
          return (
            <div
              key={index}
              className="flex-shrink-0 w-16 text-center"
            >
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-2xl mb-1"
                style={{ backgroundColor: `${emotionData?.color}20` }}
              >
                {emotionData?.emoji}
              </div>
              <p className="text-xs text-gray-500">
                {date.toLocaleDateString(locale === 'el' ? 'el-GR' : 'en-US', { 
                  weekday: 'short' 
                })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default EmotionCheckIn;
