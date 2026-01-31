'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Teacher Onboarding Flow
 * 
 * Professional flow for educators to set up their teaching profile
 * Collects: name, subjects taught, grade levels, classroom preferences
 */

type OnboardingStep = 'welcome' | 'name' | 'subjects' | 'grades' | 'preferences' | 'complete';

interface TeacherData {
  firstName: string;
  lastName: string;
  subjectsTaught: string[];
  gradeLevels: string[];
  schoolType: string;
  classSize: string;
}

const SUBJECTS = [
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
  { id: 'pe', name: 'Φυσική Αγωγή', icon: '⚽' },
  { id: 'art', name: 'Εικαστικά', icon: '🎨' },
  { id: 'music', name: 'Μουσική', icon: '🎵' },
  { id: 'ict', name: 'Πληροφορική', icon: '💻' },
  { id: 'religious', name: 'Θρησκευτικά', icon: '✝️' },
];

const GRADE_LEVELS = [
  { id: 'primary', name: 'Δημοτικό (Α\'-ΣΤ\')', icon: '👶' },
  { id: 'gymnasium', name: 'Γυμνάσιο (Α\'-Γ\')', icon: '👨‍🎓' },
  { id: 'lyceum', name: 'Λύκειο (Α\'-Γ\')', icon: '🎓' },
];

const SCHOOL_TYPES = [
  { id: 'public', name: 'Δημόσιο Σχολείο' },
  { id: 'private', name: 'Ιδιωτικό Σχολείο' },
  { id: 'frontistirio', name: 'Φροντιστήριο' },
  { id: 'other', name: 'Άλλο' },
];

const CLASS_SIZES = [
  { id: 'small', name: '1-15 μαθητές' },
  { id: 'medium', name: '16-25 μαθητές' },
  { id: 'large', name: '26+ μαθητές' },
];

export default function TeacherOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [teacherData, setTeacherData] = useState<TeacherData>({
    firstName: '',
    lastName: '',
    subjectsTaught: [],
    gradeLevels: [],
    schoolType: '',
    classSize: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    const steps: OnboardingStep[] = ['welcome', 'name', 'subjects', 'grades', 'preferences', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: OnboardingStep[] = ['welcome', 'name', 'subjects', 'grades', 'preferences', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setTeacherData(prev => ({
      ...prev,
      subjectsTaught: prev.subjectsTaught.includes(subjectId)
        ? prev.subjectsTaught.filter(id => id !== subjectId)
        : [...prev.subjectsTaught, subjectId]
    }));
  };

  const toggleGradeLevel = (gradeId: string) => {
    setTeacherData(prev => ({
      ...prev,
      gradeLevels: prev.gradeLevels.includes(gradeId)
        ? prev.gradeLevels.filter(id => id !== gradeId)
        : [...prev.gradeLevels, gradeId]
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
          name: `${teacherData.firstName} ${teacherData.lastName}`,
          user_type: 'teacher',
          onboarding_completed: true,
          interests: teacherData.subjectsTaught, // Reuse interests field for subjects taught
          children_grades: teacherData.gradeLevels, // Reuse for grade levels taught
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

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
        return teacherData.firstName.trim() && teacherData.lastName.trim();
      case 'subjects':
        return teacherData.subjectsTaught.length > 0;
      case 'grades':
        return teacherData.gradeLevels.length > 0;
      case 'preferences':
        return teacherData.schoolType && teacherData.classSize;
      default:
        return true;
    }
  };

  // Welcome Screen
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl text-center">
          <div className="text-7xl mb-6">👩‍🏫</div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Καλώς ήρθατε στο Noetium!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Η πλατφόρμα AI που σας βοηθά να διδάξετε καλύτερα, να δημιουργήσετε πιο γρήγορα, και να εξοικονομήσετε χρόνο για αυτό που σημαίνει περισσότερο: τους μαθητές σας.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm font-medium text-gray-700">Σχέδια Μαθήματος</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl">
              <div className="text-3xl mb-2">✨</div>
              <p className="text-sm font-medium text-gray-700">AI Εργαλεία</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl mb-2">📊</div>
              <p className="text-sm font-medium text-gray-700">Αξιολόγηση</p>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Ας ξεκινήσουμε! →
          </button>
        </div>
      </div>
    );
  }

  // Name Screen
  if (step === 'name') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Πώς σας λένε;
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Χαίρομαι που σας γνωρίζω!
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Όνομα
              </label>
              <input
                type="text"
                value={teacherData.firstName}
                onChange={(e) => setTeacherData({ ...teacherData, firstName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg text-gray-900"
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
                value={teacherData.lastName}
                onChange={(e) => setTeacherData({ ...teacherData, lastName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg text-gray-900"
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-3xl shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Τι διδάσκετε;
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Επιλέξτε τα μαθήματα που διδάσκετε
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {SUBJECTS.map((subject) => {
              const isSelected = teacherData.subjectsTaught.includes(subject.id);
              return (
                <button
                  key={subject.id}
                  onClick={() => toggleSubject(subject.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 scale-105 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-3xl mb-2">{subject.icon}</div>
                  <div className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                    {subject.name}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-sm text-gray-500 text-center mb-6">
            {teacherData.subjectsTaught.length} επιλεγμένα
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
              disabled={!canProceed()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Συνέχεια →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grade Levels Screen
  if (step === 'grades') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Σε ποιες τάξεις διδάσκετε;
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Επιλέξτε τις βαθμίδες εκπαίδευσης
          </p>

          <div className="space-y-3 mb-8">
            {GRADE_LEVELS.map((level) => {
              const isSelected = teacherData.gradeLevels.includes(level.id);
              return (
                <button
                  key={level.id}
                  onClick={() => toggleGradeLevel(level.id)}
                  className={`w-full p-6 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-4xl">{level.icon}</div>
                  <div className={`text-left flex-1 font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                    {level.name}
                  </div>
                  {isSelected && <div className="text-purple-500 text-2xl">✓</div>}
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
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Συνέχεια →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Preferences Screen
  if (step === 'preferences') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
            Λίγες ακόμα πληροφορίες
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            Για να προσαρμόσουμε καλύτερα την εμπειρία σας
          </p>

          <div className="space-y-6 mb-8">
            {/* School Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Τύπος Σχολείου
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SCHOOL_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTeacherData({ ...teacherData, schoolType: type.id })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      teacherData.schoolType === type.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-medium ${teacherData.schoolType === type.id ? 'text-purple-700' : 'text-gray-700'}`}>
                      {type.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Class Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Μέγεθος Τάξης
              </label>
              <div className="grid grid-cols-3 gap-3">
                {CLASS_SIZES.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setTeacherData({ ...teacherData, classSize: size.id })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      teacherData.classSize === size.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-medium text-sm ${teacherData.classSize === size.id ? 'text-purple-700' : 'text-gray-700'}`}>
                      {size.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

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
              disabled={!canProceed() || loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Περίμενε...
                </>
              ) : (
                'Ολοκλήρωση! ✨'
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
      router.push('/teacher');
    }, 3000);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 md:p-12 w-full max-w-2xl shadow-2xl text-center">
          <div className="text-9xl mb-6 animate-bounce">🎉</div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Είστε έτοιμοι, {teacherData.firstName}!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Σας μεταφέρουμε στα AI εργαλεία διδασκαλίας... ✨
          </p>

          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return null;
}
