'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

/**
 * Improved Student Onboarding - Multi-Step Flow
 * 
 * Step 1: Name + Birth Year + Grade (separate, auto-suggested)
 * Step 2: Choose AI Tutor name and avatar
 * Step 3: Select subjects (filtered by grade)
 * Step 4: Hobbies/interests
 * Step 5: Complete
 * 
 * Features:
 * - Age-appropriate theming (playful for young, mature for older)
 * - High-quality animated emoji avatars
 * - Greek AI tutor names
 * - Hobby selection for personalization
 */

type OnboardingStep = 'basics' | 'tutor' | 'subjects' | 'hobbies' | 'complete';

type GradeLevel = 'primary_lower' | 'primary_upper' | 'gymnasium' | 'lyceum';

interface StudentData {
  firstName: string;
  lastName: string;
  birthYear: number | null;
  grade: string;
  tutorName: string;
  tutorAvatar: string;
  favoriteSubjects: string[];
  hobbies: string[];
}

// All grades available
const ALL_GRADES = [
  { id: 'primary_1', name: 'Α\' Δημοτικού', level: 'primary_lower' },
  { id: 'primary_2', name: 'Β\' Δημοτικού', level: 'primary_lower' },
  { id: 'primary_3', name: 'Γ\' Δημοτικού', level: 'primary_lower' },
  { id: 'primary_4', name: 'Δ\' Δημοτικού', level: 'primary_upper' },
  { id: 'primary_5', name: 'Ε\' Δημοτικού', level: 'primary_upper' },
  { id: 'primary_6', name: 'ΣΤ\' Δημοτικού', level: 'primary_upper' },
  { id: 'gymnasium_1', name: 'Α\' Γυμνασίου', level: 'gymnasium' },
  { id: 'gymnasium_2', name: 'Β\' Γυμνασίου', level: 'gymnasium' },
  { id: 'gymnasium_3', name: 'Γ\' Γυμνασίου', level: 'gymnasium' },
  { id: 'lyceum_1', name: 'Α\' Λυκείου', level: 'lyceum' },
  { id: 'lyceum_2', name: 'Β\' Λυκείου', level: 'lyceum' },
  { id: 'lyceum_3', name: 'Γ\' Λυκείου', level: 'lyceum' },
];

// Birth year to suggested grade mapping (current year 2025)
const getSuggestedGrade = (birthYear: number): string => {
  const currentYear = 2025;
  const age = currentYear - birthYear;
  
  if (age <= 6) return 'primary_1';
  if (age === 7) return 'primary_2';
  if (age === 8) return 'primary_3';
  if (age === 9) return 'primary_4';
  if (age === 10) return 'primary_5';
  if (age === 11) return 'primary_6';
  if (age === 12) return 'gymnasium_1';
  if (age === 13) return 'gymnasium_2';
  if (age === 14) return 'gymnasium_3';
  if (age === 15) return 'lyceum_1';
  if (age === 16) return 'lyceum_2';
  if (age >= 17) return 'lyceum_3';
  return 'primary_1';
};

// AI Tutor options with high-quality avatars
const AI_TUTORS = [
  { 
    name: 'Αθηνά', 
    description: 'Θεά της σοφίας',
    avatar: '🦉',
    gradient: 'from-purple-500 to-indigo-600',
    animation: 'animate-pulse'
  },
  { 
    name: 'Σωκράτης', 
    description: 'Ο φιλόσοφος',
    avatar: '🏛️',
    gradient: 'from-amber-500 to-orange-600',
    animation: 'animate-bounce'
  },
  { 
    name: 'Αριστοτέλης', 
    description: 'Ο δάσκαλος',
    avatar: '📚',
    gradient: 'from-emerald-500 to-teal-600',
    animation: 'animate-pulse'
  },
  { 
    name: 'Υπατία', 
    description: 'Η μαθηματικός',
    avatar: '✨',
    gradient: 'from-pink-500 to-rose-600',
    animation: 'animate-spin-slow'
  },
  { 
    name: 'Νους', 
    description: 'Ο έξυπνος βοηθός',
    avatar: '🧠',
    gradient: 'from-blue-500 to-cyan-600',
    animation: 'animate-pulse'
  },
  { 
    name: 'Δικό μου', 
    description: 'Διάλεξε εσύ!',
    avatar: '🎨',
    gradient: 'from-violet-500 to-purple-600',
    animation: 'animate-bounce'
  },
];

