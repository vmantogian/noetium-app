'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * OPTION 1: "MAGICAL JOURNEY" - Gamified Multi-Step Onboarding
 * 
 * Philosophy: Make onboarding feel like beginning an adventure
 * Best for: Younger students (Primary 1-6, Gymnasium)
 * 
 * Flow:
 * 1. Welcome Screen - Animated Νους introduces itself
 * 2. Name & Identity - Friendly form
 * 3. Birth Year Selector - Visual year picker (auto-calculates grade)
 * 4. Grade Confirmation - Shows grade with celebration
 * 5. Subject Interests - Visual grid with icons
 * 6. Learning Goals - Simple question
 * 7. Ready to Start - Celebration screen
 */

type OnboardingStep = 'welcome' | 'name' | 'birth_year' | 'grade_confirm' | 'subjects' | 'goals' | 'complete';

interface StudentData {
  firstName: string;
  lastName: string;
  birthYear: number | null;
  grade: string | null;
  favoriteSubjects: string[];
  learningGoal: string;
}

const GRADE_MAPPING: Record<number, { grade: string; displayName: string }> = {
  2018: { grade: 'primary_1', displayName: 'Α\' Δημοτικού' },
  2017: { grade: 'primary_2', displayName: 'Β\' Δημοτικού' },
  2016: { grade: 'primary_3', displayName: 'Γ\' Δημοτικού' },
  2015: { grade: 'primary_4', displayName: 'Δ\' Δημοτικού' },
  2014: { grade: 'primary_5', displayName: 'Ε\' Δημοτικού' },
  2013: { grade: 'primary_6', displayName: 'ΣΤ\' Δημοτικού' },
  2012: { grade: 'gymnasium_1', displayName: 'Α\' Γυμνασίου' },
  2011: { grade: 'gymnasium_2', displayName: 'Β\' Γυμνασίου' },
  2010: { grade: 'gymnasium_3', displayName: 'Γ\' Γυμνασίου' },
  2009: { grade: 'lyceum_1', displayName: 'Α\' Λυκείου' },
  2008: { grade: 'lyceum_2', displayName: 'Β\' Λυκείου' },
  2007: { grade: 'lyceum_3', displayName: 'Γ\' Λυκείου' },
};

