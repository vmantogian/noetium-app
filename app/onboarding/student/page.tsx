'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

/**
 * Student Onboarding - Starting from Γ' Δημοτικού (8+ years old)
 * Subjects based on official Greek Ministry curriculum
 */

type OnboardingStep = 'basics' | 'tutor' | 'subjects' | 'complete';
type GradeLevel = 'primary_middle' | 'primary_upper' | 'gymnasium' | 'lyceum';

interface StudentData {
  firstName: string;
  lastName: string;
  birthYear: number | null;
  grade: string;
  tutorName: string;
  tutorAvatar: string;
  favoriteSubjects: string[];
}

// Grades starting from Γ' Δημοτικού
const ALL_GRADES = [
  { id: 'primary_3', name: 'Γ\' Δημοτικού', level: 'primary_middle' },
  { id: 'primary_4', name: 'Δ\' Δημοτικού', level: 'primary_middle' },
  { id: 'primary_5', name: 'Ε\' Δημοτικού', level: 'primary_upper' },
  { id: 'primary_6', name: 'ΣΤ\' Δημοτικού', level: 'primary_upper' },
  { id: 'gymnasium_1', name: 'Α\' Γυμνασίου', level: 'gymnasium' },
  { id: 'gymnasium_2', name: 'Β\' Γυμνασίου', level: 'gymnasium' },
  { id: 'gymnasium_3', name: 'Γ\' Γυμνασίου', level: 'gymnasium' },
  { id: 'lyceum_1', name: 'Α\' Λυκείου', level: 'lyceum' },
  { id: 'lyceum_2', name: 'Β\' Λυκείου', level: 'lyceum' },
  { id: 'lyceum_3', name: 'Γ\' Λυκείου', level: 'lyceum' },
];

// Birth year to suggested grade (2025)
const getSuggestedGrade = (birthYear: number): string => {
  const age = 2025 - birthYear;
  if (age <= 8) return 'primary_3';
  if (age === 9) return 'primary_4';
  if (age === 10) return 'primary_5';
  if (age === 11) return 'primary_6';
  if (age === 12) return 'gymnasium_1';
  if (age === 13) return 'gymnasium_2';
  if (age === 14) return 'gymnasium_3';
  if (age === 15) return 'lyceum_1';
  if (age === 16) return 'lyceum_2';
  return 'lyceum_3';
};