// Custom avatar options for "Δικό μου"
const CUSTOM_AVATARS = ['🦊', '🐼', '🦋', '🌟', '🚀', '🎯', '💡', '🔮', '🌈', '⚡', '🎭', '🎪'];

// Subjects by grade level
const SUBJECTS_BY_LEVEL: Record<string, { id: string; name: string; icon: string }[]> = {
  primary_lower: [
    { id: 'greek_lang', name: 'Γλώσσα', icon: '📖' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'study_environment', name: 'Μελέτη Περιβάλλοντος', icon: '🌍' },
    { id: 'art', name: 'Εικαστικά', icon: '🎨' },
    { id: 'music', name: 'Μουσική', icon: '🎵' },
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'religious', name: 'Θρησκευτικά', icon: '⛪' },
  ],
  primary_upper: [
    { id: 'greek_lang', name: 'Γλώσσα', icon: '📖' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'geography', name: 'Γεωγραφία', icon: '🗺️' },
    { id: 'physics', name: 'Φυσικά', icon: '🔬' },
    { id: 'art', name: 'Εικαστικά', icon: '🎨' },
    { id: 'music', name: 'Μουσική', icon: '🎵' },
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'religious', name: 'Θρησκευτικά', icon: '⛪' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
  ],
  gymnasium: [
    { id: 'greek_lang', name: 'Νεοελληνική Γλώσσα', icon: '📖' },
    { id: 'ancient_greek', name: 'Αρχαία Ελληνικά', icon: '🏛️' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'physics', name: 'Φυσική', icon: '⚡' },
    { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
    { id: 'biology', name: 'Βιολογία', icon: '🧬' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'geography', name: 'Γεωγραφία', icon: '🗺️' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'french', name: 'Γαλλικά', icon: '🇫🇷' },
    { id: 'german', name: 'Γερμανικά', icon: '🇩🇪' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
    { id: 'art', name: 'Εικαστικά', icon: '🎨' },
    { id: 'music', name: 'Μουσική', icon: '🎵' },
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
  ],
  lyceum: [
    { id: 'greek_lang', name: 'Νεοελληνική Γλώσσα', icon: '📖' },
    { id: 'ancient_greek', name: 'Αρχαία Ελληνικά', icon: '🏛️' },
    { id: 'literature', name: 'Λογοτεχνία', icon: '📚' },
    { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢' },
    { id: 'physics', name: 'Φυσική', icon: '⚡' },
    { id: 'chemistry', name: 'Χημεία', icon: '🧪' },
    { id: 'biology', name: 'Βιολογία', icon: '🧬' },
    { id: 'history', name: 'Ιστορία', icon: '📜' },
    { id: 'english', name: 'Αγγλικά', icon: '🇬🇧' },
    { id: 'economics', name: 'Οικονομικά', icon: '💰' },
    { id: 'sociology', name: 'Κοινωνιολογία', icon: '👥' },
    { id: 'ict', name: 'Πληροφορική', icon: '💻' },
    { id: 'philosophy', name: 'Φιλοσοφία', icon: '🤔' },
    { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
  ],
};

// Hobbies
const HOBBIES = [
  { id: 'sports', name: 'Αθλητισμός', icon: '⚽' },
  { id: 'music', name: 'Μουσική', icon: '🎸' },
  { id: 'gaming', name: 'Βιντεοπαιχνίδια', icon: '🎮' },
  { id: 'reading', name: 'Διάβασμα', icon: '📚' },
  { id: 'art', name: 'Ζωγραφική', icon: '🎨' },
  { id: 'science', name: 'Επιστήμη', icon: '🔬' },
  { id: 'nature', name: 'Φύση', icon: '🌿' },
  { id: 'cooking', name: 'Μαγειρική', icon: '👨‍🍳' },
  { id: 'dance', name: 'Χορός', icon: '💃' },
  { id: 'travel', name: 'Ταξίδια', icon: '✈️' },
  { id: 'photography', name: 'Φωτογραφία', icon: '📷' },
  { id: 'coding', name: 'Προγραμματισμός', icon: '👨‍💻' },
];

// Get grade level for theming
const getGradeLevel = (grade: string): GradeLevel => {
  if (['primary_1', 'primary_2', 'primary_3'].includes(grade)) return 'primary_lower';
  if (['primary_4', 'primary_5', 'primary_6'].includes(grade)) return 'primary_upper';
  if (grade.startsWith('gymnasium')) return 'gymnasium';
  return 'lyceum';
};

// Theme configurations based on grade level
const THEMES: Record<GradeLevel, {
  gradient: string;
  cardBg: string;
  buttonGradient: string;
  accent: string;
  playful: boolean;
}> = {
  primary_lower: {
    gradient: 'from-yellow-400 via-orange-400 to-pink-500',
    cardBg: 'bg-white',
    buttonGradient: 'from-orange-500 to-pink-500',
    accent: 'text-orange-600',
    playful: true,
  },
  primary_upper: {
    gradient: 'from-green-400 via-teal-500 to-blue-500',
    cardBg: 'bg-white',
    buttonGradient: 'from-teal-500 to-blue-500',
    accent: 'text-teal-600',
    playful: true,
  },
  gymnasium: {
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    cardBg: 'bg-white',
    buttonGradient: 'from-indigo-500 to-purple-600',
    accent: 'text-indigo-600',
    playful: false,
  },
  lyceum: {
    gradient: 'from-slate-700 via-blue-800 to-indigo-900',
    cardBg: 'bg-white',
    buttonGradient: 'from-blue-600 to-indigo-700',
    accent: 'text-blue-700',
    playful: false,
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
    hobbies: [],
  });
  const [customTutorName, setCustomTutorName] = useState('');
  const [showCustomAvatars, setShowCustomAvatars] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current theme based on grade
  const gradeLevel = studentData.grade ? getGradeLevel(studentData.grade) : 'gymnasium';
  const theme = THEMES[gradeLevel];
  
  // Get subjects for current grade level
  const availableSubjects = SUBJECTS_BY_LEVEL[gradeLevel] || SUBJECTS_BY_LEVEL.gymnasium;

  // Generate birth years (1990 to current year - 5)
  const currentYear = new Date().getFullYear();
  const birthYears = Array.from({ length: currentYear - 1990 - 4 }, (_, i) => currentYear - 5 - i);

  // Handle birth year change - auto-suggest grade
  const handleBirthYearChange = (year: number) => {
    const suggestedGrade = getSuggestedGrade(year);
    setStudentData(prev => ({
      ...prev,
      birthYear: year,
      grade: suggestedGrade,
      favoriteSubjects: [], // Reset subjects when grade changes
    }));
  };

  // Handle grade change
  const handleGradeChange = (grade: string) => {
    setStudentData(prev => ({
      ...prev,
      grade,
      favoriteSubjects: [], // Reset subjects when grade changes
    }));
  };

  // Handle tutor selection
  const handleTutorSelect = (tutor: typeof AI_TUTORS[0]) => {
    if (tutor.name === 'Δικό μου') {
      setShowCustomAvatars(true);
      setStudentData(prev => ({ ...prev, tutorName: '', tutorAvatar: '' }));
    } else {
      setShowCustomAvatars(false);
      setStudentData(prev => ({ 
        ...prev, 
        tutorName: tutor.name, 
        tutorAvatar: tutor.avatar 
      }));
    }
  };

  // Handle custom avatar selection
  const handleCustomAvatar = (avatar: string) => {
    setStudentData(prev => ({ ...prev, tutorAvatar: avatar }));
  };

  // Toggle subject selection
  const toggleSubject = (subjectId: string) => {
    setStudentData(prev => ({
      ...prev,
      favoriteSubjects: prev.favoriteSubjects.includes(subjectId)
        ? prev.favoriteSubjects.filter(id => id !== subjectId)
        : [...prev.favoriteSubjects, subjectId]
    }));
  };

  // Toggle hobby selection
  const toggleHobby = (hobbyId: string) => {
    setStudentData(prev => ({
      ...prev,
      hobbies: prev.hobbies.includes(hobbyId)
        ? prev.hobbies.filter(id => id !== hobbyId)
        : [...prev.hobbies, hobbyId]
    }));
  };

  // Navigation
  const steps: OnboardingStep[] = ['basics', 'tutor', 'subjects', 'hobbies', 'complete'];
  
  const handleNext = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  // Validation
  const canProceed = () => {
    switch (step) {
      case 'basics':
        return studentData.firstName.trim() && studentData.lastName.trim() && 
               studentData.birthYear && studentData.grade;
      case 'tutor':
        return studentData.tutorName.trim() && studentData.tutorAvatar;
      case 'subjects':
        return studentData.favoriteSubjects.length > 0;
      case 'hobbies':
        return true; // Optional
      default:
        return true;
    }
  };

  // Complete onboarding
  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('No user found');

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          name: `${studentData.firstName} ${studentData.lastName}`,
          grade: studentData.grade,
          grade_level: studentData.grade,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Create student profile with tutor and hobbies
      const { error: studentError } = await supabase
        .from('student_profiles')
        .upsert({
          user_id: user.id,
          grade: studentData.grade,
          favorite_subjects: studentData.favoriteSubjects,
          tutor_name: studentData.tutorName,
          tutor_avatar: studentData.tutorAvatar,
          hobbies: studentData.hobbies,
          birth_year: studentData.birthYear,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (studentError) throw studentError;

      // Create portfolio
      const { error: portfolioError } = await supabase
        .from('portfolios')
        .insert({
          student_id: user.id,
          grade_level: studentData.grade,
        });

      if (portfolioError && portfolioError.code !== '23505') {
        console.warn('Portfolio creation warning:', portfolioError);
      }

      handleNext(); // Go to complete step
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Κάτι πήγε στραβά. Δοκίμασε ξανά.');
      setLoading(false);
    }
  };

  // Progress indicator
  const stepIndex = steps.indexOf(step);
  const progress = ((stepIndex) / (steps.length - 1)) * 100;

  // ==================== STEP 1: BASICS ====================
  if (step === 'basics') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4`}>
        <div className={`${theme.cardBg} rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl`}>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/logo.svg" alt="Noetium" width={180} height={48} className="h-12 w-auto" />
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${theme.buttonGradient} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">Βήμα 1 από 4</p>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-2 ${theme.playful ? 'animate-pulse' : ''}`}>
              {theme.playful ? '🎉 ' : ''}Γεια σου! Ας γνωριστούμε{theme.playful ? ' 🎉' : ''}
            </h1>
            <p className="text-gray-600">
              Πες μας λίγα πράγματα για σένα
            </p>
          </div>

          <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Όνομα *
                </label>
                <input
                  type="text"
                  value={studentData.firstName}
                  onChange={(e) => setStudentData({ ...studentData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all"
                  placeholder="π.χ. Μαρία"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Επώνυμο *
                </label>
                <input
                  type="text"
                  value={studentData.lastName}
                  onChange={(e) => setStudentData({ ...studentData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all"
                  placeholder="π.χ. Παπαδοπούλου"
                />
              </div>
            </div>

            {/* Birth Year and Grade - Separate Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Έτος γέννησης *
                </label>
                <select
                  value={studentData.birthYear || ''}
                  onChange={(e) => handleBirthYearChange(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all"
                >
                  <option value="">Επέλεξε έτος</option>
                  {birthYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Τάξη *
                </label>
                <select
                  value={studentData.grade}
                  onChange={(e) => handleGradeChange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 transition-all"
                >
                  <option value="">Επέλεξε τάξη</option>
                  {ALL_GRADES.map((grade) => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Auto-suggestion hint */}
            {studentData.birthYear && studentData.grade && (
              <div className={`p-4 rounded-xl ${theme.playful ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-blue-50 border-2 border-blue-200'}`}>
                <p className="text-sm text-gray-600">
                  {theme.playful ? '✨ ' : ''}
                  Με βάση το έτος γέννησής σου, προτείναμε: <strong>{ALL_GRADES.find(g => g.id === getSuggestedGrade(studentData.birthYear!))?.name}</strong>
                  {studentData.grade !== getSuggestedGrade(studentData.birthYear!) && (
                    <span className="block mt-1 text-gray-500">
                      (Μπορείς να το αλλάξεις αν είσαι σε διαφορετική τάξη)
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`w-full py-4 bg-gradient-to-r ${theme.buttonGradient} text-white text-lg font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]`}
            >
              Συνέχεια →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 2: AI TUTOR ====================
  if (step === 'tutor') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4`}>
        <div className={`${theme.cardBg} rounded-3xl p-8 md:p-12 w-full max-w-3xl shadow-2xl`}>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/logo.svg" alt="Noetium" width={180} height={48} className="h-12 w-auto" />
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${theme.buttonGradient} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">Βήμα 2 από 4</p>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-2`}>
              {theme.playful ? '🤖 ' : ''}Διάλεξε τον AI βοηθό σου{theme.playful ? ' 🤖' : ''}
            </h1>
            <p className="text-gray-600">
              Ποιος θα σε βοηθάει στη μάθηση;
            </p>
          </div>

          {/* Tutor Options */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {AI_TUTORS.map((tutor) => {
              const isSelected = studentData.tutorName === tutor.name || 
                                (tutor.name === 'Δικό μου' && showCustomAvatars);
              return (
                <button
                  key={tutor.name}
                  onClick={() => handleTutorSelect(tutor)}
                  className={`p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                    isSelected
                      ? `border-transparent bg-gradient-to-br ${tutor.gradient} text-white shadow-lg scale-105`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`text-5xl mb-3 ${isSelected ? tutor.animation : ''}`}>
                    {tutor.avatar}
                  </div>
                  <div className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {tutor.name}
                  </div>
                  <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    {tutor.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Name & Avatar */}
          {showCustomAvatars && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-6 animate-fadeIn">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Δώσε όνομα στον βοηθό σου
                </label>
                <input
                  type="text"
                  value={customTutorName}
                  onChange={(e) => {
                    setCustomTutorName(e.target.value);
                    setStudentData(prev => ({ ...prev, tutorName: e.target.value }));
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900"
                  placeholder="π.χ. Σπάρκι, Ελπίδα, Φώτης..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Διάλεξε εικονίδιο
                </label>
                <div className="flex flex-wrap gap-3">
                  {CUSTOM_AVATARS.map((avatar) => (
                    <button
                      key={avatar}
                      onClick={() => handleCustomAvatar(avatar)}
                      className={`w-14 h-14 text-3xl rounded-xl transition-all transform hover:scale-110 ${
                        studentData.tutorAvatar === avatar
                          ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg scale-110'
                          : 'bg-white border-2 border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Selected Tutor Preview */}
          {studentData.tutorName && studentData.tutorAvatar && (
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl mb-6">
              <div className="text-6xl mb-2 animate-bounce">{studentData.tutorAvatar}</div>
              <p className="text-lg font-semibold text-gray-900">
                Ο/Η <span className={theme.accent}>{studentData.tutorName}</span> θα σε βοηθάει!
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← Πίσω
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 py-4 bg-gradient-to-r ${theme.buttonGradient} text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Συνέχεια →
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
        <div className={`${theme.cardBg} rounded-3xl p-8 md:p-12 w-full max-w-3xl shadow-2xl`}>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/logo.svg" alt="Noetium" width={180} height={48} className="h-12 w-auto" />
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${theme.buttonGradient} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">Βήμα 3 από 4</p>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-2`}>
              {theme.playful ? '📚 ' : ''}Ποια μαθήματα σου αρέσουν;{theme.playful ? ' 📚' : ''}
            </h1>
            <p className="text-gray-600">
              Μαθήματα για {ALL_GRADES.find(g => g.id === studentData.grade)?.name}
            </p>
          </div>

          {/* Subjects Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {availableSubjects.map((subject) => {
              const isSelected = studentData.favoriteSubjects.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    isSelected
                      ? `border-transparent bg-gradient-to-br ${theme.buttonGradient} text-white shadow-lg`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`text-3xl mb-2 ${isSelected && theme.playful ? 'animate-bounce' : ''}`}>
                    {subject.icon}
                  </div>
                  <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {subject.name}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-center text-sm text-gray-500 mb-6">
            {studentData.favoriteSubjects.length} επιλεγμένα (τουλάχιστον 1)
          </p>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              ← Πίσω
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex-1 py-4 bg-gradient-to-r ${theme.buttonGradient} text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Συνέχεια →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 4: HOBBIES ====================
  if (step === 'hobbies') {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4`}>
        <div className={`${theme.cardBg} rounded-3xl p-8 md:p-12 w-full max-w-3xl shadow-2xl`}>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/logo.svg" alt="Noetium" width={180} height={48} className="h-12 w-auto" />
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${theme.buttonGradient} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">Βήμα 4 από 4</p>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-2`}>
              {theme.playful ? '🎯 ' : ''}Τι σου αρέσει να κάνεις;{theme.playful ? ' 🎯' : ''}
            </h1>
            <p className="text-gray-600">
              Θα χρησιμοποιήσουμε παραδείγματα από τα ενδιαφέροντά σου! (προαιρετικό)
            </p>
          </div>

          {/* Hobbies Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {HOBBIES.map((hobby) => {
              const isSelected = studentData.hobbies.includes(hobby.id);
              return (
                <button
                  key={hobby.id}
                  onClick={() => toggleHobby(hobby.id)}
                  className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                    isSelected
                      ? `border-transparent bg-gradient-to-br ${theme.buttonGradient} text-white shadow-lg`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={`text-3xl mb-2 ${isSelected && theme.playful ? 'animate-bounce' : ''}`}>
                    {hobby.icon}
                  </div>
                  <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {hobby.name}
                  </div>
                </button>
              );
            })}
          </div>

          {studentData.hobbies.length > 0 && (
            <p className="text-center text-sm text-gray-500 mb-6">
              {studentData.hobbies.length} επιλεγμένα
            </p>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              ← Πίσω
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className={`flex-1 py-4 bg-gradient-to-r ${theme.buttonGradient} text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Περίμενε...
                </>
              ) : (
                <>Ολοκλήρωση! {theme.playful ? '🎉' : '✓'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 5: COMPLETE ====================
  if (step === 'complete') {
    setTimeout(() => {
      router.push('/student');
    }, 3500);

    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4`}>
        <div className={`${theme.cardBg} rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl text-center`}>
          {/* Success Animation */}
          <div className={`text-8xl mb-6 ${theme.playful ? 'animate-bounce' : 'animate-pulse'}`}>
            {studentData.tutorAvatar}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {theme.playful ? '🎊 ' : ''}Είμαστε έτοιμοι, {studentData.firstName}!{theme.playful ? ' 🎊' : ''}
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Ο/Η <span className={`font-bold ${theme.accent}`}>{studentData.tutorName}</span> σε περιμένει!
          </p>

          <div className="space-y-3 text-left bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 text-gray-700">
              <div className={`w-6 h-6 border-2 ${theme.accent.replace('text', 'border')} border-t-transparent rounded-full animate-spin`}></div>
              <span>Φορτώνουμε τα βιβλία για {ALL_GRADES.find(g => g.id === studentData.grade)?.name}...</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className={`w-6 h-6 border-2 ${theme.accent.replace('text', 'border')} border-t-transparent rounded-full animate-spin`} style={{ animationDelay: '0.2s' }}></div>
              <span>Προετοιμάζουμε {studentData.favoriteSubjects.length} μαθήματα...</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className={`w-6 h-6 border-2 ${theme.accent.replace('text', 'border')} border-t-transparent rounded-full animate-spin`} style={{ animationDelay: '0.4s' }}></div>
              <span>Ρυθμίζουμε τον/την {studentData.tutorName}...</span>
            </div>
          </div>

          <div className={`w-16 h-16 border-4 ${theme.accent.replace('text', 'border')} border-t-transparent rounded-full animate-spin mx-auto`}></div>
        </div>
      </div>
    );
  }

  return null;
}