const SUBJECTS = [
  { id: 'mathematics', name: 'Μαθηματικά', icon: '🔢', color: '#FF6B35' },
  { id: 'greek_lang', name: 'Γλώσσα', icon: '📖', color: '#2A50DF' },
  { id: 'history', name: 'Ιστορία', icon: '📜', color: '#8B4513' },
  { id: 'physics', name: 'Φυσική', icon: '⚡', color: '#3498DB' },
  { id: 'chemistry', name: 'Χημεία', icon: '🧪', color: '#9B59B6' },
  { id: 'biology', name: 'Βιολογία', icon: '🧬', color: '#27AE60' },
  { id: 'geography', name: 'Γεωγραφία', icon: '🗺️', color: '#16A085' },
  { id: 'english', name: 'Αγγλικά', icon: '🇬🇧', color: '#C8102E' },
  { id: 'art', name: 'Εικαστικά', icon: '🎨', color: '#E74C3C' },
  { id: 'music', name: 'Μουσική', icon: '🎵', color: '#F39C12' },
  { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽', color: '#1ABC9C' },
  { id: 'ict', name: 'Πληροφορική', icon: '💻', color: '#3498DB' },
];

export default function MagicalJourneyOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [studentData, setStudentData] = useState<StudentData>({
    firstName: '',
    lastName: '',
    birthYear: null,
    grade: null,
    favoriteSubjects: [],
    learningGoal: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    const steps: OnboardingStep[] = ['welcome', 'name', 'birth_year', 'grade_confirm', 'subjects', 'goals', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: OnboardingStep[] = ['welcome', 'name', 'birth_year', 'grade_confirm', 'subjects', 'goals', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleBirthYearSelect = (year: number) => {
    const gradeInfo = GRADE_MAPPING[year];
    setStudentData({
      ...studentData,
      birthYear: year,
      grade: gradeInfo?.grade || null,
    });
    setTimeout(() => handleNext(), 300);
  };

  const toggleSubject = (subjectId: string) => {
    setStudentData(prev => ({
      ...prev,
      favoriteSubjects: prev.favoriteSubjects.includes(subjectId)
        ? prev.favoriteSubjects.filter(id => id !== subjectId)
        : [...prev.favoriteSubjects, subjectId]
    }));
  };

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

      // Create student profile
      const { error: studentError } = await supabase
        .from('student_profiles')
        .upsert({
          user_id: user.id,
          grade: studentData.grade,
          favorite_subjects: studentData.favoriteSubjects,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (studentError) throw studentError;

      // Create portfolio
      const { error: portfolioError } = await supabase
        .from('portfolios')
        .insert({
          student_id: user.id,
          grade_level: studentData.grade!,
        });

      if (portfolioError && portfolioError.code !== '23505') {
        console.warn('Portfolio creation warning:', portfolioError);
      }

      // Save learning goal if provided
      if (studentData.learningGoal.trim()) {
        try {
          const { data: portfolio } = await supabase
            .from('portfolios')
            .select('id')
            .eq('student_id', user.id)
            .single();

          if (portfolio) {
            await supabase
              .from('learning_goals')
              .insert({
                portfolio_id: portfolio.id,
                title: studentData.learningGoal,
                title_el: studentData.learningGoal,
                status: 'in_progress',
              });
          }
        } catch (goalErr) {
          console.warn('Learning goal save warning:', goalErr);
        }
      }

      handleNext();
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Κάτι πήγε στραβά. Δοκίμασε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'name':
        return studentData.firstName.trim() && studentData.lastName.trim();
      case 'birth_year':
        return studentData.birthYear !== null;
      case 'subjects':
        return studentData.favoriteSubjects.length > 0;
      default:
        return true;
    }
  };

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl text-center">
          <div className="mb-6 animate-bounce">
            <div className="text-9xl">🦉</div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Γεια σου! Είμαι ο Νους! 👋
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Θα σε συνοδεύσω στο ταξίδι της μάθησης. Είμαι εδώ να σε βοηθήσω να ανακαλύψεις νέα πράγματα, να λύσεις απορίες και να γίνεις καλύτερος κάθε μέρα! 🌟
          </p>

          <button
            onClick={handleNext}
            className="px-8 py-4 bg-[#2A50DF] text-white text-lg font-semibold rounded-xl hover:bg-[#1E3DB8] transition-all transform hover:scale-105 shadow-lg"
          >
            Ας ξεκινήσουμε! 🚀
          </button>
        </div>
      </div>
    );
  }

  // Name Screen
  if (step === 'name') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl">
          <div className="text-6xl mb-6 text-center">🦉</div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Πώς σε λένε;
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Χαίρομαι που σε γνωρίζω!
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Όνομα
              </label>
              <input
                type="text"
                value={studentData.firstName}
                onChange={(e) => setStudentData({ ...studentData, firstName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A50DF] focus:border-[#2A50DF] text-lg text-gray-900"
                placeholder="π.χ. Μαρία"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Επώνυμο
              </label>
              <input
                type="text"
                value={studentData.lastName}
                onChange={(e) => setStudentData({ ...studentData, lastName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A50DF] focus:border-[#2A50DF] text-lg text-gray-900"
                placeholder="π.χ. Παπαδοπούλου"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Πίσω
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 px-6 py-3 bg-[#2A50DF] text-white font-semibold rounded-xl hover:bg-[#1E3DB8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Συνέχεια →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Birth Year Screen
  if (step === 'birth_year') {
    const years = Object.keys(GRADE_MAPPING).map(Number).sort((a, b) => b - a);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl">
          <div className="text-6xl mb-6 text-center">🎂</div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Πότε γεννήθηκες;
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Επέλεξε το έτος γέννησής σου
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => handleBirthYearSelect(year)}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-[#2A50DF] hover:bg-blue-50 transition-all text-center group"
              >
                <div className="text-3xl font-bold text-gray-900 group-hover:text-[#2A50DF]">
                  {year}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {GRADE_MAPPING[year].displayName}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleBack}
            className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Πίσω
          </button>
        </div>
      </div>
    );
  }

  // Grade Confirmation Screen
  if (step === 'grade_confirm') {
    const gradeInfo = studentData.birthYear ? GRADE_MAPPING[studentData.birthYear] : null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl text-center">
          <div className="text-9xl mb-6 animate-bounce">🎉</div>
          
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Τέλεια!
          </h2>
          <p className="text-2xl text-gray-700 mb-2">
            Άρα είσαι στην
          </p>
          <div className="inline-block px-8 py-4 bg-gradient-to-r from-[#2A50DF] to-[#25A1B0] text-white text-3xl font-bold rounded-2xl mb-8">
            {gradeInfo?.displayName}
          </div>

          <p className="text-lg text-gray-600 mb-8">
            Υπέροχα! Θα προετοιμάσω το περιβάλλον σου με το κατάλληλο περιεχόμενο για την τάξη σου! 📚
          </p>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Πίσω
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-3 bg-[#2A50DF] text-white font-semibold rounded-xl hover:bg-[#1E3DB8] transition-colors"
            >
              Συνέχεια →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Subjects Screen
  if (step === 'subjects') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-3xl shadow-2xl">
          <div className="text-6xl mb-6 text-center">❤️</div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Ποια μαθήματα σου αρέσουν;
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Επέλεξε τα αγαπημένα σου (τουλάχιστον 1)
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {SUBJECTS.map((subject) => {
              const isSelected = studentData.favoriteSubjects.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-[#2A50DF] bg-blue-50 scale-105 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  style={isSelected ? { borderColor: subject.color } : {}}
                >
                  <div className="text-4xl mb-2">{subject.icon}</div>
                  <div className={`text-sm font-medium ${isSelected ? 'text-[#2A50DF]' : 'text-gray-700'}`}>
                    {subject.name}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Πίσω
            </button>
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 px-6 py-3 bg-[#2A50DF] text-white font-semibold rounded-xl hover:bg-[#1E3DB8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Συνέχεια →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Goals Screen
  if (step === 'goals') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl">
          <div className="text-6xl mb-6 text-center">🎯</div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Τι θα ήθελες να μάθεις φέτος;
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Μοιράσου μαζί μου τον στόχο σου! (προαιρετικό)
          </p>

          <textarea
            value={studentData.learningGoal}
            onChange={(e) => setStudentData({ ...studentData, learningGoal: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2A50DF] focus:border-[#2A50DF] text-lg min-h-[120px] mb-8 text-gray-900"
            placeholder="π.χ. Θέλω να βελτιώσω τα Μαθηματικά μου και να μάθω περισσότερα για το διάστημα..."
          />

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleBack}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Πίσω
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#2A50DF] text-white font-semibold rounded-xl hover:bg-[#1E3DB8] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Περίμενε...
                </>
              ) : (
                'Ολοκλήρωση! 🎉'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete Screen
  if (step === 'complete') {
    setTimeout(() => {
      router.push('/student');
    }, 3000);

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2A50DF] via-[#25A1B0] to-[#D9325C] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl text-center">
          <div className="text-9xl mb-6 animate-bounce">🚀</div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Είμαστε έτοιμοι, {studentData.firstName}!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Το ταξίδι της γνώσης μόλις ξεκίνησε! Σε μεταφέρω στο περιβάλλον σου... ✨
          </p>

          <div className="w-16 h-16 border-4 border-[#2A50DF] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return null;
}