// AI Tutors - Simple names only
const AI_TUTORS = [
  { name: 'Αθηνά', avatar: '🦉', gradient: 'from-purple-500 to-indigo-600' },
  { name: 'Σωκράτης', avatar: '🏛️', gradient: 'from-amber-500 to-orange-600' },
  { name: 'Αριστοτέλης', avatar: '📚', gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Υπατία', avatar: '✨', gradient: 'from-pink-500 to-rose-600' },
  { name: 'Νους', avatar: '🧠', gradient: 'from-blue-500 to-cyan-600' },
  { name: 'Δικό μου', avatar: '🎨', gradient: 'from-violet-500 to-purple-600' },
];

const CUSTOM_AVATARS = ['🦊', '🐼', '🦋', '🌟', '🚀', '🎯', '💡', '🔮', '🌈', '⚡', '🎭', '🎪'];

// =====================================================
// CORRECT SUBJECTS PER GRADE - Based on Greek Curriculum
// =====================================================

const SUBJECTS_BY_GRADE: Record<string, { id: string; name: string; icon: string }[]> = {
  // Γ'-Δ' Δημοτικού - Simplified, arts combined
  primary_3: [
    { id: 'greek_lang', name: 'Γλώσσα', icon: '📖' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'environment', name: 'Μελέτη Περιβάλλοντος', icon: '🌍' },
    { id: 'religious', name: 'Θρησκευτικά', icon: '⛪' },
    { id: 'arts', name: 'Τέχνες', icon: '🎨' }, // Combined: Εικαστικά, Μουσική, Θεατρική
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
  ],
  primary_4: [
    { id: 'greek_lang', name: 'Γλώσσα', icon: '📖' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'environment', name: 'Μελέτη Περιβάλλοντος', icon: '🌍' },
    { id: 'religious', name: 'Θρησκευτικά', icon: '⛪' },
    { id: 'arts', name: 'Τέχνες', icon: '🎨' }, // Combined: Εικαστικά, Μουσική, Θεατρική
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
  ],
  // Ε'-ΣΤ' Δημοτικού - ADD Γεωγραφία, Φυσικά, Κοινωνική Αγωγή
  primary_5: [
    { id: 'greek_lang', name: 'Γλώσσα', icon: '📖' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'geography', name: 'Γεωγραφία', icon: '🗺️' },
    { id: 'physics', name: 'Φυσικά', icon: '🔬' },
    { id: 'environment', name: 'Μελέτη Περιβάλλοντος', icon: '🌍' },
    { id: 'religious', name: 'Θρησκευτικά', icon: '⛪' },
    { id: 'arts', name: 'Τέχνες', icon: '🎨' }, // Combined
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
  ],
  primary_6: [
    { id: 'greek_lang', name: 'Γλώσσα', icon: '📖' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'geography', name: 'Γεωγραφία', icon: '🗺️' },
    { id: 'physics', name: 'Φυσικά', icon: '🔬' },
    { id: 'religious', name: 'Θρησκευτικά', icon: '⛪' },
    { id: 'arts', name: 'Τέχνες', icon: '🎨' }, // Combined
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'french_german', name: '2η Ξένη Γλώσσα', icon: '🇫🇷' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
  ],
  // Γυμνάσιο
  gymnasium_1: [
    { id: 'greek_lang', name: 'Νεοελληνική Γλώσσα', icon: '📖' },
    { id: 'ancient_greek', name: 'Αρχαία Ελληνικά', icon: '🏛️' },
    { id: 'literature', name: 'Λογοτεχνία', icon: '📚' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'physics', name: 'Φυσική', icon: '⚡' },
    { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
    { id: 'biology', name: 'Βιολογία', icon: '🧬' },
    { id: 'geography', name: 'Γεωγραφία', icon: '🗺️' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'religious', name: 'Θρησκευτικά', icon: '⛪' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'french_german', name: '2η Ξένη Γλώσσα', icon: '🇫🇷' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
    { id: 'art', name: 'Εικαστικά', icon: '🎨' },
    { id: 'music', name: 'Μουσική', icon: '🎵' },
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
    { id: 'home_economics', name: 'Οικιακή Οικονομία', icon: '🏠' },
  ],
  gymnasium_2: [
    { id: 'greek_lang', name: 'Νεοελληνική Γλώσσα', icon: '📖' },
    { id: 'ancient_greek', name: 'Αρχαία Ελληνικά', icon: '🏛️' },
    { id: 'literature', name: 'Λογοτεχνία', icon: '📚' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'physics', name: 'Φυσική', icon: '⚡' },
    { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
    { id: 'biology', name: 'Βιολογία', icon: '🧬' },
    { id: 'geography', name: 'Γεωγραφία', icon: '🗺️' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'religious', name: 'Θρησκευτικά', icon: '⛪' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'french_german', name: '2η Ξένη Γλώσσα', icon: '🇫🇷' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
    { id: 'art', name: 'Εικαστικά', icon: '🎨' },
    { id: 'music', name: 'Μουσική', icon: '🎵' },
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
    { id: 'social_civic', name: 'Κοινωνική & Πολιτική Αγωγή', icon: '🏛️' },
  ],
  gymnasium_3: [
    { id: 'greek_lang', name: 'Νεοελληνική Γλώσσα', icon: '📖' },
    { id: 'ancient_greek', name: 'Αρχαία Ελληνικά', icon: '🏛️' },
    { id: 'literature', name: 'Λογοτεχνία', icon: '📚' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'physics', name: 'Φυσική', icon: '⚡' },
    { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
    { id: 'biology', name: 'Βιολογία', icon: '🧬' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'religious', name: 'Θρησκευτικά', icon: '⛪' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'french_german', name: '2η Ξένη Γλώσσα', icon: '🇫🇷' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
    { id: 'art', name: 'Εικαστικά', icon: '🎨' },
    { id: 'music', name: 'Μουσική', icon: '🎵' },
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
    { id: 'vocational', name: 'ΣΕΠ', icon: '🎯' },
  ],
  // Λύκειο
  lyceum_1: [
    { id: 'greek_lang', name: 'Νέα Ελληνικά', icon: '📖' },
    { id: 'ancient_greek', name: 'Αρχαία Ελληνικά', icon: '🏛️' },
    { id: 'literature', name: 'Λογοτεχνία', icon: '📚' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'mathematics_algebra', name: 'Άλγεβρα', icon: '🔢' },
    { id: 'mathematics_geometry', name: 'Γεωμετρία', icon: '📐' },
    { id: 'physics', name: 'Φυσική', icon: '⚡' },
    { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
    { id: 'biology', name: 'Βιολογία', icon: '🧬' },
    { id: 'religious', name: 'Θρησκευτικά', icon: '⛪' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
    { id: 'economics', name: 'Οικονομία', icon: '💰' },
    { id: 'sociology', name: 'Κοινωνιολογία', icon: '👥' },
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
  ],
  lyceum_2: [
    { id: 'greek_lang', name: 'Νέα Ελληνικά', icon: '📖' },
    { id: 'ancient_greek', name: 'Αρχαία Ελληνικά', icon: '🏛️' },
    { id: 'literature', name: 'Λογοτεχνία', icon: '📚' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'mathematics_algebra', name: 'Άλγεβρα', icon: '🔢' },
    { id: 'mathematics_geometry', name: 'Γεωμετρία', icon: '📐' },
    { id: 'physics', name: 'Φυσική', icon: '⚡' },
    { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
    { id: 'biology', name: 'Βιολογία', icon: '🧬' },
    { id: 'religious', name: 'Θρησκευτικά', icon: '⛪' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
    { id: 'latin', name: 'Λατινικά', icon: '🏛️' },
    { id: 'economics', name: 'Οικονομία', icon: '💰' },
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
  ],
  lyceum_3: [
    { id: 'greek_lang', name: 'Νέα Ελληνικά', icon: '📖' },
    { id: 'ancient_greek', name: 'Αρχαία Ελληνικά', icon: '🏛️' },
    { id: 'literature', name: 'Λογοτεχνία', icon: '📚' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'physics', name: 'Φυσική', icon: '⚡' },
    { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
    { id: 'biology', name: 'Βιολογία', icon: '🧬' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'latin', name: 'Λατινικά', icon: '🏛️' },
    { id: 'economics', name: 'Οικονομία', icon: '💰' },
    { id: 'sociology', name: 'Κοινωνιολογία', icon: '👥' },
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
  ],
};

// Get grade level for theming
const getGradeLevel = (grade: string): GradeLevel => {
  if (['primary_3', 'primary_4'].includes(grade)) return 'primary_middle';
  if (['primary_5', 'primary_6'].includes(grade)) return 'primary_upper';
  if (grade?.startsWith('gymnasium')) return 'gymnasium';
  return 'lyceum';
};

// Theme configurations
const THEMES: Record<GradeLevel, {
  gradient: string;
  buttonGradient: string;
  playful: boolean;
  fontSize: string;
  iconSize: string;
}> = {
  primary_middle: {
    gradient: 'from-yellow-400 via-orange-400 to-pink-500',
    buttonGradient: 'from-orange-500 to-pink-500',
    playful: true,
    fontSize: 'text-xl',
    iconSize: 'text-5xl',
  },
  primary_upper: {
    gradient: 'from-green-400 via-teal-500 to-blue-500',
    buttonGradient: 'from-teal-500 to-blue-500',
    playful: true,
    fontSize: 'text-lg',
    iconSize: 'text-4xl',
  },
  gymnasium: {
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    buttonGradient: 'from-indigo-500 to-purple-600',
    playful: false,
    fontSize: 'text-base',
    iconSize: 'text-3xl',
  },
  lyceum: {
    gradient: 'from-slate-700 via-blue-800 to-indigo-900',
    buttonGradient: 'from-blue-600 to-indigo-700',
    playful: false,
    fontSize: 'text-base',
    iconSize: 'text-3xl',
  },
};

export default function StudentOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('basics');
  const [studentData, setStudentData] = useState<StudentData>({
    firstName: '',
    lastName: '',
    birthYear: null,
    grade: '',
    tutorName: '',
    tutorAvatar: '',
    favoriteSubjects: [],
  });
  const [customTutorName, setCustomTutorName] = useState('');
  const [showCustomAvatars, setShowCustomAvatars] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gradeLevel = studentData.grade ? getGradeLevel(studentData.grade) : 'gymnasium';
  const theme = THEMES[gradeLevel];
  
  // Get subjects for SPECIFIC grade (not grade level!)
  const availableSubjects = SUBJECTS_BY_GRADE[studentData.grade] || [];

  // Birth years (8-18 years old)
  const birthYears = Array.from({ length: 11 }, (_, i) => 2025 - 8 - i);

  const handleBirthYearChange = (year: number) => {
    const suggestedGrade = getSuggestedGrade(year);
    setStudentData(prev => ({
      ...prev,
      birthYear: year,
      grade: suggestedGrade,
      favoriteSubjects: [], // Reset when grade changes
    }));
  };

  const handleGradeChange = (grade: string) => {
    setStudentData(prev => ({
      ...prev,
      grade,
      favoriteSubjects: [], // Reset when grade changes
    }));
  };

  const handleTutorSelect = (tutor: typeof AI_TUTORS[0]) => {
    if (tutor.name === 'Δικό μου') {
      setShowCustomAvatars(true);
      setStudentData(prev => ({ ...prev, tutorName: '', tutorAvatar: '' }));
    } else {
      setShowCustomAvatars(false);
      setStudentData(prev => ({ ...prev, tutorName: tutor.name, tutorAvatar: tutor.avatar }));
    }
  };

  const toggleSubject = (subjectId: string) => {
    setStudentData(prev => ({
      ...prev,
      favoriteSubjects: prev.favoriteSubjects.includes(subjectId)
        ? prev.favoriteSubjects.filter(id => id !== subjectId)
        : [...prev.favoriteSubjects, subjectId]
    }));
  };

  const steps: OnboardingStep[] = ['basics', 'tutor', 'subjects', 'complete'];
  const handleNext = () => {
    const idx = steps.indexOf(step);
    if (idx < steps.length - 1) setStep(steps[idx + 1]);
  };
  const handleBack = () => {
    const idx = steps.indexOf(step);
    if (idx > 0) setStep(steps[idx - 1]);
  };

  const canProceed = () => {
    switch (step) {
      case 'basics': return studentData.firstName.trim() && studentData.birthYear && studentData.grade;
      case 'tutor': return studentData.tutorName.trim() && studentData.tutorAvatar;
      case 'subjects': return studentData.favoriteSubjects.length > 0;
      default: return true;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      await supabase.from('user_profiles').update({
        name: studentData.lastName ? `${studentData.firstName} ${studentData.lastName}` : studentData.firstName,
        grade_level: studentData.grade,
        onboarding_completed: true,
      }).eq('user_id', user.id);

      await supabase.from('student_profiles').upsert({
        user_id: user.id,
        grade: studentData.grade,
        favorite_subjects: studentData.favoriteSubjects,
        tutor_name: studentData.tutorName,
        tutor_avatar: studentData.tutorAvatar,
        birth_year: studentData.birthYear,
        onboarding_completed: true,
      });

      // Create portfolio (ignore if already exists)
      try {
        await supabase.from('portfolios').insert({
          student_id: user.id,
          grade_level: studentData.grade,
        });
      } catch {
        // Ignore duplicate key errors
      }

      handleNext();
    } catch (err) {
      setError('Κάτι πήγε στραβά. Δοκίμασε ξανά.');
      setLoading(false);
    }
  };

  const progress = (steps.indexOf(step) / (steps.length - 1)) * 100;
  const gradeName = ALL_GRADES.find(g => g.id === studentData.grade)?.name || '';

  // ==================== STEP 1: BASICS ====================
  if (step === 'basics') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4`}>
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl">
          <div className="flex justify-center mb-4">
            <Link href="/">
              <Image src="/logo2.svg" alt="Noetium" width={80} height={80} className="animate-heartbeat" />
            </Link>
          </div>
          
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${theme.buttonGradient}`} style={{ width: `${progress}%` }} />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">Βήμα 1 από 3</p>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {theme.playful ? '🎉 Γεια σου!' : '👋 Καλώς ήρθες!'}
            </h1>
            <p className="text-gray-600">{theme.playful ? 'Πες μας λίγα για σένα!' : 'Ας γνωριστούμε'}</p>
          </div>

          <div className="space-y-6">
            <div className={gradeLevel === 'primary_middle' ? '' : 'grid md:grid-cols-2 gap-4'}>
              <div>
                <label className={`block font-medium text-gray-700 mb-2 ${theme.fontSize}`}>
                  {theme.playful ? 'Πώς σε λένε; 😊' : 'Όνομα *'}
                </label>
                <input
                  type="text"
                  value={studentData.firstName}
                  onChange={(e) => setStudentData({ ...studentData, firstName: e.target.value })}
                  className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 ${theme.fontSize}`}
                  placeholder={theme.playful ? 'π.χ. Μαρία' : 'Όνομα'}
                />
              </div>
              {gradeLevel !== 'primary_middle' && (
                <div>
                  <label className={`block font-medium text-gray-700 mb-2 ${theme.fontSize}`}>Επώνυμο</label>
                  <input
                    type="text"
                    value={studentData.lastName}
                    onChange={(e) => setStudentData({ ...studentData, lastName: e.target.value })}
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 ${theme.fontSize}`}
                    placeholder="Επώνυμο"
                  />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={`block font-medium text-gray-700 mb-2 ${theme.fontSize}`}>
                  {theme.playful ? 'Πότε γεννήθηκες; 🎂' : 'Έτος γέννησης *'}
                </label>
                <select
                  value={studentData.birthYear || ''}
                  onChange={(e) => handleBirthYearChange(Number(e.target.value))}
                  className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 ${theme.fontSize}`}
                >
                  <option value="">Επέλεξε</option>
                  {birthYears.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
              <div>
                <label className={`block font-medium text-gray-700 mb-2 ${theme.fontSize}`}>
                  {theme.playful ? 'Σε ποια τάξη είσαι; 🏫' : 'Τάξη *'}
                </label>
                <select
                  value={studentData.grade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 ${theme.fontSize}`}
                >
                  <option value="">Επέλεξε</option>
                  {ALL_GRADES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`w-full py-4 bg-gradient-to-r ${theme.buttonGradient} text-white ${theme.fontSize} font-semibold rounded-xl hover:opacity-90 disabled:opacity-50`}
            >
              {theme.playful ? 'Πάμε! 🚀' : 'Συνέχεια →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 2: TUTOR ====================
  if (step === 'tutor') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4`}>
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-3xl shadow-2xl">
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${theme.buttonGradient}`} style={{ width: `${progress}%` }} />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">Βήμα 2 από 3</p>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Πώς θα ήθελες να λένε τον βοηθό σου;
            </h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {AI_TUTORS.map((tutor) => {
              const isSelected = studentData.tutorName === tutor.name || (tutor.name === 'Δικό μου' && showCustomAvatars);
              return (
                <button
                  key={tutor.name}
                  onClick={() => handleTutorSelect(tutor)}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    isSelected ? `border-transparent bg-gradient-to-br ${tutor.gradient} text-white shadow-lg` : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`${theme.iconSize} mb-3 ${isSelected ? 'animate-bounce' : ''}`}>{tutor.avatar}</div>
                  <div className={`font-bold ${theme.fontSize} ${isSelected ? 'text-white' : 'text-gray-800'}`}>{tutor.name}</div>
                </button>
              );
            })}
          </div>

          {showCustomAvatars && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <input
                type="text"
                value={customTutorName}
                onChange={(e) => { setCustomTutorName(e.target.value); setStudentData(prev => ({ ...prev, tutorName: e.target.value })); }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4"
                placeholder="Όνομα βοηθού..."
              />
              <div className="flex flex-wrap gap-3">
                {CUSTOM_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    onClick={() => setStudentData(prev => ({ ...prev, tutorAvatar: avatar }))}
                    className={`w-14 h-14 text-3xl rounded-xl ${studentData.tutorAvatar === avatar ? 'bg-purple-500 shadow-lg' : 'bg-white border-2'}`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          )}

          {studentData.tutorName && studentData.tutorAvatar && (
            <div className="text-center p-6 bg-blue-50 rounded-2xl mb-6">
              <div className="text-6xl mb-2 animate-bounce">{studentData.tutorAvatar}</div>
              <p className="font-semibold">Ο/Η {studentData.tutorName} είναι έτοιμος/η!</p>
            </div>
          )}

          <div className="flex gap-4">
            <button onClick={handleBack} className="flex-1 py-4 border-2 border-gray-300 rounded-xl">← Πίσω</button>
            <button onClick={handleNext} disabled={!canProceed()} className={`flex-1 py-4 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-xl disabled:opacity-50`}>
              {theme.playful ? 'Πάμε! 🚀' : 'Συνέχεια →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 3: SUBJECTS ====================
  if (step === 'subjects') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4`}>
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-3xl shadow-2xl">
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${theme.buttonGradient}`} style={{ width: `${progress}%` }} />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">Βήμα 3 από 3</p>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {theme.playful ? '📚 Ποια μαθήματα σου αρέσουν;' : 'Αγαπημένα μαθήματα'}
            </h1>
            <p className="text-gray-600">Μαθήματα για {gradeName}</p>
          </div>

          <div className={`grid ${theme.playful ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'} gap-3 mb-6`}>
            {availableSubjects.map((subject) => {
              const isSelected = studentData.favoriteSubjects.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? `border-transparent bg-gradient-to-br ${theme.buttonGradient} text-white shadow-lg` 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`${theme.iconSize} mb-2`}>{subject.icon}</div>
                  <div className={`${theme.playful ? 'text-base' : 'text-sm'} font-semibold ${isSelected ? 'text-white' : 'text-gray-800'}`}>{subject.name}</div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-sm text-gray-500 mb-6">{studentData.favoriteSubjects.length} επιλεγμένα (τουλάχιστον 1)</p>

          {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}

          <div className="flex gap-4">
            <button onClick={handleBack} disabled={loading} className="flex-1 py-4 border-2 border-gray-300 rounded-xl disabled:opacity-50">← Πίσω</button>
            <button onClick={handleComplete} disabled={!canProceed() || loading} className={`flex-1 py-4 bg-gradient-to-r ${theme.buttonGradient} text-white rounded-xl disabled:opacity-50`}>
              {loading ? 'Περίμενε...' : 'Ας ξεκινήσουμε! 🚀'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== COMPLETE ====================
  if (step === 'complete') {
    setTimeout(() => router.push('/student'), 2500);
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4`}>
        <div className="bg-white rounded-3xl p-12 w-full max-w-2xl shadow-2xl text-center">
          <div className="text-8xl mb-6 animate-bounce">{studentData.tutorAvatar}</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎊 Μπράβο, {studentData.firstName}!</h1>
          <p className="text-xl text-gray-600 mb-8">Ο/Η {studentData.tutorName} σε περιμένει!</p>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return null;
}
